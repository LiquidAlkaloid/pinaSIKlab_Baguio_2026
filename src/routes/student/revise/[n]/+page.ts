import { MAX_REVISIONS } from '#lib/data.ts';

// Build a page for every revision a teacher can set: /student/revise/1 to /student/revise/4.
export const entries = () => Array.from({ length: MAX_REVISIONS }, (_, i) => ({ n: String(i + 1) }));
