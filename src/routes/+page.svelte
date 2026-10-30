<script lang="ts">
	import Logo from '#lib/components/Logo.svelte';
</script>

<svelte:head><title>Sign in · MYRACLE</title></svelte:head>

<main>
	<div class="panel stack">
		<Logo size={48} tagline />
		<div class="stack intro">
			<h1>Read first. Act on feedback. See how you work.</h1>
			<p class="muted">
				MYRACLE grades your essay and the steps you took to write it.
			</p>
		</div>

		<div class="stack buttons">
			<a class="btn btn-primary btn-block" href="/student">
				<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
					<path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
					<path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
					<path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
					<path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
				</svg>
				Continue as student
			</a>
			<a class="btn btn-ghost btn-block" href="/teacher">Continue as teacher</a>
		</div>

		<p class="muted small fine">Prototype for PSC XI. All names and essays are sample data.</p>
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 1.5rem 1rem;
	}
	.panel {
		width: 100%;
		max-width: 26rem;
		gap: 2rem;
	}
	.intro {
		gap: 0.6rem;
	}
	h1 {
		font-size: 1.9rem;
	}
	.buttons {
		gap: 0.75rem;
	}
	.fine {
		text-align: center;
	}
</style>
