<script lang="ts">
	// Educator Hub (#4): the teacher picks a class, then an assignment in it.
	// Cards ask questions; they never give verdicts.
	// The three cards follow v_attention_cards: stages not handed in, comments still open,
	// and "kept it" answers (declines) waiting for the teacher to check.
	// Only the demo assignment has student rows; the others show class progress only.
	import {
		AI_USES,
		assignment,
		assignmentProgress,
		assignmentSteps,
		classes,
		classSize,
		draftLabel,
		classmates,
		explainBack,
		errorLabel,
		errorTypes,
		feedbackRound,
		revisionCount,
		student,
		teacher,
		type Assignment,
		type AssignmentStatus,
		type Classmate,
		type ConfirmationStatus,
		type HubComment,
		type HubRow,
		type ResolutionAction
	} from '#lib/data.ts';
	import DraftChanges from '#lib/components/DraftChanges.svelte';
	import { downloadMatrix } from '#lib/export.ts';
	import {
		course,
		courseSteps,
		declarationFor,
		demo,
		draftChanges,
		formatDate,
		onTime,
		snapshotFor,
		stepNumber,
		summaryFor
	} from '#lib/state.svelte.ts';
	import { assignmentsIn, desk, pickClass, saved } from '#lib/teacher.svelte.ts';

	interface Row extends HubRow {
		live: boolean;
	}

	// ---------- class and assignment picker ----------
	const currentClass = $derived(classes.find((c) => c.id === desk.class_id) ?? classes[0]);
	const classList = $derived(assignmentsIn(currentClass.id));
	const current = $derived(classList.find((a) => a.id === desk.assignment_id) ?? classList[0] ?? null);
	const isDemo = $derived(current?.id === assignment.id);
	const size = $derived(classSize[currentClass.id] ?? 0);

	/** "Purposive Communication · BSIT 1-B" → subject and section. */
	const nameParts = (name: string) => {
		const [subject, section = ''] = name.split(' · ');
		return { subject, section };
	};

	/** Students past each step of an assignment, in step order. */
	function progressOf(a: Assignment): number[] {
		if (a.id === assignment.id) return stepDone;
		return assignmentProgress[a.id]?.step_done ?? assignmentSteps(a).map(() => 0);
	}

	const statusOf = (a: Assignment): AssignmentStatus => assignmentProgress[a.id]?.status ?? 'open';
	const STATUS: Record<AssignmentStatus, string> = { open: 'Open', grading: 'To grade', done: 'Graded' };

	function closePanels() {
		selectedId = null;
		showReasons = false;
	}

	function choose(a: Assignment) {
		desk.assignment_id = a.id;
		closePanels();
	}

	// ---------- the demo assignment's hub ----------
	const steps = $derived(courseSteps());
	const total = $derived(revisionCount(course.stages));

	// Where a fake student is, as a step number in the current setup.
	function classmateStep(c: Classmate) {
		const last = steps.length;
		const at = { read: 1, draft: 2, revise: 3, final: last - 1, reflect: last, done: last + 1 };
		return Math.min(at[c.at], last + 1);
	}

	const rows: Row[] = $derived([
		{
			student,
			step: stepNumber(demo, steps),
			// A comment only counts as answered once the next draft is handed in (resolved_at is set).
			comments: demo.feedback_resolutions.map((r) => ({
				item: feedbackRound(r.round).find((i) => i.id === r.feedback_item_id)!,
				round: r.round,
				resolution:
					r.resolved_at && r.action
						? { action: r.action, decline_reason: r.decline_reason, changed_excerpt: r.changed_excerpt }
						: null
			})),
			level_used: demo.ai_use_declarations.length
				? Math.max(...demo.ai_use_declarations.map((a) => a.level_used))
				: null,
			late: false,
			live: true
		},
		...classmates.map((c) => ({
			student: c.student,
			step: classmateStep(c),
			comments: feedbackRound(1).map((item, i) => ({ item, round: 1, resolution: c.resolutions[i] })),
			level_used: c.level_used,
			late: c.late,
			live: false
		}))
	]);

	const done = (row: Row) => row.step > steps.length;

	// The teacher's call on each answer (feedback_resolutions.confirmation): 'confirmed' = agreed or
	// fix confirmed, 'rejected' = not accepted yet, talk to the student. Bea's are saved in her
	// feedback_resolutions, the fake students' in the teacher store.
	function decisionOf(row: Row, itemId: string): ConfirmationStatus {
		if (row.live) return demo.feedback_resolutions.find((r) => r.feedback_item_id === itemId)?.confirmation ?? 'pending';
		return saved.decisions[`${row.student.id}:${itemId}`] ?? 'pending';
	}

	const isConfirmed = (row: Row, itemId: string) => decisionOf(row, itemId) === 'confirmed';

	function decide(row: Row, itemId: string, status: ConfirmationStatus) {
		if (row.live) {
			const r = demo.feedback_resolutions.find((r) => r.feedback_item_id === itemId)!;
			r.confirmation = status;
			r.confirmed_at = status === 'pending' ? null : new Date().toISOString();
		} else {
			saved.decisions[`${row.student.id}:${itemId}`] = status;
		}
	}

	const confirm = (row: Row, itemId: string) => decide(row, itemId, 'confirmed');

	const pendingDeclines = (row: Row) =>
		row.comments.filter((c) => c.resolution?.action === 'declined' && decisionOf(row, c.item.id) === 'pending').length;
	const confirmedCount = (row: Row) => row.comments.filter((c) => c.resolution && isConfirmed(row, c.item.id)).length;

	/** Every "kept it" answer in the class, waiting ones first. */
	const reasons = $derived(
		rows
			.flatMap((row) => row.comments.filter((c) => c.resolution?.action === 'declined').map((c) => ({ row, c })))
			.sort(
				(a, b) =>
					Number(decisionOf(b.row, b.c.item.id) === 'pending') - Number(decisionOf(a.row, a.c.item.id) === 'pending')
			)
	);

	const noFirstDraft = $derived(rows.filter((r) => r.step <= 2));
	const declinesToCheck = $derived(rows.reduce((sum, r) => sum + pendingDeclines(r), 0));
	const stepDone = $derived(steps.map((s) => rows.filter((r) => r.step > s.n).length));

	let reminded = $state(false);
	let showExplain = $state(false);
	let showReasons = $state(false);
	let selectedId: string | null = $state(null);
	const selected = $derived(rows.find((r) => r.student.id === selectedId) ?? null);

	function openStudent(id: string) {
		selectedId = id;
		showReasons = false;
	}

	function checkReasons() {
		selectedId = null;
		showReasons = true;
	}

	function todo(row: Row): { label: string; act?: () => void } {
		if (row.step <= 2) return { label: 'Remind' };
		if (pendingDeclines(row) > 0) return { label: 'Check reason', act: () => openStudent(row.student.id) };
		if (done(row)) return { label: 'Done' };
		return { label: 'On track' };
	}

	const stepName = (row: Row) => (done(row) ? 'All done' : steps[row.step - 1].name);

	const aiShort = (level: number | null) =>
		level === null ? '—' : (AI_USES.find((u) => u.level === level)?.label.replace(/^I used AI to /, 'AI: ') ?? '—');

	const answered = (row: Row) => row.comments.filter((c) => c.resolution).length;

	const roundLabel = (round: number) => (total > 1 ? `${draftLabel(course.stages[round - 1], course.stages)} · ` : '');

	// ---------- one student's details ----------
	interface StepLine {
		key: string;
		name: string;
		state: 'done' | 'now' | 'later';
		when: string | null;
		late: boolean;
		ai: string | null;
	}

	/** What the student did at each step. Bea's comes from her demo rows; the fake students only have their step. */
	function timeline(row: Row): StepLine[] {
		return steps.map((s) => {
			const state = s.n < row.step ? 'done' : s.n === row.step ? 'now' : 'later';
			const line: StepLine = { key: s.key, name: s.name, state, when: null, late: false, ai: null };
			if (!row.live) {
				line.late = row.late && s.n === row.step - 1;
				return line;
			}
			if (s.key === 'read') line.when = demo.reading.saved_at;
			else if (s.key === 'reflect') line.when = demo.reflection.created_at;
			else {
				const ss = snapshotFor(demo, s.stage);
				const ai = declarationFor(demo, ss);
				line.when = ss?.submitted_at ?? null;
				line.late = onTime(ss?.submitted_at, s.due_at) === false;
				if (ai) line.ai = aiShort(ai.level_used) + (ai.tools_used.length ? ` (${ai.tools_used.join(', ')})` : '');
			}
			return line;
		});
	}

	/** Comments written for this student on the Review screen. */
	const written = (row: Row) => saved.comments[row.student.id] ?? [];

	/** How often each error tag shows up in this student's comments, most first. */
	const errorCounts = (row: Row) => {
		const all = [...row.comments.map((c) => c.item), ...written(row)];
		return errorTypes
			.map((t) => ({ label: t.label, n: all.filter((c) => c.error_type_id === t.id).length }))
			.filter((t) => t.n > 0)
			.sort((a, b) => b.n - a.n);
	};

	// v_revision_matrix: confirmed items only.
	function exportFor(row: Row) {
		const matrix = row.comments
			.filter((c) => c.resolution && isConfirmed(row, c.item.id))
			.map(({ item, round, resolution: r }, i) => ({
				item_no: i + 1,
				comment: total > 1 ? `${draftLabel(course.stages[round - 1], course.stages)}: ${item.body}` : item.body,
				action_taken: LABEL[r!.action],
				action_detail: (r!.action === 'declined' ? r!.decline_reason : r!.changed_excerpt) ?? '',
				page: item.anchor_page
			}));
		downloadMatrix(row.student.full_name, assignment.title, matrix);
	}

	// The AI summary of Bea's first draft: the first thing the teacher reads.
	const firstSummary = $derived(summaryFor(demo, snapshotFor(demo, course.stages[0]))?.body);

	// Bea's changes that no comment asked for, per draft she has handed in.
	const ownChanges = $derived(
		course.stages
			.slice(1)
			.map((stage, i) => ({ stage, n: i + 2, changes: draftChanges(demo, course.stages, i + 1) }))
			.filter((d) => snapshotFor(demo, d.stage))
	);

	const LABEL: Record<ResolutionAction, string> = {
		addressed: 'Fixed',
		partly_addressed: 'Partly fixed',
		declined: 'Kept, with a reason'
	};
</script>

<svelte:head><title>Teacher home · MYRACLE</title></svelte:head>

<div class="head">
	<div>
		<p class="small muted">{teacher.full_name} · {currentClass.term} {currentClass.school_year}</p>
		<h1>Your classes</h1>
	</div>
	<a class="btn btn-primary" href="/teacher/new">New assignment</a>
</div>

<div class="class-tabs" role="group" aria-label="Choose a class">
	{#each classes as c (c.id)}
		{@const p = nameParts(c.name)}
		<button
			class="class-tab"
			aria-pressed={c.id === currentClass.id}
			onclick={() => {
				pickClass(c.id);
				closePanels();
			}}
		>
			<strong>{p.section}</strong>
			<span class="small">{p.subject}</span>
			<span class="small muted">{classSize[c.id]} students · {assignmentsIn(c.id).length} assignments</span>
		</button>
	{/each}
</div>

<h2 class="section-title">Assignments in {nameParts(currentClass.name).section}</h2>
{#if classList.length === 0}
	<div class="card empty stack">
		<p>No assignments in this class yet.</p>
		<a class="btn btn-ghost" href="/teacher/new">Make one</a>
	</div>
{:else}
	<div class="assignments" role="group" aria-label="Choose an assignment">
		{#each classList as a (a.id)}
			{@const finished = progressOf(a).at(-1) ?? 0}
			{@const status = statusOf(a)}
			<button class="card assign" aria-pressed={a.id === current?.id} onclick={() => choose(a)}>
				<span class="pill status-{status}">{STATUS[status]}</span>
				<strong class="assign-title">{a.title}</strong>
				<span class="small muted">{a.due_at ? `Due ${formatDate(a.due_at)}` : 'No due date'}</span>
				<span class="meter"><span style="width: {size ? (finished / size) * 100 : 0}%"></span></span>
				<span class="small muted">{finished} of {size} finished</span>
			</button>
		{/each}
	</div>
{/if}

{#if current}
<div class="current">
	<p class="small muted">
		{currentClass.name} · {size} students{#if isDemo} · {total} revision{total === 1 ? '' : 's'} (the last is the final){/if}
	</p>
	<h2 class="current-title">{current.title}</h2>
</div>

{#if !isDemo}
	{@const shown = assignmentSteps(current)}
	{@const progress = progressOf(current)}
	<section class="card stack">
		<h2>Where the class is</h2>
		<div class="steps">
			{#each shown as s, i (s.key)}
				<div class="step">
					<div class="meter"><span style="width: {size ? (progress[i] / size) * 100 : 0}%"></span></div>
					<p class="small"><strong>{s.name}</strong> <span class="muted">{progress[i]} of {size} done</span></p>
				</div>
			{/each}
		</div>
		<p class="small muted">
			{progress.every((n) => n === 0)
				? 'Just given. No one has started yet.'
				: `Student-by-student detail is only filled in for “${assignment.title}” (${nameParts(classes[0].name).section}) in this prototype.`}
		</p>
	</section>
{:else}
<h2 class="section-title">Needs you today</h2>
<div class="cards">
	<article class="card ask">
		<p class="q">
			<strong>{noFirstDraft.length} students</strong> haven’t handed in their first draft yet. Send a reminder?
		</p>
		<button class="btn btn-ghost btn-small" disabled={reminded} onclick={() => (reminded = true)}>
			{reminded ? 'Reminder sent' : 'Send reminder'}
		</button>
	</article>
	<article class="card ask">
		<p class="q">
			<strong>{declinesToCheck} comments</strong> were kept the same, with a reason. Check the reasons?
		</p>
		<p class="small muted">
			Students may leave something unchanged if they say why. Read each reason, then agree or mark it
			to talk about. Agreed reasons count as answered and go in the revision matrix.
		</p>
		<button class="btn btn-ghost btn-small" disabled={reasons.length === 0} onclick={checkReasons}>
			{declinesToCheck === 0 ? 'See checked reasons' : 'Check reasons'}
		</button>
	</article>
	<article class="card ask">
		<p class="q">
			<strong>{explainBack.length} students</strong> were picked at random to explain one change in class this week. See who?
		</p>
		<button class="btn btn-ghost btn-small" onclick={() => (showExplain = !showExplain)}>
			{showExplain ? 'Hide' : 'See who'}
		</button>
		{#if showExplain}
			<p class="small muted names">{explainBack.join(', ')}</p>
		{/if}
	</article>
</div>

{#snippet decision(row: Row, c: HubComment)}
	{@const d = decisionOf(row, c.item.id)}
	{#if d === 'confirmed'}
		<span class="decided">
			<span class="pill pill-ok">{c.resolution?.action === 'declined' ? 'You agreed' : 'Confirmed'}</span>
			<button class="link small" onclick={() => decide(row, c.item.id, 'pending')}>Undo</button>
		</span>
	{:else if d === 'rejected'}
		<span class="decided">
			<span class="pill pill-gold">Talk to them in class</span>
			<button class="link small" onclick={() => decide(row, c.item.id, 'pending')}>Undo</button>
		</span>
	{:else if c.resolution?.action === 'declined'}
		<div class="reason-actions">
			<button class="btn btn-primary btn-small" onclick={() => confirm(row, c.item.id)}>Agree</button>
			<button class="btn btn-ghost btn-small" onclick={() => decide(row, c.item.id, 'rejected')}>Talk to student</button>
		</div>
	{:else}
		<button class="btn btn-ghost btn-small" onclick={() => confirm(row, c.item.id)}>Confirm the change</button>
	{/if}
{/snippet}

<div class="layout" class:has-panel={selected || showReasons}>
	<div class="stack">
		<section class="card stack">
			<h2>Where the class is</h2>
			<div class="steps">
				{#each steps as s, i (s.key)}
					<div class="step">
						<div class="meter"><span style="width: {(stepDone[i] / rows.length) * 100}%"></span></div>
						<p class="small"><strong>{s.name}</strong> <span class="muted">{stepDone[i]} of {rows.length} done</span></p>
					</div>
				{/each}
			</div>
		</section>

		<section class="card table-card">
			<div class="table-scroll">
				<table>
					<thead>
						<tr>
							<th>Student</th>
							<th>Step</th>
							<th>Comments answered</th>
							<th>AI they declared</th>
							<th>What to do</th>
						</tr>
					</thead>
					<tbody>
						{#each rows as row (row.student.id)}
							{@const t = todo(row)}
							<tr class:active={selectedId === row.student.id}>
								<td>
									<button class="name" onclick={() => openStudent(row.student.id)}>{row.student.full_name}</button>
									{#if row.live}<span class="pill pill-brand live">live demo</span>{/if}
								</td>
								<td>
									{stepName(row)}
									{#if row.late}<span class="pill pill-gold">late</span>{/if}
								</td>
								<td>
									{#if row.step >= 3}
										<span class="answers">
											{#each row.comments as c (c.item.id)}<i class={c.resolution?.action ?? 'none'} title={c.resolution ? LABEL[c.resolution.action] : 'Not yet'}></i>{/each}
										</span>
										{answered(row)} of {row.comments.length}
									{:else}<span class="muted">—</span>{/if}
								</td>
								<td class="small">{aiShort(row.level_used)}</td>
								<td>
									{#if t.act}
										<button class="btn btn-ghost btn-small" onclick={t.act}>{t.label}</button>
									{:else}
										<span class="small muted">{t.label}</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	</div>

	{#if selected}
		{@const confirmed = confirmedCount(selected)}
		<aside class="card panel stack">
			<div class="panel-head">
				<h2>{selected.student.full_name}</h2>
				<button class="btn btn-ghost btn-small" onclick={() => (selectedId = null)} aria-label="Close">Close</button>
			</div>
			<p class="small muted">
				{selected.student.email} ·
				{done(selected) ? `all ${steps.length} steps done` : `on step ${selected.step}: ${stepName(selected)}`}
			</p>

			<h3>Steps</h3>
			<ol class="timeline">
				{#each timeline(selected) as line (line.key)}
					<li class={line.state}>
						<span class="dot" aria-hidden="true"></span>
						<div class="stack line">
							<p class="small">
								<strong>{line.name}</strong>
								<span class="muted">
									{#if line.state === 'done'}{line.when ? `handed in ${formatDate(line.when)}` : 'done'}
									{:else if line.state === 'now'}working on it
									{:else}not started{/if}
								</span>
								{#if line.late}<span class="pill pill-gold">late</span>{/if}
							</p>
							{#if line.ai}<p class="small muted">AI declared: {line.ai}</p>{/if}
						</div>
					</li>
				{/each}
			</ol>
			{#if !selected.live}
				<p class="small muted">Dates and AI per step are only filled in for Bea in this prototype.</p>
			{/if}

			{#if selected.live && firstSummary}
				<h3>First draft, summed up by AI</h3>
				<p class="small">“{firstSummary}”</p>
			{/if}

			<div class="comments-head">
				<h3>Comments</h3>
				<a class="btn btn-ghost btn-small" href="/teacher/review" onclick={() => (desk.student_id = selected.student.id)}>
					Write comments
				</a>
			</div>
			<ul class="items">
				{#each selected.comments as c (c.item.id)}
					{@const r = c.resolution}
					<li>
						<p class="pen small-pen">{c.item.body}</p>
						<p class="small">
							{#if r}<span class="pill status {r.action}">{LABEL[r.action]}</span>{:else}<span class="pill">Not answered yet</span>{/if}
							<span class="muted">{roundLabel(c.round)}{errorLabel(c.item.error_type_id)}</span>
						</p>
						{#if r}
							<div class="reason">
								<p>“{r.action === 'declined' ? r.decline_reason : r.changed_excerpt}”</p>
								{@render decision(selected, c)}
							</div>
						{/if}
					</li>
				{/each}
				{#each written(selected) as item (item.id)}
					<li>
						<p class="pen small-pen">{item.body}</p>
						<p class="small">
							<span class="pill pill-brand">New</span>
							<span class="muted">{errorLabel(item.error_type_id) || 'No tag'}</span>
						</p>
					</li>
				{/each}
			</ul>

			{#if selected.live && ownChanges.length}
				<h3>Changes they made on their own</h3>
				{#each ownChanges as d (d.stage.id)}
					<p class="small"><strong>{draftLabel(d.stage, course.stages)}</strong></p>
					<DraftChanges changes={d.changes} own="Their own change" onlyOwn />
				{/each}
			{/if}

			<h3>Errors that keep coming up</h3>
			<p class="small">
				{#each errorCounts(selected) as e, i (e.label)}{i ? ', ' : ''}{e.label} ×{e.n}{/each}
			</p>
			<p class="small muted">From the error tags on their comments.</p>

			<h3>Most AI they declared</h3>
			<p class="small">{aiShort(selected.level_used)}</p>

			<button class="btn btn-ghost btn-block" disabled={confirmed === 0} onclick={() => exportFor(selected)}>
				Download revision matrix (Word)
			</button>
			<p class="small muted">
				{confirmed} of {selected.comments.length} comments confirmed. Only confirmed comments go in the matrix.
			</p>
			{#if selected.live}
				<p class="small muted">This is Bea’s real demo data. The student sees this same report in “See how you did”.</p>
			{/if}
		</aside>
	{:else if showReasons}
		<aside class="card panel stack">
			<div class="panel-head">
				<h2>Kept, with a reason</h2>
				<button class="btn btn-ghost btn-small" onclick={() => (showReasons = false)} aria-label="Close">Close</button>
			</div>
			<p class="small muted">
				{declinesToCheck} waiting for you. Agree if the reason holds up. If not, mark it and talk to the
				student in class; it stays out of the revision matrix until you agree.
			</p>
			<ul class="items">
				{#each reasons as { row, c } (row.student.id + c.item.id)}
					<li class="reason-item">
						<button class="name" onclick={() => openStudent(row.student.id)}>{row.student.full_name}</button>
						<p class="pen small-pen">{c.item.body}</p>
						{#if c.item.anchor_excerpt}<p class="small muted">On: “{c.item.anchor_excerpt}”</p>{/if}
						<div class="reason">
							<p>“{c.resolution?.decline_reason}”</p>
							{@render decision(row, c)}
						</div>
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</div>
{/if}
{/if}

<style>
	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	.section-title {
		font-size: 1rem;
		color: var(--ink-2);
		margin-bottom: 0.75rem;
	}
	.class-tabs {
		display: flex;
		gap: 0.6rem;
		overflow-x: auto;
		padding-bottom: 0.25rem;
		margin-bottom: 1.5rem;
	}
	.class-tab {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.1rem;
		min-width: 13rem;
		padding: 0.7rem 0.95rem;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
		font: inherit;
		color: var(--ink);
		text-align: left;
		cursor: pointer;
	}
	.class-tab:hover {
		border-color: var(--brand-2);
	}
	.class-tab[aria-pressed='true'] {
		border-color: var(--brand);
		background: var(--brand-soft);
		box-shadow: inset 0 0 0 1px var(--brand);
	}
	.assignments {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.assign {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
		font: inherit;
		color: var(--ink);
		text-align: left;
		cursor: pointer;
		border: 1px solid var(--line);
	}
	.assign:hover {
		border-color: var(--brand-2);
	}
	.assign[aria-pressed='true'] {
		border-color: var(--brand);
		box-shadow: inset 0 0 0 1px var(--brand);
	}
	.assign .meter {
		width: 100%;
		margin: 0.35rem 0 0;
	}
	.assign-title {
		line-height: 1.3;
	}
	.status-open {
		background: var(--brand-soft);
		color: var(--brand);
	}
	.status-grading {
		background: var(--gold-soft);
		color: #8a5d00;
	}
	.status-done {
		background: var(--ok-soft);
		color: var(--ok);
	}
	.empty {
		align-items: flex-start;
		margin-bottom: 2rem;
	}
	.current {
		border-top: 1px solid var(--line);
		padding-top: 1.5rem;
		margin-bottom: 1.25rem;
	}
	.current-title {
		font-size: 1.6rem;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.ask {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		align-items: flex-start;
		border-top: 4px solid var(--gold);
	}
	.q {
		font-size: 1.05rem;
	}
	.names {
		margin-top: -0.25rem;
	}
	.layout {
		display: grid;
		gap: 1.25rem;
		align-items: start;
	}
	.layout.has-panel {
		grid-template-columns: minmax(0, 1fr) 26rem;
	}
	@media (max-width: 900px) {
		.layout.has-panel {
			grid-template-columns: 1fr;
		}
	}
	.steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 1rem;
	}
	.meter {
		height: 10px;
		border-radius: 999px;
		background: var(--sunken);
		overflow: hidden;
		margin-bottom: 0.35rem;
	}
	.meter span {
		display: block;
		height: 100%;
		background: var(--brand-2);
		border-radius: 999px;
		transition: width 300ms var(--ease);
	}
	.table-card {
		padding: 0;
	}
	.table-scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 40rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.7rem 1rem;
		border-bottom: 1px solid var(--line);
		vertical-align: middle;
	}
	th {
		font-size: 0.8rem;
		color: var(--ink-3);
		font-weight: 700;
	}
	tbody tr:last-child td {
		border-bottom: 0;
	}
	tr.active td {
		background: var(--brand-soft);
	}
	.name {
		background: none;
		border: 0;
		padding: 0;
		font: inherit;
		font-weight: 700;
		color: var(--ink);
		cursor: pointer;
		text-align: left;
	}
	.name:hover {
		color: var(--brand-2);
		text-decoration: underline;
	}
	.live {
		margin-left: 0.4rem;
	}
	.answers {
		display: inline-flex;
		gap: 3px;
		margin-right: 0.4rem;
		vertical-align: -1px;
	}
	.answers i {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		background: var(--line);
	}
	.answers i.addressed {
		background: var(--ok);
	}
	.answers i.partly_addressed {
		background: var(--partly);
	}
	.answers i.declined {
		background: var(--kept);
	}
	.panel {
		position: sticky;
		top: 5rem;
		gap: 0.75rem;
		max-height: calc(100dvh - 6rem);
		overflow-y: auto;
	}
	.panel-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.panel h3 {
		font-size: 0.85rem;
		color: var(--ink-3);
		margin-top: 0.5rem;
	}
	.items {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.small-pen {
		font-size: 1.2rem;
	}
	.status.addressed {
		background: var(--ok-soft);
		color: var(--ok);
	}
	.status.partly_addressed {
		background: var(--gold-soft);
		color: #8a5d00;
	}
	.status.declined {
		background: #e9edf5;
		color: var(--ink);
	}
	.reason {
		background: var(--sunken);
		border-radius: var(--radius-sm);
		padding: 0.7rem 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-start;
	}
	.reason-actions {
		display: flex;
		gap: 0.4rem;
	}
	.decided {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
	}
	.link {
		background: none;
		border: 0;
		padding: 0;
		font: inherit;
		font-weight: 700;
		color: var(--brand-2);
		cursor: pointer;
	}
	.timeline {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.timeline li {
		display: grid;
		grid-template-columns: 14px 1fr;
		gap: 0.6rem;
		padding-bottom: 0.6rem;
		position: relative;
	}
	.timeline li:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 6px;
		top: 16px;
		bottom: 0;
		width: 2px;
		background: var(--line);
	}
	.dot {
		width: 14px;
		height: 14px;
		margin-top: 3px;
		border-radius: 50%;
		border: 2px solid var(--line);
		background: var(--surface);
	}
	.timeline .done .dot {
		background: var(--ok);
		border-color: var(--ok);
	}
	.timeline .now .dot {
		border-color: var(--brand-2);
		box-shadow: inset 0 0 0 3px var(--surface);
		background: var(--brand-2);
	}
	.timeline .later {
		opacity: 0.6;
	}
	.line {
		gap: 0.2rem;
	}
	.comments-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.5rem;
	}
	.comments-head h3 {
		margin-top: 0;
	}
	.reason-item {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--line);
	}
	.reason-item:last-child {
		border-bottom: 0;
	}
</style>
