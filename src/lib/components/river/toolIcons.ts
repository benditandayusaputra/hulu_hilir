import type { LucideIcon } from '@lucide/svelte';
import Building2 from '@lucide/svelte/icons/building-2';
import CircleDot from '@lucide/svelte/icons/circle-dot';
import Construction from '@lucide/svelte/icons/construction';
import DoorClosed from '@lucide/svelte/icons/door-closed';
import Droplet from '@lucide/svelte/icons/droplet';
import Droplets from '@lucide/svelte/icons/droplets';
import Factory from '@lucide/svelte/icons/factory';
import Flower2 from '@lucide/svelte/icons/flower-2';
import House from '@lucide/svelte/icons/house';
import Leaf from '@lucide/svelte/icons/leaf';
import Recycle from '@lucide/svelte/icons/recycle';
import Scale from '@lucide/svelte/icons/scale';
import ShieldAlert from '@lucide/svelte/icons/shield-alert';
import Shovel from '@lucide/svelte/icons/shovel';
import Sprout from '@lucide/svelte/icons/sprout';
import Trash2 from '@lucide/svelte/icons/trash-2';
import TreePine from '@lucide/svelte/icons/tree-pine';
import Trees from '@lucide/svelte/icons/trees';
import Truck from '@lucide/svelte/icons/truck';
import Waves from '@lucide/svelte/icons/waves';
import Wheat from '@lucide/svelte/icons/wheat';
import type { ActionType, LandUse } from '$lib/sim';
import type { Tool } from '$lib/state/simulation.svelte';

const landIcons: Record<LandUse, LucideIcon> = {
	forest: Trees,
	paddy: Wheat,
	settlement: House,
	dense_settlement: Building2,
	factory: Factory,
	open_land: Shovel
};

const actionIcons: Record<ActionType, LucideIcon> = {
	plant_forest: Sprout,
	ipal_industrial: Droplets,
	ipal_communal: Droplet,
	waste_bank: Recycle,
	biopori: CircleDot,
	eco_farming: Leaf,
	greenbelt: TreePine,
	retention_pond: Waves,
	dredging: Construction,
	river_cleanup: Trash2,
	clear_hyacinth: Flower2,
	enforcement: Scale,
	relocation: Truck,
	change_land_use: Shovel,
	dismantle: Construction,
	floodgate: DoorClosed,
	seal_illegal_outlet: ShieldAlert
};

export function toolIcon(tool: Tool): LucideIcon {
	return tool.choice === undefined ? actionIcons[tool.type] : landIcons[tool.choice];
}
