<script lang="ts">
	// Hand-in form for one stage (#8, #9): the draft itself (written here or added as a file),
	// the AI-use declaration and a short summary. Creates the stage_submissions,
	// ai_use_declarations and draft_summaries rows. The prototype keeps only file names.
	import { AI_SCALE, AI_TOOLS, AI_USES, type IntakeSource, type Step } from '#lib/data.ts';
	import { demo, handIn, saveDocument, type StageSubmission } from '#lib/state.svelte.ts';

	let {
		step,
		sampleName,
		sampleText,
		onsubmit
	}: { step: Step; sampleName: string; sampleText: string; onsubmit: (ss: StageSubmission) => void } = $props();

	const MIN_WORDS = 40;
	const SOURCES: { value: IntakeSource; label: string }[] = [
		{ value: 'in_app', label: 'Write it here' },
		{ value: 'word_upload', label: 'Upload Word or PDF' },
		{ value: 'google_docs', label: 'Google Docs' }
	];

	// The form only shows before this stage is handed in, so it always starts empty.
	// The text box starts from the working document, so Draft 2 picks up where Draft 1 left off.
	let source: IntakeSource = $state('in_app');
	let text = $state(demo.document.content);
	let fileKey = $state('');
	let googleFileId = $state('');
	let level: number | null = $state(null);
	let tools: string[] = $state([]);
	let description = $state('');
	let summary = $state('');

	const words = $derived(text.trim().split(/\s+/).filter(Boolean).length);
	const fileName = $derived(fileKey.split('/').pop() ?? '');
	const hasWork = $derived(
		source === 'in_app' ? words >= MIN_WORDS : source === 'word_upload' ? !!fileKey : !!googleFileId
	);
	const overLimit = $derived(level !== null && level > step.ai_level);
	const aiReady = $derived(level === 0 || (level !== null && tools.length > 0 && description.trim().length > 3));
	const ready = $derived(hasWork && aiReady && summary.trim().length >= 15);

	const isFirst = $derived(step.stage?.kind === 'first_draft');
	const what = $derived(step.stage?.kind === 'final' ? 'final essay' : step.key === 'revise' ? 'Draft 2' : 'draft');

	function write(e: Event) {
		text = (e.currentTarget as HTMLTextAreaElement).value;
		saveDocument(text);
	}

	function useSample() {
		text = sampleText;
		saveDocument(text);
	}

	function pick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		if (input.files?.[0]) fileKey = 'uploads/' + input.files[0].name;
	}

	function submit() {
		if (!step.stage) return;
		const ss = handIn(step.stage, {
			source,
			content_text: source === 'in_app' ? text : null,
			file_key: source === 'word_upload' ? fileKey : null,
			google_file_id: source === 'google_docs' ? googleFileId : null,
			level_used: level ?? 0,
			tools_used: level ? tools : [],
			description: level ? description : '',
			summary
		});
		onsubmit(ss);
	}
</script>

<section class="card stack">
	<h2>1. Your {what}</h2>

	<div class="tabs" role="radiogroup" aria-label="How do you want to hand it in?">
		{#each SOURCES as s (s.value)}
			<button class="tab" role="radio" aria-checked={source === s.value} onclick={() => (source = s.value)}>
				{s.label}
			</button>
		{/each}
	</div>

	{#if source === 'in_app'}
		<textarea class="doc" rows="12" value={text} oninput={write} placeholder="Start writing. It saves as you type."
		></textarea>
		<div class="doc-foot small">
			<span class:muted={words < MIN_WORDS}>
				{words} words · {words < MIN_WORDS ? `write at least ${MIN_WORDS}` : 'saved'}
			</span>
			{#if text !== sampleText}
				<button class="link" onclick={useSample}>Demo: fill in a sample {what}</button>
			{/if}
		</div>
		<p class="muted small">Only your latest text is kept, plus a copy each time you hand in. Nothing records your typing.</p>
	{:else if source === 'word_upload'}
		{#if fileKey}
			<div class="file">
				<span class="icon" aria-hidden="true">DOC</span>
				<span class="file-name">{fileName}</span>
				<button class="btn btn-ghost btn-small" onclick={() => (fileKey = '')}>Change</button>
			</div>
		{:else}
			<label class="btn btn-ghost">
				Choose a Word or PDF file
				<input class="sr-only" type="file" accept=".docx,.doc,.pdf" onchange={pick} />
			</label>
			<button class="link small" onclick={() => (fileKey = 'uploads/' + sampleName + '.docx')}>
				No file handy? Use the sample file
			</button>
		{/if}
	{:else if googleFileId}
		<div class="file">
			<span class="icon" aria-hidden="true">DOC</span>
			<span class="file-name">{sampleName} (Google Doc)</span>
			<button class="btn btn-ghost btn-small" onclick={() => (googleFileId = '')}>Change</button>
		</div>
	{:else}
		<p class="muted small">MYRACLE only sees the one file you pick.</p>
		<button class="btn btn-ghost" onclick={() => (googleFileId = 'demo-google-file')}>Pick a file from Google Drive</button>
	{/if}
</section>

<section class="card stack">
	<h2>2. Did you use AI?</h2>
	<p class="small"><span class="pill pill-brand">Your teacher allows: {AI_SCALE[step.ai_level]}</span></p>

	<div class="stack choices" role="radiogroup">
		{#each AI_USES as option (option.level)}
			<label class="choice">
				<input type="radio" name="ai-{step.key}" value={option.level} bind:group={level} />
				<span>{option.label}</span>
			</label>
		{/each}
	</div>

	{#if level}
		<fieldset class="tools">
			<legend class="small"><strong>Which tools?</strong></legend>
			{#each AI_TOOLS as t (t)}
				<label class="tool">
					<input type="checkbox" value={t} bind:group={tools} />
					{t}
				</label>
			{/each}
		</fieldset>
		<label class="field">
			What did you use it for?
			<textarea bind:value={description} rows="3" placeholder="Example: I asked for counterarguments, then wrote my own reply."
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

<section class="card stack">
	<h2>3. Sum it up</h2>
	<label class="field">
		{isFirst ? 'What is your position, in one or two sentences?' : 'What did you change since your last draft?'}
		<textarea
			bind:value={summary}
			rows="3"
			placeholder={isFirst
				? 'Example: Baguio should keep jeepney routes but move terminals out of the market.'
				: 'Example: I stated my position in one sentence and used ¶2 of the article as evidence.'}
		></textarea>
	</label>
	<p class="muted small">Your teacher reads this first. It helps them see your thinking quickly.</p>
</section>

<button class="btn btn-primary btn-block" disabled={!ready} onclick={submit}>Hand in {what}</button>
{#if !ready}
	<p class="muted small center">Add your {what}, answer the AI question and sum it up to hand in.</p>
{/if}

<style>
	.tabs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.35rem;
	}
	.tab {
		min-height: 44px;
		padding: 0.4rem;
		border-radius: var(--radius-sm);
		border: 1.5px solid var(--line);
		background: var(--surface);
		font: inherit;
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--ink-2);
		cursor: pointer;
		transition: transform 160ms var(--ease);
	}
	.tab:active {
		transform: scale(0.97);
	}
	.tab[aria-checked='true'] {
		background: var(--brand-soft);
		border-color: var(--brand);
		color: var(--brand);
	}
	.doc {
		min-height: 14rem;
		line-height: 1.65;
	}
	.doc-foot {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-top: -0.5rem;
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
	.tools {
		border: 0;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem 0.9rem;
	}
	.tools legend {
		margin-bottom: 0.35rem;
	}
	.tool {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		cursor: pointer;
	}
	.tool input {
		width: 18px;
		height: 18px;
		accent-color: var(--brand);
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
