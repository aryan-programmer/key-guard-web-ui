<script lang="ts">
	import { slide } from "svelte/transition";
	import { Connection, keySlotSelectionMaxTimeMs } from "../lib/connection.svelte";
	import LoginForm from "../lib/login-form.svelte";
	import PromiseAccordion from "../lib/promise-accordion.svelte";
	import { addToast } from "../lib/toaster.svelte";

	let url: string = $state("ws://localhost:8765");
	let isValidUrl = $derived.by(() => {
		const urlParsed = URL.parse(url);
		if (urlParsed == null) return false;
		return urlParsed.protocol === "ws:";
	});
	let connection = new Connection();

	async function connectToSocket() {
		if (!isValidUrl) return;
		await connection.connect(url);
	}

	function onSubmit({ username, password }: { username: string; password: string }) {
		connection.login(username, password);
	}

	$effect(() => {
		function keySlotSelectionTimeout() {
			addToast({
				data: {
					title: "Key slot selection timed out",
					description: "You waited for too long. Please login again.",
					variant: "warning"
				},
				type: "assertive",
				closeDelay: 5000
			});
		}
		function keySlotTransactionDone() {
			addToast({
				data: {
					title: "Key slot transaction successfully completed",
					description: "To perform another tranaction please login again.",
					variant: "success"
				},
				type: "assertive",
				closeDelay: 3000
			});
		}
		function keySlotTransactionFailed(reason?: string) {
			addToast({
				data: {
					title: "Key slot transaction failed",
					description: reason ?? "Unknown error",
					variant: "error"
				},
				type: "assertive",
				closeDelay: 3000
			});
		}
		connection.on("keySlotSelectionTimeout", keySlotSelectionTimeout);
		connection.on("keySlotTransactionDone", keySlotTransactionDone);
		connection.on("keySlotTransactionFailed", keySlotTransactionFailed);
		return () => {
			connection.off("keySlotSelectionTimeout", keySlotSelectionTimeout);
			connection.off("keySlotTransactionDone", keySlotTransactionDone);
			connection.off("keySlotTransactionFailed", keySlotTransactionFailed);
		};
	});
</script>

<PromiseAccordion
	state={connection.connectionState}
	title-forbidden="SHOULD NOT SHOW UP"
	title-not-started="Connect to KeyGuard system"
	title-pending="Connecting to KeyGuard system..."
	title-failed="Failed to connected to KeyGuard system, try again"
	title-done="Connected to KeyGuard system successfully"
>
	<div
		class="background-blank flex flex-row overflow-hidden p-2"
		transition:slide={{ duration: 250 }}
	>
		<input class="input neob-focus" type="url" bind:value={url} />
		<button
			class="button neob-hover button-size-default background-main"
			onclick={connectToSocket}
			disabled={!isValidUrl}>Connect</button
		>
	</div>
</PromiseAccordion>

<PromiseAccordion
	state={connection.loginState}
	title-forbidden="Login"
	title-not-started="Login"
	title-pending="Logging in..."
	title-failed="Failed to login, try again"
	title-done={`Logged in successfully, Welcome ${connection.loggedInDisplayName}`}
>
	<LoginForm {onSubmit} />
</PromiseAccordion>

<PromiseAccordion
	state={connection.keySlotSelectionState}
	title-forbidden="Select key slot"
	title-not-started="Select key slot"
	title-pending="Unlocking selected key slot..."
	title-failed="Failed to unlock selected key slot: try again"
	title-done="Unlocked key slot successfully"
>
	<div class="gap-neob m-with-shadow grid grid-flow-row grid-cols-2">
		<div class="basic-element neob background-blank col-span-2 m-0 min-h-4 w-full">
			<div
				class="background-main h-full text-center"
				style:width={`${100 - connection.keySlotSelectionRemainingTimeProgressBar.fraction * 100}%`}
			>
				{Math.floor(
					(keySlotSelectionMaxTimeMs -
						connection.keySlotSelectionRemainingTimeProgressBar.fraction *
							keySlotSelectionMaxTimeMs) /
						1000
				)}s
			</div>
		</div>
		{#each connection.keySlots as keySlot (keySlot.slotId)}
			<button
				onclick={() => {
					connection.unlockKeySlot(keySlot);
				}}
				class="basic-element neob-reverse-hover background-blank m-0 text-center"
				disabled={keySlot.accessDenied ?? false}
			>
				{keySlot.slotName}<br />
				{#if keySlot.accessDenied === true}
					ACCESS DENIED
				{:else if keySlot.keyName != null}
					Remove key {keySlot.keyName}
				{:else}
					Insert key
				{/if}
			</button>
		{/each}
	</div>
</PromiseAccordion>
