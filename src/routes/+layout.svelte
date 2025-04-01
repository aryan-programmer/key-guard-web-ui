<script lang="ts">
	import "../app.css";
	import Toaster from "../lib/toaster.svelte";

	let { children } = $props();
</script>

<Toaster />
<div class="mx-auto my-1 max-w-[750px]">
	{@render children()}
</div>
