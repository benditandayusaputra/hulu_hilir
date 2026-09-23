<script lang="ts">
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import SkipForward from '@lucide/svelte/icons/skip-forward';
	import Button from '$lib/components/ui/Button.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { lab, seasonNames, timeLabel } from '$lib/content/lab';
	import { getSession, speedOptions, type Speed } from '$lib/state/simulation.svelte';

	interface Props {
		stacked?: boolean;
	}

	let { stacked = false }: Props = $props();

	const session = getSession();

	const speedChoices = speedOptions.map((speed) => ({ value: String(speed), label: `${speed}x` }));
	const timeText = $derived(
		timeLabel(session.calendar.yearNumber, session.calendar.date.month, session.month)
	);

	let speedValue = $derived(String(session.speed));

	function selectSpeed(value: string): void {
		const speed: Speed | undefined = speedOptions.find((option) => String(option) === value);
		if (speed !== undefined) session.setSpeed(speed);
	}

	function cycleSpeed(): void {
		const index = speedOptions.indexOf(session.speed);
		session.setSpeed(speedOptions[(index + 1) % speedOptions.length] ?? 1);
	}

	const roundShape = 'grid size-11 place-items-center rounded-full border-[1.5px] shadow-md';
	const roundClass = `${roundShape} border-ink/15 bg-surface text-ink hover:bg-surface-2`;
	const primaryRound = `${roundShape} border-primary bg-primary text-on-primary`;
</script>

{#if stacked}
	<div class="flex flex-wrap items-center gap-2">
		<Tooltip text="{lab.shortcut}: P">
			{#snippet children(describedBy)}
				<button
					type="button"
					aria-label={session.playing ? lab.pause : lab.play}
					aria-describedby={describedBy}
					onclick={() => session.togglePlay()}
					class={primaryRound}
				>
					{#if session.playing}
						<Pause size={22} aria-hidden="true" />
					{:else}
						<Play size={22} aria-hidden="true" />
					{/if}
				</button>
			{/snippet}
		</Tooltip>
		<Tooltip text="{lab.shortcut}: N">
			{#snippet children(describedBy)}
				<button
					type="button"
					aria-label={lab.stepMonth}
					aria-describedby={describedBy}
					onclick={() => session.step()}
					class={roundClass}
				>
					<SkipForward size={22} aria-hidden="true" />
				</button>
			{/snippet}
		</Tooltip>
		<button
			type="button"
			aria-label="{lab.speed} {session.speed}x"
			onclick={cycleSpeed}
			class="{roundClass} text-sm font-bold"
		>
			{session.speed}x
		</button>
		<p
			data-numeric
			class="min-w-0 flex-1 rounded-[var(--radius-control)] bg-surface/95 px-2 py-1 text-sm shadow-md"
		>
			{timeText}
		</p>
	</div>
{:else}
	<div
		class="flex flex-col gap-2 rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface/95 p-3 shadow-md"
	>
		<div class="flex flex-wrap items-center gap-2">
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
		</div>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<SegmentedControl
				legend={lab.speed}
				options={speedChoices}
				bind:value={speedValue}
				onchange={selectSpeed}
			/>
			<p class="flex flex-wrap items-center gap-2 text-sm">
				<span data-numeric class="font-medium">{timeText}</span>
				<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5">
					{seasonNames[session.calendar.season]}
				</span>
			</p>
		</div>
	</div>
{/if}
