<script lang="ts">
	// Assignment and stage builder (#1). Nothing is saved in the prototype.
	import { AI_LEVELS, assignment, type AiLevel } from '#lib/data.ts';

	type Band = 'jhs' | 'shs' | 'uni';

	interface DraftStep {
		id: number;
		name: string;
		goal: string;
		ai: AiLevel;
		due: string;
		timed: boolean;
		minutes: number;
	}

	const BANDS: Record<Band, { label: string; weight: number; steps: Omit<DraftStep, 'id'>[] }> = {
		jhs: {
			label: 'Junior high',
			weight: 20,
			steps: [
				{ name: 'Read and summarise', goal: 'Say what the text means in your own words.', ai: 'none', due: '2026-11-04', timed: true, minutes: 40 },
				{ name: 'Draft', goal: 'Ideas and one clear claim.', ai: 'none', due: '2026-11-07', timed: false, minutes: 60 },
				{ name: 'Final', goal: 'Clarity and correctness.', ai: 'edit', due: '2026-11-12', timed: false, minutes: 60 }
			]
		},
		shs: {
			label: 'Senior high',
			weight: 25,
			steps: [
				{ name: 'Read and summarise', goal: 'Understand the source before writing.', ai: 'none', due: '2026-11-03', timed: false, minutes: 60 },
				{ name: 'Draft 1', goal: 'Ideas and a clear position.', ai: 'ideas', due: '2026-11-06', timed: true, minutes: 60 },
				{ name: 'Revision', goal: 'Structure and evidence.', ai: 'edit', due: '2026-11-10', timed: false, minutes: 60 },
				{ name: 'Final', goal: 'Clarity and correctness.', ai: 'edit', due: '2026-11-13', timed: false, minutes: 60 }
			]
		},
		uni: {
			label: 'University',
			weight: 25,
			steps: assignment.steps
				.filter((s) => s.key !== 'reflect')
				.map((s) => ({ name: s.name, goal: s.goal, ai: s.ai, due: s.due, timed: false, minutes: 60 }))
		}
	};

	let nextId = 0;
	const withIds = (steps: Omit<DraftStep, 'id'>[]) => steps.map((s) => ({ ...s, id: nextId++ }));

	let band: Band = $state('uni');
	let title = $state(assignment.title);
	let sourceTitle = $state(assignment.source.title);
	let sourceText = $state(assignment.source.paragraphs.join('\n\n'));
	let steps: DraftStep[] = $state(withIds(BANDS.uni.steps));
	let weight = $state(BANDS.uni.weight);
	let mirror = $state(true);
	let given = $state(false);

	function pickBand(b: Band) {
		band = b;
		steps = withIds(BANDS[b].steps);
		weight = BANDS[b].weight;
	}

	function addStep() {
		steps.push({ id: nextId++, name: 'New step', goal: '', ai: 'none', due: '', timed: false, minutes: 60 });
	}

	function removeStep(id: number) {
		steps = steps.filter((s) => s.id !== id);
	}

	const ready = $derived(title.trim() && sourceText.trim() && steps.length > 0);
</script>

<svelte:head><title>New assignment · MYRACLE</title></svelte:head>

<div class="wrap stack">
	<div>
		<p class="small muted">{assignment.course} · {assignment.section}</p>
		<h1>New assignment</h1>
	</div>

	<section class="card stack">
		<p class="small muted">Who is this for? This fills in sensible steps you can change.</p>
		<div class="bands" role="radiogroup" aria-label="Class level">
			{#each Object.entries(BANDS) as [key, b] (key)}
				<button class="band" role="radio" aria-checked={band === key} onclick={() => pickBand(key as Band)}>
					{b.label}
				</button>
			{/each}
		</div>
		<label class="field">
			Assignment title
			<input type="text" bind:value={title} />
		</label>
	</section>

	<section class="card stack">
		<h2><span class="q">1</span> What will students read?</h2>
		<p class="muted small">Every assignment starts from a text. Students sum it up before they write.</p>
		<label class="field">
			Title of the text
			<input type="text" bind:value={sourceTitle} />
		</label>
		<label class="field">
			Paste the text <span class="muted small">(or upload a file)</span>
			<textarea rows="6" bind:value={sourceText}></textarea>
		</label>
		{#if band === 'jhs'}
			<p class="tip small">Tip: pick a short text the class can almost read on its own. A text that is too hard pushes students back to chatbots.</p>
		{/if}
	</section>

	<section class="card stack">
		<h2><span class="q">2</span> What steps will they go through?</h2>
		<p class="muted small">Give each step a one-line goal so students know what to work on. A “See how you did” step is added at the end automatically.</p>

		<ol class="steps">
			{#each steps as s, i (s.id)}
				<li class="step">
					<div class="step-top">
						<span class="num">{i + 1}</span>
						<input class="step-name" type="text" bind:value={s.name} aria-label="Step {i + 1} name" />
						<button class="btn btn-ghost btn-small" onclick={() => removeStep(s.id)} disabled={steps.length === 1}>Remove</button>
					</div>
					<div class="step-grid">
						<label class="field goal-field">
							One-line goal
							<input type="text" bind:value={s.goal} placeholder="Example: structure and evidence" />
						</label>
						<label class="field">
							AI allowed
							<select bind:value={s.ai}>
								{#each Object.entries(AI_LEVELS) as [k, v] (k)}<option value={k}>{v.label}</option>{/each}
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
		<button class="btn btn-ghost" onclick={addStep}>Add a step</button>
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
			<span class="pill pill-ok">Given to {assignment.section}</span>
			<p><strong>{title}</strong> is now on every student’s home screen with {steps.length + 1} steps.</p>
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
	.bands {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.band {
		flex: 1 1 8rem;
		min-height: 44px;
		border-radius: 999px;
		border: 1.5px solid var(--line);
		background: var(--surface);
		font: inherit;
		font-weight: 700;
		color: var(--ink-2);
		cursor: pointer;
		transition: transform 160ms var(--ease);
	}
	.band:active {
		transform: scale(0.97);
	}
	.band[aria-checked='true'] {
		background: var(--brand);
		border-color: var(--brand);
		color: #fff;
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
	.tip {
		background: var(--gold-soft);
		border-radius: var(--radius-sm);
		padding: 0.6rem 0.75rem;
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
