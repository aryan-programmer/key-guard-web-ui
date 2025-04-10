<script lang="ts" module>
	import z, { type TypeOf } from "zod";
	const schema = z.object({
		username: z
			.string({
				invalid_type_error: "Enter a valid user name",
				required_error: "User name is required"
			})
			.nonempty("User name is required"),
		password: z
			.string({
				invalid_type_error: "Enter a valid password",
				required_error: "Password is required"
			})
			.nonempty("Password is required")
	});
	type Data_T = TypeOf<typeof schema>;
</script>

<script lang="ts">
	import { Control, Field, FieldErrors, Label } from "formsnap";
	import { superForm } from "sveltekit-superforms";
	import { zodClient } from "sveltekit-superforms/adapters";

	let { onSubmit }: { onSubmit: (data: Data_T) => void } = $props();
	const form = superForm<Data_T>(
		{
			username: "",
			password: ""
		},
		{
			validators: zodClient(schema)
		}
	);
	const { form: formData, validateForm, errors } = form;

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const result = await validateForm();

		if (!result.valid) {
			errors.update((v) => {
				return {
					...v,
					username: result.errors.username,
					password: result.errors.password
				};
			});

			return;
		}
		onSubmit(result.data);
	}
</script>

<form
	onsubmit={handleSubmit}
	class="background-blank m-2 grid grid-cols-[min-content_1fr] items-center overflow-hidden"
>
	<Field {form} name="username">
		<Control>
			{#snippet children({ props })}
				<Label>User&nbsp;Name</Label>
				<div>
					<div class="flex w-full flex-row justify-stretch">
						<input
							class="input neob-focus"
							{...props}
							type="text"
							bind:value={$formData.username}
						/>
					</div>
				</div>
			{/snippet}
		</Control>
		<div></div>
		<FieldErrors class="m-with-shadow !my-0" />
	</Field>
	<Field {form} name="password">
		<Control>
			{#snippet children({ props })}
				<Label>Password</Label>
				<div>
					<div class="flex w-full flex-row justify-stretch">
						<input
							class="input neob-focus w-full"
							{...props}
							type="password"
							bind:value={$formData.password}
						/>
					</div>
				</div>
			{/snippet}
		</Control>
		<div></div>
		<FieldErrors class="m-with-shadow !my-0" />
	</Field>
	<div></div>
	<button class="button neob-hover button-size-default background-main" type="submit">
		Login
	</button>
</form>
