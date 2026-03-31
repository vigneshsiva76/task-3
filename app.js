/**
 * Cognifyz Level 1 – Task 3
 * Console-style CRUD Application for Task Management
 * =====================================================
 * Implements: Create, Read, Update, Delete operations
 * Storage   : JavaScript Array (in-memory) + localStorage (persistence)
 * Language  : Vanilla JavaScript (ES6+)
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// ── TASK CLASS  (Step 1: Define a Task class with necessary attributes)
// ═══════════════════════════════════════════════════════════════════════════════

class Task {
  /**
   * @param {string} title       - Task title (required)
   * @param {string} description - Detailed description
   * @param {string} priority    - 'low' | 'medium' | 'high'
   * @param {string} category    - e.g. 'Work', 'Personal', 'Study'
   * @param {string} dueDate     - ISO date string or ''
   */
  constructor(title, description = '', priority = 'medium', category = 'General', dueDate = '') {
    this.id          = Task.generateId();
    this.title       = title.trim();
    this.description = description.trim();
    this.priority    = priority;
    this.category    = category.trim() || 'General';
    this.dueDate     = dueDate;
    this.completed   = false;
    this.createdAt   = new Date().toISOString();
    this.updatedAt   = new Date().toISOString();
  }

  /** Generate a short unique ID */
  static generateId() {
    return 'task_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  /** Return a plain object copy (for serialisation) */
  toJSON() {
    return { ...this };
  }

  /** Restore a plain object into a Task instance */
  static fromJSON(obj) {
    const t = Object.assign(new Task('__placeholder__'), obj);
    return t;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ── TASK STORE  (The list / array acting as the data layer)
// ═══════════════════════════════════════════════════════════════════════════════

class TaskStore {
  constructor(storageKey = 'cognifyz_tasks') {
    this.storageKey = storageKey;
    /** @type {Task[]} */
    this.tasks = [];
    this._load();
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  _save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks.map(t => t.toJSON())));
    } catch (_) { /* storage quota exceeded – silently ignore */ }
  }

  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.tasks = JSON.parse(raw).map(Task.fromJSON);
      }
    } catch (_) {
      this.tasks = [];
    }
  }

  // ── CREATE  (Step 2) ────────────────────────────────────────────────────────

  /**
   * Add a new task to the list.
   * @returns {Task} The created task
   */
  create(title, description, priority, category, dueDate) {
    if (!title || !title.trim()) throw new Error('Task title is required.');
    const task = new Task(title, description, priority, category, dueDate);
    this.tasks.unshift(task);   // newest first
    this._save();
    return task;
  }

  // ── READ  (Step 3) ──────────────────────────────────────────────────────────

  /** Return all tasks (optionally filtered) */
  readAll(filter = {}) {
    let list = [...this.tasks];

    if (filter.status === 'active')    list = list.filter(t => !t.completed);
    if (filter.status === 'completed') list = list.filter(t => t.completed);
    if (filter.priority)               list = list.filter(t => t.priority === filter.priority);
    if (filter.category)               list = list.filter(t => t.category === filter.category);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    if (filter.sort === 'priority') {
      const order = { high: 0, medium: 1, low: 2 };
      list.sort((a, b) => order[a.priority] - order[b.priority]);
    } else if (filter.sort === 'dueDate') {
      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (filter.sort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    // default: insertion order (newest first)

    return list;
  }

  /** Find a single task by id */
  readById(id) {
    return this.tasks.find(t => t.id === id) || null;
  }

  /** Return all unique categories */
  getCategories() {
    return [...new Set(this.tasks.map(t => t.category))].sort();
  }

  /** Summary stats */
  getStats() {
    const total     = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;
    const active    = total - completed;
    const high      = this.tasks.filter(t => t.priority === 'high' && !t.completed).length;
    const overdue   = this.tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    return { total, completed, active, high, overdue };
  }

  // ── UPDATE  (Step 4) ────────────────────────────────────────────────────────

  /**
   * Update any subset of task fields.
   * @param {string} id
   * @param {object} fields  - { title?, description?, priority?, category?, dueDate?, completed? }
   * @returns {Task|null}
   */
  update(id, fields) {
    const task = this.readById(id);
    if (!task) return null;
    if (fields.title !== undefined) {
      if (!fields.title.trim()) throw new Error('Task title cannot be empty.');
      task.title = fields.title.trim();
    }
    if (fields.description !== undefined) task.description = fields.description.trim();
    if (fields.priority    !== undefined) task.priority    = fields.priority;
    if (fields.category    !== undefined) task.category    = fields.category.trim() || 'General';
    if (fields.dueDate     !== undefined) task.dueDate     = fields.dueDate;
    if (fields.completed   !== undefined) task.completed   = Boolean(fields.completed);
    task.updatedAt = new Date().toISOString();
    this._save();
    return task;
  }

  /** Toggle completion status */
  toggleComplete(id) {
    const task = this.readById(id);
    if (!task) return null;
    return this.update(id, { completed: !task.completed });
  }

  // ── DELETE  (Step 5) ────────────────────────────────────────────────────────

  /** Delete a single task by id */
  delete(id) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx === -1) return false;
    this.tasks.splice(idx, 1);
    this._save();
    return true;
  }

  /** Delete all completed tasks */
  deleteCompleted() {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter(t => !t.completed);
    this._save();
    return before - this.tasks.length;
  }

  /** Delete ALL tasks (with confirmation flag) */
  deleteAll(confirmed = false) {
    if (!confirmed) throw new Error('Pass confirmed=true to delete all tasks.');
    const count = this.tasks.length;
    this.tasks = [];
    this._save();
    return count;
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ── UI CONTROLLER  (Renders everything, wires events)
// ═══════════════════════════════════════════════════════════════════════════════

class TaskUI {
  constructor(store) {
    this.store       = store;
    this.editingId   = null;
    this.activeFilter = { status: 'all', priority: '', category: '', search: '', sort: 'default' };
    this._init();
  }

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  _init() {
    this._seedDemoData();
    this._bindEvents();
    this._render();
  }

  /** Add sample tasks on first visit */
  _seedDemoData() {
    if (this.store.tasks.length > 0) return;
    const samples = [
      { title: 'Design system architecture',      desc: 'Create component library and token system',    pri: 'high',   cat: 'Work',     due: this._futureDateStr(2) },
      { title: 'Review pull requests',             desc: 'Go through 3 open PRs from the team',          pri: 'high',   cat: 'Work',     due: this._futureDateStr(0) },
      { title: 'Weekly team sync',                 desc: 'Prepare agenda and share notes afterwards',     pri: 'medium', cat: 'Work',     due: this._futureDateStr(1) },
      { title: 'Read "Clean Code" – ch. 5–8',      desc: 'Take notes on functions and comments chapters',pri: 'medium', cat: 'Study',    due: this._futureDateStr(4) },
      { title: 'Grocery run',                      desc: 'Milk, eggs, bread, coffee, fruit',              pri: 'low',    cat: 'Personal', due: this._futureDateStr(1) },
      { title: 'Morning workout',                  desc: '30 min cardio + stretching',                    pri: 'low',    cat: 'Health',   due: '' },
    ];
    samples.forEach(s => {
      const t = this.store.create(s.title, s.desc, s.pri, s.cat, s.due);
      if (s.title === 'Morning workout') this.store.update(t.id, { completed: true });
    });
  }

  _futureDateStr(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  }

  // ── Event Binding ────────────────────────────────────────────────────────────

  _bindEvents() {
    // Form submit (Create / Update)
    document.getElementById('task-form').addEventListener('submit', e => {
      e.preventDefault();
      this._handleFormSubmit();
    });

    // Cancel edit
    document.getElementById('btn-cancel').addEventListener('click', () => this._cancelEdit());

    // Search
    document.getElementById('search-input').addEventListener('input', e => {
      this.activeFilter.search = e.target.value;
      this._renderList();
    });

    // Filter dropdowns
    document.getElementById('filter-status').addEventListener('change', e => {
      this.activeFilter.status = e.target.value;
      this._renderList();
    });
    document.getElementById('filter-priority').addEventListener('change', e => {
      this.activeFilter.priority = e.target.value;
      this._renderList();
    });
    document.getElementById('filter-sort').addEventListener('change', e => {
      this.activeFilter.sort = e.target.value;
      this._renderList();
    });

    // Bulk actions
    document.getElementById('btn-clear-completed').addEventListener('click', () => {
      const n = this.store.deleteCompleted();
      if (n > 0) this._toast(`🗑 Cleared ${n} completed task${n > 1 ? 's' : ''}`, 'success');
      else this._toast('No completed tasks to clear.', 'info');
      this._render();
    });

    // Keyboard shortcut: N = new task, Escape = cancel
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.editingId) this._cancelEdit();
      if (e.key === 'n' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        document.getElementById('task-title').focus();
      }
    });
  }

  // ── CRUD Handlers ────────────────────────────────────────────────────────────

  _handleFormSubmit() {
    const title    = document.getElementById('task-title').value;
    const desc     = document.getElementById('task-desc').value;
    const priority = document.getElementById('task-priority').value;
    const category = document.getElementById('task-category').value;
    const dueDate  = document.getElementById('task-due').value;

    try {
      if (this.editingId) {
        // ── UPDATE
        this.store.update(this.editingId, { title, description: desc, priority, category, dueDate });
        this._toast('✏️ Task updated successfully!', 'success');
        this._cancelEdit();
      } else {
        // ── CREATE
        const task = this.store.create(title, desc, priority, category, dueDate);
        this._toast(`✅ "${task.title}" added!`, 'success');
        document.getElementById('task-form').reset();
      }
      this._render();
    } catch (err) {
      this._toast('⚠️ ' + err.message, 'error');
    }
  }

  _startEdit(id) {
    const task = this.store.readById(id);
    if (!task) return;
    this.editingId = id;

    document.getElementById('task-title').value    = task.title;
    document.getElementById('task-desc').value     = task.description;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-due').value      = task.dueDate || '';

    document.getElementById('form-heading').textContent = '✏️ Edit Task';
    document.getElementById('btn-submit').textContent   = 'Update Task';
    document.getElementById('btn-cancel').style.display = 'inline-flex';
    document.getElementById('task-title').focus();
    document.getElementById('task-form').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Highlight editing card
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('editing'));
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.classList.add('editing');
  }

  _cancelEdit() {
    this.editingId = null;
    document.getElementById('task-form').reset();
    document.getElementById('form-heading').textContent = '＋ New Task';
    document.getElementById('btn-submit').textContent   = 'Add Task';
    document.getElementById('btn-cancel').style.display = 'none';
    document.querySelectorAll('.task-card').forEach(c => c.classList.remove('editing'));
  }

  _deleteTask(id) {
    const task = this.store.readById(id);
    if (!task) return;
    // Animate out first
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.classList.add('removing');
      setTimeout(() => {
        this.store.delete(id);
        if (this.editingId === id) this._cancelEdit();
        this._render();
        this._toast(`🗑 "${task.title}" deleted.`, 'info');
      }, 320);
    } else {
      this.store.delete(id);
      this._render();
    }
  }

  _toggleComplete(id) {
    this.store.toggleComplete(id);
    this._render();
  }

  // ── Rendering ────────────────────────────────────────────────────────────────

  _render() {
    this._renderStats();
    this._renderList();
    this._renderCategoryFilter();
  }

  _renderStats() {
    const s = this.store.getStats();
    document.getElementById('stat-total').textContent     = s.total;
    document.getElementById('stat-active').textContent    = s.active;
    document.getElementById('stat-completed').textContent = s.completed;
    document.getElementById('stat-high').textContent      = s.high;
    document.getElementById('stat-overdue').textContent   = s.overdue;

    const pct = s.total === 0 ? 0 : Math.round((s.completed / s.total) * 100);
    document.getElementById('progress-bar').style.width = pct + '%';
    document.getElementById('progress-label').textContent = `${pct}% complete`;
  }

  _renderCategoryFilter() {
    const sel = document.getElementById('filter-category');
    const cur = sel.value;
    // rebuild options
    sel.innerHTML = '<option value="">All categories</option>';
    this.store.getCategories().forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
    sel.value = cur;
    sel.addEventListener('change', e => {
      this.activeFilter.category = e.target.value;
      this._renderList();
    });
  }

  _renderList() {
    const container = document.getElementById('task-list');
    const emptyState = document.getElementById('empty-state');

    const filterArg = { ...this.activeFilter };
    if (filterArg.status === 'all') delete filterArg.status;

    const tasks = this.store.readAll(filterArg);

    if (tasks.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'flex';
      return;
    }
    emptyState.style.display = 'none';
    container.innerHTML = tasks.map(t => this._taskCardHTML(t)).join('');

    // Bind card buttons
    container.querySelectorAll('.btn-complete').forEach(btn =>
      btn.addEventListener('click', () => this._toggleComplete(btn.dataset.id)));
    container.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', () => this._startEdit(btn.dataset.id)));
    container.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => this._deleteTask(btn.dataset.id)));
  }

  _taskCardHTML(task) {
    const due      = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : null;
    const now      = new Date(); now.setHours(0,0,0,0);
    const overdue  = due && !task.completed && due < now;
    const dueStr   = due ? due.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '';
    const dueCls   = overdue ? 'due-overdue' : (due && due.getTime() === now.getTime() ? 'due-today' : 'due-normal');
    const dueBadge = due ? `<span class="due-badge ${dueCls}">${overdue ? '⚠ Overdue · ' : (dueCls==='due-today'?'📅 Today · ':'')}${dueStr}</span>` : '';

    const priBadge = `<span class="pri-badge pri-${task.priority}">${task.priority}</span>`;
    const catBadge = `<span class="cat-badge">${this._escHtml(task.category)}</span>`;

    const checkIcon = task.completed
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/></svg>`;

    const createdStr = new Date(task.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' });

    return `
    <article class="task-card ${task.completed ? 'completed' : ''} pri-border-${task.priority}" data-id="${task.id}">
      <button class="btn-complete" data-id="${task.id}" title="${task.completed ? 'Mark active' : 'Mark complete'}">
        ${checkIcon}
      </button>
      <div class="card-body">
        <div class="card-top">
          <h3 class="task-title">${this._escHtml(task.title)}</h3>
          <div class="card-badges">${priBadge}${catBadge}${dueBadge}</div>
        </div>
        ${task.description ? `<p class="task-desc">${this._escHtml(task.description)}</p>` : ''}
        <div class="card-meta">
          <span class="meta-date">Created ${createdStr}</span>
          ${task.updatedAt !== task.createdAt ? `<span class="meta-date">· Edited</span>` : ''}
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-icon btn-edit"   data-id="${task.id}" title="Edit task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon btn-delete" data-id="${task.id}" title="Delete task">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </article>`;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  _escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
}


// ═══════════════════════════════════════════════════════════════════════════════
// ── BOOT
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  const store = new TaskStore();
  const ui    = new TaskUI(store);

  // Expose to browser console for manual testing (Step 6)
  window.__crud = { store, ui };
  console.log('%c Cognifyz CRUD App ready!', 'color:#4ade80;font-weight:bold;font-size:14px');
  console.log('%c Access window.__crud.store for direct CRUD testing.', 'color:#94a3b8');
});
