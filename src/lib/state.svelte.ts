// What the demo student has done so far. Saved in the browser so a page refresh
// doesn't lose the walkthrough. Later this becomes rows in Supabase.
import { assignment, lastGoal, type AiUse, type Answer, type StepKey } from './data.ts';

export interface Submission {
	file: string;
	ai: AiUse | null;
	aiNote: string;
	at: number | null;
}

export interface FeedbackAnswer {
	status: Answer | null;
	paragraph: number | null;
	note: string;
	reason: string;
	/** Teacher agreed with a "kept it" answer on the Educator Hub. */
	teacherOk: boolean;
}

function fresh() {
	return {
		summary: '',
		readAt: null as number | null,
		draft: { file: '', ai: null, aiNote: '', at: null } as Submission,
		answers: assignment.feedback.map(
			(): FeedbackAnswer => ({ status: null, paragraph: null, note: '', reason: '', teacherOk: false })
		),
		revisedAt: null as number | null,
		final: { file: '', ai: null, aiNote: '', at: null } as Submission,
		reflection: { changed: '', hardest: '', surprise: '' },
		goal: '',
		reflectedAt: null as number | null,
		lastGoal
	};
}

export type Demo = ReturnType<typeof fresh>;

export const demo: Demo = $state(fresh());

const KEY = 'myracle-demo-v1';

export function loadDemo() {
	try {
		const saved = localStorage.getItem(KEY);
		if (saved) Object.assign(demo, JSON.parse(saved));
	} catch {
		// Private window or blocked storage: the demo still works, it just won't survive a refresh.
	}
}

export function saveDemo(json: string) {
	try {
		localStorage.setItem(KEY, json);
	} catch {
		// See loadDemo.
	}
}

export function resetDemo() {
	Object.assign(demo, fresh());
}

/** The step the student should do next, or 'done'. */
export function currentStep(d: Demo): StepKey | 'done' {
	if (!d.readAt) return 'read';
	if (!d.draft.at) return 'draft';
	if (!d.revisedAt) return 'revise';
	if (!d.final.at) return 'final';
	if (!d.reflectedAt) return 'reflect';
	return 'done';
}

export function stepNumber(d: Demo): number {
	const order: (StepKey | 'done')[] = ['read', 'draft', 'revise', 'final', 'reflect', 'done'];
	return order.indexOf(currentStep(d)) + 1;
}

export function formatDate(value: number | string) {
	return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function onTime(at: number | null, due: string) {
	if (!at) return null;
	return at <= new Date(due + 'T23:59:59').getTime();
}
