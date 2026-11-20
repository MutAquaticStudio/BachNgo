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

const SCHEDULE_HINT = /(mỗi ngày|hằng ngày|hàng ngày|mỗi sáng|mỗi tối|mỗi tuần|hằng tuần|mỗi giờ|tiếng một lần|theo lịch|tự động|lên lịch|cron|schedul|every (day|morning|hour|week)|daily|weekly|automation|đăng bài|nhập liệu)/i;

function firstUser(conv) {
  const m = conv.messages.find((x) => x.role === 'user');
  return m ? m.text : '';
}

const keyOf = (text) => text.replace(/\s+/g, ' ').trim().slice(0, 2000).toLowerCase();

/**
 * Tìm automation trong lịch sử: task theo lịch trên claude.ai tạo ra nhiều
 * hội thoại có cùng tin nhắn đầu. Nhóm các hội thoại trùng tin nhắn đầu (>= 2 lần).
 * Hội thoại lẻ nhắc tới lịch / tự động được đánh dấu "gợi ý".
 */
function detectAutomations(list) {
  const groups = new Map();
  for (const c of list) {
    const text = firstUser(c);
    if (text.length < 20) continue;
    const k = keyOf(text);
    if (!groups.has(k)) groups.set(k, { prompt: text, convs: [] });
    groups.get(k).convs.push(c);
  }
  const repeated = [];
  const repeatedIds = new Set();
  for (const [k, g] of groups) {
    if (g.convs.length < 2) continue;
    const convs = [...g.convs].sort((a, b) => String(b.createdAt || b.updatedAt).localeCompare(String(a.createdAt || a.updatedAt)));
    convs.forEach((c) => repeatedIds.add(c.id));
    repeated.push({
      id: 'grp-' + require('crypto').createHash('sha1').update(k).digest('hex').slice(0, 12),
      kind: 'repeated',
      title: convs[0].title,
      prompt: g.prompt,
      count: convs.length,
      runs: convs.map((c) => c.createdAt || c.updatedAt).filter(Boolean),
      conversationIds: convs.map((c) => c.id),
    });
  }
  repeated.sort((a, b) => b.count - a.count);
  const hinted = list
    .filter((c) => !repeatedIds.has(c.id) && c.messages.some((m) => m.role === 'user' && SCHEDULE_HINT.test(m.text)))
    .map((c) => ({ id: 'conv-' + c.id, kind: 'hint', title: c.title, prompt: firstUser(c), count: 1, runs: [c.createdAt || c.updatedAt], conversationIds: [c.id] }));
  return [...repeated, ...hinted];
}

/** Dựng nội dung gửi Claude để phân tích một automation / hội thoại. */
function automationBrief(auto, convs, tz) {
  const fmt = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? iso : `${iso} (giờ máy: ${d.toLocaleString('vi-VN', { timeZone: tz })}, ${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]})`;
  };
  let out = '';
  if (auto.kind === 'repeated') {
    out += `Phát hiện ${auto.count} hội thoại có cùng tin nhắn đầu tiên. Đây nhiều khả năng là một task chạy theo lịch trên claude.ai.\n\n`;
    out += `Thời điểm các lần chạy (mới nhất trước):\n${auto.runs.slice(0, 40).map(fmt).join('\n')}\n\n`;
    out += `PROMPT CỦA TASK:\n<<<\n${auto.prompt.slice(0, 20000)}\n>>>\n\n`;
    convs.slice(0, 3).forEach((c, i) => {
      const reply = c.messages.filter((m) => m.role === 'assistant').map((m) => m.text).join('\n').slice(0, 3000);
      out += `KẾT QUẢ LẦN CHẠY ${i + 1} (${c.createdAt || c.updatedAt}):\n<<<\n${reply || '(trống)'}\n>>>\n\n`;
    });
  } else {
    out += asContext(convs[0], 50000);
  }
  return out.slice(0, 80000);
}

module.exports = { importFile, normalize, asContext, readFromZip, detectAutomations, automationBrief };
