<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import MapIcon from '@lucide/svelte/icons/map';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import RoundButton from '$lib/components/hud/art/RoundButton.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { lab } from '$lib/content/lab';
	import { getCamera } from '$lib/world/camera.svelte';

	interface Props {
		small?: boolean;
	}

	let { small = false }: Props = $props();

	const camera = getCamera();

	interface Control {
		label: string;
		key: string;
		icon: LucideIcon;
		run: () => void;
	}

	const controls: Control[] = [
		{ label: lab.zoomIn, key: '+', icon: ZoomIn, run: () => void camera?.zoomIn() },
		{ label: lab.zoomOut, key: '-', icon: ZoomOut, run: () => void camera?.zoomOut() },
		{ label: lab.showAll, key: '0', icon: MapIcon, run: () => void camera?.showAll() }
	];
</script>

<div role="group" aria-label={lab.cameraControls} class="flex flex-col items-center gap-2">
	{#each controls as control (control.label)}
		{@const Icon = control.icon}
		<Tooltip text="{control.label}, {lab.shortcut}: {control.key}" side="left">
			{#snippet children(describedBy)}
				<RoundButton
					label={control.label}
					{small}
					aria-describedby={describedBy}
					onclick={control.run}
				>
					<Icon size={22} aria-hidden="true" />
				</RoundButton>
			{/snippet}
		</Tooltip>
	{/each}
</div>
