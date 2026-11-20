// Lưu dữ liệu dạng JSON trong thư mục userData của app.
// API key và token được mã hoá bằng safeStorage (Keychain / DPAPI / libsecret).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Store {
  /**
   * @param {string} dir thư mục lưu dữ liệu
   * @param {{isEncryptionAvailable():boolean, encryptString(s:string):Buffer, decryptString(b:Buffer):string}} [safe]
   */
  constructor(dir, safe) {
    this.dir = dir;
    this.safe = safe;
    fs.mkdirSync(dir, { recursive: true });
  }

  file(name) {
    return path.join(this.dir, `${name}.json`);
  }

  read(name, fallback) {
    try {
      return JSON.parse(fs.readFileSync(this.file(name), 'utf8'));
    } catch {
      return fallback;
    }
  }

  write(name, data) {
    const tmp = this.file(name) + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, this.file(name));
  }

  // ---- bí mật (API key, token Telegram) ----
  setSecret(key, value) {
    const secrets = this.read('secrets', {});
    if (!value) {
      delete secrets[key];
    } else if (this.safe && this.safe.isEncryptionAvailable()) {
      secrets[key] = { enc: this.safe.encryptString(value).toString('base64') };
    } else {
      secrets[key] = { plain: value };
    }
    this.write('secrets', secrets);
  }

  getSecret(key) {
    const s = this.read('secrets', {})[key];
    if (!s) return '';
    if (s.enc && this.safe) return this.safe.decryptString(Buffer.from(s.enc, 'base64'));
    return s.plain || '';
  }

  hasSecret(key) {
    return Boolean(this.read('secrets', {})[key]);
  }

  // ---- cài đặt ----
  settings() {
    return {
      model: 'claude-opus-5-5',
      effort: 'medium',
      system: 'Bạn là trợ lý nói tiếng Việt, trả lời thẳng, ngắn gọn.',
      telegramChatId: '',
      autoStart: false,
      ...this.read('settings', {}),
    };
  }

  saveSettings(patch) {
    const next = { ...this.settings(), ...patch };
    this.write('settings', next);
    return next;
  }

  // ---- chat ----
  chats() {
    return this.read('chats', []);
  }

  saveChat(chat) {
    const chats = this.chats().filter((c) => c.id !== chat.id);
    chat.updatedAt = new Date().toISOString();
    chats.unshift(chat);
    this.write('chats', chats);
    return chat;
  }

  deleteChat(id) {
    this.write('chats', this.chats().filter((c) => c.id !== id));
  }

  // ---- task tự động ----
  tasks() {
    return this.read('tasks', []);
  }

  saveTask(task) {
    const tasks = this.tasks();
    if (!task.id) task.id = crypto.randomUUID();
    const i = tasks.findIndex((t) => t.id === task.id);
    if (i >= 0) tasks[i] = task;
    else tasks.push(task);
    this.write('tasks', tasks);
    return task;
  }

  deleteTask(id) {
    this.write('tasks', this.tasks().filter((t) => t.id !== id));
  }

  runs() {
    return this.read('runs', []);
  }

  addRun(run) {
    const runs = [run, ...this.runs()].slice(0, 500);
    this.write('runs', runs);
    return run;
  }

  // ---- lịch sử chat nhập từ claude.ai ----
  imported() {
    return this.read('imported', []);
  }

  saveImported(list) {
    this.write('imported', list);
  }
}

module.exports = { Store };
