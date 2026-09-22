<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Waves from '@lucide/svelte/icons/waves';
	import { floodStatusNames, waterStatusNames } from '$lib/content/lab';
	import type { FloodStatus, WaterStatus } from '$lib/sim';

	type Status = WaterStatus | FloodStatus;

	interface Props {
		status: Status;
		prefix?: string;
	}

	let { status, prefix = '' }: Props = $props();

	interface Meta {
		label: string;
		icon: LucideIcon;
		water: boolean;
	}

	const meta: Record<Status, Meta> = {
		good: { label: waterStatusNames.good, icon: CircleCheck, water: true },
		light: { label: waterStatusNames.light, icon: CircleAlert, water: true },
		moderate: { label: waterStatusNames.moderate, icon: TriangleAlert, water: true },
		heavy: { label: waterStatusNames.heavy, icon: OctagonAlert, water: true },
		safe: { label: floodStatusNames.safe, icon: ShieldCheck, water: false },
		alert: { label: floodStatusNames.alert, icon: TriangleAlert, water: false },
		minor: { label: floodStatusNames.minor, icon: Waves, water: false },
		major: { label: floodStatusNames.major, icon: CloudRain, water: false }
	};

	const current = $derived(meta[status]);
	const Icon = $derived(current.icon);
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] border-[1.5px] border-ink/10 bg-surface px-2 py-0.5 text-sm font-medium text-ink"
	data-status={status}
>
	{#if current.water}
		<svg class="size-4 shrink-0" aria-hidden="true" viewBox="0 0 16 16">
			<rect width="16" height="16" rx="4" style="fill: var(--color-water-{status})" />
			<rect width="16" height="16" rx="4" fill="url(#water-pattern-{status})" />
			<rect
				width="15"
				height="15"
				x="0.5"
				y="0.5"
				rx="4"
				fill="none"
				stroke="currentColor"
				stroke-opacity="0.35"
			/>
		</svg>
	{/if}
	<Icon size={16} aria-hidden="true" class="shrink-0" />
	<span>{prefix}{current.label}</span>
</span>
