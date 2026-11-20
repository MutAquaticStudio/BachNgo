// Cầu nối an toàn giữa giao diện và tiến trình chính (contextIsolation bật).
const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('desk', {
  getState: invoke('state:get'),
  saveSettings: invoke('settings:save'),
  setSecret: invoke('secret:set'),
  testKey: invoke('key:test'),
  findTelegramChat: invoke('telegram:find-chat'),
  testTelegram: invoke('telegram:test'),

  sendChat: invoke('chat:send'),
  stopChat: invoke('chat:stop'),
  deleteChat: invoke('chat:delete'),
  renameChat: invoke('chat:rename'),

  saveTask: invoke('task:save'),
  deleteTask: invoke('task:delete'),
  runTask: invoke('task:run'),
  validateCron: invoke('cron:validate'),

  importExport: invoke('import:pick'),
  continueImported: invoke('import:continue'),
  clearImported: invoke('import:clear'),
  listAutomations: invoke('auto:list'),
  analyzeAutomation: invoke('auto:analyze'),

  on(channel, fn) {
    const allowed = ['chat:delta', 'chat:done', 'task:event'];
    if (!allowed.includes(channel)) return () => {};
    const handler = (_e, data) => fn(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },
});
