// Chạy task theo lịch (cú pháp cron) khi app đang mở (kể cả khi chỉ còn ở khay hệ thống).
const cron = require('node-cron');
const { ask, friendlyError } = require('./claude');
const { sendTelegram, sendWebhook, extractJson } = require('./outputs');

function fill(template, vars) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (k in vars ? vars[k] : m));
}

class Scheduler {
  /** @param {import('./store').Store} store  @param {(evt:object)=>void} notify */
  constructor(store, notify) {
    this.store = store;
    this.notify = notify || (() => {});
    this.jobs = new Map();
    this.running = new Set();
  }

  reload() {
    for (const job of this.jobs.values()) job.stop();
    this.jobs.clear();
    for (const task of this.store.tasks()) {
      if (!task.enabled || !task.cron || !cron.validate(task.cron)) continue;
      const job = cron.schedule(task.cron, () => this.run(task.id, 'lịch'), {
        timezone: task.timezone || undefined,
      });
      this.jobs.set(task.id, job);
    }
  }

  stopAll() {
    for (const job of this.jobs.values()) job.stop();
    this.jobs.clear();
  }

  async run(taskId, trigger = 'tay') {
    const task = this.store.tasks().find((t) => t.id === taskId);
    if (!task) throw new Error('Không tìm thấy task.');
    if (this.running.has(taskId)) return { skipped: true };
    this.running.add(taskId);
    const startedAt = new Date();
    const run = { id: `${taskId}-${startedAt.getTime()}`, taskId, taskName: task.name, trigger, startedAt: startedAt.toISOString(), steps: [] };
    this.notify({ type: 'run-start', taskId });

    try {
      const settings = this.store.settings();
      const last = this.store.runs().find((r) => r.taskId === taskId && r.status === 'ok');
      const vars = {
        date: startedAt.toLocaleDateString('vi-VN'),
        time: startedAt.toLocaleTimeString('vi-VN'),
        last: last ? last.text : '(chưa có lần chạy trước)',
      };
      let prompt = fill(task.prompt || '', vars);
      if (task.format === 'json') {
        prompt += '\n\nChỉ trả về đúng một khối JSON hợp lệ, không thêm chữ nào khác.';
      }

      const result = await ask({
        apiKey: this.store.getSecret('anthropicKey'),
        model: task.model || settings.model,
        effort: task.effort || settings.effort,
        system: task.system || settings.system,
        messages: [{ role: 'user', content: prompt }],
      });
      run.text = result.text;
      run.usage = result.usage;
      if (result.stopReason === 'refusal') throw new Error(result.text);

      let data;
      if (task.format === 'json') {
        try {
          data = extractJson(result.text);
        } catch {
          throw new Error('Claude không trả về JSON hợp lệ.');
        }
        run.data = data;
      }

      if (task.telegram) {
        await sendTelegram(this.store.getSecret('telegramToken'), settings.telegramChatId, `✅ ${task.name}\n\n${result.text}`);
        run.steps.push('Đã gửi Telegram');
      }
      if (task.webhookUrl) {
        const resp = await sendWebhook(task.webhookUrl, {
          task: task.name,
          text: result.text,
          data: data ?? null,
          at: startedAt.toISOString(),
        });
        run.steps.push(`Webhook OK: ${resp.slice(0, 120)}`);
      }
      run.status = 'ok';
    } catch (err) {
      run.status = 'error';
      run.error = friendlyError(err);
      if (task.telegram && task.notifyErrors !== false) {
        sendTelegram(this.store.getSecret('telegramToken'), this.store.settings().telegramChatId, `❌ ${task.name} lỗi: ${run.error}`).catch(() => {});
      }
    } finally {
      run.finishedAt = new Date().toISOString();
      this.store.addRun(run);
      this.running.delete(taskId);
      this.notify({ type: 'run-end', taskId, run });
    }
    return run;
  }
}

module.exports = { Scheduler, fill, validateCron: (expr) => cron.validate(expr) };
