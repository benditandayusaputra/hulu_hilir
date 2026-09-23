export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 3000;

export const RIVER_WIDTH = 150;
export const SAMPLE_STEP = 24;

export const PLOT_OFFSET_ABOVE = { near: 205, far: 355 } as const;
export const PLOT_OFFSET_BELOW = { near: 260, far: 410 } as const;
export const PLOT_STAGGER = 115;
export const PLOT_WIDTH = 240;
export const PLOT_HEIGHT = 150;
export const ASSET_GROUND_OFFSET = 30;

export const BOARD_UPSTREAM = 330;
export const BOARD_ABOVE_RIVER = 205;

export const ZOOM_MAX = 2.4;
export const ZOOM_SEGMENT = 0.6;
export const ZOOM_TILE = 1.1;
export const LOD_SEGMENT_FROM = 0.45;
export const LOD_NEAR_FROM = 1.1;
export const ZOOM_STEP = 1.5;
export const DOUBLE_CLICK_ZOOM = 2;
export const WHEEL_ZOOM_RATE = 0.0015;
export const FIT_PADDING_PX = 16;
export const SEGMENT_PADDING_PX = 48;

export const FLY_SECONDS = 0.6;
export const DRAG_THRESHOLD_PX = 6;
export const CULL_MARGIN = 240;
export const CULL_GRID = 200;

export const CLOUD_ALTITUDE = 230;
export const CLOUD_SHADOW_OFFSET = { x: 110, y: 40 } as const;
export const CLOUD_COUNTS = { drought: 1, clear: 3, cloudy: 5, heavy: 8, extreme: 12 } as const;
export const CLOUD_SCALES = {
	drought: 0.6,
	clear: 1,
	cloudy: 1.1,
	heavy: 1.15,
	extreme: 1.9
} as const;
export const HEAVY_UPSTREAM_BIAS = 1.7;
export const WEATHER_DIM = {
	drought: 0,
	clear: 0,
	cloudy: 0.05,
	heavy: 0.12,
	extreme: 0.22
} as const;
export const DROUGHT_TINT = 0.06;
export const NEAR_CLOUD_OPACITY = 0.4;
export const RAIN_BURST_MS = 4000;
export const RAIN_COLUMN_SHARE = 0.4;
export const EXTREME_RAIN_SLANT = 0.25;
export const RAIN_PATTERN_SCALE = { far: 3, segment: 1.6, near: 1 } as const;
export const RUNOFF_WIDTH_PER_C = 14;
export const RUNOFF_LENGTH = 170;
export const RUNOFF_STRANDS = [-60, 0, 60] as const;
export const RUNOFF_INTO_WATER = 14;
export const SOAK_OFFSETS = [
	{ x: -70, y: 50 },
	{ x: 0, y: 64 },
	{ x: 70, y: 48 }
] as const;
export const SOAK_BANK_SHARES = [0.2, 0.5, 0.8] as const;
export const SPLASH_SHARES = [0.1, 0.3, 0.5, 0.7, 0.9] as const;
export const SPLASH_LATERALS = [-38, 26] as const;
export const WEATHER_FADE_MS = 1000;
export const RAIN_LOOP_SECONDS = { heavy: 0.5, extreme: 0.32 } as const;
export const RAIN_TILES = {
	heavy: { width: 40, height: 90 },
	extreme: { width: 24, height: 48 }
} as const;
