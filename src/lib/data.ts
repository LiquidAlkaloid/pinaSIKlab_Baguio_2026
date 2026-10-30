// All fake data for the prototype lives here.
// When Supabase is added later, these become database tables and the screens stay the same.

/** How much AI the teacher allows on a step (based on the AI Assessment Scale). */
export type AiLevel = 'none' | 'ideas' | 'edit' | 'full';

export const AI_LEVELS: Record<AiLevel, { label: string; short: string }> = {
	none: { label: 'No AI', short: 'No AI on this step' },
	ideas: { label: 'AI for ideas only', short: 'AI allowed for ideas only' },
	edit: { label: 'AI for grammar and wording', short: 'AI allowed for editing only' },
	full: { label: 'AI allowed, say how', short: 'AI allowed if you say how' }
};

/** What a student says they used, picked on every hand-in. */
export type AiUse = 'none' | 'ideas' | 'edit' | 'write';

export const AI_USES: { value: AiUse; label: string; level: number }[] = [
	{ value: 'none', label: 'No, I wrote it myself', level: 0 },
	{ value: 'ideas', label: 'I used AI to get ideas', level: 1 },
	{ value: 'edit', label: 'I used AI to fix grammar or wording', level: 2 },
	{ value: 'write', label: 'I used AI to write some sentences', level: 3 }
];

export const AI_LEVEL_RANK: Record<AiLevel, number> = { none: 0, ideas: 1, edit: 2, full: 3 };

export type StepKey = 'read' | 'draft' | 'revise' | 'final' | 'reflect';

export interface Step {
	key: StepKey;
	n: number;
	name: string;
	/** Plain instruction shown on the student home card. */
	action: string;
	/** Button label on the student home card. */
	cta: string;
	/** One-line goal the teacher wrote for this step. */
	goal: string;
	ai: AiLevel;
	due: string; // ISO date
	href: string;
}

export interface SourceText {
	title: string;
	byline: string;
	paragraphs: string[];
}

export type Tag = 'Evidence' | 'Structure' | 'Grammar' | 'Citation';

export interface FeedbackItem {
	n: number;
	tag: Tag;
	paragraph: number;
	/** The student's words the comment points at. */
	quote: string;
	/** The teacher's comment, shown in red pen. */
	comment: string;
}

export interface Criterion {
	name: string;
	score: number;
	max: number;
	note: string;
}

export interface Assignment {
	title: string;
	course: string;
	section: string;
	teacher: string;
	processWeight: number;
	source: SourceText;
	steps: Step[];
	feedback: FeedbackItem[];
	processScores: Criterion[];
	finalGrade: string;
}

export const student = { first: 'Bea', name: 'Bea Santos', initials: 'BS' };

export const assignment: Assignment = {
	title: 'Position paper: public transport in Baguio',
	course: 'Purposive Communication',
	section: 'BSIT 1-B',
	teacher: 'Ms. Reyes',
	processWeight: 25,
	source: {
		title: 'Who gets a seat? Moving people around a city built for fewer',
		byline: 'Sample article written for the MYRACLE prototype',
		paragraphs: [
			'Every school morning, lines form at the jeepney terminals near the city market. Students, vendors and office workers wait for the same few routes, and many of them stand for half an hour before they find a seat.',
			'Traffic in the city centre is often blamed on jeepneys, but the roads also carry private cars, taxis, delivery trucks and tourist vans. On weekends and holidays, visitor vehicles add to the load on roads that were laid out for a much smaller town.',
			'Some residents want fewer jeepney routes in the centre and more space for walking. Others warn that cutting routes would hurt the people who depend on jeepneys most: students, older riders and workers who cannot afford a car or a taxi every day.',
			'Cities with similar problems have tried several answers: staggered school and office hours, terminals moved away from the busiest streets, modern buses on fixed schedules, and safer sidewalks so that short trips can be made on foot.',
			'None of these answers is free. Each one asks a different group to give something up, whether that is time, money, road space or a familiar route. A good plan has to say clearly who gains, who pays, and why that trade is fair.'
		]
	},
	steps: [
		{
			key: 'read',
			n: 1,
			name: 'Read',
			action: 'Read the article and sum it up',
			cta: 'Start reading',
			goal: 'Understand the article before you write about it.',
			ai: 'none',
			due: '2026-11-03',
			href: '/student/read'
		},
		{
			key: 'draft',
			n: 2,
			name: 'Draft',
			action: 'Hand in your first draft',
			cta: 'Hand in draft',
			goal: 'Draft 1: ideas and a clear position.',
			ai: 'ideas',
			due: '2026-11-06',
			href: '/student/draft'
		},
		{
			key: 'revise',
			n: 3,
			name: 'Revise',
			action: 'Answer your teacher’s comments',
			cta: 'See the comments',
			goal: 'Draft 2: structure and evidence from the article.',
			ai: 'edit',
			due: '2026-11-10',
			href: '/student/feedback'
		},
		{
			key: 'final',
			n: 4,
			name: 'Final',
			action: 'Hand in your final essay',
			cta: 'Hand in final',
			goal: 'Final: clarity and correctness.',
			ai: 'edit',
			due: '2026-11-13',
			href: '/student/final'
		},
		{
			key: 'reflect',
			n: 5,
			name: 'Reflect',
			action: 'See how you did and set a goal',
			cta: 'See how you did',
			goal: 'Look back at how you worked and pick one thing to improve.',
			ai: 'none',
			due: '2026-11-17',
			href: '/student/mirror'
		}
	],
	feedback: [
		{
			n: 1,
			tag: 'Structure',
			paragraph: 1,
			quote: 'Public transport in Baguio has many problems and also many good sides.',
			comment: 'What is your position? Say it in one sentence.'
		},
		{
			n: 2,
			tag: 'Evidence',
			paragraph: 3,
			quote: 'Everyone knows that jeepneys are the reason for the traffic.',
			comment: 'Says who? The article disagrees (¶2). Use it.'
		},
		{
			n: 3,
			tag: 'Grammar',
			paragraph: 5,
			quote: 'In conclusion the government should of fixed it already.',
			comment: '“should have” and which office? Be specific.'
		}
	],
	processScores: [
		{ name: 'Used the article', score: 3, max: 4, note: 'Good use of ¶2. Bring in ¶4 next time.' },
		{ name: 'Acted on feedback', score: 3, max: 4, note: 'Clear reasons when you kept something.' },
		{ name: 'Depth of revision', score: 2, max: 4, note: 'You fixed sentences. Rework the argument too.' }
	],
	finalGrade: '86'
};

/** Other work on the student home screen. Visual only for the demo. */
export const otherWork = [
	{ title: 'Summary: Ibaloi oral histories', status: 'Graded', cta: 'See how you did' },
	{ title: 'Reflection paper: my reading habits', status: 'Graded', cta: 'See how you did' }
];

/** Goal the student set at the end of their last assignment. */
export const lastGoal = 'Revise the argument, not only the grammar.';

export type Answer = 'fixed' | 'partly' | 'kept';

export interface ClassmateRow {
	name: string;
	/** Step the student is on (1–5), 6 = all done. */
	step: number;
	answers: (Answer | null)[];
	ai: AiUse | null;
	late?: boolean;
	keptReasons?: string[];
}

/** Fake class for the Educator Hub. Bea's row is added live from the student demo. */
export const classmates: ClassmateRow[] = [
	{ name: 'Carlo Bautista', step: 1, answers: [null, null, null], ai: null, late: false },
	{ name: 'Joanna Lim', step: 1, answers: [null, null, null], ai: null },
	{ name: 'Paolo Ramos', step: 2, answers: [null, null, null], ai: null },
	{ name: 'Mika Fernandez', step: 3, answers: ['fixed', null, null], ai: 'ideas' },
	{
		name: 'Daniel Aquino',
		step: 3,
		answers: ['kept', 'kept', 'fixed'],
		ai: 'none',
		keptReasons: [
			'My first paragraph already says I support more buses.',
			'I used my own commute as evidence instead.'
		]
	},
	{ name: 'Andrea Cruz', step: 4, answers: ['fixed', 'fixed', 'partly'], ai: 'edit', late: true },
	{
		name: 'Kevin Tan',
		step: 4,
		answers: ['fixed', 'kept', 'fixed'],
		ai: 'none',
		keptReasons: ['¶3 is a quote from a driver I interviewed, so I kept the wording.']
	},
	{ name: 'Lea Villanueva', step: 5, answers: ['fixed', 'fixed', 'fixed'], ai: 'ideas' },
	{ name: 'Rafael Gomez', step: 6, answers: ['fixed', 'partly', 'fixed'], ai: 'none' }
];

/** Students picked at random this week to explain one change live in class (feature #8). */
export const explainBack = ['Andrea Cruz', 'Kevin Tan', 'Mika Fernandez', 'Joanna Lim', 'Lea Villanueva', 'Paolo Ramos'];
