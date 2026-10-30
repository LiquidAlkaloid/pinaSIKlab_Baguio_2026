// Compares two drafts sentence by sentence, so every change can be shown and labelled:
// made because of a teacher comment, or made directly by the student. Only the two texts are
// compared; nothing records typing.

export interface DraftChange {
	kind: 'changed' | 'added' | 'removed';
	before: string;
	after: string;
	/** Number of the teacher comment it answers, or null for the student's own change. */
	comment: number | null;
}

/** A comment the student fixed: the words the teacher marked and what they became. */
export interface Fix {
	number: number;
	anchor: string;
	excerpt: string;
}

/** A sentence ends at . ! or ? followed by a space, so "3.5 km" or "¶2.1" stay in one piece. */
export function sentences(text: string): string[] {
	return text
		.trim()
		.split(/(?<=[.!?]["”’)]*)\s+/)
		.map((s) => s.trim())
		.filter(Boolean);
}

/** Sentence-level difference (longest common subsequence). Drafts are short, so this is cheap. */
export function diffSentences(before: string, after: string): Omit<DraftChange, 'comment'>[] {
	const a = sentences(before);
	const b = sentences(after);
	const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
	for (let i = a.length - 1; i >= 0; i--) {
		for (let j = b.length - 1; j >= 0; j--) {
			lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
		}
	}

	const out: Omit<DraftChange, 'comment'>[] = [];
	let removed: string[] = [];
	let added: string[] = [];
	// A run of removed sentences followed by added ones reads as "this became that".
	const flush = () => {
		const pairs = Math.min(removed.length, added.length);
		for (let k = 0; k < pairs; k++) out.push({ kind: 'changed', before: removed[k], after: added[k] });
		for (const s of removed.slice(pairs)) out.push({ kind: 'removed', before: s, after: '' });
		for (const s of added.slice(pairs)) out.push({ kind: 'added', before: '', after: s });
		removed = [];
		added = [];
	};

	let i = 0;
	let j = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			flush();
			i++;
			j++;
		} else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
			removed.push(a[i++]);
		} else {
			added.push(b[j++]);
		}
	}
	removed.push(...a.slice(i));
	added.push(...b.slice(j));
	flush();
	return out;
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
const overlaps = (x: string, y: string) => {
	const nx = norm(x);
	const ny = norm(y);
	return nx.length >= 8 && ny.length >= 8 && (nx.includes(ny) || ny.includes(nx));
};

/** Label each change with the comment it answers, if any. */
export function labelChanges(changes: Omit<DraftChange, 'comment'>[], fixes: Fix[]): DraftChange[] {
	return changes.map((c) => {
		const fix = fixes.find((f) =>
			c.kind === 'removed' ? overlaps(c.before, f.anchor) : overlaps(c.after, f.excerpt) || overlaps(c.before, f.anchor)
		);
		return { ...c, comment: fix?.number ?? null };
	});
}

/** Plain text for draft_summaries (kind 'changes'). */
export function changesText(changes: DraftChange[]): string {
	if (!changes.length) return 'No changes.';
	return changes
		.map((c) => {
			const who = c.comment ? `Comment ${c.comment}` : 'Own change';
			if (c.kind === 'added') return `${who}: added “${c.after}”`;
			if (c.kind === 'removed') return `${who}: removed “${c.before}”`;
			return `${who}: “${c.before}” → “${c.after}”`;
		})
		.join('\n');
}
