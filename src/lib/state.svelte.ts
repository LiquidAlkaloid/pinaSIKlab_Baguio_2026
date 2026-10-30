// What the demo student has done so far, kept as the rows her work would create in the
// database (submissions, documents, stage_submissions, ...). Saved in the browser so a page
// refresh doesn't lose the walkthrough. Later these become inserts into Supabase.
import {
	feedbackItems,
	lastGoal,
	stageOf,
	type ConfirmationStatus,
	type IntakeSource,
	type PromptKey,
	type ResolutionAction,
	type Stage,
	type StageKind,
	type StepKey,
	type SubmissionStatus
} from './data.ts';

export interface StageSubmission {
	id: string;
	stage_id: string;
	source: IntakeSource;
	content_text: string | null;
	file_key: string | null;
	google_file_id: string | null;
	submitted_at: string;
}

export interface AiUseDeclaration {
	stage_submission_id: string;
	level_used: number;
	tools_used: string[];
	description: string | null;
	declared_at: string;
}

export interface DraftSummary {
	stage_submission_id: string;
	kind: 'student' | 'changes';
	body: string;
}

/**
 * How the student closed one comment. In the database there is no row until it is closed;
 * here the row exists from the start so the form can fill it in, and `action` is null until then.
 */
export interface FeedbackResolution {
	feedback_item_id: string;
	action: ResolutionAction | null;
	decline_reason: string;
	revised_stage_submission_id: string | null;
	changed_excerpt: string;
	resolved_at: string | null;
	confirmation: ConfirmationStatus;
	confirmed_at: string | null;
}

/** Everything a hand-in creates: the snapshot, its AI declaration and the student's summary. */
export interface HandInInput {
	source: IntakeSource;
	content_text: string | null;
	file_key: string | null;
	google_file_id: string | null;
	level_used: number;
	tools_used: string[];
	description: string;
	summary: string;
}

function fresh() {
	return {
		/** Step 1 has no table yet (see README "Gaps"). */
		reading: { summary: '', saved_at: null as string | null },
		submission: { id: '70000000-0000-0000-0000-000000000001', status: 'in_progress' as SubmissionStatus },
		/** One working document per submission, autosaved in place. No keystroke history. */
		document: { content: '', version: 1, updated_at: null as string | null },
		stage_submissions: [] as StageSubmission[],
		ai_use_declarations: [] as AiUseDeclaration[],
		draft_summaries: [] as DraftSummary[],
		feedback_resolutions: feedbackItems.map(
			(item): FeedbackResolution => ({
				feedback_item_id: item.id,
				action: null,
				decline_reason: '',
				revised_stage_submission_id: null,
				changed_excerpt: '',
				resolved_at: null,
				confirmation: 'pending',
				confirmed_at: null
			})
		),
		reflection: {
			responses: { changed_most: '', hardest_item: '', score_surprise: '' } as Record<PromptKey, string>,
			created_at: null as string | null
		},
		/** next_goals.goal_text for this reflection. */
		next_goal: '',
		/** v_latest_goal before this assignment. */
		latest_goal: lastGoal
	};
}

export type Demo = ReturnType<typeof fresh>;

export const demo: Demo = $state(fresh());

const KEY = 'myracle-demo-v2';

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

const now = () => new Date().toISOString();

/** Autosave of the in-app document. The database trigger bumps `version` the same way. */
export function saveDocument(content: string) {
	if (content === demo.document.content) return;
	demo.document.content = content;
	demo.document.version += 1;
	demo.document.updated_at = now();
}

export function snapshotFor(d: Demo, stage: Stage | null) {
	return stage ? d.stage_submissions.find((s) => s.stage_id === stage.id) : undefined;
}

export const declarationFor = (d: Demo, ss: StageSubmission | undefined) =>
	ss && d.ai_use_declarations.find((a) => a.stage_submission_id === ss.id);

export const summaryFor = (d: Demo, ss: StageSubmission | undefined) =>
	ss && d.draft_summaries.find((s) => s.stage_submission_id === ss.id && s.kind === 'student');

/** Hand in one stage: one stage_submissions row, one ai_use_declarations row, one draft_summaries row. */
export function handIn(stage: Stage, input: HandInInput): StageSubmission {
	const at = now();
	const ss: StageSubmission = {
		id: crypto.randomUUID(),
		stage_id: stage.id,
		source: input.source,
		content_text: input.content_text,
		file_key: input.file_key,
		google_file_id: input.google_file_id,
		submitted_at: at
	};
	demo.stage_submissions.push(ss);
	demo.ai_use_declarations.push({
		stage_submission_id: ss.id,
		level_used: input.level_used,
		tools_used: input.tools_used,
		description: input.description || null,
		declared_at: at
	});
	demo.draft_summaries.push({ stage_submission_id: ss.id, kind: 'student', body: input.summary });

	if (stage.kind === 'revision') {
		// The comments are closed by this draft: "fixed" answers point at it (revised_needs_link).
		for (const r of demo.feedback_resolutions) {
			r.resolved_at = at;
			if (r.action !== 'declined') r.revised_stage_submission_id = ss.id;
		}
	}
	if (stage.kind === 'final') demo.submission.status = 'submitted';
	return ss;
}

/** A comment answer is ready when it has an action and what the database needs with it. */
export function resolutionReady(r: FeedbackResolution) {
	if (!r.action) return false;
	if (r.action === 'declined') return r.decline_reason.trim().length >= 10;
	return r.changed_excerpt.trim().length >= 5;
}

const stageDone = (d: Demo, kind: StageKind) => !!snapshotFor(d, stageOf(kind));

/** The step the student should do next, or 'done'. */
export function currentStep(d: Demo): StepKey | 'done' {
	if (!d.reading.saved_at) return 'read';
	if (!stageDone(d, 'first_draft')) return 'draft';
	if (!stageDone(d, 'revision')) return 'revise';
	if (!stageDone(d, 'final')) return 'final';
	if (!d.reflection.created_at) return 'reflect';
	return 'done';
}

export function stepNumber(d: Demo): number {
	const order: (StepKey | 'done')[] = ['read', 'draft', 'revise', 'final', 'reflect', 'done'];
	return order.indexOf(currentStep(d)) + 1;
}

export function formatDate(value: string) {
	return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function onTime(at: string | null | undefined, due: string | null) {
	if (!at || !due) return null;
	return new Date(at).getTime() <= new Date(due).getTime();
}
