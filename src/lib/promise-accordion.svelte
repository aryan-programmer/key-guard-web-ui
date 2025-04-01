<script lang="ts">
	import { ChevronDown } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { State } from "../lib/connection.svelte";

	let {
		state,
		children,
		...titles
	}: { state: State; children: Snippet } & { [title in `title-${State}`]: string } = $props();

	let doneOrForbidden = $derived(state === State.Done || state === State.Forbidden);
</script>

<div class="accordion" class:focus={!doneOrForbidden} class:disabled={state === State.Forbidden}>
	<button
		class="accordion-button"
		class:background-main={state !== State.Failed}
		class:background-error={state === State.Failed}
		data-state={doneOrForbidden ? "closed" : "open"}
	>
		{titles[`title-${state}`]}
		<ChevronDown class="transition-all duration-200" />
	</button>

	{#if !doneOrForbidden}
		{#if state === State.Pending}
			<div class="flex w-full flex-row items-center justify-center">
				<span class="loader"></span>
			</div>
		{/if}
		{@render children()}
	{/if}
</div>

<style lang="postcss">
	@reference "../app.css";

	.accordion {
		@apply basic-element neob-reverse-focus transition-all;
	}

	.accordion-button {
		@apply flex flex-row justify-between;
		@apply border-border w-full p-2;
		@apply text-left;
		@apply transition-all;
		@apply data-[state=open]:border-b-2 [&[data-state=open]>svg]:rotate-180;
	}

	.loader {
		border: 24px solid #fff;
		border-bottom-color: var(--main);
		border-radius: 50%;
		display: inline-block;
		position: relative;
		box-sizing: border-box;
		animation: rotation 1s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
