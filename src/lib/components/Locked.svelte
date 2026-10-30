<script lang="ts">
	let { what, href }: { what: string; href: string } = $props();
</script>

<div class="card locked stack">
	<h2>Not yet</h2>
	<p class="muted">{what}</p>
	<a class="btn btn-primary" {href}>Go there</a>
</div>

<style>
	.locked {
		text-align: center;
		align-items: center;
	}
</style>
