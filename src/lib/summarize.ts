// Draft summaries (#9), written by AI from the student's draft. The browser asks the site's own
// /api/summarize function (functions/api/summarize.ts), which holds the Claude API key.
// Where that function is not running (npm run dev, or no key set), a simple sample summary is
// made in the browser instead and clearly labelled, so the demo still works offline.
import { sentences } from './diff.ts';

export interface DraftSummaryResult {
	body: string;
	/** 'ai' = written by Claude; 'sample' = the offline stand-in. */
	source: 'ai' | 'sample';
}

const POSITION = /\b(should|must|need to|needs to|ought|I believe|I argue|I think|it is better|we have to)\b/i;

/** Offline stand-in: quote the sentence that most looks like the student's position. */
function sampleSummary(text: string): string {
	const all = sentences(text);
	const claim = all.find((s) => POSITION.test(s));
	if (!claim) return 'The draft describes the topic but does not yet state a clear position.';
	return `The draft argues: “${claim}”`;
}

export async function summarizeDraft(text: string): Promise<DraftSummaryResult> {
	try {
		const res = await fetch('/api/summarize', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ text })
		});
		if (res.ok) {
			const { summary } = (await res.json()) as { summary?: string };
			if (summary) return { body: summary, source: 'ai' };
		}
	} catch {
		// Offline, or the function is not deployed: fall through to the sample.
	}
	return { body: sampleSummary(text), source: 'sample' };
}
