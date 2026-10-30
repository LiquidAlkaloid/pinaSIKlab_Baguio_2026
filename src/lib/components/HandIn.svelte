<script lang="ts">
	// Hand-in form for a draft or the final essay: a file plus the AI-use declaration (#18, #9).
	// The prototype only keeps the file name. Real parsing of .docx comes later (JSZip).
	import { AI_LEVELS, AI_LEVEL_RANK, AI_USES, type AiUse, type Step } from '#lib/data.ts';
	import type { Submission } from '#lib/state.svelte.ts';

	let {
		step,
		sub,
		sampleName,
		onsubmit
	}: { step: Step; sub: Submission; sampleName: string; onsubmit: () => void } = $props();

	// The form only shows before anything is handed in, so it always starts empty.
	let ai: AiUse | null = $state(null);
	let aiNote = $state('');
	let file = $state('');

	const used = $derived(AI_USES.find((u) => u.value === ai));
	const overLimit = $derived(used ? used.level > AI_LEVEL_RANK[step.ai] : false);
	const ready = $derived(!!file && !!ai && (ai === 'none' || aiNote.trim().length > 3));

	function pick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (input.files?.[0]) file = input.files[0].name;
	}

	function submit() {
		sub.file = file;
		sub.ai = ai;
		sub.aiNote = ai === 'none' ? '' : aiNote;
		sub.at = Date.now();
		onsubmit();
	}
</script>

<section class="card stack">
	<h2>1. Add your file</h2>
	<p class="muted small">Write in Word or Google Docs like you always do, then add it here.</p>

	{#if file}
		<div class="file">
			<span class="icon" aria-hidden="true">DOC</span>
			<span class="file-name">{file}</span>
			<button class="btn btn-ghost btn-small" onclick={() => (file = '')}>Change</button>
		</div>
	{:else}
		<div class="pickers">
			<label class="btn btn-ghost">
				Upload Word or PDF
				<input class="sr-only" type="file" accept=".docx,.doc,.pdf" onchange={pick} />
			</label>
			<button class="btn btn-ghost" onclick={() => (file = sampleName + ' (Google Doc)')}>
				Import from Google Docs
			</button>
		</div>
		<button class="link small" onclick={() => (file = sampleName + '.docx')}>
			No file handy? Use the sample file
		</button>
	{/if}
</section>

<section class="card stack">
	<h2>2. Did you use AI?</h2>
	<p class="small"><span class="pill pill-brand">Your teacher allows: {AI_LEVELS[step.ai].label}</span></p>

	<div class="stack choices" role="radiogroup">
		{#each AI_USES as option (option.value)}
			<label class="choice">
				<input type="radio" name="ai-{step.key}" value={option.value} bind:group={ai} />
				<span>{option.label}</span>
			</label>
		{/each}
	</div>

	{#if ai && ai !== 'none'}
		<label class="field">
			Which tool, and what did you use it for?
			<textarea bind:value={aiNote} rows="3" placeholder="Example: I asked ChatGPT for counterarguments, then wrote my own reply."
			></textarea>
		</label>
		{#if overLimit}
			<p class="note small">
				That is more than your teacher allowed for this step. You can still hand it in. Being honest
				here is what counts, and your teacher will talk it through with you.
			</p>
		{/if}
	{/if}
</section>

<button class="btn btn-primary btn-block" disabled={!ready} onclick={submit}>
	Hand in {step.key === 'final' ? 'final essay' : 'draft'}
</button>
{#if !ready}
	<p class="muted small center">Add your file and answer the AI question to hand in.</p>
{/if}

<style>
	.pickers {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.pickers > * {
		flex: 1 1 12rem;
	}
	.file {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border: 1.5px dashed var(--brand-2);
		border-radius: var(--radius-sm);
		background: var(--brand-soft);
	}
	.icon {
		font-size: 0.7rem;
		font-weight: 700;
		color: #fff;
		background: var(--brand-2);
		border-radius: 6px;
		padding: 0.4rem 0.45rem;
	}
	.file-name {
		flex: 1;
		font-weight: 700;
		word-break: break-word;
	}
	.choices {
		gap: 0.5rem;
	}
	.link {
		background: none;
		border: 0;
		padding: 0;
		font: inherit;
		color: var(--brand-2);
		text-decoration: underline;
		cursor: pointer;
		align-self: flex-start;
	}
	.note {
		background: var(--gold-soft);
		border-radius: var(--radius-sm);
		padding: 0.6rem 0.75rem;
	}
	.center {
		text-align: center;
	}
</style>
