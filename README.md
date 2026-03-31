# 📋 Cognifyz Level 1 – Task 3: CRUD Task Manager

> **Task 3 · Beginner** — Create a console application for basic CRUD operations on a list of tasks.

---

## 📌 Table of Contents

1. [What This Application Does](#what-this-application-does)
2. [Objective & Task Requirements](#objective--task-requirements)
3. [Project Structure](#project-structure)
4. [How to Run](#how-to-run)
5. [CRUD Operations – Full Breakdown](#crud-operations--full-breakdown)
6. [Task Class – Data Model](#task-class--data-model)
7. [Features](#features)
8. [Testing Scenarios (Step 6)](#testing-scenarios-step-6)
9. [Console Testing via Browser DevTools](#console-testing-via-browser-devtools)
10. [Technology Stack](#technology-stack)

---

## What This Application Does

This is a fully functional **browser-based Task Manager** that implements **Create, Read, Update, and Delete (CRUD)** operations on a dynamic list of tasks. All data is stored in a JavaScript **array** (in-memory), with optional persistence via **localStorage** so tasks survive page refreshes.

The application allows users to:
- **Create** new tasks with title, description, priority, category, and due date
- **Read** and display all tasks with filtering, sorting, and search capabilities
- **Update** any task's details inline without leaving the page
- **Delete** individual tasks or bulk-clear all completed ones

---

## Objective & Task Requirements

| # | Requirement | Status | Implementation |
|---|---|---|---|
| — | Implement CRUD using arrays/lists | ✅ | `TaskStore.tasks` is a JavaScript array |
| 1 | Define a Task class with necessary attributes | ✅ | `class Task` with 9 attributes |
| 2 | Implement functionality to create a new task | ✅ | `TaskStore.create()` + form UI |
| 3 | Develop a method to read and display tasks | ✅ | `TaskStore.readAll()` + `TaskUI._renderList()` |
| 4 | Allow users to update task details | ✅ | `TaskStore.update()` + edit mode UI |
| 5 | Provide an option to delete tasks | ✅ | `TaskStore.delete()`, `deleteCompleted()`, `deleteAll()` |
| 6 | Test the application with various scenarios | ✅ | See [Testing Scenarios](#testing-scenarios-step-6) |

---

## Project Structure

```
cognifyz_task3_crud/
├── index.html     ← Main application page (HTML structure)
├── style.css      ← Complete stylesheet (editorial design system)
├── app.js         ← All CRUD logic + UI controller (JavaScript)
└── README.md      ← This file
```

---

## How to Run

### Method 1 – Open directly in browser (quickest)

1. Download or unzip the folder `cognifyz_task3_crud/`
2. Double-click `index.html` — it opens in your default browser
3. No server, no installation, no dependencies needed

### Method 2 – Local dev server (optional, for strict environments)

```bash
# Using Python (already installed on most machines)
cd cognifyz_task3_crud
python -m http.server 8080
# Then open: http://localhost:8080
```

```bash
# Using Node.js / npx
npx serve .
```

---

## CRUD Operations – Full Breakdown

### ➕ CREATE — `TaskStore.create(title, description, priority, category, dueDate)`

**What it does:**
- Validates that a title is provided (throws if empty)
- Instantiates a new `Task` object with a unique auto-generated ID
- Prepends it to the `tasks` array (newest first)
- Persists the updated array to `localStorage`
- Returns the created `Task` object

**How to trigger in the UI:**
1. Fill in the "New Task" form on the left sidebar
2. Click **"Add Task"** or press **Enter**

**Code excerpt:**
```javascript
create(title, description, priority, category, dueDate) {
  if (!title || !title.trim()) throw new Error('Task title is required.');
  const task = new Task(title, description, priority, category, dueDate);
  this.tasks.unshift(task);   // add to front of array
  this._save();               // persist to localStorage
  return task;
}
```

---

### 📖 READ — `TaskStore.readAll(filter)` and `TaskStore.readById(id)`

**What it does:**
- `readAll(filter)` returns a filtered, sorted copy of the `tasks` array
- Supports filter by: `status` (active/completed), `priority`, `category`, `search` (text match)
- Supports sorting by: newest, priority rank, due date, title A–Z
- `readById(id)` returns a single task by its unique ID

**How to trigger in the UI:**
- Tasks are displayed automatically on load
- Use the filter bar (search box, dropdowns) to narrow results
- The stats strip reads task data to compute totals and progress %

**Code excerpt:**
```javascript
readAll(filter = {}) {
  let list = [...this.tasks];                    // non-destructive copy
  if (filter.status === 'active')    list = list.filter(t => !t.completed);
  if (filter.priority)               list = list.filter(t => t.priority === filter.priority);
  if (filter.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(t => t.title.toLowerCase().includes(q) || ...);
  }
  // ... sorting logic
  return list;
}
```

---

### ✏️ UPDATE — `TaskStore.update(id, fields)` and `TaskStore.toggleComplete(id)`

**What it does:**
- `update(id, fields)` accepts a partial fields object — only provided fields are changed
- Validates that title is not set to empty
- Stamps `updatedAt` timestamp on every change
- `toggleComplete(id)` flips the `completed` boolean

**How to trigger in the UI:**
- Click the **pencil icon** on any task card → form fills with task data → edit → click **"Update Task"**
- Click the **circle icon** on the left of a card to toggle completion
- Press **Escape** to cancel editing

**Code excerpt:**
```javascript
update(id, fields) {
  const task = this.readById(id);
  if (!task) return null;
  if (fields.title !== undefined) task.title = fields.title.trim();
  if (fields.priority !== undefined) task.priority = fields.priority;
  // ... other fields
  task.updatedAt = new Date().toISOString();
  this._save();
  return task;
}
```

---

### 🗑 DELETE — `TaskStore.delete(id)`, `deleteCompleted()`, `deleteAll()`

**What it does:**
- `delete(id)` removes one task by ID from the array using `splice()`
- `deleteCompleted()` filters out all completed tasks in one pass
- `deleteAll(confirmed)` requires `confirmed=true` as a safety gate
- All three methods persist the updated array

**How to trigger in the UI:**
- Click the **trash icon** on a card → animated slide-out → task removed
- Click **"Clear All Completed"** in the sidebar → removes all done tasks at once

**Code excerpt:**
```javascript
delete(id) {
  const idx = this.tasks.findIndex(t => t.id === id);
  if (idx === -1) return false;
  this.tasks.splice(idx, 1);   // removes 1 element at index
  this._save();
  return true;
}
```

---

## Task Class – Data Model

```javascript
class Task {
  constructor(title, description, priority, category, dueDate) {
    this.id          // string  — unique auto-generated ID (e.g. "task_lf3k2_abc1")
    this.title       // string  — required, max 120 chars
    this.description // string  — optional, max 500 chars
    this.priority    // string  — 'low' | 'medium' | 'high'
    this.category    // string  — free text, defaults to 'General'
    this.dueDate     // string  — ISO date 'YYYY-MM-DD' or ''
    this.completed   // boolean — false by default
    this.createdAt   // string  — ISO datetime
    this.updatedAt   // string  — ISO datetime, updated on every edit
  }
}
```

---

## Features

### Core CRUD
- ✅ Create tasks with 5 attributes (title, description, priority, category, due date)
- ✅ Read and display all tasks with real-time updates
- ✅ Update any field of any task inline
- ✅ Delete single tasks (animated removal)
- ✅ Bulk delete completed tasks

### Filtering & Search
- 🔍 Live text search (matches title, description, category)
- 🎛 Filter by status: All / Active / Completed
- 🎛 Filter by priority: All / High / Medium / Low
- 🎛 Filter by category (auto-populated from existing tasks)
- 📊 Sort by: Newest, Priority rank, Due date, Title A–Z

### Visual Feedback
- 📊 Stats dashboard: Total, Active, Completed, High Priority, Overdue counts
- 📈 Progress bar showing completion percentage
- 🏷 Priority badges with colour coding (red / amber / green)
- 📅 Due date badges: normal / today / overdue (with warning)
- 🔔 Toast notifications for every action
- ✨ Smooth card entry / deletion animations

### UX
- ⌨️ Keyboard shortcuts: `N` to focus form, `Escape` to cancel edit
- 💾 Data persists across page refreshes via localStorage
- 📱 Fully responsive layout (mobile friendly)
- 6 demo tasks pre-loaded on first visit

---

## Testing Scenarios (Step 6)

### Scenario 1 — Create a new task
1. Type a title (e.g. "Buy groceries")
2. Add description, set priority to High, category to "Personal"
3. Click **Add Task**
4. ✅ Card appears at top of list; stats update; toast notification shown

### Scenario 2 — Read / filter tasks
1. Open the app — 6 sample tasks are visible
2. Type "design" in the search box → only matching task shown
3. Change priority filter to "High" → only high-priority tasks shown
4. Change sort to "By due date" → tasks re-order by soonest due date

### Scenario 3 — Update a task
1. Click the ✏️ pencil icon on any card
2. Change the title and priority in the form
3. Click **Update Task**
4. ✅ Card updates in place; "Edited" tag appears; toast confirms

### Scenario 4 — Toggle completion
1. Click the circle icon (◯) on an active task
2. ✅ Task fades and title gets strikethrough; completed count +1
3. Click again → task becomes active again

### Scenario 5 — Delete a task
1. Click the 🗑 trash icon on any card
2. ✅ Card animates out; task removed; count decreases

### Scenario 6 — Bulk delete completed
1. Complete 3 tasks using circle buttons
2. Click **"Clear All Completed"** in sidebar
3. ✅ All completed tasks removed at once; toast shows count

### Scenario 7 — Edge cases
| Edge case | Expected behaviour |
|---|---|
| Submit form with empty title | Red toast: "Task title is required." — no task created |
| Clear all filters | Full task list restored instantly |
| Edit then press Escape | Edit cancelled, form reset, card highlight removed |
| All tasks completed | Progress bar shows 100% |
| localStorage full | Error caught silently, app continues working |

---

## Console Testing via Browser DevTools

The app exposes `window.__crud` for direct testing:

```javascript
// Open browser DevTools → Console tab, then:

// READ all tasks
window.__crud.store.readAll()

// CREATE a task programmatically
window.__crud.store.create('Test Task', 'From console', 'high', 'Dev', '2025-12-31')

// UPDATE a task (replace ID with a real one)
const id = window.__crud.store.tasks[0].id
window.__crud.store.update(id, { title: 'Updated title', priority: 'low' })

// TOGGLE complete
window.__crud.store.toggleComplete(id)

// DELETE a task
window.__crud.store.delete(id)

// Get stats
window.__crud.store.getStats()

// Delete all (requires confirmation flag)
window.__crud.store.deleteAll(true)
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic elements) |
| Styling | CSS3 (custom properties, grid, flexbox, animations) |
| Logic | Vanilla JavaScript ES6+ (classes, modules, localStorage) |
| Fonts | Google Fonts — DM Serif Display, DM Sans, DM Mono |
| External deps | **None** — zero libraries, zero frameworks |
| Data storage | JavaScript Array + localStorage (browser) |

---

## Author

Built for **Cognifyz Technologies** — Level 1 Beginner Task 3  
*Where Data Meets Intelligence*
