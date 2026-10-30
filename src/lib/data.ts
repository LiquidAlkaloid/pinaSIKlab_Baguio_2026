// All fake data for the prototype lives here, shaped like the MYRACLE database (schema.sql v4).
// Types are named after the tables and fields after the columns, so when Supabase is added
// the rows come from the database instead and the screens stay the same.
// Only the columns the screens use are listed. Keys and tenant columns the database fills in
// (institution_id, created_at, ...) are left out unless a screen needs them.

// ---------- enums (schema.sql section 1) ----------
export type UserRole = 'student' | 'teacher' | 'adviser' | 'rater' | 'admin';
export type StageKind = 'first_draft' | 'revision' | 'final';
export type IntakeSource = 'in_app' | 'word_upload' | 'google_docs';
export type CriterionKind = 'output' | 'process';
export type ResolutionAction = 'addressed' | 'partly_addressed' | 'declined';
export type ConfirmationStatus = 'pending' | 'confirmed' | 'rejected';
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded' | 'released';
/** reflection_responses.prompt_key */
export type PromptKey = 'changed_most' | 'hardest_item' | 'score_surprise';

// ---------- AI levels: stages.ai_level and ai_use_declarations.level_used (0 to 5) ----------
/** What each number means, based on the AI Assessment Scale. 0 = no AI. */
export const AI_SCALE: string[] = [
	'No AI',
	'AI for ideas and planning',
	'AI for grammar and wording',
	'AI can draft parts, you check them',
	'Full AI, you say how',
	'Open AI use (exploration)'
];

/** What a student can say they used, picked on every hand-in. The value is level_used. */
export const AI_USES: { level: number; label: string }[] = [
	{ level: 0, label: 'No, I wrote it myself' },
	{ level: 1, label: 'I used AI to get ideas' },
	{ level: 2, label: 'I used AI to fix grammar or wording' },
	{ level: 3, label: 'I used AI to write some sentences' }
];

/** Choices for ai_use_declarations.tools_used. */
export const AI_TOOLS = ['ChatGPT', 'Gemini', 'Copilot', 'Grammarly', 'Other'];

// ---------- table rows ----------
export interface User {
	id: string;
	email: string;
	full_name: string;
	role: UserRole;
	program_id: string | null;
}

export interface Program {
	id: string;
	code: string;
	name: string;
}

/** A row of `classes`. */
export interface SchoolClass {
	id: string;
	teacher_id: string;
	name: string;
	program_id: string | null;
	school_year: string;
	term: string | null;
}

export interface ErrorType {
	id: string;
	code: string;
	label: string;
}

export interface SourceText {
	id: string;
	owner_id: string;
	title: string;
	citation: string | null;
}

export interface SourceParagraph {
	source_text_id: string;
	para_no: number;
	body: string;
}

export interface RubricCriterion {
	id: string;
	rubric_id: string;
	name: string;
	description: string | null;
	kind: CriterionKind;
	max_points: number;
	position: number;
}

export interface Assignment {
	id: string;
	class_id: string;
	title: string;
	instructions: string | null;
	rubric_id: string | null;
	source_text_id: string | null;
	/** Share of the grade for how the student worked, 0 to 30. */
	process_weight_pct: number;
	due_at: string | null;
}

export interface Stage {
	id: string;
	assignment_id: string;
	position: number;
	kind: StageKind;
	goal: string | null;
	ai_level: number;
	due_at: string | null;
}

/**
 * A teacher comment. In the database it also has stage_submission_id and submission_id;
 * the demo attaches these comments to whatever first draft the student hands in.
 */
export interface FeedbackItem {
	id: string;
	number: number;
	author_id: string;
	criterion_id: string | null;
	error_type_id: string | null;
	/** The comment itself, shown in red pen. */
	body: string;
	anchor_page: number | null;
	/** The student's words the comment points at. */
	anchor_excerpt: string | null;
}

export interface CriterionScore {
	criterion_id: string;
	score: number;
	comment: string | null;
}

export interface Grade {
	output_score: number;
	process_score: number;
	final_score: number;
	/** The Process Mirror opens when this is set. */
	released_at: string | null;
}

// ---------- the fake school ----------
const PH = '+08:00';

export const program: Program = {
	id: '11000000-0000-0000-0000-000000000001',
	code: 'BSIT',
	name: 'BS Information Technology'
};

export const teacher: User = {
	id: '20000000-0000-0000-0000-000000000001',
	email: 'reyes@example.edu',
	full_name: 'Ms. Reyes',
	role: 'teacher',
	program_id: null
};

export const student: User = {
	id: '20000000-0000-0000-0000-000000000002',
	email: 'bea.santos@example.edu',
	full_name: 'Bea Santos',
	role: 'student',
	program_id: program.id
};

export const firstName = (u: User) => u.full_name.split(' ')[0];
export const initials = (u: User) =>
	u.full_name
		.split(' ')
		.map((w) => w[0])
		.join('')
		.slice(0, 2);

export const schoolClass: SchoolClass = {
	id: '30000000-0000-0000-0000-000000000001',
	teacher_id: teacher.id,
	name: 'Purposive Communication · BSIT 1-B',
	program_id: program.id,
	school_year: '2026-2027',
	term: '1st semester'
};

export const errorTypes: ErrorType[] = [
	{ id: 'et-evidence', code: 'evidence', label: 'Evidence' },
	{ id: 'et-structure', code: 'structure', label: 'Structure' },
	{ id: 'et-grammar', code: 'grammar', label: 'Grammar' },
	{ id: 'et-citation', code: 'citation', label: 'Citation' }
];

export const errorLabel = (id: string | null) => errorTypes.find((t) => t.id === id)?.label ?? '';

export const sourceText: SourceText = {
	id: '50000000-0000-0000-0000-000000000001',
	owner_id: teacher.id,
	title: 'Who gets a seat? Moving people around a city built for fewer',
	citation: 'Sample article written for the MYRACLE prototype'
};

export const sourceParagraphs: SourceParagraph[] = [
	'Every school morning, lines form at the jeepney terminals near the city market. Students, vendors and office workers wait for the same few routes, and many of them stand for half an hour before they find a seat.',
	'Traffic in the city centre is often blamed on jeepneys, but the roads also carry private cars, taxis, delivery trucks and tourist vans. On weekends and holidays, visitor vehicles add to the load on roads that were laid out for a much smaller town.',
	'Some residents want fewer jeepney routes in the centre and more space for walking. Others warn that cutting routes would hurt the people who depend on jeepneys most: students, older riders and workers who cannot afford a car or a taxi every day.',
	'Cities with similar problems have tried several answers: staggered school and office hours, terminals moved away from the busiest streets, modern buses on fixed schedules, and safer sidewalks so that short trips can be made on foot.',
	'None of these answers is free. Each one asks a different group to give something up, whether that is time, money, road space or a familiar route. A good plan has to say clearly who gains, who pays, and why that trade is fair.'
].map((body, i) => ({ source_text_id: sourceText.id, para_no: i + 1, body }));

const RUBRIC = '40000000-0000-0000-0000-000000000001';

export const rubricCriteria: RubricCriterion[] = [
	{ id: 'rc-position', rubric_id: RUBRIC, name: 'Position and evidence', description: null, kind: 'output', max_points: 45, position: 1 },
	{ id: 'rc-clarity', rubric_id: RUBRIC, name: 'Clarity and correctness', description: null, kind: 'output', max_points: 30, position: 2 },
	{ id: 'rc-article', rubric_id: RUBRIC, name: 'Used the article', description: null, kind: 'process', max_points: 8, position: 3 },
	{ id: 'rc-feedback', rubric_id: RUBRIC, name: 'Acted on feedback', description: null, kind: 'process', max_points: 9, position: 4 },
	{ id: 'rc-depth', rubric_id: RUBRIC, name: 'Depth of revision', description: null, kind: 'process', max_points: 8, position: 5 }
];

export const assignment: Assignment = {
	id: '60000000-0000-0000-0000-000000000001',
	class_id: schoolClass.id,
	title: 'Position paper: public transport in Baguio',
	instructions: null,
	rubric_id: RUBRIC,
	source_text_id: sourceText.id,
	process_weight_pct: 25,
	due_at: `2026-11-13T23:59:00${PH}`
};

/** The teacher's stages: one first draft, one or more revisions, one final. */
export const stages: Stage[] = [
	{ id: 'stage-1', assignment_id: assignment.id, position: 1, kind: 'first_draft', goal: 'Draft 1: ideas and a clear position.', ai_level: 1, due_at: `2026-11-06T23:59:00${PH}` },
	{ id: 'stage-2', assignment_id: assignment.id, position: 2, kind: 'revision', goal: 'Draft 2: structure and evidence from the article.', ai_level: 2, due_at: `2026-11-10T23:59:00${PH}` },
	{ id: 'stage-3', assignment_id: assignment.id, position: 3, kind: 'final', goal: 'Final: clarity and correctness.', ai_level: 2, due_at: `2026-11-13T23:59:00${PH}` }
];

export const stageOf = (kind: StageKind) => stages.find((s) => s.kind === kind)!;

export const feedbackItems: FeedbackItem[] = [
	{
		id: '80000000-0000-0000-0000-000000000001',
		number: 1,
		author_id: teacher.id,
		criterion_id: 'rc-position',
		error_type_id: 'et-structure',
		body: 'What is your position? Say it in one sentence.',
		anchor_page: 1,
		anchor_excerpt: 'Public transport in Baguio has many problems and also many good sides.'
	},
	{
		id: '80000000-0000-0000-0000-000000000002',
		number: 2,
		author_id: teacher.id,
		criterion_id: 'rc-position',
		error_type_id: 'et-evidence',
		body: 'Says who? The article disagrees (¶2). Use it.',
		anchor_page: 1,
		anchor_excerpt: 'Everyone knows that jeepneys are the reason for the traffic.'
	},
	{
		id: '80000000-0000-0000-0000-000000000003',
		number: 3,
		author_id: teacher.id,
		criterion_id: 'rc-clarity',
		error_type_id: 'et-grammar',
		body: '“should have” and which office? Be specific.',
		anchor_page: 2,
		anchor_excerpt: 'In conclusion the government should of fixed it already.'
	}
];

/** Bea's grade (grades) and rubric scores (criterion_scores). The demo releases it when she hands in her final. */
export const grade: Grade = { output_score: 84, process_score: 92, final_score: 86, released_at: null };

export const criterionScores: CriterionScore[] = [
	{ criterion_id: 'rc-position', score: 37, comment: null },
	{ criterion_id: 'rc-clarity', score: 26, comment: null },
	{ criterion_id: 'rc-article', score: 7, comment: 'Good use of ¶2. Bring in ¶4 next time.' },
	{ criterion_id: 'rc-feedback', score: 9, comment: 'Clear reasons when you kept something.' },
	{ criterion_id: 'rc-depth', score: 7, comment: 'You fixed sentences. Rework the argument too.' }
];

/** v_latest_goal: the goal Bea set at the end of her last assignment. */
export const lastGoal = 'Revise the argument, not only the grammar.';

// ---------- the student's 5 steps (screens, not tables) ----------
// Draft, Revise and Final are the 3 stages above. Read and Reflect have no stage row:
// see "Gaps" in the README.
export type StepKey = 'read' | 'draft' | 'revise' | 'final' | 'reflect';

export interface Step {
	key: StepKey;
	n: number;
	name: string;
	/** Plain instruction shown on the student home card. */
	action: string;
	/** Button label on the student home card. */
	cta: string;
	href: string;
	goal: string;
	ai_level: number;
	due_at: string;
	stage: Stage | null;
}

const fromStage = (kind: StageKind) => {
	const s = stageOf(kind);
	return { goal: s.goal ?? '', ai_level: s.ai_level, due_at: s.due_at ?? '', stage: s };
};

export const steps: Step[] = [
	{
		key: 'read',
		n: 1,
		name: 'Read',
		action: 'Read the article and sum it up',
		cta: 'Start reading',
		href: '/student/read',
		goal: 'Understand the article before you write about it.',
		ai_level: 0,
		due_at: `2026-11-03T23:59:00${PH}`,
		stage: null
	},
	{ key: 'draft', n: 2, name: 'Draft', action: 'Hand in your first draft', cta: 'Hand in draft', href: '/student/draft', ...fromStage('first_draft') },
	{ key: 'revise', n: 3, name: 'Revise', action: 'Answer your teacher’s comments and hand in Draft 2', cta: 'See the comments', href: '/student/feedback', ...fromStage('revision') },
	{ key: 'final', n: 4, name: 'Final', action: 'Hand in your final essay', cta: 'Hand in final', href: '/student/final', ...fromStage('final') },
	{
		key: 'reflect',
		n: 5,
		name: 'Reflect',
		action: 'See how you did and set a goal',
		cta: 'See how you did',
		href: '/student/mirror',
		goal: 'Look back at how you worked and pick one thing to improve.',
		ai_level: 0,
		due_at: `2026-11-17T23:59:00${PH}`,
		stage: null
	}
];

/** Other work on the student home screen. Visual only for the demo. */
export const otherWork = [
	{ title: 'Summary: Ibaloi oral histories', status: 'Graded', cta: 'See how you did' },
	{ title: 'Reflection paper: my reading habits', status: 'Graded', cta: 'See how you did' }
];

// ---------- Educator Hub ----------
/** How one comment was closed, as far as the hub needs it (from feedback_resolutions). */
export interface HubResolution {
	action: ResolutionAction;
	decline_reason: string | null;
	changed_excerpt: string | null;
}

/** One student's row on the Educator Hub: what the hub's queries return per enrolled student. */
export interface HubRow {
	student: User;
	/** Step the student is on (1 to 5), 6 = all done. */
	step: number;
	/** One per feedback item, by number. null = still open (no resolution row). */
	resolutions: (HubResolution | null)[];
	/** Highest ai_use_declarations.level_used so far, null if nothing handed in. */
	level_used: number | null;
	late: boolean;
}

let fakeId = 100;
const classmate = (full_name: string): User => ({
	id: `20000000-0000-0000-0000-000000000${fakeId++}`,
	email: full_name.toLowerCase().replace(' ', '.') + '@example.edu',
	full_name,
	role: 'student',
	program_id: program.id
});
const fixed = (changed_excerpt = 'Revised as suggested.'): HubResolution => ({ action: 'addressed', decline_reason: null, changed_excerpt });
const partly = (changed_excerpt = 'Revised part of it.'): HubResolution => ({ action: 'partly_addressed', decline_reason: null, changed_excerpt });
const kept = (decline_reason: string): HubResolution => ({ action: 'declined', decline_reason, changed_excerpt: null });
const open = [null, null, null];

/** Fake class for the Educator Hub. Bea's row is added live from the student demo. */
export const classmates: HubRow[] = [
	{ student: classmate('Carlo Bautista'), step: 1, resolutions: open, level_used: null, late: false },
	{ student: classmate('Joanna Lim'), step: 1, resolutions: open, level_used: null, late: false },
	{ student: classmate('Paolo Ramos'), step: 2, resolutions: open, level_used: null, late: false },
	{ student: classmate('Mika Fernandez'), step: 3, resolutions: [fixed(), null, null], level_used: 1, late: false },
	{
		student: classmate('Daniel Aquino'),
		step: 4,
		resolutions: [
			kept('My first paragraph already says I support more buses.'),
			kept('I used my own commute as evidence instead.'),
			fixed('Changed to “should have” and named the City Transport Office.')
		],
		level_used: 0,
		late: false
	},
	{ student: classmate('Andrea Cruz'), step: 4, resolutions: [fixed(), fixed(), partly()], level_used: 2, late: true },
	{
		student: classmate('Kevin Tan'),
		step: 4,
		resolutions: [fixed(), kept('¶3 is a quote from a driver I interviewed, so I kept the wording.'), fixed()],
		level_used: 0,
		late: false
	},
	{ student: classmate('Lea Villanueva'), step: 5, resolutions: [fixed(), fixed(), fixed()], level_used: 1, late: false },
	{ student: classmate('Rafael Gomez'), step: 6, resolutions: [fixed(), partly(), fixed()], level_used: 0, late: false }
];

/** explain_back_checks: students picked at random to explain one change live in class. */
export const explainBack = ['Andrea Cruz', 'Kevin Tan', 'Mika Fernandez', 'Joanna Lim', 'Lea Villanueva', 'Paolo Ramos'];

/** Demo only: text for the "fill in a sample draft" button on each hand-in. */
export const sampleDrafts: Record<StageKind, string> = {
	first_draft:
		'Public transport in Baguio has many problems and also many good sides. Everyone knows that jeepneys are the reason for the traffic. Students wait a long time at the terminals near the market and some are late for class. Jeepneys are cheap and they go to many places, so a lot of people need them. In conclusion the government should of fixed it already.',
	revision:
		'Baguio should keep its jeepney routes but move the terminals away from the market. Many people blame jeepneys for the traffic, but the article points out that private cars, taxis, trucks and tourist vans fill the same roads (¶2). Students wait a long time at the terminals near the market and some are late for class. Jeepneys are cheap and they go to many places, so cutting routes would hurt riders who cannot pay for a taxi (¶3). In conclusion, the City Transport Office should have moved the terminals already.',
	final:
		'Baguio should keep its jeepney routes but move the terminals away from the market. Many people blame jeepneys for the traffic, but the article points out that private cars, taxis, trucks and tourist vans fill the same roads (¶2). Students wait up to half an hour at the market terminals, and some arrive late for class (¶1). Because jeepneys are cheap and reach many barangays, cutting routes would hurt the riders who cannot pay for a taxi every day (¶3). Other cities moved terminals off their busiest streets (¶4). The City Transport Office should do the same, and say clearly who gains and who pays (¶5).'
};
