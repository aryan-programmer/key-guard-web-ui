<script lang="ts">
	import Collapsible from "../lib/collapsible.svelte";
	import {
		Connection,
		keySlotPostSelectionPrepTimeMs,
		keySlotSelectionMaxTimeMs,
		RELOCK_KEY_TIMEOUT_S,
		SOLENOID_LOCK_WAIT_TIME_S
	} from "../lib/connection.svelte";
	import { localStore } from "../lib/local-store.svelte";
	import LoginForm from "../lib/login-form.svelte";
	import ProgressBar from "../lib/progress-bar.svelte";
	import PromiseAccordion from "../lib/promise-accordion.svelte";

	const defaultUrl = "wss://raspberrypi.local:2000";
	const url = localStore("ws-url", defaultUrl);
	let isValidUrl = $derived.by(() => {
		const urlParsed = URL.parse(url.value);
		if (urlParsed == null) return false;
		return urlParsed.protocol === "ws:" || urlParsed.protocol === "wss:";
	});
	let connection = new Connection();

	async function connectToSocket() {
		if (!isValidUrl) return;
		await connection.connect(url.value);
	}

	function onSubmit({ username, password }: { username: string; password: string }) {
		connection.login(username, password);
	}
</script>

<svelte:head>
	<title>KeyGuard Web UI</title>
</svelte:head>

<Collapsible title="Instructions">
	<div class="background-blank p-2">
		<ol class="list-outside list-decimal pl-4">
			<li>
				<b>Connect to the KeyGuard system server</b>: Specify the URL of the WebSocket server and
				click connect. This is usually done by the administrator once during start up.
			</li>
			<li>
				<b>Login</b>: Login by presenting your card to the reader with, or with your username and
				password.
			</li>
			<li>
				<b>Select key slot</b>:
				<ul class="list-outside list-disc pl-4">
					<li>
						Select the key to check out, or key slot to place a key into. Any key slot containing a
						key you are not authorized for will be disabled and grayed out.
					</li>
					<li>
						You will have {(keySlotSelectionMaxTimeMs / 1000).toFixed(0)} seconds to select a key slot
						to unlock.
					</li>
					<li>
						After you click the button to select a key slot to unlock, the system will be sent the
						command to unlock after {(keySlotPostSelectionPrepTimeMs / 1000).toFixed(0)} seconds to provide
						some buffer time.
					</li>
					<li>
						Once the key slot unlocks:
						<ul class="list-outside list-disc pl-4">
							<li>
								It will stay unlocked for {RELOCK_KEY_TIMEOUT_S} seconds if you are removing a key.
							</li>
							<li>
								If you are placing a key, then it will automatically lock {SOLENOID_LOCK_WAIT_TIME_S}
								seconds after it detects the key. If you do not place a key, it will lock automatically
								after {RELOCK_KEY_TIMEOUT_S} seconds from when it was unlocked.
							</li>
							<li>
								If you fail to perform your task before it times out, you will have to start a new
								transaction from the login process.
							</li>
						</ul>
					</li>
				</ul>
			</li>
		</ol>
	</div>
</Collapsible>

<PromiseAccordion
	state={connection.connectionState}
	title-forbidden="SHOULD NOT SHOW UP"
	title-not-started="Connect to KeyGuard system"
	title-pending="Connecting to KeyGuard system..."
	title-failed="Failed to connected to KeyGuard system, try again"
	title-done="Connected to KeyGuard system successfully"
>
	<div class="background-blank flex flex-row overflow-hidden p-2">
		<input class="input neob-focus" type="url" bind:value={url.value} />
		<button
			class="button neob-hover button-size-default background-success"
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
	{#snippet alwaysVisibleChildren()}
		<ProgressBar
			progressBar={connection.keySlotSelectionRemainingTimeProgressBar}
			backgroundClass="background-main"
			total={keySlotSelectionMaxTimeMs / 1000}
		>
			{#snippet text({ remaining })}
				Selection Time Remaining: {Math.floor(remaining)}s
			{/snippet}
		</ProgressBar>
		<ProgressBar
			progressBar={connection.keySlotPostSelectionBufferTimeProgressBar}
			backgroundClass="background-warning"
			total={keySlotPostSelectionPrepTimeMs / 1000}
		>
			{#snippet text({ remaining })}
				Post Selection Preparation Time: {Math.floor(remaining)}s
			{/snippet}
		</ProgressBar>
		<ProgressBar
			progressBar={connection.keySlotInsertTimeProgressBar}
			backgroundClass="background-main"
			total={RELOCK_KEY_TIMEOUT_S}
		>
			{#snippet text({ remaining })}
				Auto-Relock Timeout: {Math.floor(remaining)}s
			{/snippet}
		</ProgressBar>
	{/snippet}
	<div class="gap-neob m-with-shadow grid grid-flow-row grid-cols-2">
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
					Remove {keySlot.keyName}
				{:else}
					Insert key
				{/if}
			</button>
		{/each}
	</div>
</PromiseAccordion>
