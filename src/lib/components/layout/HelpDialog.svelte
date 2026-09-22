<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Kbd from '$lib/components/ui/Kbd.svelte';
	import { keyboardHelp, keyboardHelpNote, lab } from '$lib/content/lab';

	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();
</script>

<Dialog bind:open title={lab.helpTitle} description={keyboardHelpNote}>
	<table class="w-full border-collapse text-sm">
		<caption class="mb-2 text-left font-medium">{lab.keyboardTitle}</caption>
		<thead>
			<tr class="border-b-[1.5px] border-ink/10 text-left">
				<th scope="col" class="py-1 pr-3">{lab.keyColumn}</th>
				<th scope="col" class="py-1">{lab.actionColumn}</th>
			</tr>
		</thead>
		<tbody>
			{#each keyboardHelp as row (row.action)}
				<tr class="border-b border-ink/10 align-top">
					<td class="py-1.5 pr-3 whitespace-nowrap">
						{#each row.keys as key, index (key)}
							{#if index > 0}<span class="px-0.5 text-ink-muted">/</span>{/if}<Kbd>{key}</Kbd>
						{/each}
					</td>
					<td class="py-1.5">{row.action}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</Dialog>
