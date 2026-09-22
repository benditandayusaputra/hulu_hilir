<script lang="ts">
	import { announcer } from '$lib/state/announcer.svelte';
</script>

<div class="sr-only" aria-live="polite" aria-atomic="true">{announcer.polite}</div>
<div class="sr-only" aria-live="assertive" aria-atomic="true">{announcer.assertive}</div>
