// Kiểm tra end-to-end: chạy app Electron thật với một máy chủ giả lập Claude API.
// Chạy: npm test   (trên Linux không có màn hình: xvfb-run -a npm test)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

// Playwright cài sẵn trên máy (toàn cục) hoặc trong dự án; dùng require để NODE_PATH có hiệu lực.
const req = createRequire(import.meta.url);
const { _electron: electron } = req('playwright');
const executablePath = req('electron'); // đường dẫn tới file chạy Electron của dự án

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shots = process.env.SHOTS_DIR || path.join(root, 'test', 'shots');
fs.mkdirSync(shots, { recursive: true });
const requests = [];
const webhooks = [];
let failures = 0;
const check = (ok, name) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failures++;
};

// ---- máy chủ giả: /v1/messages (stream + thường) và /hook ----
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    if (req.url.startsWith('/hook')) {
      webhooks.push(JSON.parse(body));
      res.end('{"ok":true}');
      return;
    }
    const json = JSON.parse(body);
    requests.push({ url: req.url, headers: req.headers, body: json });
    const last = json.messages[json.messages.length - 1].content;
    const reply = String(last).includes('JSON')
      ? '```json\n{"ten":"Túi tote","gia":139000}\n```'
      : `Xin chào! Bạn vừa nói: ${String(last).slice(-40)}`;
    if (!json.stream) {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: json.model, content: [{ type: 'text', text: 'OK' }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 5, output_tokens: 1 } }));
      return;
    }
    res.setHeader('content-type', 'text/event-stream');
    const ev = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`);
    ev('message_start', { message: { id: 'msg_2', type: 'message', role: 'assistant', model: json.model, content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 12, output_tokens: 0 } } });
    ev('content_block_start', { index: 0, content_block: { type: 'text', text: '' } });
    for (const part of reply.match(/.{1,6}/gs)) ev('content_block_delta', { index: 0, delta: { type: 'text_delta', text: part } });
    ev('content_block_stop', { index: 0 });
    ev('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 20 } });
    ev('message_stop', {});
    res.end();
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// ---- file export giả của claude.ai (.zip chứa conversations.json) ----
function makeZip(name, content) {
  const data = Buffer.from(content);
  const comp = zlib.deflateRawSync(data);
  const nameBuf = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10);
  central.writeUInt32LE(comp.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42);
  const cdOffset = local.length + nameBuf.length + comp.length;
  const cd = Buffer.concat([central, nameBuf]);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(1, 8); end.writeUInt16LE(1, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(cdOffset, 16);
  return Buffer.concat([local, nameBuf, comp, cd, end]);
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-desk-'));
const zipPath = path.join(tmp, 'data-export.zip');
fs.writeFileSync(zipPath, makeZip('data-2026/conversations.json', JSON.stringify([
  { uuid: 'c1', name: 'Kế hoạch đăng bài tháng 11', created_at: '2026-11-01T08:00:00Z', updated_at: '2026-11-02T08:00:00Z',
    chat_messages: [
      { sender: 'human', text: 'Lên lịch đăng bài cho shop túi', created_at: '2026-11-01T08:00:00Z' },
      { sender: 'assistant', text: '', content: [{ type: 'text', text: 'Đăng 3 bài/tuần: thứ 2, 4, 6 lúc 8h.' }], created_at: '2026-11-01T08:00:05Z' },
    ] },
  { uuid: 'c2', name: 'Trống', chat_messages: [] },
])));

// ---- chạy app ----
const app = await electron.launch({
  executablePath, args: [root, '--no-sandbox'],
  env: { ...process.env, CLAUDE_DESK_TEST: '1', CLAUDE_DESK_DATA: path.join(tmp, 'data'), ANTHROPIC_BASE_URL: base },
});
const page = await app.firstWindow();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.setViewportSize({ width: 1200, height: 800 });
await page.waitForSelector('#view-settings.active');
check(true, 'Chưa có key thì mở thẳng Cài đặt');
await page.screenshot({ path: path.join(shots, '1-settings.png') });

await page.fill('#apiKey', 'sk-ant-test-key');
await page.click('#saveKey');
await page.waitForSelector('#keyMsg.ok', { timeout: 10000 });
check((await page.textContent('#keyStatus')).includes('Đã có'), 'Lưu key và kiểm tra key thành công');
const secrets = fs.readFileSync(path.join(tmp, 'data', 'secrets.json'), 'utf8');
check(!secrets.includes('sk-ant-test-key') || !(await app.evaluate(({ safeStorage }) => safeStorage.isEncryptionAvailable())), 'Key không lưu dạng chữ thường (khi máy hỗ trợ mã hoá)');

// Chat
await page.click('.tab[data-view=chat]');
await page.fill('#input', 'Chào Claude');
await page.press('#input', 'Enter');
await page.waitForFunction(() => document.querySelector('#messages .msg.assistant')?.textContent.includes('Bạn vừa nói'), null, { timeout: 15000 });
await page.waitForFunction(() => !document.querySelector('#sendBtn').disabled);
check(true, 'Chat stream câu trả lời');
const chatReq = requests.find((r) => r.body.stream);
check(chatReq.body.model === 'claude-opus-5-5' && chatReq.body.fallbacks === 'default' && String(chatReq.headers['anthropic-beta']).includes('server-side-fallback'), 'Gửi đúng model và fallback phía server');
// SDK 1.x gửi key qua Authorization: Bearer; bản cũ dùng x-api-key.
check(chatReq.headers['x-api-key'] === 'sk-ant-test-key' || chatReq.headers['authorization'] === 'Bearer sk-ant-test-key', 'Dùng đúng API key đã lưu');
await page.fill('#input', 'Câu thứ hai');
await page.click('#sendBtn');
await page.waitForFunction(() => document.querySelectorAll('#messages .msg').length === 4, null, { timeout: 15000 });
const second = requests.filter((r) => r.body.stream).pop();
check(second.body.messages.length === 3, 'Giữ lịch sử hội thoại khi gửi tiếp');
check((await page.locator('#chatList li').count()) === 1, 'Chat xuất hiện trong danh sách');
await page.screenshot({ path: path.join(shots, '2-chat.png') });

// Task
await page.click('.tab[data-view=tasks]');
await page.click('#newTask');
await page.fill('#taskForm input[name=name]', 'Nhập sản phẩm vào Sheets');
await page.fill('#taskForm input[name=cron]', 'sai cú pháp');
await page.fill('#taskForm textarea[name=prompt]', 'Trích thông tin sản phẩm thành JSON. Ngày {{date}}');
await page.selectOption('#taskForm select[name=format]', 'json');
await page.fill('#taskForm input[name=webhookUrl]', `${base}/hook`);
await page.click('#taskForm button[type=submit]');
await page.waitForSelector('#taskMsg.bad');
check((await page.textContent('#taskMsg')).includes('cron'), 'Báo lỗi lịch cron sai');
await page.fill('#taskForm input[name=cron]', '0 8 * * *');
await page.click('#taskForm button[type=submit]');
await page.waitForSelector('#taskMsg.ok');
await page.click('#runTask');
await page.waitForFunction(() => /Chạy xong|Lỗi/.test(document.querySelector('#taskMsg').textContent), null, { timeout: 15000 });
check((await page.textContent('#taskMsg')) === 'Chạy xong.', 'Chạy task thủ công thành công');
check(webhooks.length === 1 && webhooks[0].data && webhooks[0].data.gia === 139000, 'Webhook nhận JSON đã tách (nhập liệu)');
const taskReq = requests.filter((r) => r.body.stream).pop();
check(!taskReq.body.messages[0].content.includes('{{date}}'), 'Thay biến {{date}} trong prompt');
check((await page.locator('#runList li .badge.ok').count()) === 1, 'Hiện lần chạy trong lịch sử task');
await page.screenshot({ path: path.join(shots, '3-tasks.png') });

// Nhập lịch sử claude.ai
await page.click('.tab[data-view=history]');
const imp = await page.evaluate((p) => window.desk.importExport(p), zipPath);
check(imp.ok && imp.count === 1, 'Đọc file export .zip (bỏ hội thoại trống)');
await page.click('.tab[data-view=tasks]');
await page.click('.tab[data-view=history]');
await page.click('#histList li');
await page.waitForSelector('#histMessages .msg');
check((await page.textContent('#histMessages')).includes('thứ 2, 4, 6'), 'Xem lại nội dung hội thoại cũ');
await page.screenshot({ path: path.join(shots, '4-history.png') });
await page.click('#histContinue');
await page.fill('#input', 'Tiếp tục kế hoạch này');
await page.press('#input', 'Enter');
await page.waitForFunction(() => !document.querySelector('#sendBtn').disabled && document.querySelectorAll('#messages .msg').length === 2, null, { timeout: 15000 });
const ctxReq = requests.filter((r) => r.body.stream).pop();
check(ctxReq.body.messages[0].content.includes('Đăng 3 bài/tuần'), 'Chat mới mang ngữ cảnh từ lịch sử cũ');

// Dữ liệu còn sau khi mở lại
await app.close();
const app2 = await electron.launch({ executablePath, args: [root, '--no-sandbox'], env: { ...process.env, CLAUDE_DESK_TEST: '1', CLAUDE_DESK_DATA: path.join(tmp, 'data'), ANTHROPIC_BASE_URL: base } });
const p2 = await app2.firstWindow();
await p2.waitForSelector('#view-chat.active');
check((await p2.locator('#chatList li').count()) === 2, 'Lịch sử chat còn sau khi mở lại app');
await app2.close();

check(errors.length === 0, `Không có lỗi console${errors.length ? ': ' + errors.join(' | ') : ''}`);
server.close();
console.log(failures ? `\n${failures} kiểm tra thất bại` : '\nTất cả kiểm tra đạt');
process.exit(failures ? 1 : 0);
