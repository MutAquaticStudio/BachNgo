// Đọc file export dữ liệu từ claude.ai (Settings → Privacy → Export data).
// Gói export là .zip, bên trong có conversations.json. App nhận cả file .zip lẫn .json.
const fs = require('fs');
const zlib = require('zlib');

/** Lấy một file trong zip (định dạng zip chuẩn, nén deflate hoặc không nén). */
function readFromZip(buf, wanted) {
  // Tìm End of Central Directory
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('File zip không hợp lệ.');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    if (name === wanted || name.endsWith('/' + wanted)) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + compSize);
      if (method === 0) return data;
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error(`Không hỗ trợ kiểu nén ${method} trong zip.`);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`Không thấy ${wanted} trong file zip.`);
}

function messageText(m) {
  if (typeof m.text === 'string' && m.text.trim()) return m.text;
  if (Array.isArray(m.content)) {
    return m.content
      .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('\n');
  }
  return '';
}

/**
 * Chuyển dữ liệu export thành danh sách hội thoại gọn.
 * @returns {{id:string,title:string,createdAt:string,updatedAt:string,messages:{role:'user'|'assistant',text:string,at:string}[]}[]}
 */
function normalize(raw) {
  if (!Array.isArray(raw)) throw new Error('conversations.json không đúng định dạng (cần một mảng).');
  return raw
    .map((c) => ({
      id: c.uuid || c.id || String(Math.random()),
      title: c.name || c.title || '(không tên)',
      createdAt: c.created_at || '',
      updatedAt: c.updated_at || c.created_at || '',
      messages: (c.chat_messages || c.messages || [])
        .map((m) => ({
          role: m.sender === 'human' || m.role === 'user' ? 'user' : 'assistant',
          text: messageText(m),
          at: m.created_at || '',
        }))
        .filter((m) => m.text),
    }))
    .filter((c) => c.messages.length)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function importFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const json = filePath.toLowerCase().endsWith('.zip')
    ? readFromZip(buf, 'conversations.json').toString('utf8')
    : buf.toString('utf8');
  return normalize(JSON.parse(json));
}

/** Ghép một hội thoại cũ thành văn bản để đưa vào chat mới làm ngữ cảnh. */
function asContext(conv, maxChars = 60000) {
  let out = `Lịch sử hội thoại cũ "${conv.title}" (${conv.updatedAt}):\n\n`;
  for (const m of conv.messages) {
    out += `${m.role === 'user' ? 'NGƯỜI DÙNG' : 'CLAUDE'}: ${m.text}\n\n`;
  }
  if (out.length > maxChars) {
    out = out.slice(0, maxChars) + '\n…(đã cắt bớt phần cuối vì quá dài)';
  }
  return out;
}

module.exports = { importFile, normalize, asContext, readFromZip };
