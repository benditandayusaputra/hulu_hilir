import type { ActionType, EventType, Season } from '$lib/sim';
import { segmentLabel } from './lab';
import type { SegmentIndex } from '$lib/sim';

export const narration = {
	title: 'Narator',
	sourceAi: 'Narasi AI',
	sourceTemplate: 'Narasi otomatis',
	writing: 'Pemandu sedang menulis',
	history: 'Riwayat narasi',
	empty: 'Narator akan bicara saat ada perubahan yang layak dijelaskan.',
	pickTool: 'Pilih alat',
	factLabel: 'Tahukah kamu?',
	monthPrefix: 'Bulan',
	kabarKali: 'Kabar Kali',
	continueLabel: 'Lanjutkan',
	tabNarrator: 'Narator'
} as const;

export interface TemplateContext {
	segment: string;
	statusBefore: string;
	statusAfter: string;
	ip: string;
	ipBefore: string;
	oxygen: string;
	fish: string;
	detail: string;
	waterQuality: string;
	fishIndicator: string;
	floodRisk: string;
}

export type TemplateVariant = (context: TemplateContext) => string;

export const narrationTriggerKinds = [
	'event',
	'flood',
	'fish_kill',
	'status_change',
	'fish_extinct',
	'fish_return',
	'intervention_effect',
	'yearly_summary'
] as const;

export type NarrationTriggerKind = (typeof narrationTriggerKinds)[number];

export const triggerSentences: Record<NarrationTriggerKind, readonly TemplateVariant[]> = {
	status_change: [
		(c) =>
			`Air di ${c.segment} berubah dari ${c.statusBefore} menjadi ${c.statusAfter}. IP sekarang ${c.ip} dan DO ${c.oxygen} mg/L.`,
		(c) =>
			`${c.segment} kini berstatus ${c.statusAfter}, sebelumnya ${c.statusBefore}. Nilai IP ${c.ip}, oksigen terlarut ${c.oxygen} mg/L.`,
		(c) =>
			`Perhatikan ${c.segment}: statusnya bergeser dari ${c.statusBefore} ke ${c.statusAfter} dengan IP ${c.ip} dan DO ${c.oxygen} mg/L.`
	],
	event: [
		(c) =>
			`${c.detail} terjadi di ${c.segment}. Air di sana kini ${c.statusAfter} dengan IP ${c.ip}.`,
		(c) =>
			`Kabar dari ${c.segment}: ${c.detail.toLowerCase()}. Statusnya ${c.statusAfter}, IP ${c.ip}.`,
		(c) =>
			`${c.detail} melanda ${c.segment}, dan air di sana tercatat ${c.statusAfter} dengan IP ${c.ip}.`
	],
	flood: [
		(c) =>
			`Banjir merendam ${c.segment} karena debit puncak melampaui kapasitas alur. Air tercatat ${c.statusAfter} setelah luapan.`,
		(c) =>
			`${c.segment} kebanjiran. Alur sungai tidak sanggup menampung limpasan, dan airnya kini ${c.statusAfter}.`,
		(c) =>
			`Air meluap di ${c.segment}. Setelah banjir, sampah dan kotoran ikut mengalir sehingga status air ${c.statusAfter}.`
	],
	fish_kill: [
		(c) =>
			`Ikan mati massal di ${c.segment}. Oksigen terlarut turun ke ${c.oxygen} mg/L dan skor ikan tinggal ${c.fish}.`,
		(c) =>
			`${c.segment} kehilangan banyak ikan sekaligus karena DO hanya ${c.oxygen} mg/L. Skor ikan kini ${c.fish}.`,
		(c) =>
			`Kematian ikan terjadi di ${c.segment}: DO ${c.oxygen} mg/L terlalu rendah, skor ikan jatuh ke ${c.fish}.`
	],
	fish_extinct: [
		(c) =>
			`Kelompok ikan ${c.detail} hilang dari ${c.segment}. Air di sana ${c.statusAfter} dengan DO ${c.oxygen} mg/L.`,
		(c) =>
			`${c.segment} tidak lagi punya ikan ${c.detail}. Habitatnya rusak, DO tinggal ${c.oxygen} mg/L.`,
		(c) =>
			`Ikan ${c.detail} punah lokal di ${c.segment} karena airnya ${c.statusAfter} dan DO ${c.oxygen} mg/L.`
	],
	fish_return: [
		(c) =>
			`Ikan sensitif kembali ke ${c.segment} setelah airnya membaik menjadi ${c.statusAfter} dengan DO ${c.oxygen} mg/L.`,
		(c) =>
			`Kabar baik dari ${c.segment}: ikan sensitif muncul lagi. Status air ${c.statusAfter}, DO ${c.oxygen} mg/L.`,
		(c) =>
			`${c.segment} kedatangan ikan sensitif lagi dari segmen tetangga karena DO sudah ${c.oxygen} mg/L.`
	],
	intervention_effect: [
		(c) =>
			`Tiga bulan setelah ${c.detail} dipasang, IP ${c.segment} bergeser dari ${c.ipBefore} menjadi ${c.ip}. Statusnya ${c.statusAfter}.`,
		(c) =>
			`${c.detail} sudah bekerja tiga bulan di ${c.segment}. IP berubah dari ${c.ipBefore} ke ${c.ip}, air kini ${c.statusAfter}.`,
		(c) =>
			`Lihat efek ${c.detail} di ${c.segment}: IP dari ${c.ipBefore} menjadi ${c.ip}, status ${c.statusAfter}.`
	],
	yearly_summary: [
		(c) =>
			`Satu tahun berlalu. Kualitas air sungai bernilai ${c.waterQuality}, kehidupan ikan ${c.fishIndicator}, dan risiko banjir ${c.floodRisk}. ${c.segment} adalah segmen paling tercemar dengan IP ${c.ip}.`,
		(c) =>
			`Rapor tahunan: kualitas air ${c.waterQuality}, ikan ${c.fishIndicator}, risiko banjir ${c.floodRisk}. Titik terburuk ada di ${c.segment} dengan IP ${c.ip}.`,
		(c) =>
			`Dua belas bulan sudah lewat. Indikator sungai: kualitas air ${c.waterQuality}, ikan ${c.fishIndicator}, banjir ${c.floodRisk}. ${c.segment} paling butuh perhatian, IP ${c.ip}.`
	]
};

export const causeSentences: readonly ((source: string, percent: string) => string)[] = [
	(source, percent) => `Penyebab terbesar adalah ${source}, yang menyumbang ${percent}% beban BOD.`,
	(source, percent) => `Sumber beban utamanya ${source}, sekitar ${percent}% dari BOD yang masuk.`,
	(source, percent) => `${source} menjadi penyumbang terbesar dengan ${percent}% beban BOD.`
];

export const seasonSentences: Record<Season, readonly string[]> = {
	wet: [
		'Musim hujan menambah debit dan mengencerkan limbah, tetapi lumpur ikut terbawa.',
		'Debit sedang tinggi karena musim hujan, sehingga limbah lebih encer walau air keruh.',
		'Hujan yang sering turun membuat sungai deras dan limpasan lumpur bertambah.'
	],
	transition: [
		'Musim sedang beralih, debit sungai mulai berubah.',
		'Ini bulan peralihan, hujan datang tidak menentu.',
		'Debit sungai di bulan peralihan tidak setinggi musim hujan.'
	],
	dry: [
		'Kemarau membuat debit kecil, sehingga limbah lebih pekat dan air lebih hangat.',
		'Saat kemarau seperti sekarang, sungai dangkal dan pencemaran terasa lebih berat.',
		'Debit sungai sedang rendah karena kemarau, limbah yang sama jadi lebih terasa.'
	]
};

export const meaningSentences: readonly ((statusAfter: string) => string)[] = [
	(status) =>
		status === 'Baik'
			? 'Ikan sensitif bisa hidup nyaman di air seperti ini.'
			: 'Ikan sensitif makin sulit bertahan, dan warga di hilir ikut merasakan airnya.',
	(status) =>
		status === 'Baik'
			? 'Artinya oksigen cukup untuk semua kelompok ikan.'
			: 'Artinya oksigen berkurang dan air kurang aman dipakai warga.',
	(status) =>
		status === 'Baik'
			? 'Bagi warga, air ini masih layak untuk kegiatan sehari-hari.'
			: 'Bagi warga, air ini tidak lagi nyaman dipakai, dan ikan pun tertekan.'
];

export const suggestionSentences: readonly ((action: string) => string)[] = [
	(action) => `Coba pasang ${action}.`,
	(action) => `Satu langkah yang bisa dicoba: ${action}.`,
	(action) => `${action} bisa membantu di sini.`
];

export const eventNamesForFacts: Record<string, string> = {
	'Ledakan eceng gondok': 'fact_hyacinth',
	'Kemarau panjang': 'fact_dry_season',
	'Longsor tebing': 'fact_tss',
	'Pembuangan limbah ilegal': 'fact_chromium',
	'Hujan ekstrem': 'fact_forest_runoff',
	'Banjir rob': 'fact_forest_runoff'
};

export interface EventNews {
	title: string;
	body: string;
}

const eventNewsCatalog: Record<EventType, EventNews> = {
	heavy_rain: {
		title: 'Hujan lebat mengguyur daerah aliran sungai',
		body: 'Hujan lebat turun sepanjang hari. Debit sungai naik dan lumpur dari lahan terbuka ikut terbawa ke {segmen}.'
	},
	extreme_rain: {
		title: 'Hujan ekstrem, warga bantaran diminta waspada',
		body: 'Hujan ekstrem mengguyur hulu sampai hilir. Alur sungai diuji habis-habisan, terutama di {segmen} yang bantarannya minim hutan.'
	},
	drought: {
		title: 'Kemarau panjang, sungai menyusut',
		body: 'Hujan tidak turun berbulan-bulan. Debit sungai menyusut, air lebih hangat, dan limbah yang sama terasa lebih pekat di {segmen}.'
	},
	illegal_dumping: {
		title: 'Warga temukan buangan limbah gelap di {segmen}',
		body: 'Saluran tersembunyi mengalirkan limbah pekat berwarna gelap ke sungai pada malam hari. Kandungan BOD dan kromium di {segmen} melonjak bulan ini.'
	},
	hyacinth_bloom: {
		title: 'Eceng gondok menutup permukaan {segmen}',
		body: 'Hamparan eceng gondok meluas dengan cepat. Arus melambat dan oksigen dari udara sulit masuk ke air di {segmen}.'
	},
	landslide: {
		title: 'Tebing longsor di {segmen}, air keruh pekat',
		body: 'Tebing tanpa pepohonan runtuh setelah hujan deras. Ribuan kilogram lumpur masuk sungai dan mengendap di {segmen}.'
	},
	litter_shipment: {
		title: 'Sampah kiriman menumpuk di {segmen}',
		body: 'Banjir di hulu mendorong sampah ke hilir. Tumpukan sampah kini mengganggu aliran di {segmen}.'
	},
	fish_kill: {
		title: 'Ikan mati mengambang di {segmen}',
		body: 'Warga menemukan ikan mati mengambang sejak subuh. Oksigen terlarut anjlok sehingga ikan tidak sempat menyelamatkan diri di {segmen}.'
	},
	fish_return: {
		title: 'Ikan sensitif kembali terlihat di {segmen}',
		body: 'Pemancing melaporkan ikan sungai jernih yang lama menghilang kini kembali. Air di {segmen} sudah cukup bersih untuk mereka.'
	},
	community: {
		title: 'Komunitas peduli sungai bersih-bersih di {segmen}',
		body: 'Warga dan bank sampah setempat bergotong royong mengangkat sampah dari bantaran {segmen} tanpa biaya dari kas.'
	},
	ecotourism: {
		title: 'Ekowisata tumbuh di {segmen}',
		body: 'Air yang bersih berbulan-bulan mengundang pengunjung. Warga {segmen} membuka jasa wisata dan lapangan kerja baru.'
	},
	flood: {
		title: 'Banjir merendam permukiman di {segmen}',
		body: 'Debit puncak melampaui kapasitas alur. Rumah di bantaran {segmen} terendam, sawah gagal panen, dan sampah terbawa ke hilir.'
	},
	rob_flood: {
		title: 'Banjir rob merendam muara',
		body: 'Pasang tertinggi bertemu hujan lebat. Air laut mendorong masuk dan {segmen} terendam walau debit hulu tidak besar.'
	}
};

export function eventNewsOf(type: EventType, segment: SegmentIndex | null): EventNews {
	const where = segment === null ? 'sungai' : segmentLabel(segment);
	const item = eventNewsCatalog[type];
	return {
		title: item.title.replaceAll('{segmen}', where),
		body: item.body.replaceAll('{segmen}', where)
	};
}

export interface EventResponse {
	label: string;
	action: ActionType | null;
}

export const eventResponses: Partial<Record<EventType, readonly EventResponse[]>> = {
	illegal_dumping: [
		{ label: 'Sidak dan segel saluran', action: 'seal_illegal_outlet' },
		{ label: 'Abaikan', action: null }
	],
	hyacinth_bloom: [
		{ label: 'Bersihkan sekarang', action: 'clear_hyacinth' },
		{ label: 'Nanti', action: null }
	]
};
