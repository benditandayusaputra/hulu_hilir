import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { labRouteIdOf, labRouteIds } from '$lib/content/lab';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = 'auto';

export const entries: EntryGenerator = () => labRouteIds.map((skenario) => ({ skenario }));

export const load: PageLoad = ({ params }) => {
	const id = labRouteIdOf(params.skenario);
	if (id === null) redirect(307, resolve('/lab'));
	return { id };
};
