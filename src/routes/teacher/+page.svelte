<script lang="ts">
	// Educator Hub (#4): one screen per class. Cards ask questions; they never give verdicts.
	import { AI_USES, assignment, classmates, explainBack, student, type AiUse, type Answer } from '#lib/data.ts';
	import { downloadMatrix } from '#lib/export.ts';
	import { demo, stepNumber } from '#lib/state.svelte.ts';

	interface Row {
		name: string;
		step: number;
		answers: (Answer | null)[];
		ai: AiUse | null;
		late: boolean;
		keptReasons: string[];
		live: boolean;
	}

	// Teacher "agree" marks for the fake students. Bea's are saved in the demo state.
	let agreed: Record<string, boolean[]> = $state({});

	const rows: Row[] = $derived([
		{
			name: student.name,
			step: stepNumber(demo),
			answers: demo.answers.map((a) => a.status),
			ai: demo.final.ai ?? demo.draft.ai,
			late: false,
			keptReasons: demo.answers.filter((a) => a.status === 'kept').map((a) => a.reason),
			live: true
		},
		...classmates.map((c) => ({ ...c, late: !!c.late, keptReasons: c.keptReasons ?? [], live: false }))
	]);

	function isAgreed(row: Row, keptIndex: number) {
		if (row.live) {
			const keptAnswers = demo.answers.filter((a) => a.status === 'kept');
			return keptAnswers[keptIndex]?.teacherOk ?? false;
		}
		return agreed[row.name]?.[keptIndex] ?? false;
	}

	function agree(row: Row, keptIndex: number) {
		if (row.live) {
			const keptAnswers = demo.answers.filter((a) => a.status === 'kept');
			keptAnswers[keptIndex].teacherOk = true;
		} else {
			agreed[row.name] ??= [];
			agreed[row.name][keptIndex] = true;
		}
	}

	const unchecked = (row: Row) => row.keptReasons.filter((_, i) => !isAgreed(row, i)).length;

	const notStarted = $derived(rows.filter((r) => r.step === 1));
	const keptToCheck = $derived(rows.reduce((sum, r) => sum + unchecked(r), 0));
	const stepDone = $derived(assignment.steps.map((s) => rows.filter((r) => r.step > s.n).length));

	let reminded = $state(false);
	let showExplain = $state(false);
	let selectedName: string | null = $state(null);
	const selected = $derived(rows.find((r) => r.name === selectedName) ?? null);

	function checkReasons() {
		const first = rows.find((r) => unchecked(r) > 0);
		if (first) selectedName = first.name;
	}

	function todo(row: Row): { label: string; act?: () => void } {
		if (row.step === 1) return { label: 'Remind' };
		if (unchecked(row) > 0) return { label: 'Check reason', act: () => (selectedName = row.name) };
		if (row.step === 6) return { label: 'Done' };
		return { label: 'On track' };
	}

	const aiShort = (v: AiUse | null) =>
		v ? (AI_USES.find((u) => u.value === v)?.label.replace(/^I used AI to /, 'AI: ') ?? '—') : '—';

	function answered(row: Row) {
		return row.answers.filter(Boolean).length;
	}

	function exportFor(row: Row) {
		let keptIndex = 0;
		const matrix = assignment.feedback.map((item, i) => {
			const status = row.answers[i];
			const live = row.live ? demo.answers[i] : null;
			let action = 'Not answered yet';
			if (status === 'fixed') action = 'Fixed. ' + (live?.note || 'Revised as suggested.');
			if (status === 'partly') action = 'Partly fixed. ' + (live?.note || '');
			if (status === 'kept') action = 'Kept the same. Reason: ' + (row.keptReasons[keptIndex++] ?? '');
			return {
				n: item.n,
				comment: item.comment,
				action,
				where: '¶' + (live?.paragraph ?? item.paragraph)
			};
		});
		downloadMatrix(row.name, assignment.title, matrix);
	}

	const LABEL: Record<Answer, string> = { fixed: 'Fixed', partly: 'Partly', kept: 'Kept' };
</script>

<svelte:head><title>Teacher home · MYRACLE</title></svelte:head>

<div class="head">
	<div>
		<p class="small muted">{assignment.course} · {assignment.section} · {rows.length} students</p>
		<h1>{assignment.title}</h1>
	</div>
	<a class="btn btn-primary" href="/teacher/new">New assignment</a>
</div>

<h2 class="section-title">Needs you today</h2>
<div class="cards">
	<article class="card ask">
		<p class="q">
			<strong>{notStarted.length} students</strong> haven’t handed in their summary yet. Send a reminder?
		</p>
		<button class="btn btn-ghost btn-small" disabled={reminded} onclick={() => (reminded = true)}>
			{reminded ? 'Reminder sent' : 'Send reminder'}
		</button>
	</article>
	<article class="card ask">
		<p class="q">
			<strong>{keptToCheck} comments</strong> were kept the same, with a reason. Check the reasons?
		</p>
		<button class="btn btn-ghost btn-small" disabled={keptToCheck === 0} onclick={checkReasons}>
			{keptToCheck === 0 ? 'All checked' : 'Check reasons'}
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
				{#each assignment.steps as s, i (s.key)}
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
						{#each rows as row (row.name)}
							{@const t = todo(row)}
							<tr class:active={selectedName === row.name}>
								<td>
									<button class="name" onclick={() => (selectedName = row.name)}>{row.name}</button>
									{#if row.live}<span class="pill pill-brand live">live demo</span>{/if}
								</td>
								<td>
									{row.step > 5 ? 'All done' : assignment.steps[row.step - 1].name}
									{#if row.late}<span class="pill pill-gold">late</span>{/if}
								</td>
								<td>
									{#if row.step >= 3}
										<span class="answers">
											{#each row.answers as a, i (i)}<i class={a ?? 'none'} title={a ? LABEL[a] : 'Not yet'}></i>{/each}
										</span>
										{answered(row)} of {row.answers.length}
									{:else}<span class="muted">—</span>{/if}
								</td>
								<td class="small">{aiShort(row.ai)}</td>
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
		<aside class="card panel stack">
			<div class="panel-head">
				<h2>{selected.name}</h2>
				<button class="btn btn-ghost btn-small" onclick={() => (selectedName = null)} aria-label="Close">Close</button>
			</div>
			<p class="small muted">
				{selected.step > 5 ? 'All 5 steps done' : `On step ${selected.step}: ${assignment.steps[selected.step - 1].name}`}
			</p>

			<h3>Comments</h3>
			{#if selected.step < 3}
				<p class="small muted">No comments to answer yet.</p>
			{:else}
				<ul class="items">
					{#each assignment.feedback as item, i (item.n)}
						{@const a = selected.answers[i]}
						<li>
							<p class="pen small-pen">{item.comment}</p>
							<p class="small">
								{#if a}<span class="pill status {a}">{LABEL[a]}</span>{:else}<span class="pill">Not yet</span>{/if}
								<span class="muted">{item.tag}</span>
							</p>
						</li>
					{/each}
				</ul>
			{/if}

			{#if selected.keptReasons.length}
				<h3>Reasons for keeping</h3>
				{#each selected.keptReasons as reason, k (k)}
					<div class="reason">
						<p>“{reason}”</p>
						{#if isAgreed(selected, k)}
							<span class="pill pill-ok">You agreed</span>
						{:else}
							<div class="reason-actions">
								<button class="btn btn-primary btn-small" onclick={() => agree(selected, k)}>Agree</button>
								<button class="btn btn-ghost btn-small">Talk to student</button>
							</div>
						{/if}
					</div>
				{/each}
			{/if}

			<h3>AI they declared</h3>
			<p class="small">{aiShort(selected.ai)}</p>

			<button class="btn btn-ghost btn-block" disabled={selected.step < 3} onclick={() => exportFor(selected)}>
				Download revision matrix (Word)
			</button>
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
	.answers i.fixed {
		background: var(--ok);
	}
	.answers i.partly {
		background: var(--partly);
	}
	.answers i.kept {
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
	.status.fixed {
		background: var(--ok-soft);
		color: var(--ok);
	}
	.status.partly {
		background: var(--gold-soft);
		color: #8a5d00;
	}
	.status.kept {
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
