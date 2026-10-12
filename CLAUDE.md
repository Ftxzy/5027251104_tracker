# CLAUDE.md

## What this is
University assignment (Pemrograman Web, semester 3): **Task Tracker Kuliah v2, connected to a REST API**.
Code Challenge done at Praktikum, part of Tugas 1. It continues the Week 5 Task Tracker (the current
files here), which now gets its data from a server instead of an in-memory array.

Plain HTML/CSS/vanilla JS only. No framework, no build step, no npm dependencies.

## Current state
- `index.html`, `style.css`, `app.js` (renamed from `script.js`). Git repo on `main`, author
  Khalifa Suryadinarta. Commits are made as each stage works.
- Done: baseline, GET with loading/error/empty states, POST form (course `<select>` loaded with
  `Promise.all`), PATCH toggle and DELETE via event delegation (`pendingIds` blocks double clicks).
  Error-handling pass done: the add button is locked until data is loaded (and while a POST runs),
  the course select shows a fallback on failure, and stale errors are cleared on retry.
  Next: the bonus items (debounced search, optimistic update), if wanted.
- The Mock API is loaded from a CDN script (see "Mock API spec" below), not stored in this folder.
  Source slides: https://fuaddary.github.io/Pemrograman-Web/minggu6-async-fetch.html
  Do not invent behavior beyond the spec below.

## Mock API spec
Script: `https://fuaddary.github.io/Pemrograman-Web/assets/mock-api-kampus.js`. It replaces
`window.fetch` and answers any URL starting with `/api/` (no real server, no CORS). Load it
**before** `app.js`:
```html
<script src="https://fuaddary.github.io/Pemrograman-Web/assets/mock-api-kampus.js"></script>
<script src="app.js" defer></script>
```
Use relative URLs such as `fetch("/api/tugas")`. Latency is simulated at 250-700 ms.

**Endpoints we use**
- `GET /api/tugas` -> `200 [{id, judul, matkul, deadline, selesai}]`
  - `matkul` is a course *name string* (e.g. "Pemrograman Web"), not a code.
- `POST /api/tugas` body `{judul, matkul, deadline}` -> `201` with the new task.
  - `judul` must be at least 3 characters, otherwise `400 {error:"Judul minimal 3 karakter"}`.
  - `deadline` is required, format `YYYY-MM-DD`, otherwise `400 {error:"Deadline wajib berformat YYYY-MM-DD"}`.
  - `matkul` defaults to "Umum" if missing. New tasks always start with `selesai:false`.
- `PATCH /api/tugas/:id` body e.g. `{selesai:true}` -> `200` with the updated task.
  - `selesai` must be a boolean, otherwise 400. Unknown id gives `404`.
- `DELETE /api/tugas/:id` -> `204` with **no body** (never call `res.json()` on it).
- `GET /api/matkul` -> `200 [{kode, nama, sks, semester}]`, used for the `<select>`.
  - Option label and value should be `nama`, because tasks store the course name.
- Test helpers: `GET /api/rusak` always returns 500, and `GET /api/lambat?ms=2000` is slow.

**Rules and gotchas**
- Errors always have the shape `{error: "message"}`. The `api()` helper should throw
  `new Error(data.error)`. Other statuses are 404, 405, 409 and 500.
- **POST/PATCH must send `Content-Type: application/json`.** Without it the mock silently ignores the
  body and validation fails.
- The body must be a `JSON.stringify`'d string. Passing an object gives "[object Object]".
- Offline mode makes fetch reject with `TypeError("Failed to fetch")` (a network error, not an HTTP
  status). Handle it separately from `!res.ok`.
- `fetch` calls accept an `AbortSignal` (aborted requests reject with `AbortError`). This is useful
  for the debounced search bonus.
- Data lives in memory and resets on reload unless `__API.simpan(true)` is called.
- Field names are now Indonesian (`judul`, `selesai`, ...). v1 used `text` and `done`, so rename them
  everywhere.

**Console controls**: `__API.setMode("normal" | "lambat" | "tidakstabil" | "offline" | "error500")`,
`__API.gagalkan("/api/matkul")` (one endpoint always 500), `__API.pulihkan()`, `__API.reset()`,
`__API.setLatency(ms)`, `__API.simpan(true)`, `__API.calls` (request log), `__API.db`.

## Deliverables (per the brief)
- `index.html`, `style.css`, **`app.js`** (renamed from `script.js`, done).
- Mock API + the project in a Git repo with **at least 5 staged commits**, in this order:
  1. GET, render state
  2. POST
  3. PATCH/DELETE
  4. error handling
  (plus an initial/setup commit). Commit only when the user asks.

## Requirements (the 6 core items)
1. **Load from server**: `GET /api/tugas` on page open. Show a **loading** state (skeleton/text), an
   **error** state with a **retry button**, and an **empty** state.
2. **Add**: form -> `POST /api/tugas` (JSON header and body). Disable the button while sending. Show the
   server's error message (400).
3. **Done and delete**: use event delegation. `PATCH /api/tugas/:id` and `DELETE /api/tugas/:id`
   (returns 204). Update state from the server response, then call `render()`.
4. **Helper `api()`**: wraps fetch, checks `res.ok`, throws an Error carrying the server's message.
5. **Parallel**: load tasks and the course list (for the `<select>`) with `Promise.all`.
6. **Stress test**: must work with `__API.setMode("offline")` and `"lambat"`. No uncaught red errors
   in the Console.

**Bonus**: debounced search; optimistic update (UI changes first, rolled back if the server fails).

## UI (from the screenshot)
- Title "Task Tracker Kuliah" with a small "v2 · REST API" tag.
- Title input (placeholder "Judul tugas (min. 3 karakter)"), a course `<select>` (e.g. Pemrograman
  Web), a date input (deadline), and a "Tambah" button.
- Filters: **Semua / Aktif / Selesai**, plus an "N tugas aktif" counter on the right.
- Task cards: checkbox, title, meta line "Course · deadline YYYY-MM-DD", red X delete button.
- UI language is **Indonesian**. This is a change from the English v1 labels.

## Async rules (the point of the exercise)
- Every `await` inside `try/catch/finally`.
- `fetch` only rejects on network failure, so **always check `res.ok`**.
- Send JSON with `method` + `headers: {"Content-Type": "application/json"}` + `JSON.stringify(body)`.
- Independent requests -> `Promise.all`.
- Every async view has 4 states: loading, error, empty, success.
- Event order to keep in mind: sync code -> microtask (Promise) -> task (setTimeout, events).

## AI-use policy (IMPORTANT)
AI is allowed **only with a declaration and a prompt log**. The student must be able to explain the
async flow of their code **without AI** during Asistensi.
- When working on this project, keep a short prompt log in `AI_LOG.md` (date, what was asked, what was
  used). Append to it whenever Claude changes code. Do this without being reminded.
- AI-written async code often *looks* right but forgets `await`, skips the `res.ok` check, or swallows
  errors. Double-check those three things in everything written here.
- Prefer explaining *why* in short comments or in chat, so the student can defend the code.

## Conventions
- Match the existing code style: section banners (`// ── Name ───`), `render()` rebuilds the list from
  state, small named functions, `data-action` + `data-id` attributes for delegation.
- **Escape user/server text before putting it in `innerHTML`** (v1 does not, which is an XSS hole). Use
  `textContent` or an `escapeHtml()` helper.
- Surgical changes: touch only what the task needs. No new libraries.

## Timeline
3-week cycle: Penyampaian (day of the brief) -> Asistensi (continue Live Coding Lab, progress check of
Tugas 1) -> Praktikum/Evaluasi. Next: Evaluasi 1 (Week 8), then Modul 3, where they build their own REST
API with Express, PostgreSQL and Prisma. Today's Mock API endpoints become the spec to implement.
