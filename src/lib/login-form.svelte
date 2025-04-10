<script lang="ts">
	import { Control, Field, FieldErrors, Label } from "formsnap";
	import { superForm } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";
	import z, { type TypeOf } from "zod";
	import { randomAddress } from "./uniq-address";

	const usernameField = randomAddress();
	const passwordField = randomAddress();
	const schema = z.object({
		[usernameField]: z
			.string({
				invalid_type_error: "Enter a valid user name",
				required_error: "User name is required"
			})
			.nonempty("User name is required"),
		[passwordField]: z
			.string({
				invalid_type_error: "Enter a valid password",
				required_error: "Password is required"
			})
			.nonempty("Password is required")
	});
	type Data_T = TypeOf<typeof schema>;

	let { onSubmit }: { onSubmit: (data: { username: string; password: string }) => void } = $props();
	const form = superForm<Data_T>(
		{
			[usernameField]: "",
			[passwordField]: ""
		},
		{
			validators: zodClient(schema)
		}
	);
	const { form: formData, validateForm, errors } = form;

	let readonlyUsername = $state(true);
	let readonlyPassword = $state(true);

	async function handleSubmit(event: Event) {
		const result = await validateForm();

		console.log(result);

		if (!result.valid) {
			errors.update((v) => {
				return {
					...v,
					[usernameField]: result.errors[usernameField],
					[passwordField]: result.errors[passwordField]
				};
			});

			return;
		}
		onSubmit({
			username: result.data[usernameField],
			password: result.data[passwordField]
		});
	}
</script>

<div class="background-blank m-2 grid grid-cols-[min-content_1fr] items-center overflow-hidden">
	<input
		type="password"
		id="prevent-autofill"
		autocomplete="off"
		style="display: none"
		tabindex="-1"
	/>
	<Field {form} name={usernameField}>
		<Control id={randomAddress()}>
			{#snippet children({ props })}
				<Label>User&nbsp;Name</Label>
				<div>
					<div class="flex w-full flex-row justify-stretch">
						<input
							class="input neob-focus"
							autocomplete="off"
							{...props}
							type="text"
							bind:value={$formData[usernameField]}
							readonly={readonlyUsername}
							onfocus={() => (readonlyUsername = false)}
						/>
					</div>
				</div>
			{/snippet}
		</Control>
		<div></div>
		<FieldErrors class="m-with-shadow !my-0" />
	</Field>
	<Field {form} name={passwordField}>
		<Control id={randomAddress()}>
			{#snippet children({ props })}
				<Label>Password</Label>
				<div>
					<div class="flex w-full flex-row justify-stretch">
						<input
							class="input neob-focus w-full"
							{...props}
							type="text"
							style="text-security: disc; -webkit-text-security: disc;"
							autocomplete="off"
							bind:value={$formData[passwordField]}
							readonly={readonlyPassword}
							onfocus={() => (readonlyPassword = false)}
						/>
					</div>
				</div>
			{/snippet}
		</Control>
		<div></div>
		<FieldErrors class="m-with-shadow !my-0" />
	</Field>
	<div></div>
	<button class="button neob-hover button-size-default background-main" onclick={handleSubmit}>
		Login
	</button>
</div>
