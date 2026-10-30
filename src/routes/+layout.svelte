<script lang="ts">
	import '@fontsource/atkinson-hyperlegible/400.css';
	import '@fontsource/atkinson-hyperlegible/700.css';
	import '@fontsource/caveat/600.css';
	import '../app.css';
	import { onMount } from 'svelte';
	import { course, demo, loadDemo, saveDemo } from '#lib/state.svelte.ts';

	let { children } = $props();
	let loaded = $state(false);

	onMount(() => {
		loadDemo();
		loaded = true;
	});

	// Save the demo and the teacher's setup whenever anything in them changes.
	$effect(() => {
		const demoJson = JSON.stringify(demo);
		const courseJson = JSON.stringify(course);
		if (loaded) saveDemo(demoJson, courseJson);
	});
</script>

{@render children()}
