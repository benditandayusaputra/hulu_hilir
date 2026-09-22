export interface PageSkipLink {
	targetId: string;
	label: string;
}

interface ShellState {
	skipLinks: PageSkipLink[];
	fullWidth: boolean;
	helpOpen: boolean;
}

export const shell = $state<ShellState>({ skipLinks: [], fullWidth: false, helpOpen: false });
