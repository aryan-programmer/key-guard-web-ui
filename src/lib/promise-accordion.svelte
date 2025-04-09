<script lang="ts">
	import { ChevronDown } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { slide } from "svelte/transition";
	import { State } from "../lib/connection.svelte";

	let {
		state,
		children,
		alwaysVisibleChildren,
		...titles
	}: { state: State; children: Snippet; alwaysVisibleChildren?: Snippet } & {
		[title in `title-${State}`]: string;
	} = $props();

	let doneOrForbidden = $derived(state === State.Done || state === State.Forbidden);
</script>

<!-- {#snippet alwaysVisibleChildren()}
{/snippet} -->

<div class="accordion" class:focus={!doneOrForbidden} class:disabled={state === State.Forbidden}>
	<button
		class="accordion-button"
		class:background-warning={!doneOrForbidden && state !== State.Failed}
		class:background-success={state === State.Done}
		class:background-error={state === State.Failed}
		data-state={doneOrForbidden ? "closed" : "open"}
	>
		{titles[`title-${state}`]}
		<ChevronDown class="transition-all duration-200" />
	</button>

	{#if !doneOrForbidden}
		<div transition:slide={{ axis: "y" }}>
			{#if state === State.Pending}
				<div class="my-3 flex w-full flex-row items-center justify-center">
					<span class="loader"></span>
				</div>
			{/if}
			{#if alwaysVisibleChildren != null}
				{@render alwaysVisibleChildren()}
			{/if}
			{#if state !== State.Pending}
				{@render children()}
			{/if}
		</div>
	{/if}
</div>
