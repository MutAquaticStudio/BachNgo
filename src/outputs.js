// Nơi gửi kết quả của task: Telegram và webhook.
// Webhook dùng để nối với Google Apps Script (ghi vào Google Sheets),
// Make / Zapier / n8n (đăng Facebook, Instagram...), hoặc API riêng.

async function sendTelegram(token, chatId, text) {
  if (!token || !chatId) throw new Error('Chưa cài token bot Telegram hoặc chat ID.');
  const chunks = [];
  for (let i = 0; i < text.length; i += 4000) chunks.push(text.slice(i, i + 4000));
  for (const chunk of chunks.length ? chunks : ['(trống)']) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: chunk, disable_web_page_preview: true }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body.ok === false) {
      throw new Error(`Telegram lỗi ${res.status}: ${body.description || 'không rõ'}`);
    }
  }
}

/** Lấy chat ID từ tin nhắn gần nhất gửi tới bot (người dùng nhắn /start cho bot trước). */
async function findTelegramChatId(token) {
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const body = await res.json();
  if (!body.ok) throw new Error(`Telegram lỗi: ${body.description || res.status}`);
  const last = [...body.result].reverse().find((u) => u.message && u.message.chat);
  if (!last) throw new Error('Chưa thấy tin nhắn nào. Mở Telegram, nhắn /start cho bot rồi thử lại.');
  return String(last.message.chat.id);
}

async function sendWebhook(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Webhook trả về ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 1000);
}

/** Tìm khối JSON trong câu trả lời (```json ...``` hoặc cả câu trả lời). */
function extractJson(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fence ? fence[1] : text).trim();
  return JSON.parse(candidate);
}

module.exports = { sendTelegram, findTelegramChatId, sendWebhook, extractJson };
