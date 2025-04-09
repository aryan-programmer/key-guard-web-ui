<script lang="ts">
	import { ChevronDown } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";

	let {
		children,
		buttonClass = "accordion-button background-main",
		title,
		open = $bindable(false),
		disabled = false
	}: {
		children: Snippet;
		buttonClass?: string;
		title: string;
		open?: boolean;
		disabled?: boolean;
	} = $props();
</script>

<div class="accordion" class:focus={open} class:disabled>
	<button
		class={buttonClass}
		{disabled}
		data-state={open ? "open" : "closed"}
		onclick={() => {
			if (!disabled) open = !open;
		}}
	>
		{title}
		<ChevronDown class="transition-all duration-200" />
	</button>

	{#if open}
		<div transition:slide={{ axis: "y" }}>
			{@render children()}
		</div>
	{/if}
</div>
