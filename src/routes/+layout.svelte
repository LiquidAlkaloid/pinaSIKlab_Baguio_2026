<script lang="ts">
	import '@fontsource/atkinson-hyperlegible/400.css';
	import '@fontsource/atkinson-hyperlegible/700.css';
	import '@fontsource/caveat/600.css';
	import '../app.css';
	import { onMount } from 'svelte';
	import { demo, loadDemo, saveDemo } from '#lib/state.svelte.ts';

	let { children } = $props();
	let loaded = $state(false);

	onMount(() => {
		loadDemo();
		loaded = true;
	});

	// Save the demo whenever anything in it changes.
	$effect(() => {
		const json = JSON.stringify(demo);
		if (loaded) saveDemo(json);
	});
</script>

{@render children()}
