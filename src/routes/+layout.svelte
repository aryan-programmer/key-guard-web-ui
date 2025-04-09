<script lang="ts">
	import "../app.css";
	import Alertoast from "../lib/alertoast.svelte";
	import Toaster from "../lib/toaster.svelte";

	let { children } = $props();
</script>

<Alertoast />
<Toaster />
<div class="mx-auto my-1 max-w-[750px]">
	{@render children()}
</div>
