// Gọi Claude API bằng SDK chính thức. Dùng streaming để không bị timeout
// và bật fallback phía server khi model từ chối một yêu cầu.
const AnthropicModule = require('@anthropic-ai/sdk');

const Anthropic = AnthropicModule.default || AnthropicModule;

const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (mặc định)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (rẻ hơn)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (rẻ nhất)' },
];

// Model hỗ trợ `fallbacks: "default"` phía server.
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-sonnet-5-5']);

function client(apiKey) {
  if (!apiKey) throw new Error('Chưa nhập API key. Vào Cài đặt để thêm key.');
  return new Anthropic({ apiKey, maxRetries: 3 });
}

function friendlyError(err) {
  const status = err && err.status;
  if (status === 401) return 'API key không hợp lệ (401). Kiểm tra lại key trong Cài đặt.';
  if (status === 403) return 'Key không có quyền dùng model này (403).';
  if (status === 429) return 'Bị giới hạn tốc độ hoặc hết hạn mức (429). Thử lại sau ít phút.';
  if (status === 529 || status >= 500) return `Máy chủ Anthropic đang lỗi hoặc quá tải (${status}). Thử lại sau.`;
  if (status === 400) return `Yêu cầu không hợp lệ (400): ${err.message}`;
  if (err && err.name === 'APIConnectionError') return 'Không kết nối được tới api.anthropic.com. Kiểm tra mạng.';
  return (err && err.message) || String(err);
}

/**
 * Gửi hội thoại tới Claude và stream câu trả lời.
 * @param {object} o
 * @param {string} o.apiKey
 * @param {string} o.model
 * @param {string} o.effort low|medium|high|xhigh|max
 * @param {string} o.system
 * @param {{role:'user'|'assistant', content:string}[]} o.messages
 * @param {(delta:string)=>void} [o.onText]
 * @param {AbortSignal} [o.signal]
 * @param {object} [o.jsonSchema] ép câu trả lời theo JSON schema (structured outputs)
 * @returns {Promise<{text:string, stopReason:string, usage:object}>}
 */
async function ask({ apiKey, model, effort, system, messages, onText, signal, jsonSchema }) {
  const params = {
    model,
    max_tokens: 64000,
    thinking: { type: 'adaptive' },
    output_config: { effort: effort || 'medium' },
    messages,
  };
  if (jsonSchema) params.output_config.format = { type: 'json_schema', schema: jsonSchema };
  if (system) params.system = system;
  if (FALLBACK_MODELS.has(model)) {
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }

  const stream = client(apiKey).beta.messages.stream(params, { signal });
  if (onText) stream.on('text', (delta) => onText(delta));
  const msg = await stream.finalMessage();

  const text = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  if (msg.stop_reason === 'refusal') {
    const why = msg.stop_details && msg.stop_details.explanation;
    return { text: text || `Claude từ chối yêu cầu này.${why ? ' ' + why : ''}`, stopReason: 'refusal', usage: msg.usage };
  }
  return { text, stopReason: msg.stop_reason, usage: msg.usage };
}

/** Kiểm tra key bằng một yêu cầu rất nhỏ. */
async function testKey(apiKey) {
  const c = client(apiKey);
  const res = await c.messages.create({
    model: 'claude-haiku-5-5',
    max_tokens: 16,
    messages: [{ role: 'user', content: 'Trả lời đúng một chữ: OK' }],
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

module.exports = { ask, testKey, friendlyError, MODELS };
