<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import SkipForward from '@lucide/svelte/icons/skip-forward';
	import RoundButton from '$lib/components/hud/art/RoundButton.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { lab } from '$lib/content/lab';
	import { getSession, speedOptions } from '$lib/state/simulation.svelte';

	interface Props {
		stacked?: boolean;
	}

	let { stacked = false }: Props = $props();

	const session = getSession();
	const speedName = $props.id();

	function cycleSpeed(): void {
		const index = speedOptions.indexOf(session.speed);
		session.setSpeed(speedOptions[(index + 1) % speedOptions.length] ?? 1);
	}
</script>

{#snippet playButton()}
	<Tooltip text="{lab.shortcut}: P" side={stacked ? 'left' : 'top'}>
		{#snippet children(describedBy)}
			<RoundButton
				label={session.playing ? lab.pause : lab.play}
				captioned={!stacked}
				small={stacked}
				on={session.playing}
				aria-describedby={describedBy}
				onclick={() => session.togglePlay()}
			>
				{#if session.playing}
					<Pause size={22} aria-hidden="true" />
				{:else}
					<Play size={22} aria-hidden="true" />
				{/if}
			</RoundButton>
		{/snippet}
	</Tooltip>
{/snippet}

{#snippet stepButton()}
	<Tooltip text="{lab.shortcut}: N" side={stacked ? 'left' : 'top'}>
		{#snippet children(describedBy)}
			<RoundButton
				label={lab.stepMonth}
				captioned={!stacked}
				small={stacked}
				aria-describedby={describedBy}
				onclick={() => session.step()}
			>
				<SkipForward size={22} aria-hidden="true" />
			</RoundButton>
		{/snippet}
	</Tooltip>
{/snippet}

{#if stacked}
	<div class="flex flex-col items-center gap-2">
		{@render playButton()}
		{@render stepButton()}
		<RoundButton label="{lab.speed} {session.speed}x" small onclick={cycleSpeed}>
			<span data-numeric class="text-sm">{session.speed}x</span>
		</RoundButton>
	</div>
{:else}
	<div class="wood wood-nails flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-5 py-3">
		<div class="flex items-start gap-3">
			{@render playButton()}
			{@render stepButton()}
		</div>
		<fieldset class="flex flex-col items-center">
			<legend class="mb-1 text-sm font-bold">{lab.speed}</legend>
			<div class="flex gap-2">
				{#each speedOptions as speed (speed)}
					<label class="relative inline-flex">
						<input
							type="radio"
							name={speedName}
							value={speed}
							checked={session.speed === speed}
							onchange={() => session.setSpeed(speed)}
							class="absolute inset-0 z-10 m-0 size-full cursor-pointer appearance-none rounded-full"
						/>
						<span
							data-numeric
							class="knob knob-sm pointer-events-none text-sm"
							class:knob-on={session.speed === speed}>{speed}x</span
						>
					</label>
				{/each}
			</div>
		</fieldset>
	</div>
{/if}
