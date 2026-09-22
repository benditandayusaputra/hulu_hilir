import type {
	ActionErrorCode,
	ActionType,
	CauseSource,
	EventType,
	FishGroup,
	FloodStatus,
	Indicators,
	LandUse,
	QualityParameter,
	Season,
	SegmentIndex,
	WaterStatus
} from '$lib/sim';
import { formatBillions, formatScore, formatSignedScore } from '$lib/format/number';

export const segmentNames: Record<SegmentIndex, string> = {
	1: 'Hulu Atas',
	2: 'Hulu',
	3: 'Tengah',
	4: 'Kota',
	5: 'Hilir',
	6: 'Muara'
};

export function segmentLabel(index: SegmentIndex): string {
	return `Segmen ${index} ${segmentNames[index]}`;
}

export const landUseNames: Record<LandUse, string> = {
	forest: 'Hutan',
	paddy: 'Sawah',
	settlement: 'Permukiman',
	dense_settlement: 'Permukiman padat',
	factory: 'Pabrik',
	open_land: 'Lahan terbuka'
};

export const landUseEffects: Record<LandUse, string> = {
	forest: 'Menahan air hujan dan menyaring limpasan.',
	paddy: 'Pupuk terbawa hujan menjadi nitrat dan fosfat.',
	settlement: 'Limbah rumah tangga, bakteri, dan sampah.',
	dense_settlement: 'Beban limbah dan limpasan jauh lebih besar.',
	factory: 'BOD dan kromium bila tanpa IPAL.',
	open_land: 'Erosi tinggi: TSS dan limpasan besar.'
};

export const factoryUntreatedName = 'Pabrik tanpa IPAL';

export const forestStageNames: readonly string[] = ['bibit', 'muda', 'remaja', 'matang'];

export type TileSideKey = 'L2' | 'L1' | 'R1' | 'R2';

export const sideNames: Record<TileSideKey, string> = {
	L2: 'kiri jauh dari sungai',
	L1: 'kiri dekat sungai',
	R1: 'kanan dekat sungai',
	R2: 'kanan jauh dari sungai'
};

export const waterStatusNames: Record<WaterStatus, string> = {
	good: 'Baik',
	light: 'Cemar ringan',
	moderate: 'Cemar sedang',
	heavy: 'Cemar berat'
};

export const floodStatusNames: Record<FloodStatus, string> = {
	safe: 'Aman',
	alert: 'Siaga',
	minor: 'Banjir ringan',
	major: 'Banjir besar'
};

export const fishGroupNames: Record<FishGroup, string> = {
	sensitive: 'Sensitif',
	intermediate: 'Menengah',
	tolerant: 'Toleran'
};

export const fishGroupExamples: Record<FishGroup, string> = {
	sensitive: 'ikan dewa, ikan sungai jernih',
	intermediate: 'tawes, nilem',
	tolerant: 'sapu-sapu, lele'
};

export interface ParameterLabel {
	label: string;
	short: string;
	unit: string;
	digits: number;
}

export const parameterLabels: Record<QualityParameter, ParameterLabel> = {
	do: { label: 'Oksigen terlarut (DO)', short: 'DO', unit: 'mg/L', digits: 1 },
	bod: { label: 'BOD', short: 'BOD', unit: 'mg/L', digits: 1 },
	tss: { label: 'TSS', short: 'TSS', unit: 'mg/L', digits: 0 },
	nitrate: { label: 'Nitrat (N)', short: 'Nitrat', unit: 'mg/L', digits: 2 },
	phosphate: { label: 'Total fosfat (P)', short: 'Fosfat', unit: 'mg/L', digits: 2 },
	fecalColiform: { label: 'Fecal coliform', short: 'Coliform', unit: 'MPN/100 mL', digits: 0 },
	chromium: { label: 'Kromium heksavalen (Cr VI)', short: 'Cr VI', unit: 'mg/L', digits: 3 }
};

export const actionNames: Record<ActionType, string> = {
	plant_forest: 'Tanam Hutan',
	ipal_industrial: 'IPAL Industri',
	ipal_communal: 'IPAL Komunal',
	waste_bank: 'Bank Sampah',
	biopori: 'Biopori dan Sumur Resapan',
	eco_farming: 'Pertanian Ramah Lingkungan',
	greenbelt: 'Sabuk Hijau Bantaran',
	retention_pond: 'Kolam Retensi',
	dredging: 'Pengerukan Sedimen',
	river_cleanup: 'Kerja Bakti Bersih Sungai',
	clear_hyacinth: 'Pembersihan Eceng Gondok',
	enforcement: 'Pengawasan dan Sanksi Limbah',
	relocation: 'Relokasi Pabrik',
	change_land_use: 'Ubah Penggunaan Lahan',
	dismantle: 'Bongkar Intervensi',
	floodgate: 'Pintu Air dan Pompa',
	seal_illegal_outlet: 'Sidak dan Segel Saluran'
};

export const actionEffects: Record<ActionType, string> = {
	plant_forest: 'Menjadi hutan muda yang matang dalam 30 bulan.',
	ipal_industrial: 'BOD turun 85%, TSS 80%, coliform 90%, Cr VI 90%.',
	ipal_communal: 'BOD turun 80%, TSS 70%, coliform 95%, N 30%, P 50%.',
	waste_bank: 'Sampah yang masuk sungai turun 70%.',
	biopori: 'Limpasan hujan berkurang, koefisien limpasan turun 0,15.',
	eco_farming: 'Nitrat dan fosfat turun 40%, TSS 20%, pendapatan sawah turun 10%.',
	greenbelt: 'TSS masuk turun 30%, N dan P 20%, naungan bertambah; matang dalam 12 bulan.',
	retention_pond: 'Debit puncak banjir berkurang 25 m³/detik.',
	dredging: 'Sedimen berkurang 0,6; TSS naik 1,5 kali selama sebulan.',
	river_cleanup: 'Sampah segmen berkurang 40.',
	clear_hyacinth: 'Tutupan eceng gondok berkurang 0,7.',
	enforcement: 'Pembuangan ilegal jauh lebih jarang; pabrik tanpa IPAL didenda tiap bulan.',
	relocation: 'Pabrik pindah setelah 6 bulan dan petak menjadi lahan terbuka.',
	change_land_use: 'Mengganti penggunaan lahan petak seketika, khusus Lab.',
	dismantle: 'Menghapus intervensi tanpa pengembalian biaya.',
	floodgate: 'Pengaruh muka laut turun 70%; mencegah banjir rob sampai muka laut 1,2 m.',
	seal_illegal_outlet: 'Beban tambahan dari pembuangan ilegal turun 70%.'
};

export const eventNames: Record<EventType, string> = {
	heavy_rain: 'Hujan lebat',
	extreme_rain: 'Hujan ekstrem',
	drought: 'Kemarau panjang',
	illegal_dumping: 'Pembuangan limbah ilegal',
	hyacinth_bloom: 'Ledakan eceng gondok',
	landslide: 'Longsor tebing',
	litter_shipment: 'Sampah kiriman',
	fish_kill: 'Ikan mati massal',
	fish_return: 'Ikan kembali',
	community: 'Komunitas peduli sungai',
	ecotourism: 'Ekowisata tumbuh',
	flood: 'Banjir',
	rob_flood: 'Banjir rob'
};

export const causeSourceNames: Record<CauseSource, string> = {
	...landUseNames,
	...eventNames,
	factory: factoryUntreatedName,
	treated_factory: 'Pabrik dengan IPAL',
	treated_settlement: 'Permukiman dengan IPAL komunal',
	background: 'Latar alami'
};

export const seasonNames: Record<Season, string> = {
	wet: 'Musim hujan',
	transition: 'Peralihan',
	dry: 'Kemarau'
};

export const monthNames: readonly string[] = [
	'Januari',
	'Februari',
	'Maret',
	'April',
	'Mei',
	'Juni',
	'Juli',
	'Agustus',
	'September',
	'Oktober',
	'November',
	'Desember'
];

export const indicatorNames: Record<keyof Indicators, string> = {
	waterQuality: 'Kualitas Air',
	fish: 'Kehidupan Ikan',
	floodRisk: 'Risiko Banjir',
	economy: 'Ekonomi'
};

export const labPresetIds = ['alami', 'desa', 'kota-padat', 'lahan-kosong'] as const;
export type LabPresetId = (typeof labPresetIds)[number];

export const presetNames: Record<LabPresetId, string> = {
	alami: 'Sungai Alami',
	desa: 'Desa Berkembang',
	'kota-padat': 'Kota Padat',
	'lahan-kosong': 'Lahan Kosong'
};

export const lab = {
	pageTitle: 'Lab Bebas | Hulu Hilir',
	title: 'Lab Bebas',
	lead: 'Susun bantaran sungai, jalankan waktu, lalu lihat dampaknya dari hulu sampai muara.',
	skipToStage: 'Lewati ke panggung sungai',
	skipToTime: 'Lewati ke kontrol waktu',
	scenarioLabel: 'Skenario awal',
	scenarioChangeTitle: 'Ganti skenario?',
	scenarioChangeBody: 'Riwayat dan aksi di Lab saat ini akan hilang.',
	confirm: 'Ganti',
	cancel: 'Batal',
	stageRegion: 'Panggung sungai',
	stageLabel: 'Sungai, 6 segmen dari hulu ke muara',
	upstream: 'Hulu',
	downstream: 'Muara',
	waterCell: 'air',
	pressEnterSegment: 'Tekan Enter untuk aksi segmen.',
	pressEnterInstall: 'Tekan Enter untuk memasang.',
	toolSelected: 'Alat terpilih',
	enforcementActive: 'Pengawasan aktif',
	paletteTitle: 'Palet alat',
	groupLand: 'Lahan',
	groupTile: 'Intervensi Petak',
	groupSegment: 'Intervensi Segmen',
	groupRiver: 'Kebijakan',
	releaseTool: 'Lepas alat',
	noTool: 'Tidak ada alat terpilih. Pilih petak untuk membuka menunya.',
	toolHint: 'Pilih alat lalu tekan petak, atau pilih petak lalu pilih aksi dari menunya.',
	cost: 'Biaya',
	free: 'Gratis',
	perMonth: 'per bulan',
	panelTitle: 'Panel',
	actionPanelTitle: 'Aksi petak',
	segmentPanelTitle: 'Aksi segmen',
	chooseAction: 'Pilih aksi',
	install: 'Pasang',
	dismantle: 'Bongkar',
	close: 'Tutup',
	preview: 'Pratinjau',
	buildCost: 'Biaya bangun',
	upkeepCost: 'Biaya rutin',
	leadTime: 'Mulai berefek',
	immediate: 'Langsung',
	effect: 'Efek',
	cashAfter: 'Kas setelah aksi',
	cashUnlimited: 'Tanpa batas (Lab)',
	currentState: 'Keadaan sekarang',
	installed: 'Terpasang',
	pendingBadge: 'Menunggu bulan depan',
	landChange: 'Ubah penggunaan lahan',
	tileInterventions: 'Intervensi petak',
	segmentInterventions: 'Intervensi segmen',
	riverPolicy: 'Kebijakan sungai',
	dismantleGroup: 'Bongkar intervensi',
	nothingAvailable: 'Tidak ada aksi yang tersedia.',
	play: 'Putar',
	pause: 'Jeda',
	stepMonth: 'Maju 1 bulan',
	speed: 'Kecepatan',
	undo: 'Batalkan aksi terakhir',
	undoNone: 'Tidak ada aksi yang menunggu',
	rewind: 'Kembali ke bulan',
	rewindGo: 'Kembali',
	rewindNone: 'Belum ada bulan sebelumnya',
	rewindSlider: 'Bulan tujuan',
	timeRegion: 'Kontrol waktu',
	shortcut: 'Pintasan',
	indicatorsTitle: 'Indikator',
	cash: 'Kas',
	outOf: 'dari',
	vsLastMonth: 'dari bulan lalu',
	inspectorTitle: 'Inspektor Segmen',
	water: 'Air',
	pollutionIndex: 'Indeks Pencemaran (IP)',
	flood: 'Banjir',
	sources: 'Sumber beban',
	fishPerGroup: 'Ikan per kelompok',
	stocks: 'Stok dan aliran',
	litter: 'Sampah',
	sediment: 'Sedimen',
	hyacinth: 'Eceng gondok',
	flow: 'Debit',
	temperature: 'Suhu',
	scientificMode: 'Mode Ilmiah',
	parameterColumn: 'Parameter',
	valueColumn: 'Nilai',
	standardColumn: 'Baku kelas 2',
	verdictColumn: 'Keterangan',
	meetsStandard: 'Memenuhi',
	failsStandard: 'Melewati baku',
	belowStandard: 'Di bawah baku',
	tableToggle: 'Tampilan Tabel',
	tableColumns: {
		segment: 'Segmen',
		status: 'Status',
		pollutionIndex: 'IP',
		litter: 'Sampah',
		fish: 'Ikan',
		floodRisk: 'Risiko banjir'
	},
	chartTitle: 'Riwayat indikator',
	chartX: 'Bulan',
	seeData: 'Lihat data',
	helpTitle: 'Bantuan',
	keyboardTitle: 'Pintasan keyboard',
	keyColumn: 'Tombol',
	actionColumn: 'Aksi',
	openTools: 'Alat',
	openPanel: 'Panel',
	tabTools: 'Alat',
	tabIndicators: 'Indikator',
	tabInspector: 'Inspektor'
} as const;

export interface KeyboardHelpRow {
	keys: readonly string[];
	action: string;
}

export const keyboardHelp: readonly KeyboardHelpRow[] = [
	{
		keys: ['Tab', 'Shift+Tab'],
		action: 'Pindah antarwilayah: palet, panggung, panel, kontrol waktu'
	},
	{ keys: ['↑', '↓'], action: 'Pindah ke segmen hulu atau hilir' },
	{ keys: ['←', '→'], action: 'Pindah sel dalam segmen' },
	{ keys: ['Home', 'End'], action: 'Sel pertama atau terakhir di segmen' },
	{ keys: ['Ctrl+Home', 'Ctrl+End'], action: 'Segmen 1 atau segmen 6' },
	{ keys: ['Enter', 'Spasi'], action: 'Pasang alat terpilih atau buka panel aksi' },
	{ keys: ['Escape'], action: 'Tutup panel dan kembali ke sel asal' },
	{ keys: ['I'], action: 'Umumkan ringkasan segmen yang difokus' },
	{ keys: ['P'], action: 'Putar atau jeda' },
	{ keys: ['N'], action: 'Maju 1 bulan' },
	{ keys: ['1', '2', '3'], action: 'Kecepatan 1x, 2x, 4x' },
	{ keys: ['T'], action: 'Buka atau tutup Tampilan Tabel' },
	{ keys: ['?'], action: 'Buka Bantuan' }
];

export const keyboardHelpNote =
	'Pintasan satu huruf hanya aktif saat fokus berada di area simulasi dan bisa dimatikan di Pengaturan.';

export function timeLabel(yearNumber: number, calendarMonth: number, month: number): string {
	const name = monthNames[calendarMonth - 1] ?? '';
	return `Tahun ${yearNumber}, ${name} (bulan ${month})`;
}

export function monthMessage(
	calendarMonth: number,
	yearNumber: number,
	waterQuality: number,
	delta: number
): string {
	const name = monthNames[calendarMonth - 1] ?? '';
	const rounded = Math.round(delta);
	const trend =
		rounded === 0 ? 'tetap' : `${rounded > 0 ? 'naik' : 'turun'} ${formatScore(Math.abs(rounded))}`;
	return `${name} tahun ${yearNumber}. Kualitas air ${formatScore(waterQuality)}, ${trend}.`;
}

export function statusChangedMessage(segment: SegmentIndex, status: WaterStatus): string {
	return `${segmentLabel(segment)} berubah menjadi ${waterStatusNames[status]}.`;
}

export function eventMessage(type: EventType, segment: SegmentIndex | null): string {
	const where = segment === null ? '' : ` di ${segmentLabel(segment)}`;
	return `Kabar Kali: ${eventNames[type]}${where}.`;
}

export function fishExtinctMessage(segment: SegmentIndex, group: FishGroup): string {
	return `Ikan ${fishGroupNames[group].toLowerCase()} hilang dari ${segmentLabel(segment)}.`;
}

export function fishReturnMessage(segment: SegmentIndex): string {
	return `Ikan sensitif kembali ke ${segmentLabel(segment)}.`;
}

export function floodMessage(segment: SegmentIndex | null, status: FloodStatus): string {
	const where = segment === null ? 'sungai' : segmentLabel(segment);
	return `${floodStatusNames[status]} di ${where}.`;
}

export function actionInstalledMessage(
	actionName: string,
	segment: SegmentIndex,
	cash: number | null
): string {
	const base = `${actionName} dipasang di ${segmentLabel(segment)}.`;
	if (cash === null) return base;
	return `${base} Kas tersisa ${formatBillions(cash)}.`;
}

export function actionRemovedMessage(actionName: string, segment: SegmentIndex): string {
	return `${actionName} dibongkar dari ${segmentLabel(segment)}.`;
}

export function actionUndoneMessage(actionName: string): string {
	return `${actionName} dibatalkan.`;
}

export function rewoundMessage(month: number): string {
	return `Kembali ke bulan ${month}. Riwayat setelahnya dihapus.`;
}

export function actionErrorMessage(
	code: ActionErrorCode,
	actionName: string,
	landUseName: string
): string {
	switch (code) {
		case 'incompatible_land_use':
			return `${actionName} tidak bisa dipasang di ${landUseName}.`;
		case 'already_installed':
			return `${actionName} sudah terpasang di sini.`;
		case 'insufficient_cash':
			return `Kas tidak cukup untuk ${actionName}.`;
		case 'lab_only':
			return `${actionName} hanya tersedia di Lab.`;
		case 'nothing_to_dismantle':
			return 'Tidak ada intervensi untuk dibongkar.';
		case 'invalid_target':
			return `${actionName} tidak bisa dipasang di sini.`;
		case 'unknown_action':
			return 'Aksi tidak dikenal.';
	}
}

export const floodgateTargetMessage = `${actionNames.floodgate} hanya bisa dipasang di Segmen 5 atau 6.`;

export function toolReadyDescription(actionName: string, cost: number | null): string {
	const costText = cost === null || cost === 0 ? '' : `, biaya ${formatBillions(cost)}`;
	return `${lab.toolSelected}: ${actionName}${costText}. ${lab.pressEnterInstall}`;
}

export function tileName(
	segment: SegmentIndex,
	side: TileSideKey,
	landUseLabel: string,
	stage: string | null,
	interventions: readonly string[],
	status: WaterStatus
): string {
	const parts = [landUseLabel];
	if (stage !== null) parts.push(`tahap ${stage}`);
	parts.push(...interventions);
	return `${segmentLabel(segment)}, ${sideNames[side]}: ${parts.join(', ')}. Air segmen: ${waterStatusNames[status]}.`;
}

export function waterCellName(
	segment: SegmentIndex,
	status: WaterStatus,
	pollutionIndex: number,
	fishScore: number,
	flood: FloodStatus
): string {
	const ip = pollutionIndex.toLocaleString('id-ID', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});
	return `${segmentLabel(segment)}, ${lab.waterCell}: ${waterStatusNames[status]}, IP ${ip}, ikan ${formatScore(fishScore)} dari 100, banjir ${floodStatusNames[flood]}. ${lab.pressEnterSegment}`;
}

export function trendText(delta: number): string {
	const rounded = Math.round(delta);
	if (rounded === 0) return 'tetap';
	return `${rounded > 0 ? 'naik' : 'turun'} ${formatScore(Math.abs(rounded))}`;
}

export function meterValueText(value: number, max: number, delta: number | null): string {
	const base = `${formatScore(value)} ${lab.outOf} ${formatScore(max)}`;
	if (delta === null) return base;
	return `${base}, ${trendText(delta)} ${lab.vsLastMonth}`;
}

export function chartSummary(name: string, from: number, to: number, months: number): string {
	return `${name} dari ${formatScore(from)} ke ${formatScore(to)} dalam ${months} bulan.`;
}

export function deltaLabel(delta: number): string {
	return formatSignedScore(delta);
}
