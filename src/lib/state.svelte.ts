// What the demo student has done so far, kept as the rows her work would create in the
// database (submissions, documents, stage_submissions, ...). Saved in the browser so a page
// refresh doesn't lose the walkthrough. Later these become inserts into Supabase.
import {
	assignment,
	defaultStages,
	feedbackRound,
	lastGoal,
	revisionCount,
	stepsFor,
	type ConfirmationStatus,
	type IntakeSource,
	type PromptKey,
	type ResolutionAction,
	type Stage,
	type FeedbackItem,
	type Step,
	type SubmissionStatus
} from './data.ts';
import { changesText, diffSentences, labelChanges, type DraftChange } from './diff.ts';

/**
 * What the teacher set up in the builder: the assignment's stages (how many revisions) and the
 * process weight. The student screens read it, so a change shows up on the student side.
 */
export const course = $state({
	stages: defaultStages as Stage[],
	process_weight_pct: assignment.process_weight_pct
});

/** The student's steps for the current setup. */
export const courseSteps = () => stepsFor(course.stages);

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
	/** 'ai' = summary written by AI from the draft; 'changes' = what changed since the last draft. */
	kind: 'student' | 'changes' | 'ai';
	body: string;
}

/**
 * How the student closed one comment. In the database there is no row until it is closed;
 * here the row exists from the start so the form can fill it in, and `action` is null until then.
 */
export interface FeedbackResolution {
	feedback_item_id: string;
	/** Which round of comments: round r is about Draft r and is closed by the next draft. */
	round: number;
	action: ResolutionAction | null;
	decline_reason: string;
	revised_stage_submission_id: string | null;
	changed_excerpt: string;
	resolved_at: string | null;
	confirmation: ConfirmationStatus;
	confirmed_at: string | null;
	/**
	 * Set when the teacher did not accept a "kept it" reason and raised the comment again: the
	 * feedback item it repeats, from the round before. Not in the schema yet (see README "Gaps").
	 */
	redo_of?: string | null;
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
		// One row per comment in every round. Round r has comments on Draft r.
		feedback_resolutions: Array.from({ length: revisionCount(course.stages) }, (_, i) => i + 1).flatMap((round) =>
			feedbackRound(round).map(
				(item): FeedbackResolution => ({
				feedback_item_id: item.id,
				round,
				action: null,
				decline_reason: '',
				revised_stage_submission_id: null,
				changed_excerpt: '',
				resolved_at: null,
				confirmation: 'pending',
				confirmed_at: null
				})
			)
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

const KEY = 'myracle-demo-v4';
const COURSE_KEY = 'myracle-course-v2';

export function loadDemo() {
	try {
		const savedCourse = localStorage.getItem(COURSE_KEY);
		if (savedCourse) Object.assign(course, JSON.parse(savedCourse));
		const saved = localStorage.getItem(KEY);
		if (saved) Object.assign(demo, JSON.parse(saved));
	} catch {
		// Private window or blocked storage: the demo still works, it just won't survive a refresh.
	}
}

export function saveDemo(demoJson: string, courseJson: string) {
	try {
		localStorage.setItem(KEY, demoJson);
		localStorage.setItem(COURSE_KEY, courseJson);
	} catch {
		// See loadDemo.
	}
}

export function resetDemo() {
	Object.assign(demo, fresh());
}

/** The teacher gives the class a new setup. The demo student starts the walkthrough over on it. */
export function setCourse(stages: Stage[], process_weight_pct: number) {
	course.stages = stages;
	course.process_weight_pct = process_weight_pct;
	resetDemo();
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
	ss && d.draft_summaries.find((s) => s.stage_submission_id === ss.id && s.kind === 'ai');

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
	if (input.summary.trim()) demo.draft_summaries.push({ stage_submission_id: ss.id, kind: 'ai', body: input.summary });

	// This draft closes the comments on the draft before it: "fixed" answers point at it
	// (revised_needs_link). Revision 1 closes the comments on the first draft, and so on; the final
	// closes the last round.
	for (const r of roundOf(demo, stage.position - 1)) {
		r.resolved_at = at;
		if (r.action !== 'declined') r.revised_stage_submission_id = ss.id;
	}
	// Note every change since the last draft, from comments and the student's own (kind 'changes').
	const changes = stage.position > 1 ? draftChanges(demo, course.stages, stage.position - 1) : null;
	if (changes) demo.draft_summaries.push({ stage_submission_id: ss.id, kind: 'changes', body: changesText(changes) });
	if (stage.kind === 'final') demo.submission.status = 'submitted';
	return ss;
}

/**
 * A comment answer is ready when it has an action and what the database needs with it.
 * A fix needs an actual change: the marked words must read differently now.
 */
export function resolutionReady(r: FeedbackResolution, anchor: string | null = null) {
	if (!r.action) return false;
	if (r.action === 'declined') return r.decline_reason.trim().length >= 10;
	const text = r.changed_excerpt.trim();
	return text.length >= 5 && text !== (anchor ?? '').trim();
}

/**
 * Everything that changed between Draft k and the draft after it (or the working document, while
 * the student is still revising), each labelled with the comment it answers or as their own change.
 * null when either draft was not written in MYRACLE, because then there is no text to compare.
 */
export function draftChanges(d: Demo, stages: Stage[], k: number): DraftChange[] | null {
	const before = snapshotFor(d, stages[k - 1] ?? null)?.content_text;
	const next = snapshotFor(d, stages[k] ?? null);
	const after = next ? next.content_text : d.document.content;
	if (!before || !after) return null;
	const items = itemsFor(d, k);
	const fixes = roundOf(d, k)
		.filter((r) => r.action === 'addressed' || r.action === 'partly_addressed')
		.map((r) => {
			const item = items.find((i) => i.id === r.feedback_item_id);
			return { number: item?.number ?? 0, anchor: item?.anchor_excerpt ?? '', excerpt: r.changed_excerpt };
		});
	return labelChanges(diffSentences(before, after), fixes);
}

export const roundOf = (d: Demo, round: number) => d.feedback_resolutions.filter((r) => r.round === round);

/**
 * The comments in a round: the teacher's comments on that draft, then any "kept it" comments from
 * the round before that the teacher raised again (Redo). Raised-again ones carry `redo_of`.
 */
export function itemsFor(d: Demo, round: number): (FeedbackItem & { redo_of?: string })[] {
	const base = feedbackRound(round);
	const raised = roundOf(d, round)
		.filter((r) => r.redo_of)
		.flatMap((r, i) => {
			const original = itemById(d, r.redo_of!);
			return original ? [{ ...original, id: r.feedback_item_id, number: base.length + i + 1, redo_of: original.id }] : [];
		});
	return [...base, ...raised];
}

/** Any comment the student has, by id, including raised-again ones. */
export function itemById(d: Demo, id: string) {
	const row = d.feedback_resolutions.find((r) => r.feedback_item_id === id);
	return row ? itemsFor(d, row.round).find((i) => i.id === id) : undefined;
}

/** The raised-again answer row for a comment, if the teacher asked for a redo. */
export const redoOf = (d: Demo, itemId: string) => d.feedback_resolutions.find((r) => r.redo_of === itemId);

/** Teacher did not accept a "kept it" reason: ask about the same comment again in the next revision. */
export function redo(d: Demo, itemId: string) {
	const r = d.feedback_resolutions.find((x) => x.feedback_item_id === itemId);
	if (!r || redoOf(d, itemId)) return;
	r.confirmation = 'rejected';
	r.confirmed_at = now();
	d.feedback_resolutions.push({
		feedback_item_id: `${itemId}-redo`,
		round: r.round + 1,
		redo_of: itemId,
		action: null,
		decline_reason: '',
		revised_stage_submission_id: null,
		changed_excerpt: '',
		resolved_at: null,
		confirmation: 'pending',
		confirmed_at: null
	});
}

/** Take a redo back, as long as the student has not answered it in a handed-in draft. */
export function undoRedo(d: Demo, itemId: string) {
	const again = redoOf(d, itemId);
	if (!again || again.resolved_at) return;
	d.feedback_resolutions.splice(d.feedback_resolutions.indexOf(again), 1);
	const r = d.feedback_resolutions.find((x) => x.feedback_item_id === itemId);
	if (r) {
		r.confirmation = 'pending';
		r.confirmed_at = null;
	}
}

function stepDone(d: Demo, step: Step) {
	if (step.key === 'read') return !!d.reading.saved_at;
	if (step.key === 'reflect') return !!d.reflection.created_at;
	return !!snapshotFor(d, step.stage);
}

/** The step the student should do next, or null when everything is done. */
export function currentStep(d: Demo, steps: Step[]): Step | null {
	return steps.find((s) => !stepDone(d, s)) ?? null;
}

/** 1 to steps.length, or steps.length + 1 when everything is done. */
export function stepNumber(d: Demo, steps: Step[]): number {
	return currentStep(d, steps)?.n ?? steps.length + 1;
}

export function formatDate(value: string) {
	return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function onTime(at: string | null | undefined, due: string | null) {
	if (!at || !due) return null;
	return new Date(at).getTime() <= new Date(due).getTime();
}
