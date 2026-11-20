/* global desk */
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

let S = null; // state từ main
let currentChat = null; // id chat đang mở
let pendingContext = null; // ngữ cảnh từ lịch sử claude.ai cho chat mới
let streaming = null; // { chatId, el, text }
let currentTask = null;
let currentHist = null;

// ---------- tiện ích ----------
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Markdown tối giản, an toàn: code block, inline code, đậm, nghiêng, link. */
function md(text) {
  const parts = String(text).split(/```(\w*)\n?([\s\S]*?)(?:```|$)/g);
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 0) {
      const html = esc(parts[i])
        .replace(/`([^`\n]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
        .replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, '$1<i>$2</i>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank">$1</a>');
      out += html
        .split(/\n{2,}/)
        .filter((p) => p.trim())
        .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('');
    } else if (i % 3 === 2) {
      out += `<pre><code>${esc(parts[i])}</code></pre>`;
    }
  }
  return out;
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function flash(el, text, cls = 'muted') {
  el.className = cls;
  el.textContent = text;
}

async function refresh() {
  S = await desk.getState();
  const ks = $('#keyStatus');
  ks.textContent = S.hasKey ? '● Đã có API key' : '● Chưa có API key';
  ks.className = 'rail-foot' + (S.hasKey ? '' : ' bad');
}

// ---------- điều hướng ----------
async function show(view) {
  if (view !== 'chat') await refresh();
  $$('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${view}`));
  if (view === 'tasks') renderTasks();
  if (view === 'history') renderHistList();
  if (view === 'settings') renderSettings();
}
$$('.tab').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));

// ---------- CHAT ----------
function renderChatList() {
  const q = $('#chatSearch').value.trim().toLowerCase();
  const ul = $('#chatList');
  ul.innerHTML = '';
  for (const c of S.chats) {
    if (q && !c.title.toLowerCase().includes(q) && !c.messages.some((m) => m.content.toLowerCase().includes(q))) continue;
    const li = document.createElement('li');
    li.className = c.id === currentChat ? 'active' : '';
    li.innerHTML = `${esc(c.title)}<small>${fmtTime(c.updatedAt)} · ${c.messages.length} tin</small>`;
    li.onclick = () => openChat(c.id);
    ul.appendChild(li);
  }
}

function addMsg(container, role, text, meta) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.innerHTML = md(text) + (meta ? `<div class="meta">${esc(meta)}</div>` : '');
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function openChat(id) {
  currentChat = id;
  pendingContext = null;
  const chat = S.chats.find((c) => c.id === id);
  const box = $('#messages');
  box.innerHTML = '';
  $('#chatTitle').textContent = chat ? chat.title : 'Chat mới';
  $('#deleteChat').hidden = !chat;
  $('#contextNote').hidden = !(chat && chat.context);
  if (chat && chat.context) $('#contextNote').textContent = 'Chat này có kèm ngữ cảnh từ một hội thoại cũ trên claude.ai.';
  if (!chat) {
    box.innerHTML = '<div class="empty"><h3>Bắt đầu chat với Claude</h3><p>Lịch sử chat được lưu trên máy này. API key của bạn được mã hoá.</p></div>';
  } else {
    for (const m of chat.messages) addMsg(box, m.role, m.content, m.role === 'assistant' && m.usage ? `${m.usage.input_tokens + (m.usage.cache_read_input_tokens || 0)} vào · ${m.usage.output_tokens} ra token` : '');
  }
  $('#chatMeta').textContent = chat ? fmtTime(chat.updatedAt) : '';
  setBusy(streaming && streaming.chatId === id);
  renderChatList();
  $('#input').focus();
}

function setBusy(busy) {
  $('#sendBtn').disabled = Boolean(busy);
  $('#stopBtn').hidden = !busy;
}

$('#newChat').onclick = () => openChat(null);
$('#chatSearch').oninput = renderChatList;
$('#deleteChat').onclick = async () => {
  if (!currentChat || !confirm('Xoá chat này?')) return;
  await desk.deleteChat(currentChat);
  await refresh();
  openChat(null);
};

$('#input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    $('#composer').requestSubmit();
  }
});

$('#composer').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('#input').value.trim();
  if (!text || streaming) return;
  if (!S.hasKey) {
    alert('Chưa có API key. Vào Cài đặt để thêm.');
    show('settings');
    return;
  }
  $('#input').value = '';
  const box = $('#messages');
  if (!currentChat) box.innerHTML = '';
  addMsg(box, 'user', text);
  const el = addMsg(box, 'assistant', '');
  el.classList.add('typing');
  setBusy(true);
  const { chatId } = await desk.sendChat({ chatId: currentChat, text, context: currentChat ? undefined : pendingContext });
  pendingContext = null;
  currentChat = chatId;
  $('#deleteChat').hidden = false;
  streaming = { chatId, el, text: '' };
  await refresh();
  renderChatList();
  const chat = S.chats.find((c) => c.id === chatId);
  if (chat) $('#chatTitle').textContent = chat.title;
});

$('#stopBtn').onclick = () => streaming && desk.stopChat(streaming.chatId);

desk.on('chat:delta', ({ chatId, delta }) => {
  if (!streaming || streaming.chatId !== chatId) return;
  streaming.text += delta;
  if (currentChat === chatId) {
    streaming.el.innerHTML = md(streaming.text);
    const box = $('#messages');
    box.scrollTop = box.scrollHeight;
  }
});

desk.on('chat:done', async ({ chatId, ok, error, restoreText }) => {
  const s = streaming;
  streaming = null;
  setBusy(false);
  await refresh();
  if (currentChat === chatId || (s && s.chatId === chatId)) {
    if (!S.chats.find((c) => c.id === chatId)) currentChat = null;
    if (currentChat) openChat(chatId);
    if (!ok) {
      addMsg($('#messages'), 'assistant error', error);
      if (restoreText) $('#input').value = restoreText;
    }
  }
  renderChatList();
});

// ---------- TASKS ----------
function fillModels(sel, withDefault) {
  sel.innerHTML = (withDefault ? '<option value="">Theo cài đặt chung</option>' : '') +
    S.models.map((m) => `<option value="${m.id}">${esc(m.label)}</option>`).join('');
}

function renderTasks() {
  const ul = $('#taskList');
  ul.innerHTML = '';
  for (const t of S.tasks) {
    const li = document.createElement('li');
    li.className = t.id === currentTask ? 'active' : '';
    const last = S.runs.find((r) => r.taskId === t.id);
    li.innerHTML = `<span class="dot ${t.enabled && t.cron ? 'on' : ''}"></span>${esc(t.name)}<small>${t.cron ? esc(t.cron) : 'chạy tay'}${last ? ' · ' + (last.status === 'ok' ? 'OK ' : 'LỖI ') + fmtTime(last.startedAt) : ''}</small>`;
    li.onclick = () => openTask(t.id);
    ul.appendChild(li);
  }
  if (currentTask !== null) openTask(currentTask, true);
}

function openTask(id, keepForm) {
  currentTask = id;
  const t = S.tasks.find((x) => x.id === id) || { name: '', cron: '', enabled: true, prompt: '', format: 'text', telegram: false, webhookUrl: '', model: '' };
  const f = $('#taskForm');
  f.hidden = false;
  $('#taskEmpty').hidden = true;
  fillModels($('#taskModel'), true);
  if (!keepForm || !f.dataset.dirty) {
    f.name.value = t.name;
    f.cron.value = t.cron || '';
    f.enabled.checked = t.enabled !== false;
    f.prompt.value = t.prompt;
    f.format.value = t.format || 'text';
    f.model.value = t.model || '';
    f.telegram.checked = Boolean(t.telegram);
    f.webhookUrl.value = t.webhookUrl || '';
    delete f.dataset.dirty;
  }
  $('#taskFormTitle').textContent = t.id ? t.name : 'Task mới';
  $('#runTask').disabled = !t.id;
  $('#deleteTask').hidden = !t.id;
  const runs = S.runs.filter((r) => r.taskId === id).slice(0, 20);
  $('#runList').innerHTML = runs.length
    ? runs.map((r) => `<li><details><summary><span class="badge ${r.status === 'ok' ? 'ok' : 'bad'}">${r.status === 'ok' ? 'OK' : 'LỖI'}</span>${fmtTime(r.startedAt)} · ${esc(r.trigger)}${r.error ? ' · ' + esc(r.error) : ''}</summary>${r.steps && r.steps.length ? `<div class="muted">${r.steps.map(esc).join('<br>')}</div>` : ''}<pre>${esc(r.text || '')}</pre></details></li>`).join('')
    : '<li class="muted">Chưa chạy lần nào.</li>';
  $$('#taskList li').forEach((li, i) => li.classList.toggle('active', S.tasks[i] && S.tasks[i].id === id));
}

$('#newTask').onclick = () => {
  delete $('#taskForm').dataset.dirty;
  openTask(null);
  $('#taskForm').name.focus();
};
$('#taskForm').addEventListener('input', () => { $('#taskForm').dataset.dirty = '1'; });

$('#taskForm').cron.addEventListener('input', async (e) => {
  const v = e.target.value.trim();
  const ok = !v || (await desk.validateCron(v));
  e.target.style.borderColor = ok ? '' : 'var(--danger)';
});

$('#taskForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const existing = S.tasks.find((x) => x.id === currentTask) || {};
  try {
    const saved = await desk.saveTask({
      ...existing,
      name: f.name.value.trim(),
      cron: f.cron.value.trim(),
      enabled: f.enabled.checked,
      prompt: f.prompt.value,
      format: f.format.value,
      model: f.model.value,
      telegram: f.telegram.checked,
      webhookUrl: f.webhookUrl.value.trim(),
    });
    delete f.dataset.dirty;
    currentTask = saved.id;
    await refresh();
    renderTasks();
    flash($('#taskMsg'), 'Đã lưu.', 'ok');
  } catch (err) {
    flash($('#taskMsg'), String(err.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'bad');
  }
});

$('#runTask').onclick = async () => {
  if (!currentTask) return;
  flash($('#taskMsg'), 'Đang chạy…');
  $('#runTask').disabled = true;
  const run = await desk.runTask(currentTask);
  $('#runTask').disabled = false;
  await refresh();
  renderTasks();
  if (run && run.skipped) flash($('#taskMsg'), 'Task đang chạy rồi.');
  else flash($('#taskMsg'), run.status === 'ok' ? 'Chạy xong.' : `Lỗi: ${run.error}`, run.status === 'ok' ? 'ok' : 'bad');
};

$('#deleteTask').onclick = async () => {
  if (!currentTask || !confirm('Xoá task này?')) return;
  await desk.deleteTask(currentTask);
  currentTask = null;
  await refresh();
  $('#taskForm').hidden = true;
  $('#taskEmpty').hidden = false;
  renderTasks();
};

desk.on('task:event', async () => {
  await refresh();
  if ($('#view-tasks').classList.contains('active')) renderTasks();
});

// ---------- LỊCH SỬ claude.ai ----------
let autos = [];
let currentAuto = null;

async function renderHistList() {
  autos = await desk.listAutomations();
  const q = $('#histSearch').value.trim().toLowerCase();
  const match = (title, text) => !q || title.toLowerCase().includes(q) || String(text).toLowerCase().includes(q);

  const au = $('#autoList');
  au.innerHTML = '';
  const shownAutos = autos.filter((a) => match(a.title, a.prompt));
  $('#autoLabel').hidden = !autos.length;
  for (const a of shownAutos.slice(0, 200)) {
    const li = document.createElement('li');
    li.className = a.id === currentAuto ? 'active' : '';
    li.innerHTML = `${esc(a.title)}<small>${a.kind === 'repeated' ? `Chạy ${a.count} lần · gần nhất ${fmtTime(a.runs[0])}` : 'Gợi ý: có nhắc tới lịch / tự động'}</small>`;
    li.onclick = () => openAuto(a.id);
    au.appendChild(li);
  }

  const ul = $('#histList');
  ul.innerHTML = '';
  for (const c of S.imported.filter((c) => match(c.title, c.preview)).slice(0, 500)) {
    const li = document.createElement('li');
    li.className = c.id === currentHist ? 'active' : '';
    li.innerHTML = `${esc(c.title)}<small>${fmtTime(c.updatedAt)} · ${c.count} tin</small>`;
    li.onclick = () => openHist(c.id);
    ul.appendChild(li);
  }
  if (!S.imported.length) ul.innerHTML = '<li class="muted">Chưa nhập gì.</li>';
}

function showHistPane(which) {
  $('#histEmpty').hidden = which !== 'empty';
  $('#histDetail').hidden = which !== 'conv';
  $('#autoDetail').hidden = which !== 'auto';
}

async function openHist(id) {
  currentHist = id;
  currentAuto = null;
  const conv = await desk.continueImported(id);
  showHistPane('conv');
  $('#histTitle').textContent = conv.title;
  $('#histAnalysis').innerHTML = '';
  const box = $('#histMessages');
  box.innerHTML = '';
  for (const m of conv.messages) addMsg(box, m.role, m.text, fmtTime(m.at));
  $('#histContinue').onclick = () => {
    show('chat');
    openChat(null);
    pendingContext = conv.context;
    $('#contextNote').hidden = false;
    $('#contextNote').textContent = `Tin nhắn đầu tiên sẽ kèm toàn bộ hội thoại cũ “${conv.title}” làm ngữ cảnh.`;
  };
  $('#histFindAuto').onclick = () => analyze('conv-' + id, $('#histAnalysis'), $('#histFindAuto'));
  renderHistList();
}

function openAuto(id) {
  currentAuto = id;
  currentHist = null;
  const a = autos.find((x) => x.id === id);
  if (!a) return;
  showHistPane('auto');
  $('#autoTitle').textContent = a.title;
  $('#autoMeta').textContent = a.kind === 'repeated'
    ? `${a.count} hội thoại có cùng tin nhắn đầu, nhiều khả năng là task chạy theo lịch. Lần gần nhất: ${fmtTime(a.runs[0])}.`
    : 'Hội thoại có nhắc tới lịch hoặc tự động. Có thể chứa yêu cầu automation.';
  $('#autoPrompt').value = a.prompt;
  $('#autoRuns').innerHTML = a.runs.slice(0, 100).map((r) => `<li>${esc(fmtTime(r))}</li>`).join('');
  $('#autoAnalysis').innerHTML = '';
  $('#autoMsg').textContent = '';
  $('#autoAnalyze').onclick = () => analyze(id, $('#autoAnalysis'), $('#autoAnalyze'));
  $('#autoRaw').onclick = () => renderProposals($('#autoAnalysis'), {
    summary: 'Tạo task với prompt cũ, chưa qua phân tích. Hãy tự đặt lịch và kiểm tra prompt: nếu prompt cũ dùng connector (Gmail, Upwork, Drive…), task sẽ không có dữ liệu đó.',
    tasks: [{ name: a.title, cron: '', prompt: a.prompt, format: 'text', telegram: S.hasTelegram, feasible: true, missing: '', notes: '' }],
  });
  renderHistList();
}

async function analyze(autoId, target, btn) {
  if (!S.hasKey) {
    alert('Chưa có API key. Vào Cài đặt để thêm.');
    return show('settings');
  }
  btn.disabled = true;
  target.innerHTML = '<p class="muted typing">Claude đang đọc lịch sử và đề xuất task</p>';
  const res = await desk.analyzeAutomation(autoId);
  btn.disabled = false;
  if (!res.ok) {
    target.innerHTML = `<p class="bad">${esc(res.error)}</p>`;
    return;
  }
  renderProposals(target, res);
}

function renderProposals(target, res) {
  target.innerHTML = `<div class="summary">${esc(res.summary || '')}</div>`;
  if (!res.tasks.length) {
    target.innerHTML += '<p class="muted">Không tìm thấy automation nào để tạo task.</p>';
    return;
  }
  res.tasks.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'proposal' + (t.feasible ? '' : ' warn');
    card.innerHTML = `
      ${t.feasible ? '' : `<div class="warning"><b>Chưa chạy lại đầy đủ được:</b> ${esc(t.missing || 'task cũ cần công cụ mà Claude Desk chưa có.')}</div>`}
      ${t.feasible && t.missing ? `<div class="warning">${esc(t.missing)}</div>` : ''}
      <label>Tên task<input data-f="name"></label>
      <label>Lịch (cron)<input data-f="cron" placeholder="để trống = chỉ chạy tay"></label>
      <label>Prompt<textarea data-f="prompt" rows="7"></textarea></label>
      ${t.notes ? `<p class="muted">${esc(t.notes)}</p>` : ''}
      ${t.cronInvalid ? '<p class="bad">Lịch Claude đề xuất không hợp lệ nên đã để trống.</p>' : ''}
      <label class="check-inline"><input type="checkbox" data-f="telegram"> Gửi kết quả qua Telegram</label>
      <div class="form-actions">
        <button class="primary" data-act="add">Thêm task</button>
        <button class="ghost" data-act="run">Thêm và chạy ngay</button>
        <span class="muted" data-msg></span>
      </div>`;
    card.querySelector('[data-f=name]').value = t.name;
    card.querySelector('[data-f=cron]').value = t.cron || '';
    card.querySelector('[data-f=prompt]').value = t.prompt;
    card.querySelector('[data-f=telegram]').checked = Boolean(t.telegram && S.hasTelegram);
    const msg = card.querySelector('[data-msg]');
    const save = async (runNow) => {
      try {
        const saved = await desk.saveTask({
          name: card.querySelector('[data-f=name]').value.trim() || 'Task',
          cron: card.querySelector('[data-f=cron]').value.trim(),
          enabled: true,
          prompt: card.querySelector('[data-f=prompt]').value,
          format: t.format || 'text',
          model: '',
          telegram: card.querySelector('[data-f=telegram]').checked,
          webhookUrl: '',
          source: 'claude.ai',
        });
        card.querySelectorAll('button').forEach((b) => (b.disabled = true));
        await refresh();
        if (!runNow) {
          flash(msg, 'Đã thêm vào Task tự động.', 'ok');
          return;
        }
        flash(msg, 'Đã thêm, đang chạy…');
        const run = await desk.runTask(saved.id);
        await refresh();
        flash(msg, run.status === 'ok' ? 'Chạy xong. Xem kết quả trong Task tự động.' : `Lỗi: ${run.error}`, run.status === 'ok' ? 'ok' : 'bad');
      } catch (err) {
        flash(msg, String(err.message || err).replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'bad');
      }
    };
    card.querySelector('[data-act=add]').onclick = () => save(false);
    card.querySelector('[data-act=run]').onclick = () => save(true);
    target.appendChild(card);
  });
}

$('#histSearch').oninput = renderHistList;
$('#importBtn').onclick = async () => {
  const res = await desk.importExport();
  if (res.canceled) return;
  if (!res.ok) return alert(`Không nhập được: ${res.error}`);
  await refresh();
  await renderHistList();
  alert(`Đã nhập ${res.count} hội thoại. Phát hiện ${autos.filter((a) => a.kind === 'repeated').length} automation chạy lặp lại.`);
};
$('#histClear').onclick = async () => {
  if (!confirm('Xoá toàn bộ lịch sử đã nhập trên máy này?')) return;
  await desk.clearImported();
  await refresh();
  showHistPane('empty');
  renderHistList();
};

// ---------- CÀI ĐẶT ----------
function renderSettings() {
  const f = $('#settingsForm');
  fillModels($('#modelSel'), false);
  f.model.value = S.settings.model;
  f.effort.value = S.settings.effort;
  f.system.value = S.settings.system;
  f.telegramChatId.value = S.settings.telegramChatId || '';
  f.autoStart.checked = Boolean(S.settings.autoStart);
  $('#apiKey').placeholder = S.hasKey ? '•••••••• (đã lưu – nhập key mới để thay)' : 'sk-ant-…';
  $('#tgToken').placeholder = S.hasTelegram ? '•••••••• (đã lưu)' : '123456:ABC…';
  $('#sysInfo').textContent = `Dữ liệu lưu tại: ${S.dataDir}. ${S.encryption ? 'Key được mã hoá bằng kho khoá của hệ điều hành.' : 'CẢNH BÁO: máy không hỗ trợ mã hoá, key lưu dạng thường.'} Phiên bản ${S.version}.`;
}

$('#saveKey').onclick = async () => {
  const v = $('#apiKey').value.trim();
  if (!v) return flash($('#keyMsg'), 'Nhập key trước.', 'bad');
  await desk.setSecret('anthropicKey', v);
  $('#apiKey').value = '';
  await refresh();
  renderSettings();
  flash($('#keyMsg'), 'Đã lưu. Đang kiểm tra…');
  const r = await desk.testKey();
  flash($('#keyMsg'), r.ok ? 'Key hoạt động.' : r.error, r.ok ? 'ok' : 'bad');
};
$('#testKey').onclick = async () => {
  flash($('#keyMsg'), 'Đang kiểm tra…');
  const r = await desk.testKey();
  flash($('#keyMsg'), r.ok ? 'Key hoạt động.' : r.error, r.ok ? 'ok' : 'bad');
};
$('#saveTg').onclick = async () => {
  const v = $('#tgToken').value.trim();
  if (!v) return flash($('#tgMsg'), 'Nhập token trước.', 'bad');
  await desk.setSecret('telegramToken', v);
  $('#tgToken').value = '';
  await refresh();
  renderSettings();
  flash($('#tgMsg'), 'Đã lưu token.', 'ok');
};
$('#findTg').onclick = async () => {
  const r = await desk.findTelegramChat();
  if (r.ok) {
    $('#settingsForm').telegramChatId.value = r.chatId;
    await refresh();
  }
  flash($('#tgMsg'), r.ok ? `Chat ID: ${r.chatId}` : r.error, r.ok ? 'ok' : 'bad');
};
$('#testTg').onclick = async () => {
  await desk.saveSettings({ telegramChatId: $('#settingsForm').telegramChatId.value.trim() });
  const r = await desk.testTelegram();
  flash($('#tgMsg'), r.ok ? 'Đã gửi, kiểm tra Telegram.' : r.error, r.ok ? 'ok' : 'bad');
};
$('#settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  await desk.saveSettings({
    model: f.model.value,
    effort: f.effort.value,
    system: f.system.value,
    telegramChatId: f.telegramChatId.value.trim(),
    autoStart: f.autoStart.checked,
  });
  await refresh();
  flash($('#settingsMsg'), 'Đã lưu.', 'ok');
});

// ---------- khởi động ----------
(async () => {
  await refresh();
  renderChatList();
  openChat(S.chats[0] ? S.chats[0].id : null);
  if (!S.hasKey) show('settings');
})();
