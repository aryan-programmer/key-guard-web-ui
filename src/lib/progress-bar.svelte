<script lang="ts" module>
	export class ProgressBarState {
		fraction = $state(0);
		//done = $state(false);
		started = $state(false);

		reset() {
			this.fraction = 0;
			//this.done = false;
			this.started = false;
		}

		countUp(totalTimeMs: number): Promise<boolean> {
			return new Promise((resolve, reject) => {
				if (this.started) {
					reject(new Error("Another progress bar is already running on this object"));
				}
				this.fraction = 0;
				//this.done = false;
				this.started = true;
				let start: number | undefined;
				const step = (timestamp: DOMHighResTimeStamp) => {
					if (!this.started) {
						this.fraction = 0;
						//this.done = false;
						resolve(false);
						return;
					}
					if (start === undefined) {
						start = timestamp;
					}
					const elapsed = timestamp - start;

					this.fraction = elapsed / totalTimeMs;

					if (elapsed < totalTimeMs) {
						window.requestAnimationFrame(step);
					} else {
						this.started = false;
						//this.done = true;
						this.fraction = 1;
						resolve(true);
					}
				};

				window.requestAnimationFrame(step);
			});
		}

		cancel() {
			this.started = false;
		}
	}
</script>

<script lang="ts">
	import { type Snippet } from "svelte";

	import { slide } from "svelte/transition";

	let {
		progressBar,
		total,
		text,
		backgroundClass = "background-main"
	}: {
		progressBar: ProgressBarState;
		backgroundClass?: string;
		total: number;
		text?(v: {
			total: number;
			fraction: number;
			remaining: number;
			progress: number;
		}): ReturnType<Snippet>;
	} = $props();

	let progress = $derived(progressBar.fraction * total);
</script>

<!-- {#snippet text(v: {total: number, fraction: number, progress: number})}
{/snippet} -->

{#if progressBar.started}
	<div transition:slide={{ axis: "y" }} class="flex w-full flex-col items-stretch">
		<div class="basic-element neob background-blank min-h-4 text-center">
			<div class="relative w-full">
				<div
					class={`${backgroundClass} absolute top-0 bottom-0 left-0 h-full`}
					style:width={`${100 - progressBar.fraction * 100}%`}
				></div>
				<div class="relative z-10">
					{#if text != null}
						{@render text({
							total,
							fraction: progressBar.fraction,
							remaining: total - progress,
							progress
						})}
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
