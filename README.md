# Claude Desk

App desktop (Windows / macOS / Linux) để chat với Claude và chạy task tự động theo lịch bằng **API key của bạn**. Chi phí tính theo token trên tài khoản API, không dùng hạn mức của gói claude.ai.

## Tính năng

- **Chat với Claude** (Opus 5.5 mặc định; có thể chọn Sonnet 5.5 hoặc Haiku 5.5 cho rẻ hơn). Câu trả lời hiện dần, bấm Dừng được giữa chừng. Lịch sử chat lưu trên máy.
- **Task tự động:** mỗi task là một prompt chạy theo lịch (cron). Kết quả được gửi qua:
  - **Telegram**: nhắn vào điện thoại;
  - **Webhook**: POST JSON tới Google Apps Script (ghi vào Google Sheets), Make / Zapier / n8n (đăng Facebook, Instagram…) hoặc API riêng.
  - Định dạng **JSON** dùng cho nhập liệu: Claude trả về JSON, app tách sẵn vào trường `data` của webhook.
- **Lịch sử claude.ai:** nhập file export (Settings → Privacy → Export data) để xem lại chat cũ và tiếp tục chat với nội dung đó làm ngữ cảnh.
- **Chạy nền:** đóng cửa sổ thì app thu xuống khay hệ thống và task vẫn chạy. Có tuỳ chọn tự mở cùng máy.
- **Bảo mật:** API key và token Telegram được mã hoá bằng kho khoá của hệ điều hành (DPAPI trên Windows, Keychain trên macOS). Không có gì gửi đi ngoài `api.anthropic.com`, Telegram và webhook bạn tự nhập.

> Task chỉ chạy khi máy bật và app đang mở. Nếu lỡ giờ chạy (máy tắt), task sẽ không chạy bù.

## Cài đặt

**Windows:** giải nén `Claude Desk-<phiên bản>-win.zip` rồi chạy `Claude Desk.exe`. File chưa ký số nên Windows SmartScreen có thể cảnh báo: bấm *More info → Run anyway*.

**macOS / Linux (build từ mã nguồn):**

```bash
npm ci
npm start            # chạy thử
npm run dist:mac     # tạo .dmg (phải chạy trên máy Mac)
npm run dist:linux   # tạo .AppImage
npm run dist:win     # tạo .zip cho Windows
```

## Dùng lần đầu

1. Lấy API key ở **platform.claude.com → API keys**, nạp credit, rồi dán key vào **Cài đặt → Lưu key**. App sẽ tự kiểm tra key.
2. (Tuỳ chọn) Telegram: nhắn `/newbot` cho **@BotFather** để lấy token và dán vào Cài đặt. Nhắn `/start` cho bot vừa tạo, bấm **Tự tìm chat ID**, rồi **Gửi thử**.
3. Vào **Task tự động → + Task mới**, nhập tên, lịch, prompt và nơi nhận kết quả. Bấm **Chạy ngay** để thử.

### Cú pháp lịch (cron)

| Lịch | Ý nghĩa |
|---|---|
| `0 8 * * *` | 8:00 mỗi ngày |
| `0 8 * * 1,3,5` | 8:00 thứ 2, 4, 6 |
| `0 */2 * * *` | 2 tiếng một lần |
| `30 21 * * *` | 21:30 mỗi ngày |
| (để trống) | chỉ chạy khi bấm *Chạy ngay* |

Biến dùng trong prompt: `{{date}}` (ngày), `{{time}}` (giờ), `{{last}}` (kết quả lần chạy trước, ví dụ để bài mới không lặp lại bài cũ).

### Ghi vào Google Sheets bằng webhook

Tạo Google Sheet, chọn *Extensions → Apps Script*, dán đoạn sau, rồi *Deploy → New deployment → Web app* (Execute as: Me; Who has access: Anyone). Dán URL `/exec` vào ô Webhook của task.

```js
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const rows = Array.isArray(body.data) ? body.data : [body.data || { text: body.text }];
  for (const r of rows) sheet.appendRow([body.at, body.task, ...Object.values(r)]);
  return ContentService.createTextOutput('ok');
}
```

Webhook nhận JSON có dạng:

```json
{ "task": "Tên task", "text": "câu trả lời của Claude", "data": { "...": "khi định dạng là JSON" }, "at": "2026-11-20T08:00:00.000Z" }
```

### Đăng bài tự động

Cho task viết bài, rồi gửi webhook tới một kịch bản Make / Zapier / n8n có bước *Facebook Pages → Create a post* (hoặc Instagram, LinkedIn…). Nên bật Telegram song song để xem lại bài đã đăng.

## Kiểm tra

```bash
npm test     # trên Linux không có màn hình: xvfb-run -a npm test
```

Bài kiểm tra chạy app Electron thật với một máy chủ Claude API giả lập. Nó kiểm tra: lưu và kiểm tra key, chat stream, giữ lịch sử, task chạy tay, webhook nhận JSON, đọc file export `.zip`, chat tiếp với ngữ cảnh cũ, dữ liệu còn sau khi mở lại app, và không có lỗi console. Cần Playwright, cài sẵn hoặc chạy `npm i -D playwright`.

## Cấu trúc

```
src/main.js        tiến trình chính: cửa sổ, khay, IPC
src/claude.js      gọi Claude API (streaming, fallback khi bị từ chối)
src/scheduler.js   chạy task theo cron
src/outputs.js     Telegram, webhook, tách JSON
src/importer.js    đọc file export claude.ai (.zip / .json)
src/store.js       lưu dữ liệu JSON + mã hoá bí mật
src/renderer/      giao diện
test/smoke.mjs     kiểm tra end-to-end
```
