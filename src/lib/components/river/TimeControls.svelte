<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import SkipForward from '@lucide/svelte/icons/skip-forward';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Button from '$lib/components/ui/Button.svelte';
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { lab, seasonNames, timeLabel } from '$lib/content/lab';
	import { getSession, speedOptions, type Speed } from '$lib/state/simulation.svelte';

	const session = getSession();

	const speedChoices = speedOptions.map((speed) => ({ value: String(speed), label: `${speed}x` }));
	const timeText = $derived(
		timeLabel(session.calendar.yearNumber, session.calendar.date.month, session.month)
	);
	const rewindMax = $derived(Math.max(0, session.month - 1));

	let speedValue = $derived(String(session.speed));
	let rewindMonth = $state(0);

	const rewindTarget = $derived(Math.min(rewindMonth, rewindMax));

	function selectSpeed(value: string): void {
		const speed: Speed | undefined = speedOptions.find((option) => String(option) === value);
		if (speed !== undefined) session.setSpeed(speed);
	}
</script>

<div
	class="flex flex-col gap-3 rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
>
	<div class="flex flex-wrap items-center gap-2 sm:gap-3">
		<Tooltip text="{lab.shortcut}: P">
			{#snippet children(describedBy)}
				<Button aria-describedby={describedBy} onclick={() => session.togglePlay()}>
					{#snippet icon()}
						{#if session.playing}
							<Pause size={20} />
						{:else}
							<Play size={20} />
						{/if}
					{/snippet}
					{session.playing ? lab.pause : lab.play}
				</Button>
			{/snippet}
		</Tooltip>
		<Tooltip text="{lab.shortcut}: N">
			{#snippet children(describedBy)}
				<Button variant="secondary" aria-describedby={describedBy} onclick={() => session.step()}>
					{#snippet icon()}
						<SkipForward size={20} />
					{/snippet}
					{lab.stepMonth}
				</Button>
			{/snippet}
		</Tooltip>
		<SegmentedControl
			legend={lab.speed}
			options={speedChoices}
			bind:value={speedValue}
			onchange={selectSpeed}
		/>
		<p class="ml-auto flex flex-wrap items-center gap-2">
			<span data-numeric class="font-medium">{timeText}</span>
			<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5 text-sm">
				{seasonNames[session.calendar.season]}
			</span>
		</p>
	</div>
	<div class="flex flex-wrap items-start gap-2 sm:gap-3">
		<Button
			variant="secondary"
			size="sm"
			onclick={() => session.undo()}
			unavailableReason={session.pending.length === 0 ? lab.undoNone : ''}
		>
			{#snippet icon()}
				<Undo2 size={18} />
			{/snippet}
			{lab.undo}
		</Button>
		<div class="min-w-64 flex-1">
			<Disclosure summary={lab.rewind}>
				<div class="flex flex-col gap-2">
					<Slider
						label={lab.rewindSlider}
						min={0}
						max={rewindMax}
						bind:value={rewindMonth}
						valueText={(value) => `${lab.chartX} ${value}`}
					/>
					<div>
						<Button
							variant="secondary"
							size="sm"
							onclick={() => session.rewindTo(rewindTarget)}
							unavailableReason={session.month === 0 ? lab.rewindNone : ''}
						>
							{lab.rewindGo}
						</Button>
					</div>
				</div>
			</Disclosure>
		</div>
	</div>
</div>
