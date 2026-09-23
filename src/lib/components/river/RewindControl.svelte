<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import { lab } from '$lib/content/lab';
	import { getSession } from '$lib/state/simulation.svelte';

	const session = getSession();

	let rewindMonth = $state(0);

	const rewindMax = $derived(Math.max(0, session.month - 1));
	const rewindTarget = $derived(Math.min(rewindMonth, rewindMax));
</script>

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
