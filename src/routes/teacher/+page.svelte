<script lang="ts">
	// Educator Hub (#4): one screen per class. Cards ask questions; they never give verdicts.
	// The three cards follow v_attention_cards: stages not handed in, comments still open,
	// and "kept it" answers (declines) waiting for the teacher to check.
	import {
		AI_USES,
		assignment,
		draftLabel,
		classmates,
		explainBack,
		errorLabel,
		feedbackRound,
		revisionCount,
		schoolClass,
		student,
		type Classmate,
		type HubRow,
		type ResolutionAction
	} from '#lib/data.ts';
	import DraftChanges from '#lib/components/DraftChanges.svelte';
	import { downloadMatrix } from '#lib/export.ts';
	import { course, courseSteps, demo, draftChanges, snapshotFor, stepNumber, summaryFor } from '#lib/state.svelte.ts';

	interface Row extends HubRow {
		live: boolean;
	}

	const steps = $derived(courseSteps());
	const total = $derived(revisionCount(course.stages));

	// Where a fake student is, as a step number in the current setup.
	function classmateStep(c: Classmate) {
		const last = steps.length;
		const at = { read: 1, draft: 2, revise: 3, final: last - 1, reflect: last, done: last + 1 };
		return Math.min(at[c.at], last + 1);
	}

	// Teacher confirmations for the fake students, by student and comment. Bea's are saved in
	// her feedback_resolutions.
	let confirmedFake: Record<string, boolean> = $state({});

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

	function isConfirmed(row: Row, itemId: string) {
		if (row.live) return demo.feedback_resolutions.find((r) => r.feedback_item_id === itemId)?.confirmation === 'confirmed';
		return confirmedFake[`${row.student.id}:${itemId}`] ?? false;
	}

	function confirm(row: Row, itemId: string) {
		if (row.live) {
			const r = demo.feedback_resolutions.find((r) => r.feedback_item_id === itemId)!;
			r.confirmation = 'confirmed';
			r.confirmed_at = new Date().toISOString();
		} else {
			confirmedFake[`${row.student.id}:${itemId}`] = true;
		}
	}

	const pendingDeclines = (row: Row) =>
		row.comments.filter((c) => c.resolution?.action === 'declined' && !isConfirmed(row, c.item.id)).length;
	const confirmedCount = (row: Row) => row.comments.filter((c) => c.resolution && isConfirmed(row, c.item.id)).length;

	const noFirstDraft = $derived(rows.filter((r) => r.step <= 2));
	const declinesToCheck = $derived(rows.reduce((sum, r) => sum + pendingDeclines(r), 0));
	const stepDone = $derived(steps.map((s) => rows.filter((r) => r.step > s.n).length));

	let reminded = $state(false);
	let showExplain = $state(false);
	let selectedId: string | null = $state(null);
	const selected = $derived(rows.find((r) => r.student.id === selectedId) ?? null);

	function checkReasons() {
		const first = rows.find((r) => pendingDeclines(r) > 0);
		if (first) selectedId = first.student.id;
	}

	function todo(row: Row): { label: string; act?: () => void } {
		if (row.step <= 2) return { label: 'Remind' };
		if (pendingDeclines(row) > 0) return { label: 'Check reason', act: () => (selectedId = row.student.id) };
		if (done(row)) return { label: 'Done' };
		return { label: 'On track' };
	}

	const stepName = (row: Row) => (done(row) ? 'All done' : steps[row.step - 1].name);

	const aiShort = (level: number | null) =>
		level === null ? '—' : (AI_USES.find((u) => u.level === level)?.label.replace(/^I used AI to /, 'AI: ') ?? '—');

	const answered = (row: Row) => row.comments.filter((c) => c.resolution).length;

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
		<p class="small muted">{schoolClass.name} · {rows.length} students · {total} revision{total === 1 ? '' : 's'} (the last is the final)</p>
		<h1>{assignment.title}</h1>
	</div>
	<a class="btn btn-primary" href="/teacher/new">New assignment</a>
</div>

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
		<button class="btn btn-ghost btn-small" disabled={declinesToCheck === 0} onclick={checkReasons}>
			{declinesToCheck === 0 ? 'All checked' : 'Check reasons'}
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

<div class="layout" class:has-panel={selected}>
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
									<button class="name" onclick={() => (selectedId = row.student.id)}>{row.student.full_name}</button>
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
				{done(selected) ? `All ${steps.length} steps done` : `On step ${selected.step}: ${stepName(selected)}`}
			</p>

			{#if selected.live && firstSummary}
				<h3>First draft, summed up by AI</h3>
				<p class="small">“{firstSummary}”</p>
			{/if}

			<h3>Comments</h3>
			{#if answered(selected) === 0}
				<p class="small muted">No comments answered yet.</p>
			{:else}
				<ul class="items">
					{#each selected.comments as { item, round, resolution: r } (item.id)}
						<li>
							<p class="pen small-pen">{item.body}</p>
							<p class="small">
								{#if r}<span class="pill status {r.action}">{LABEL[r.action]}</span>{:else}<span class="pill">Not yet</span>{/if}
								<span class="muted">{total > 1 ? `${draftLabel(course.stages[round - 1], course.stages)} · ` : ''}{errorLabel(item.error_type_id)}</span>
							</p>
							{#if r}
								<div class="reason">
									<p>“{r.action === 'declined' ? r.decline_reason : r.changed_excerpt}”</p>
									{#if isConfirmed(selected, item.id)}
										<span class="pill pill-ok">{r.action === 'declined' ? 'You agreed' : 'Confirmed'}</span>
									{:else if r.action === 'declined'}
										<div class="reason-actions">
											<button class="btn btn-primary btn-small" onclick={() => confirm(selected, item.id)}>Agree</button>
											<button class="btn btn-ghost btn-small">Talk to student</button>
										</div>
									{:else}
										<button class="btn btn-ghost btn-small" onclick={() => confirm(selected, item.id)}>Confirm the change</button>
									{/if}
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}

			{#if selected.live && ownChanges.length}
				<h3>Changes they made on their own</h3>
				{#each ownChanges as d (d.stage.id)}
					<p class="small"><strong>{draftLabel(d.stage, course.stages)}</strong></p>
					<DraftChanges changes={d.changes} own="Their own change" onlyOwn />
				{/each}
			{/if}

			<h3>AI they declared</h3>
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
	{/if}
</div>

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
		grid-template-columns: minmax(0, 1fr) 22rem;
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
</style>
