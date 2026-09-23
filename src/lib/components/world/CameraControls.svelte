<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import Maximize from '@lucide/svelte/icons/maximize';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { lab } from '$lib/content/lab';
	import { getCamera } from '$lib/world/camera.svelte';

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
		{ label: lab.showAll, key: '0', icon: Maximize, run: () => void camera?.showAll() }
	];
</script>

<div role="group" aria-label={lab.cameraControls} class="flex flex-col gap-2">
	{#each controls as control (control.label)}
		{@const Icon = control.icon}
		<Tooltip text="{control.label}, {lab.shortcut}: {control.key}" side="left">
			{#snippet children(describedBy)}
				<button
					type="button"
					aria-label={control.label}
					aria-describedby={describedBy}
					onclick={control.run}
					class="grid size-11 place-items-center rounded-full border-[1.5px] border-ink/15 bg-surface text-ink shadow-md hover:bg-surface-2"
				>
					<Icon size={22} aria-hidden="true" />
				</button>
			{/snippet}
		</Tooltip>
	{/each}
</div>
