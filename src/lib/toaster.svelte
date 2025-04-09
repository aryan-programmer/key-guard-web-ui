<script lang="ts" module>
	import { type AddToastProps, Toaster } from "melt/builders";
	type ToastData = {
		title: string;
		description?: string;
		variant: "success" | "warning" | "error" | "info";
	};

	const toaster = new Toaster<ToastData>({
		closeDelay: 3000,
		hover: "pause-all"
	});

	export function addToast(props: AddToastProps<ToastData>) {
		return toaster.addToast(props);
	}
</script>

<script lang="ts">
	import { X } from "@lucide/svelte";
	import { Progress } from "melt/components";
	import { fly } from "svelte/transition";
</script>

<div
	{...toaster.root}
	class="toaster-group-root fixed inset-[unset] !right-0 !bottom-0 w-[500px]"
	style:--toasts={toaster.toasts.length}
>
	{#each toaster.toasts as toast, i (toast.id)}
		<div
			class="toast-holder"
			{...toast.content}
			style:--n={toaster.toasts.length - i}
			in:fly={{ y: 60, opacity: 0.9 }}
			out:fly={{ y: 20 }}
		>
			<div
				class="toast"
				class:background-success={toast.data.variant === "success"}
				class:background-warning={toast.data.variant === "warning"}
				class:background-error={toast.data.variant === "error"}
				class:background-main={toast.data.variant === "info"}
			>
				<h3 {...toast.title} class="text-sm font-medium whitespace-nowrap">
					{toast.data.title}
				</h3>

				{#if toast.data.description}
					<div {...toast.description} class="text-xs text-gray-800">
						{toast.data.description}
					</div>
				{/if}

				<button
					{...toast.close}
					aria-label="dismiss toast"
					class="absolute top-1 right-1 bg-transparent text-gray-600 hover:text-gray-900"
				>
					<X class="h-3.5 w-3.5" />
				</button>

				{#if toast.closeDelay !== 0}
					<div class="rounded-base absolute right-4 bottom-4 h-[4px] w-[30px] overflow-hidden">
						<Progress value={toast.percentage}>
							{#snippet children(progress)}
								<div
									{...progress.root}
									class="rounded-base relative h-full w-full overflow-hidden bg-gray-200 dark:bg-gray-950"
								>
									<div
										{...progress.progress}
										class="h-full w-full -translate-x-[var(--progress)] bg-purple-600"
									></div>
								</div>
							{/snippet}
						</Progress>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style lang="postcss">
	@reference "../app.css";

	.toaster-group-root {
		--gap: var(--spacing);
		--hover-offset: 1rem;
		--toast-height: 4rem;
		--hidden-offset: 0.75rem;

		--hidden-toasts: calc(var(--toasts) - 1);

		overflow: visible;
		display: grid;
		grid-template-rows: var(--toast-height) repeat(var(--hidden-toasts), var(--hidden-offset));
		grid-template-columns: 1fr;
		gap: 0;
		background: unset;
		padding: 0;
	}

	.toaster-group-root:hover {
		grid-template-rows: var(--hidden-offset) var(--toast-height) repeat(
				var(--hidden-toasts),
				calc(var(--toast-height) + var(--gap))
			);
	}

	.toast {
		@apply basic-element neob relative;
		@apply w-full;
		@apply flex flex-col justify-center;
		@apply px-2 text-left transition-all;
	}

	.toast-holder {
		@apply flex flex-row items-stretch justify-stretch;
		@apply h-[var(--toast-height)] w-full;
		@apply transition-all duration-350;

		position: absolute;
		pointer-events: auto;
		bottom: 0;
		left: 0;

		transform-origin: 50% 0%;
	}

	.toast-holder:nth-last-child(n + 4) {
		z-index: 1;
		scale: 0.925;
		opacity: 0;
		translate: 0 calc(-3 * var(--hidden-offset));
	}

	.toast-holder:nth-last-child(-n + 3) {
		z-index: 2;
		scale: 0.95;
		translate: 0 calc(-2 * var(--hidden-offset));
	}

	.toast-holder:nth-last-child(-n + 2) {
		z-index: 3;
		scale: 0.975;
		translate: 0 calc(-1 * var(--hidden-offset));
	}

	.toast-holder:nth-last-child(-n + 1) {
		z-index: 4;
		scale: 1;
		translate: 0;
	}

	.toaster-group-root:hover .toast-holder {
		scale: 1;
		opacity: 1;
		--toast-gap: calc(calc(var(--gap) * var(--n)) + var(--hover-offset));
		--percentage: calc(-100% * calc(var(--n) - 1));
		translate: 0 calc(var(--percentage) - var(--toast-gap));
	}
</style>
