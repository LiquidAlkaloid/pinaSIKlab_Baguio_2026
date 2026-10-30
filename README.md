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

## AI draft summaries

On the first draft, "Sum up my draft" asks Claude (`claude-opus-5-5`, low effort) for a one- or two-sentence summary of the student's position. The site is static, so the call runs in a Cloudflare Pages Function, `functions/api/summarize.ts`, which keeps the API key on the server. It never reaches students' browsers.

- **Turn it on (Cloudflare):** Pages project > Settings > Variables and Secrets > add `ANTHROPIC_API_KEY` as a secret, then redeploy.
- **Try it locally:** put `ANTHROPIC_API_KEY=...` in a `.dev.vars` file (ignored by Git), run `npm run build`, then `npx wrangler pages dev build`.
- **Without a key** (`npm run dev`, `npm run preview`, or no secret set) the page makes a simple sample summary in the browser, labelled "Sample summary: AI not connected here", so the demo still works offline. The browser console then shows one 404 for `/api/summarize`; that is expected.
- **Privacy:** with the key set, a student's first draft is sent to Anthropic's API to be summarised. Cover this in the privacy notice (`consents`) before real students use it.

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
| Revision 1, 2, ... (answer comments, hand in the next draft; the last is the final) | `src/routes/student/revise/[n]/` |
| How you did (Process Mirror) | `src/routes/student/mirror/` |
| "Revision 2 of 3 · Teacher feedback next" indicator | `src/lib/components/RevisionMeter.svelte` |
| AI summary of the first draft (browser side, with offline sample) | `src/lib/summarize.ts` |
| AI summary (server side: calls Claude with the secret key) | `functions/api/summarize.ts` |
| Comparing two drafts and labelling each change ("Comment 2" or "Your own change") | `src/lib/diff.ts`, `src/lib/components/DraftChanges.svelte` |
| Teacher home (Educator Hub) | `src/routes/teacher/+page.svelte` |
| New assignment (builder) | `src/routes/teacher/new/` |
| Comment bank | `src/routes/teacher/bank/`, `src/lib/teacher.svelte.ts` |
| Commenting on a draft with the bank | `src/routes/teacher/review/` |

Imports use `#lib/...` with the file extension (for example `#lib/data.ts`). SvelteKit 3 replaced `$lib` with this.

## Demo script

1. Continue as student, then do every step. On the draft and each revision, "Write it here" is the in-app document (#8); "Demo: fill in a sample" fills it.
2. Click "Student view" / "Teacher home": Bea Santos's row shows exactly what you just did.
3. "Check reasons" → Agree and "Confirm the change" → "Download revision matrix (Word)". Like `v_revision_matrix`, only confirmed comments go in.
4. On "New assignment", pick how many times students can revise (1 to 4) and "Give to class". The student steps change to match, and Bea's walkthrough starts over.
5. Restart the walkthrough from the link at the bottom of student home.

Red handwriting means "your teacher said this" and is used nowhere else.

## Screens and tables

| Screen | Tables it reads or writes |
|---|---|
| Step 1 Read | `source_texts`, `source_paragraphs` (the summary has no table yet, see Gaps) |
| Draft and every revision | `stages`, `documents` (Write it here), `stage_submissions`, `ai_use_declarations`, `draft_summaries` |
| Revision k | `feedback_items` on Draft k, `feedback_resolutions` (answers point at the next draft's `stage_submissions` row; `changed_excerpt` is the rewrite typed on the comment card, which also goes into `documents.content`), `draft_summaries` kind `changes` (every change since Draft k, labelled by comment or as the student's own) |
| How you did | `grades`, `rubric_criteria`, `criterion_scores`, `reflections`, `reflection_responses`, `next_goals` |
| Student home | `v_latest_goal` |
| Teacher home | the logic of `v_attention_cards`, `feedback_resolutions.confirmation`, `v_revision_matrix`, `explain_back_checks` |
| New assignment | `assignments`, `stages` (one row per draft: the number of revisions sets how many), `source_texts` |

## Gaps between the screens and the schema

1. **Step 1's summary has no table.** Option: add `reading` to `stage_kind` (it then gets a due date, an AI level and a snapshot for free), or a small `reading_summaries (submission_id, body)` table.
2. **"Timed, in class"** on the builder has no column. Option: `stages.timed_minutes smallint` (NULL = not timed).
3. **"Students see the same process report"** toggle on the builder has no column. Option: `assignments.mirror_enabled boolean`, or drop the toggle.
4. **AI level labels.** `ai_level` is 0 to 5, but the schema doesn't say what each number means. The prototype uses: 0 No AI, 1 ideas and planning, 2 grammar and wording, 3 AI drafts parts, 4 full AI, 5 open use (`AI_SCALE` in `data.ts`). Confirm or change.
5. **Who confirms a "fixed" comment.** The hub lets the teacher confirm fixes as well as declines, so the matrix (confirmed items only) can be exported. The schema notes say the adviser confirms fixes for thesis classes.
6. **One revision means no `revision` stage.** The teacher sets how many times students revise, and the last revision is the final. So 1 revision is stages `first_draft` + `final`, and 3 revisions is `first_draft`, 2 × `revision`, `final`. The database allows this; only the schema's comment ("at least one revision is checked by the app") needs updating.
7. **AI summaries need a new `draft_summaries.kind`.** The first-draft summary is now written by AI, stored as kind `ai` with `author_id` NULL. Add it to the check: `CHECK (kind IN ('student', 'changes', 'ai'))`. Revisions have no summary; their `changes` row lists what changed instead.
8. **Not on screen yet:** program dictionary (#6). Its table exists; no prototype screen uses it.
9. **Comment bank (#5) and the student screens.** Teachers can save, tag and insert bank comments on the Review screen (`/teacher/review`), and those comments show in the student's details on Teacher home. The student screens still use the sample comment rounds, so a new comment is not yet something the student can answer.
10. **"Redo" on a kept-with-a-reason answer.** The teacher can ask about the same comment again in the next revision. The prototype adds a `feedback_resolutions` row in the next round with `redo_of` pointing at the original item, and marks the original `confirmation = 'rejected'` ("Talk to student" also uses `rejected`; the redo row tells them apart). Option: `feedback_resolutions.redo_of uuid REFERENCES feedback_items`, or copy the item into the next round's `feedback_items` with a `repeats_item_id`.
11. **Other classes and assignments.** Teacher home has a class and assignment picker. Only the demo assignment (BSIT 1-B) has student-by-student rows; the others show class progress only.
