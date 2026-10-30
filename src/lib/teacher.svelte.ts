// Which class and assignment the teacher is looking at, shared by the teacher screens.
// Assignments made in "New assignment" are kept here for the session. The comment bank,
// the comments the teacher writes and their decisions on "kept it" reasons are saved in
// the browser like the student demo (see state.svelte.ts).
import {
	assignment,
	assignments,
	commentBank,
	schoolClass,
	student,
	teacher,
	type Assignment,
	type CommentBankEntry,
	type ConfirmationStatus,
	type FeedbackItem
} from './data.ts';

/** The teacher's call on an answer: the database's confirmation, plus 'redo' = raised again next revision. */
export type Decision = ConfirmationStatus | 'redo';

export const desk = $state({ class_id: schoolClass.id, assignment_id: assignment.id, student_id: student.id });

export const created: Assignment[] = $state([]);

export const assignmentsIn = (class_id: string) =>
	[...created, ...assignments].filter((a) => a.class_id === class_id);

export function pickClass(class_id: string) {
	desk.class_id = class_id;
	desk.assignment_id = assignmentsIn(class_id)[0]?.id ?? '';
}

function fresh() {
	return {
		bank: commentBank.map((e) => ({ ...e })),
		/** Comments written on the Review screen, per student id, after the sample ones. */
		comments: {} as Record<string, FeedbackItem[]>,
		/** feedback_resolutions.confirmation for the fake students, keyed `student id:feedback item id`. */
		decisions: {} as Record<string, Decision>
	};
}

export const saved = $state(fresh());

const KEY = 'myracle-teacher-v2';

export function loadTeacher() {
	try {
		const json = localStorage.getItem(KEY);
		if (json) Object.assign(saved, JSON.parse(json));
	} catch {
		// Private window or blocked storage: it still works, it just won't survive a refresh.
	}
}

export function saveTeacher(json: string) {
	try {
		localStorage.setItem(KEY, json);
	} catch {
		// See loadTeacher.
	}
}

export function resetTeacher() {
	Object.assign(saved, fresh());
}

// ---------- comment bank ----------
export function addToBank(body: string, criterion_id: string | null, error_type_id: string | null): CommentBankEntry {
	const entry = { id: crypto.randomUUID(), owner_id: teacher.id, criterion_id, error_type_id, body: body.trim(), use_count: 0 };
	saved.bank.unshift(entry);
	return entry;
}

export function removeFromBank(id: string) {
	saved.bank = saved.bank.filter((e) => e.id !== id);
}

/** Bank entries, most used first, optionally for one criterion and matching a search. */
export function bankFor(criterion_id: string | null, search = '') {
	const q = search.trim().toLowerCase();
	return saved.bank
		.filter((e) => !criterion_id || e.criterion_id === criterion_id)
		.filter((e) => !q || e.body.toLowerCase().includes(q))
		.sort((a, b) => b.use_count - a.use_count);
}

// ---------- comments on a student's draft ----------
export function addComment(
	student_id: string,
	first: number,
	c: Pick<FeedbackItem, 'body' | 'criterion_id' | 'error_type_id' | 'anchor_excerpt'>,
	bank_id?: string
) {
	const list = (saved.comments[student_id] ??= []);
	list.push({ id: crypto.randomUUID(), number: first + list.length, author_id: teacher.id, anchor_page: null, ...c });
	if (bank_id) {
		const entry = saved.bank.find((e) => e.id === bank_id);
		if (entry) entry.use_count += 1;
	}
}

export function removeComment(student_id: string, first: number, id: string) {
	const list = (saved.comments[student_id] ?? []).filter((c) => c.id !== id);
	saved.comments[student_id] = list.map((c, i) => ({ ...c, number: first + i }));
}
