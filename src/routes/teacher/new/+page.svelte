<script lang="ts">
	// Assignment and stage builder (#1). Nothing is saved in the prototype.
	// Follows the schema's rules: one first draft, at least one revision, one final,
	// and a process share of 0 to 30 percent (this screen offers 20 to 30).
	import { AI_SCALE, assignment, schoolClass, sourceParagraphs, sourceText, stages, type StageKind } from '#lib/data.ts';

	interface DraftStage {
		id: number;
		kind: StageKind;
		goal: string;
		ai_level: number;
		/** yyyy-mm-dd for the date input; saved as stages.due_at. */
		due: string;
		/** Not in the schema yet: see README "Gaps". */
		timed: boolean;
		minutes: number;
	}

	let nextId = 0;
	let title = $state(assignment.title);
	let withSource = $state(true);
	let sourceTitle = $state(sourceText.title);
	let sourceBody = $state(sourceParagraphs.map((p) => p.body).join('\n\n'));
	let list: DraftStage[] = $state(
		stages.map((s) => ({
			id: nextId++,
			kind: s.kind,
			goal: s.goal ?? '',
			ai_level: s.ai_level,
			due: s.due_at?.slice(0, 10) ?? '',
			timed: false,
			minutes: 60
		}))
	);
	let weight = $state(assignment.process_weight_pct);
	let mirror = $state(true);
	let given = $state(false);

	const revisions = $derived(list.filter((s) => s.kind === 'revision'));

	function stageName(s: DraftStage) {
		if (s.kind === 'first_draft') return 'First draft';
		if (s.kind === 'final') return 'Final';
		return revisions.length > 1 ? `Revision ${revisions.indexOf(s) + 1}` : 'Revision';
	}

	function addRevision() {
		list.splice(list.length - 1, 0, {
			id: nextId++,
			kind: 'revision',
			goal: '',
			ai_level: 0,
			due: '',
			timed: false,
			minutes: 60
		});
	}

	function removeStage(id: number) {
		list = list.filter((s) => s.id !== id);
	}

	const ready = $derived(title.trim() && (!withSource || sourceBody.trim()) && revisions.length > 0);
	const studentSteps = $derived(list.length + (withSource ? 1 : 0) + 1);
</script>

<svelte:head><title>New assignment · MYRACLE</title></svelte:head>

<div class="wrap stack">
	<div>
		<p class="small muted">{schoolClass.name}</p>
		<h1>New assignment</h1>
	</div>

	<section class="card stack">
		<label class="field">
			Assignment title
			<input type="text" bind:value={title} />
		</label>
	</section>

	<section class="card stack">
		<h2><span class="q">1</span> What will students read?</h2>
		<label class="toggle">
			<input type="checkbox" bind:checked={withSource} />
			<span>Students read a text and sum it up before they write</span>
		</label>
		{#if withSource}
			<label class="field">
				Title of the text
				<input type="text" bind:value={sourceTitle} />
			</label>
			<label class="field">
				Paste the text <span class="muted small">(or upload a file)</span>
				<textarea rows="6" bind:value={sourceBody}></textarea>
			</label>
			<p class="muted small">Each paragraph gets a number (¶) so students can cite it.</p>
		{/if}
	</section>

	<section class="card stack">
		<h2><span class="q">2</span> What drafts will they hand in?</h2>
		<p class="muted small">
			A first draft, at least one revision, and a final. Give each a one-line goal so students know
			what to work on. A “See how you did” step is added at the end automatically.
		</p>

		<ol class="steps">
			{#each list as s, i (s.id)}
				<li class="step">
					<div class="step-top">
						<span class="num">{i + 1}</span>
						<span class="step-name">{stageName(s)}</span>
						{#if s.kind === 'revision'}
							<button class="btn btn-ghost btn-small" onclick={() => removeStage(s.id)} disabled={revisions.length === 1}
								>Remove</button
							>
						{/if}
					</div>
					<div class="step-grid">
						<label class="field goal-field">
							One-line goal
							<input type="text" bind:value={s.goal} placeholder="Example: structure and evidence" />
						</label>
						<label class="field">
							AI allowed
							<select bind:value={s.ai_level}>
								{#each AI_SCALE as label, level (level)}<option value={level}>{label}</option>{/each}
							</select>
						</label>
						<label class="field">
							Due
							<input type="date" bind:value={s.due} />
						</label>
					</div>
					<div class="timed">
						<label class="toggle">
							<input type="checkbox" bind:checked={s.timed} />
							<span>Timed, in class</span>
						</label>
						{#if s.timed}
							<label class="minutes small">
								<input type="number" min="10" max="180" step="5" bind:value={s.minutes} /> minutes
							</label>
							<span class="small muted">Written in one sitting. Useful as a first draft you can compare later revisions against.</span>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
		<button class="btn btn-ghost" onclick={addRevision}>Add another revision</button>
	</section>

	<section class="card stack">
		<h2><span class="q">3</span> How is it graded?</h2>
		<label class="field">
			How much of the grade is about how they worked?
			<input type="range" min="20" max="30" step="1" bind:value={weight} />
		</label>
		<div class="split" aria-hidden="true">
			<span class="essay" style="flex: {100 - weight}">Final essay {100 - weight}%</span>
			<span class="process" style="flex: {weight}">How they worked {weight}%</span>
		</div>
		<p class="small muted">
			“How they worked” is graded on how each comment was answered, never on word counts or time spent.
		</p>
		<label class="toggle">
			<input type="checkbox" bind:checked={mirror} />
			<span>After grading, students see the same process report I see</span>
		</label>
	</section>

	{#if given}
		<div class="card done stack">
			<span class="pill pill-ok">Given to {schoolClass.name}</span>
			<p><strong>{title}</strong> is now on every student’s home screen with {studentSteps} steps.</p>
			<a class="btn btn-ghost" href="/teacher">Back to teacher home</a>
		</div>
	{:else}
		<button class="btn btn-primary btn-block" disabled={!ready} onclick={() => (given = true)}>Give to class</button>
	{/if}
</div>

<style>
	.wrap {
		max-width: 48rem;
		margin: 0 auto;
		gap: 1.25rem;
	}
	.q {
		display: inline-grid;
		place-items: center;
		width: 28px;
		height: 28px;
		margin-right: 0.4rem;
		border-radius: 50%;
		background: var(--gold-soft);
		color: #8a5d00;
		font-size: 0.9rem;
		vertical-align: 2px;
	}
	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.step {
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		background: #fcfbf8;
	}
	.step-top {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}
	.num {
		display: grid;
		place-items: center;
		flex: none;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--brand);
		color: #fff;
		font-weight: 700;
		font-size: 0.85rem;
	}
	.step-name {
		flex: 1;
		font-weight: 700;
	}
	.step-grid {
		display: grid;
		grid-template-columns: 2fr 1.3fr 1fr;
		gap: 0.6rem;
	}
	@media (max-width: 640px) {
		.step-grid {
			grid-template-columns: 1fr;
		}
	}
	.step-grid .field {
		font-size: 0.85rem;
	}
	.timed {
		display: flex;
		align-items: center;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
	}
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 700;
		cursor: pointer;
	}
	.toggle input {
		width: 18px;
		height: 18px;
		accent-color: var(--brand);
	}
	.minutes {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.minutes input {
		width: 5rem;
		padding: 0.35rem 0.5rem;
	}
	input[type='range'] {
		accent-color: var(--brand);
		padding: 0;
		border: 0;
		box-shadow: none;
	}
	.split {
		display: flex;
		gap: 3px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		font-size: 0.85rem;
		font-weight: 700;
	}
	.split span {
		padding: 0.55rem 0.75rem;
		white-space: nowrap;
		transition: flex 200ms var(--ease);
	}
	.essay {
		background: var(--brand-soft);
		color: var(--brand);
	}
	.process {
		background: var(--gold-soft);
		color: #8a5d00;
	}
	.done {
		align-items: flex-start;
	}
</style>
