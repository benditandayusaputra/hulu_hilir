export const ui = {
	siteName: 'Hulu Hilir',
	tagline: 'Laboratorium sungai virtual untuk siswa SMP dan SMA',
	skipToContent: 'Lewati ke konten utama',
	mainNavLabel: 'Utama',
	footerNavLabel: 'Footer',
	home: 'Beranda',
	settings: 'Pengaturan',
	close: 'Tutup',
	loading: 'Memuat',
	copyright: 'Hulu Hilir, karya siswa untuk belajar mutu air sungai.'
} as const;

export const settingsContent = {
	title: 'Pengaturan',
	description:
		'Pilihan tampilan dan gerak berlaku di seluruh halaman dan tersimpan di perangkat ini.',
	theme: {
		legend: 'Tema',
		system: 'Ikuti sistem',
		light: 'Terang',
		dark: 'Gelap'
	},
	textSize: {
		legend: 'Ukuran teks',
		normal: 'Normal',
		large: 'Besar',
		larger: 'Sangat besar'
	},
	motion: {
		legend: 'Gerak',
		system: 'Ikuti sistem',
		full: 'Penuh',
		reduced: 'Dikurangi'
	},
	narration: {
		legend: 'Frekuensi narasi',
		off: 'Mati',
		important: 'Hanya yang penting',
		normal: 'Normal'
	},
	narratorVoice: 'Suara narator',
	scientificMode: 'Mode Ilmiah',
	keyboardShortcuts: 'Pintasan keyboard satu huruf'
} as const;
