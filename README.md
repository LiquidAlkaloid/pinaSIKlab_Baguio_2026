# MYRACLE prototype

Clickable prototype for PSC XI. SvelteKit 3 + TypeScript, fake data only (no database, no login). The fake data is shaped like the database schema (v4): types are named after tables and fields after columns.

## First time on a new computer

The setup script checks for Node.js (22.17 or newer), installs Node.js 24 LTS if it is missing or too old, then installs the project's packages. Node.js is installed for your user only, so **no admin password or permission is needed**.

- **Mac:** open Terminal in this folder and run `bash setup.sh`. Node.js goes in `~/.myracle/node` and is added to `~/.zprofile`.
- **Windows:** double-click `setup.cmd`. Node.js goes in `%LOCALAPPDATA%\myracle\node` and is added to your user PATH.

At the end it offers to start the app. After a fresh install, open a new terminal window (and restart VS Code once) so it finds Node.js. If your computer already had an older Node.js, the script tells you how to update or remove it. Run it again any time packages change (after a `git pull` that touches `package.json`).

## Run it

```bash
npm run dev        # open the link it prints
```

Check for mistakes with `npm run check`. Build the static site with `npm run build` (output goes to `build/`, ready for Cloudflare Pages: build command `npm run build`, output directory `build`).

## Where things are

| What | File |
|---|---|
| All fake data and types (table-shaped) | `src/lib/data.ts` |
| Demo progress, as the rows the student's work creates | `src/lib/state.svelte.ts` |
| Colours, fonts, buttons | `src/app.css` |
| Sign in | `src/routes/+page.svelte` |
| Student home | `src/routes/student/+page.svelte` |
| Step 1 Read | `src/routes/student/read/` |
| Step 2 Draft | `src/routes/student/draft/` |
| Step 3 Answer comments (Uptake Map) | `src/routes/student/feedback/` |
| Step 4 Final | `src/routes/student/final/` |
| Step 5 How you did (Process Mirror) | `src/routes/student/mirror/` |
| Teacher home (Educator Hub) | `src/routes/teacher/+page.svelte` |
| New assignment (builder) | `src/routes/teacher/new/` |

Imports use `#lib/...` with the file extension (for example `#lib/data.ts`). SvelteKit 3 replaced `$lib` with this.

## Demo script

1. Continue as student, then do all 5 steps (use "Use the sample file" for uploads).
1. On Step 2 to 4, "Write it here" is the in-app document (#8); "Demo: fill in a sample" fills it.
2. Click "Student view" / "Teacher home": Bea Santos's row shows exactly what you just did.
3. "Check reasons" → Agree and "Confirm the change" → "Download revision matrix (Word)". Like `v_revision_matrix`, only confirmed comments go in.
4. Restart the walkthrough from the link at the bottom of student home.

Red handwriting means "your teacher said this" and is used nowhere else.

## Screens and tables

| Screen | Tables it reads or writes |
|---|---|
| Step 1 Read | `source_texts`, `source_paragraphs` (the summary has no table yet, see Gaps) |
| Step 2 Draft, Step 4 Final | `stages`, `documents` (Write it here), `stage_submissions`, `ai_use_declarations`, `draft_summaries` |
| Step 3 Revise | `feedback_items`, `feedback_resolutions` (answers point at the Draft 2 `stage_submissions` row), then a Draft 2 hand-in |
| Step 5 How you did | `grades`, `rubric_criteria`, `criterion_scores`, `reflections`, `reflection_responses`, `next_goals` |
| Student home | `v_latest_goal` |
| Teacher home | the logic of `v_attention_cards`, `feedback_resolutions.confirmation`, `v_revision_matrix`, `explain_back_checks` |
| New assignment | `assignments`, `stages`, `source_texts` |

## Gaps between the screens and the schema

1. **Step 1's summary has no table.** Option: add `reading` to `stage_kind` (it then gets a due date, an AI level and a snapshot for free), or a small `reading_summaries (submission_id, body)` table.
2. **"Timed, in class"** on the builder has no column. Option: `stages.timed_minutes smallint` (NULL = not timed).
3. **"Students see the same process report"** toggle on the builder has no column. Option: `assignments.mirror_enabled boolean`, or drop the toggle.
4. **AI level labels.** `ai_level` is 0 to 5, but the schema doesn't say what each number means. The prototype uses: 0 No AI, 1 ideas and planning, 2 grammar and wording, 3 AI drafts parts, 4 full AI, 5 open use (`AI_SCALE` in `data.ts`). Confirm or change.
5. **Who confirms a "fixed" comment.** The hub lets the teacher confirm fixes as well as declines, so the matrix (confirmed items only) can be exported. The schema notes say the adviser confirms fixes for thesis classes.
6. **Not on screen yet:** comment bank (#5) and program dictionary (#6). Their tables exist; no prototype screen uses them.
