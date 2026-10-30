# MYRACLE prototype

Clickable prototype for PSC XI. SvelteKit 3 + TypeScript, fake data only (no database, no login).

## Run it

```bash
npm install
npm run dev        # open the link it prints
```

Check for mistakes with `npm run check`. Build the static site with `npm run build` (output goes to `build/`, ready for Cloudflare Pages: build command `npm run build`, output directory `build`).

## Where things are

| What | File |
|---|---|
| All fake data and types | `src/lib/data.ts` |
| Demo progress (saved in the browser) | `src/lib/state.svelte.ts` |
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
2. Click "Student view" / "Teacher home": Bea Santos's row shows exactly what you just did.
3. "Check reasons" → Agree → "Download revision matrix (Word)".
4. Restart the walkthrough from the link at the bottom of student home.

Red handwriting means "your teacher said this" and is used nowhere else.
