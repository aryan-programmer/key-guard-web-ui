<script lang="ts" module>
	import { type AddToastProps, Toaster } from "melt/builders";
	type ToastData = {
		title: string;
		description?: string;
		variant: "success" | "warning" | "error" | "info";
	};

	const toaster = new Toaster<ToastData>({
		closeDelay: 0
	});

	export function addAlertoast(props: AddToastProps<ToastData>) {
		return toaster.addToast(props);
	}
</script>

<script lang="ts">
	import { X } from "@lucide/svelte";
	import { Progress } from "melt/components";
	import { fade, slide } from "svelte/transition";
</script>

{#if toaster.toasts.length > 0}
	<div
		class="fixed inset-0 z-50 bg-black/50"
		transition:fade={{
			duration: 150
		}}
	></div>
	<div
		class="toaster-group-root basic-element neob background-blank fixed top-1/2 left-1/2 z-50 max-h-[85vh] min-h-min w-[90vw] max-w-[450px] -translate-x-1/2 -translate-y-1/2 transition-all"
		transition:slide={{
			duration: 150,
			axis: "y"
		}}
		{...toaster.root}
		style:--toasts={toaster.toasts.length}
	>
		{#each toaster.toasts as toast, i (toast.id)}
			<div
				class="toast-holder"
				{...toast.content}
				style:--n={toaster.toasts.length - i}
				transition:slide={{ axis: "y" }}
			>
				<div
					class="toast"
					class:background-success={toast.data.variant === "success"}
					class:background-warning={toast.data.variant === "warning"}
					class:background-error={toast.data.variant === "error"}
					class:background-main={toast.data.variant === "info"}
				>
					<div class:mr-[30px]={toast.closeDelay !== 0}>
						<h3 {...toast.title} class="text-sm font-medium whitespace-nowrap">
							{toast.data.title}
						</h3>

						{#if toast.data.description}
							<div {...toast.description} class="text-xs text-gray-700">
								{toast.data.description}
							</div>
						{/if}
					</div>

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
											class="h-full w-full -translate-x-[var(--progress)]"
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
{/if}

<style lang="postcss">
	@reference "../app.css";

	.toaster-group-root {
		--gap: var(--spacing);
		--hover-offset: 1rem;
		--hidden-offset: 0.75rem;

		overflow-y: auto;
		gap: 0;
		padding: 0;

		@apply flex flex-col pt-2;
	}

	.toast {
		@apply basic-element neob relative mt-0;
		@apply w-full;
		@apply flex flex-col justify-center;
		@apply px-2 text-left transition-all;
	}

	.toast-holder {
		@apply flex flex-row items-stretch justify-stretch;
		@apply w-full;
		@apply transition-all duration-350;
	}
</style>
