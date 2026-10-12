# AI Log (Deklarasi Penggunaan AI)

Tool: Claude Code (Claude Sonnet 5.5). Every prompt that led to code changes is logged here.
I must be able to explain the async flow of this code myself.

| Date | Prompt (summary) | What the AI did | What I checked |
|------|------------------|-----------------|----------------|
| 2026-10-12 | Showed the Task Tracker v2 brief; asked for a CLAUDE.md first | Wrote `CLAUDE.md` with requirements, mock API spec, async rules | Read it against the brief |
| 2026-10-12 | "rename please ... go and commit" | Renamed `script.js` to `app.js`; Indonesian UI; `api()` helper; `GET /api/tugas` with loading / error + retry / empty states; XSS escaping | (fill in after testing in the browser) |
| 2026-10-12 | "go ahead" on the POST form | Added the add form, `Promise.all` for tasks + courses, `addTask()` with `POST` (JSON header + body), disabled button while sending, server error message shown | (fill in after testing in the browser) |
