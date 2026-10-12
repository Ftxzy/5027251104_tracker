// ── State ────────────────────────────────────────────────────
let tasks = [];
let courses = [];
const pendingIds = new Set();       // task ids with a PATCH/DELETE still in flight
let currentFilter = 'all';          // 'all' | 'active' | 'done'
let status = 'loading';             // 'loading' | 'error' | 'ready'
let errorMessage = '';
let isSubmitting = false;           // a POST is in flight

// ── Helpers ──────────────────────────────────────────────────
function getTodayString() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Server text goes into innerHTML, so escape it first (prevents XSS)
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// Offline mode rejects with TypeError("Failed to fetch"); HTTP errors carry the server's message
function describeError(err) {
  return err instanceof TypeError
    ? 'Tidak dapat terhubung ke server. Periksa koneksi kamu.'
    : err.message;
}

// ── API ──────────────────────────────────────────────────────
// fetch() only rejects on network failure, so we check res.ok ourselves
// and turn the server's { error } message into a thrown Error.
async function api(path, options = {}) {
  const res = await fetch(path, options);

  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch { /* body is not JSON, keep the default message */ }
    throw new Error(message);
  }

  if (res.status === 204) return null;   // DELETE has no body
  return res.json();
}

// ── Render ───────────────────────────────────────────────────
// The add button is only usable once data has loaded and no POST is running
function updateAddButton() {
  const addBtn = document.getElementById('add-btn');
  addBtn.disabled = status !== 'ready' || isSubmitting;
  addBtn.textContent = isSubmitting ? 'Menyimpan…' : 'Tambah';
}

function render() {
  const list = document.getElementById('task-list');
  updateAddButton();
  const activeCount = tasks.filter(t => !t.selesai).length;

  document.getElementById('active-count').textContent =
    status === 'ready' ? `${activeCount} tugas aktif` : '';

  if (status === 'loading') {
    list.innerHTML = '<li class="state">Memuat tugas…</li>';
    return;
  }

  if (status === 'error') {
    list.innerHTML = `
      <li class="state state-error">
        <p>${escapeHtml(errorMessage)}</p>
        <button class="retry-btn" data-action="retry">Coba lagi</button>
      </li>`;
    return;
  }

  const filtered = tasks.filter(t =>
    currentFilter === 'active' ? !t.selesai :
    currentFilter === 'done'   ? t.selesai  : true
  );

  if (filtered.length === 0) {
    list.innerHTML = '<li class="state">Belum ada tugas.</li>';
    return;
  }

  list.innerHTML = filtered.map(task => `
    <li class="task-card ${pendingIds.has(task.id) ? 'pending' : ''}" data-id="${task.id}">
      <div class="task-check ${task.selesai ? 'checked' : ''}" data-action="toggle"></div>
      <div class="task-body" data-action="toggle">
        <span class="task-text ${task.selesai ? 'done' : ''}">${escapeHtml(task.judul)}</span>
        <span class="task-meta">${escapeHtml(task.matkul)} · deadline ${escapeHtml(task.deadline)}</span>
      </div>
      <button class="delete-btn" data-action="delete" aria-label="Hapus tugas">✕</button>
    </li>
  `).join('');
}

function renderCourses() {
  const select = document.getElementById('course-select');
  select.innerHTML = courses.map(c =>
    `<option value="${escapeHtml(c.nama)}">${escapeHtml(c.nama)}</option>`
  ).join('');
}

// ── Load tasks + courses ─────────────────────────────────────
async function loadTasks() {
  status = 'loading';
  showListError('');                // clear a stale message from an earlier failed action
  render();

  try {
    // The two requests don't depend on each other, so run them in parallel
    [tasks, courses] = await Promise.all([
      api('/api/tugas'),
      api('/api/matkul'),
    ]);
    renderCourses();
    status = 'ready';
  } catch (err) {
    errorMessage = describeError(err);
    status = 'error';
    document.getElementById('course-select').innerHTML =
      '<option value="">Mata kuliah tidak tersedia</option>';
  } finally {
    render();
  }
}

// ── Add task ─────────────────────────────────────────────────
function showFormError(message) {
  const el = document.getElementById('form-error');
  el.textContent = message;
  el.hidden = !message;
}

async function addTask(e) {
  e.preventDefault();
  if (isSubmitting || status !== 'ready') return;

  const titleInput = document.getElementById('task-input');

  showFormError('');
  isSubmitting = true;              // stop double submits while the request is in flight
  updateAddButton();

  try {
    const created = await api('/api/tugas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        judul: titleInput.value,
        matkul: document.getElementById('course-select').value,
        deadline: document.getElementById('deadline-input').value,
      }),
    });

    tasks.push(created);            // the server's response has the real id
    titleInput.value = '';
    render();
  } catch (err) {
    showFormError(describeError(err));   // e.g. the server's 400 message
  } finally {
    isSubmitting = false;
    updateAddButton();
  }
}

// ── Toggle / delete ──────────────────────────────────────────
function showListError(message) {
  const el = document.getElementById('list-error');
  el.textContent = message;
  el.hidden = !message;
}

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task || pendingIds.has(id)) return;

  pendingIds.add(id);
  showListError('');
  render();

  try {
    const updated = await api(`/api/tugas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selesai: !task.selesai }),
    });
    tasks = tasks.map(t => t.id === id ? updated : t);   // trust the server's version
  } catch (err) {
    showListError(describeError(err));
  } finally {
    pendingIds.delete(id);
    render();
  }
}

async function deleteTask(id) {
  if (pendingIds.has(id)) return;

  pendingIds.add(id);
  showListError('');
  render();

  try {
    await api(`/api/tugas/${id}`, { method: 'DELETE' });  // 204: api() returns null, no JSON to parse
    tasks = tasks.filter(t => t.id !== id);
  } catch (err) {
    showListError(describeError(err));
  } finally {
    pendingIds.delete(id);
    render();
  }
}

// ── Event listeners ──────────────────────────────────────────
document.getElementById('add-form').addEventListener('submit', addTask);

// One listener for the whole list (event delegation); data-action says what was clicked
document.getElementById('task-list').addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  if (target.dataset.action === 'retry') return loadTasks();

  const card = target.closest('[data-id]');
  if (!card) return;
  const id = Number(card.dataset.id);

  if (target.dataset.action === 'toggle') toggleTask(id);
  if (target.dataset.action === 'delete') deleteTask(id);
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b =>
      b.classList.toggle('active', b === btn)
    );
    render();
  });
});

// ── Init ─────────────────────────────────────────────────────
document.getElementById('today-date').textContent = getTodayString();
loadTasks();
