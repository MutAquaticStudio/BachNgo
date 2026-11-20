// Tiến trình chính của Claude Desk.
const path = require('path');
const crypto = require('crypto');
const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, safeStorage, shell, Notification } = require('electron');
const { Store } = require('./store');
const { ask, testKey, friendlyError, MODELS } = require('./claude');
const { Scheduler, validateCron } = require('./scheduler');
const { sendTelegram, findTelegramChatId } = require('./outputs');
const { importFile, asContext, detectAutomations, automationBrief } = require('./importer');
const { analyzeAutomation } = require('./automation');

// Cho phép test tự động chạy với thư mục dữ liệu riêng.
if (process.env.CLAUDE_DESK_DATA) app.setPath('userData', process.env.CLAUDE_DESK_DATA);

let win = null;
let tray = null;
let store = null;
let scheduler = null;
let quitting = false;
const chatAborts = new Map();

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function send(channel, data) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data);
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 760,
    minHeight: 520,
    title: 'Claude Desk',
    icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#14161a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // Đóng cửa sổ thì ẩn xuống khay để task vẫn chạy.
  win.on('close', (e) => {
    if (!quitting && !process.env.CLAUDE_DESK_TEST) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Claude Desk – task đang chạy nền');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Mở Claude Desk', click: () => { win.show(); win.focus(); } },
      { type: 'separator' },
      { label: 'Thoát hẳn (dừng mọi task)', click: () => { quitting = true; app.quit(); } },
    ]),
  );
  tray.on('click', () => { win.show(); win.focus(); });
}

function state() {
  return {
    settings: store.settings(),
    hasKey: store.hasSecret('anthropicKey'),
    hasTelegram: store.hasSecret('telegramToken'),
    models: MODELS,
    chats: store.chats(),
    tasks: store.tasks(),
    runs: store.runs().slice(0, 100),
    imported: store.imported().map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, count: c.messages.length, preview: (c.messages[0] || {}).text?.slice(0, 160) || '' })),
    encryption: safeStorage.isEncryptionAvailable(),
    dataDir: app.getPath('userData'),
    version: app.getVersion(),
  };
}

function registerIpc() {
  ipcMain.handle('state:get', () => state());

  ipcMain.handle('settings:save', (_e, patch) => {
    const s = store.saveSettings(patch);
    if ('autoStart' in patch && !process.env.CLAUDE_DESK_TEST) {
      app.setLoginItemSettings({ openAtLogin: Boolean(patch.autoStart), args: ['--hidden'] });
    }
    return s;
  });

  ipcMain.handle('secret:set', (_e, key, value) => {
    if (!['anthropicKey', 'telegramToken'].includes(key)) throw new Error('Khoá không hợp lệ');
    store.setSecret(key, (value || '').trim());
    return true;
  });

  ipcMain.handle('key:test', async () => {
    try {
      await testKey(store.getSecret('anthropicKey'));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: friendlyError(err) };
    }
  });

  ipcMain.handle('telegram:find-chat', async () => {
    try {
      const id = await findTelegramChatId(store.getSecret('telegramToken'));
      store.saveSettings({ telegramChatId: id });
      return { ok: true, chatId: id };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('telegram:test', async () => {
    try {
      await sendTelegram(store.getSecret('telegramToken'), store.settings().telegramChatId, 'Claude Desk: kết nối Telegram OK.');
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // ---- chat ----
  ipcMain.handle('chat:send', async (_e, { chatId, text, context }) => {
    const settings = store.settings();
    let chat = store.chats().find((c) => c.id === chatId);
    if (!chat) {
      chat = { id: crypto.randomUUID(), title: text.slice(0, 60) || 'Chat mới', createdAt: new Date().toISOString(), messages: [] };
      if (context) chat.context = context;
    }
    chat.messages.push({ role: 'user', content: text, at: new Date().toISOString() });
    store.saveChat(chat);

    const apiMessages = chat.messages.map((m) => ({ role: m.role, content: m.content }));
    if (chat.context) {
      apiMessages[0] = { role: 'user', content: `${chat.context}\n\n---\n\n${apiMessages[0].content}` };
    }

    const controller = new AbortController();
    chatAborts.set(chat.id, controller);
    // Trả id ngay để giao diện biết chat nào đang nhận stream.
    setImmediate(async () => {
      let reply = '';
      try {
        const result = await ask({
          apiKey: store.getSecret('anthropicKey'),
          model: settings.model,
          effort: settings.effort,
          system: settings.system,
          messages: apiMessages,
          signal: controller.signal,
          onText: (d) => {
            reply += d;
            send('chat:delta', { chatId: chat.id, delta: d });
          },
        });
        reply = result.text;
        chat.messages.push({ role: 'assistant', content: reply, at: new Date().toISOString(), usage: result.usage });
        store.saveChat(chat);
        send('chat:done', { chatId: chat.id, ok: true });
      } catch (err) {
        const aborted = controller.signal.aborted;
        if (reply) {
          chat.messages.push({ role: 'assistant', content: reply + (aborted ? '\n\n(đã dừng)' : ''), at: new Date().toISOString() });
        } else {
          // Bỏ tin nhắn người dùng chưa có trả lời để lịch sử luôn xen kẽ user/assistant.
          chat.messages.pop();
        }
        if (chat.messages.length) store.saveChat(chat);
        else store.deleteChat(chat.id);
        send('chat:done', { chatId: chat.id, ok: false, error: aborted ? 'Đã dừng.' : friendlyError(err), restoreText: reply ? '' : text });
      } finally {
        chatAborts.delete(chat.id);
      }
    });
    return { chatId: chat.id };
  });

  ipcMain.handle('chat:stop', (_e, chatId) => {
    const c = chatAborts.get(chatId);
    if (c) c.abort();
    return true;
  });

  ipcMain.handle('chat:delete', (_e, chatId) => {
    store.deleteChat(chatId);
    return true;
  });

  ipcMain.handle('chat:rename', (_e, chatId, title) => {
    const chat = store.chats().find((c) => c.id === chatId);
    if (chat) {
      chat.title = title;
      store.saveChat(chat);
    }
    return true;
  });

  // ---- task ----
  ipcMain.handle('task:save', (_e, task) => {
    if (task.cron && !validateCron(task.cron)) throw new Error('Lịch cron không hợp lệ.');
    const saved = store.saveTask(task);
    scheduler.reload();
    return saved;
  });

  ipcMain.handle('task:delete', (_e, id) => {
    store.deleteTask(id);
    scheduler.reload();
    return true;
  });

  ipcMain.handle('task:run', (_e, id) => scheduler.run(id, 'tay'));

  ipcMain.handle('cron:validate', (_e, expr) => validateCron(expr));

  // ---- nhập lịch sử từ claude.ai ----
  ipcMain.handle('import:pick', async (_e, filePath) => {
    let file = filePath;
    if (!file) {
      const res = await dialog.showOpenDialog(win, {
        title: 'Chọn file export từ claude.ai',
        filters: [{ name: 'Export Claude', extensions: ['zip', 'json'] }],
        properties: ['openFile'],
      });
      if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };
      file = res.filePaths[0];
    }
    try {
      const list = importFile(file);
      const byId = new Map(store.imported().map((c) => [c.id, c]));
      for (const c of list) byId.set(c.id, c);
      store.saveImported([...byId.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))));
      return { ok: true, count: list.length };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('import:continue', (_e, id) => {
    const conv = store.imported().find((c) => c.id === id);
    if (!conv) throw new Error('Không tìm thấy hội thoại.');
    return { context: asContext(conv), title: conv.title, messages: conv.messages };
  });

  // ---- automation trong lịch sử ----
  ipcMain.handle('auto:list', () => detectAutomations(store.imported()));

  ipcMain.handle('auto:analyze', async (_e, autoId) => {
    const list = store.imported();
    const auto = detectAutomations(list).find((a) => a.id === autoId)
      || (autoId.startsWith('conv-') && list.some((c) => 'conv-' + c.id === autoId)
        ? { id: autoId, kind: 'hint', conversationIds: [autoId.slice(5)] }
        : null);
    if (!auto) return { ok: false, error: 'Không tìm thấy automation.' };
    const byId = new Map(list.map((c) => [c.id, c]));
    const convs = auto.conversationIds.map((id) => byId.get(id)).filter(Boolean);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const result = await analyzeAutomation({
        apiKey: store.getSecret('anthropicKey'),
        model: store.settings().model,
        brief: automationBrief(auto, convs, tz),
      });
      result.tasks = result.tasks.map((t) => ({ ...t, cron: t.cron && validateCron(t.cron) ? t.cron : '', cronInvalid: Boolean(t.cron && !validateCron(t.cron)) }));
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, error: friendlyError(err) };
    }
  });

  ipcMain.handle('import:clear', () => {
    store.saveImported([]);
    return true;
  });
}

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'), safeStorage);
  scheduler = new Scheduler(store, (evt) => {
    send('task:event', evt);
    if (evt.type === 'run-end' && evt.run.status === 'error' && Notification.isSupported()) {
      new Notification({ title: `Task lỗi: ${evt.run.taskName}`, body: evt.run.error }).show();
    }
  });
  registerIpc();
  createWindow();
  if (!process.env.CLAUDE_DESK_TEST) createTray();
  scheduler.reload();
  if (process.argv.includes('--hidden')) win.hide();
});

app.on('second-instance', () => {
  if (win) { win.show(); win.focus(); }
});

app.on('before-quit', () => {
  quitting = true;
  if (scheduler) scheduler.stopAll();
});

// Không thoát khi đóng hết cửa sổ: app vẫn chạy ở khay.
app.on('window-all-closed', () => {
  if (process.env.CLAUDE_DESK_TEST) app.quit();
});

app.on('activate', () => {
  if (win) win.show();
});
