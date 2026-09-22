<script lang="ts">
	interface Props {
		targetId: string;
		label: string;
	}

	let { targetId, label }: Props = $props();
</script>

<a
	href="#{targetId}"
	class="absolute start-2 top-2 z-50 -translate-y-24 rounded-[var(--radius-control)] border-[1.5px] border-ink/10 bg-surface px-4 py-2 font-medium text-ink opacity-0 transition-[transform,opacity] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:translate-y-0 focus-visible:opacity-100"
>
	{label}
</a>
