<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { settingsContent } from '$lib/content/ui';
	import {
		audienceOptions,
		motionOptions,
		narrationOptions,
		pickOption,
		settings,
		textSizeOptions,
		themeOptions,
		worldDetailOptions
	} from '$lib/state/settings.svelte';

	interface Props {
		open: boolean;
	}

	interface RadioOption {
		value: string;
		label: string;
	}

	let { open = $bindable() }: Props = $props();

	const groupId = $props.id();

	const detailChoices: RadioOption[] = [
		{ value: 'auto', label: settingsContent.worldDetail.auto },
		{ value: 'light', label: settingsContent.worldDetail.light },
		{ value: 'full', label: settingsContent.worldDetail.full }
	];

	const themeChoices: RadioOption[] = [
		{ value: 'system', label: settingsContent.theme.system },
		{ value: 'light', label: settingsContent.theme.light },
		{ value: 'dark', label: settingsContent.theme.dark }
	];

	const textSizeChoices: RadioOption[] = [
		{ value: 'normal', label: settingsContent.textSize.normal },
		{ value: 'large', label: settingsContent.textSize.large },
		{ value: 'larger', label: settingsContent.textSize.larger }
	];

	const motionChoices: RadioOption[] = [
		{ value: 'system', label: settingsContent.motion.system },
		{ value: 'full', label: settingsContent.motion.full },
		{ value: 'reduced', label: settingsContent.motion.reduced }
	];

	const audienceChoices: RadioOption[] = [
		{ value: 'smp', label: settingsContent.audience.smp },
		{ value: 'sma', label: settingsContent.audience.sma }
	];

	const narrationChoices: RadioOption[] = [
		{ value: 'off', label: settingsContent.narration.off },
		{ value: 'important', label: settingsContent.narration.important },
		{ value: 'normal', label: settingsContent.narration.normal }
	];

	function selectDetail(value: string): void {
		settings.worldDetail = pickOption(value, worldDetailOptions, settings.worldDetail);
		settings.save();
	}

	function selectTheme(value: string): void {
		settings.theme = pickOption(value, themeOptions, settings.theme);
		settings.save();
	}

	function selectTextSize(value: string): void {
		settings.textSize = pickOption(value, textSizeOptions, settings.textSize);
		settings.save();
	}

	function selectMotion(value: string): void {
		settings.motion = pickOption(value, motionOptions, settings.motion);
		settings.save();
	}

	function selectAudience(value: string): void {
		settings.audience = pickOption(value, audienceOptions, settings.audience);
		settings.save();
	}

	function selectNarration(value: string): void {
		settings.narrationFrequency = pickOption(value, narrationOptions, settings.narrationFrequency);
		settings.save();
	}
</script>

{#snippet radioGroup(
	legend: string,
	name: string,
	options: RadioOption[],
	current: string,
	select: (value: string) => void
)}
	<fieldset class="rounded-[var(--radius-control)] border-[1.5px] border-ink/10 px-4 py-3">
		<legend class="px-1 text-sm font-medium">{legend}</legend>
		<div class="flex flex-wrap gap-x-5 gap-y-2">
			{#each options as option (option.value)}
				<label class="flex items-center gap-2">
					<input
						type="radio"
						name="{groupId}-{name}"
						value={option.value}
						checked={current === option.value}
						onchange={() => select(option.value)}
						class="size-4 accent-primary"
					/>
					{option.label}
				</label>
			{/each}
		</div>
	</fieldset>
{/snippet}

{#snippet toggle(label: string, checked: boolean, change: (value: boolean) => void)}
	<label class="flex items-center gap-2">
		<input
			type="checkbox"
			{checked}
			onchange={(event) => change(event.currentTarget.checked)}
			class="size-4 accent-primary"
		/>
		{label}
	</label>
{/snippet}

<Dialog bind:open title={settingsContent.title} description={settingsContent.description}>
	<div class="flex flex-col gap-4">
		{@render radioGroup(
			settingsContent.worldDetail.legend,
			'detail',
			detailChoices,
			settings.worldDetail,
			selectDetail
		)}
		{@render radioGroup(
			settingsContent.theme.legend,
			'theme',
			themeChoices,
			settings.theme,
			selectTheme
		)}
		{@render radioGroup(
			settingsContent.textSize.legend,
			'text-size',
			textSizeChoices,
			settings.textSize,
			selectTextSize
		)}
		{@render radioGroup(
			settingsContent.motion.legend,
			'motion',
			motionChoices,
			settings.motion,
			selectMotion
		)}
		{@render radioGroup(
			settingsContent.audience.legend,
			'audience',
			audienceChoices,
			settings.audience,
			selectAudience
		)}
		{@render radioGroup(
			settingsContent.narration.legend,
			'narration',
			narrationChoices,
			settings.narrationFrequency,
			selectNarration
		)}
		<div class="flex flex-col gap-2">
			{@render toggle(settingsContent.narratorVoice, settings.narratorVoice, (value) => {
				settings.narratorVoice = value;
				settings.save();
			})}
			{@render toggle(settingsContent.scientificMode, settings.scientificMode, (value) => {
				settings.scientificMode = value;
				settings.save();
			})}
			{@render toggle(settingsContent.keyboardShortcuts, settings.keyboardShortcuts, (value) => {
				settings.keyboardShortcuts = value;
				settings.save();
			})}
		</div>
	</div>
</Dialog>
