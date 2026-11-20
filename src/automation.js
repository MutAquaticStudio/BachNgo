// Cho Claude đọc một automation cũ (hoặc một hội thoại) và đề xuất task cho Claude Desk.
const { ask } = require('./claude');

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tasks', 'summary'],
  properties: {
    summary: { type: 'string', description: 'Tóm tắt 1-3 câu: automation cũ làm gì.' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'cron', 'prompt', 'format', 'telegram', 'feasible', 'missing', 'notes'],
        properties: {
          name: { type: 'string', description: 'Tên ngắn gọn tiếng Việt.' },
          cron: { type: 'string', description: 'Lịch cron 5 trường theo giờ máy; chuỗi rỗng nếu chỉ chạy tay.' },
          prompt: { type: 'string', description: 'Prompt hoàn chỉnh để chạy lại task.' },
          format: { type: 'string', enum: ['text', 'json'] },
          telegram: { type: 'boolean', description: 'Có nên gửi kết quả qua Telegram không.' },
          feasible: { type: 'boolean', description: 'Có chạy được chỉ bằng prompt (không cần công cụ/connector) không.' },
          missing: { type: 'string', description: 'Những gì task cũ cần mà Claude Desk chưa có (connector, đăng nhập, file...). Rỗng nếu không thiếu.' },
          notes: { type: 'string', description: 'Ghi chú ngắn cho người dùng: cách suy ra lịch, việc cần làm thêm.' },
        },
      },
    },
  },
};

const SYSTEM = `Bạn chuyển các automation cũ của người dùng trên claude.ai thành task cho app Claude Desk.

Claude Desk chạy mỗi task như sau: gửi đúng một prompt tới Claude API (không có công cụ, không truy cập web, không có connector như Gmail, Upwork, Google Drive; không đọc được file), nhận câu trả lời văn bản hoặc JSON, rồi gửi kết quả qua Telegram và/hoặc webhook (POST JSON). Webhook có thể nối Google Apps Script để ghi vào Google Sheets, hoặc Make/Zapier/n8n để đăng bài lên mạng xã hội. Prompt có thể dùng biến {{date}}, {{time}} và {{last}} (kết quả lần chạy trước, để tránh lặp nội dung).

Yêu cầu:
- Suy ra lịch cron từ thời điểm các lần chạy (theo "giờ máy"). Các lần chạy thường lệch vài phút so với lịch thật, nên làm tròn hợp lý. Nếu không suy ra được, để cron rỗng và ghi lý do trong notes.
- Viết lại prompt sao cho chạy được trong Claude Desk. Giữ nguyên mục đích và văn phong, bỏ các chỉ dẫn gọi công cụ không còn dùng được. Nếu task cũ cần dữ liệu từ connector hoặc web, đặt feasible=false và ghi rõ vào missing (ví dụ: "cần đọc tin nhắn Upwork, Claude Desk không có connector Upwork").
- Nếu hội thoại không chứa automation nào thì trả tasks rỗng và giải thích trong summary.
- Viết tất cả bằng tiếng Việt.`;

/**
 * @param {{apiKey:string, model:string, brief:string}} o
 * @returns {Promise<{summary:string, tasks:object[]}>}
 */
async function analyzeAutomation({ apiKey, model, brief }) {
  const res = await ask({
    apiKey,
    model,
    effort: 'medium',
    system: SYSTEM,
    jsonSchema: SCHEMA,
    messages: [{ role: 'user', content: `Phân tích nội dung sau và đề xuất task:\n\n${brief}` }],
  });
  if (res.stopReason === 'refusal') throw new Error(res.text);
  if (res.stopReason === 'max_tokens') throw new Error('Câu trả lời bị cắt (quá dài). Thử với hội thoại ngắn hơn.');
  let out;
  try {
    out = JSON.parse(res.text);
  } catch {
    throw new Error('Claude không trả về JSON hợp lệ.');
  }
  return { summary: out.summary || '', tasks: Array.isArray(out.tasks) ? out.tasks : [] };
}

module.exports = { analyzeAutomation, SCHEMA };
