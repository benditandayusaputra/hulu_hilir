<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import Fish from '@lucide/svelte/icons/fish';
	import House from '@lucide/svelte/icons/house';
	import Leaf from '@lucide/svelte/icons/leaf';
	import Mountain from '@lucide/svelte/icons/mountain';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import Sun from '@lucide/svelte/icons/sun';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Trees from '@lucide/svelte/icons/trees';
	import Waves from '@lucide/svelte/icons/waves';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { timeLabel } from '$lib/content/lab';
	import { eventNewsOf, eventResponses, narration } from '$lib/content/narration';
	import { formatBillions } from '$lib/format/number';
	import type { EventType } from '$lib/sim';
	import { getSession, toolCost } from '$lib/state/simulation.svelte';

	const session = getSession();

	const icons: Record<EventType, LucideIcon> = {
		heavy_rain: CloudRain,
		extreme_rain: CloudRain,
		drought: Sun,
		illegal_dumping: OctagonAlert,
		hyacinth_bloom: Leaf,
		landslide: Mountain,
		litter_shipment: Trash2,
		fish_kill: Fish,
		fish_return: Fish,
		community: House,
		ecotourism: Trees,
		flood: Waves,
		rob_flood: Waves
	};

	const event = $derived(session.pendingEvent);
	let open = $derived(event !== null);
	const news = $derived(event === null ? null : eventNewsOf(event.type, event.segment));
	const responses = $derived(event === null ? [] : (eventResponses[event.type] ?? []));
	const Icon = $derived(event === null ? null : icons[event.type]);
	const dateText = $derived(
		timeLabel(session.calendar.yearNumber, session.calendar.date.month, session.month)
	);

	function responseLabel(label: string, action: string | null): string {
		if (action === null) return label;
		const cost = toolCost({
			type: responses.find((item) => item.action === action)?.action ?? 'dismantle'
		});
		return cost > 0 ? `${label} (${formatBillions(cost)})` : label;
	}

	$effect(() => {
		if (!open && session.pendingEvent !== null) session.dismissEvent();
	});
</script>

<Dialog
	bind:open
	title={news?.title ?? ''}
	description={event === null ? '' : `${narration.kabarKali}, ${dateText}`}
>
	{#snippet footer()}
		{#each responses as response (response.label)}
			<Button
				variant={response.action === null ? 'secondary' : 'primary'}
				onclick={() => session.respondToEvent(response.action)}
			>
				{responseLabel(response.label, response.action)}
			</Button>
		{/each}
		{#if responses.length === 0}
			<Button onclick={() => session.respondToEvent(null)}>{narration.continueLabel}</Button>
		{/if}
	{/snippet}
	<div class="flex items-start gap-4">
		{#if Icon !== null}
			<Icon size={48} aria-hidden="true" class="shrink-0 text-accent" />
		{/if}
		<p>{news?.body ?? ''}</p>
	</div>
</Dialog>
