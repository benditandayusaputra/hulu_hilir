import type { FishGroup, Indicators, WaterStatus } from '$lib/sim';

export const gallery = {
	title: 'Galeri Aset',
	intro:
		'Halaman pengembang untuk menilai gaya aset dunia dan antarmuka sebelum dipakai di Lab. Setiap aset dunia tampil di tiga tingkat zoom kamera: Peta DAS setengah piksel per unit dunia, Segmen satu piksel, dan Dekat dua piksel.',
	zooms: [
		{ label: 'Peta DAS', pixelsPerUnit: 0.5 },
		{ label: 'Segmen', pixelsPerUnit: 1 },
		{ label: 'Dekat', pixelsPerUnit: 2 }
	],
	worldHeading: 'Aset dunia',
	groups: {
		land: 'Lahan',
		interventions: 'Intervensi',
		water: 'Air sungai per status mutu',
		life: 'Kehidupan dan benda di sungai',
		markers: 'Penanda',
		backdrop: 'Latar'
	},
	assets: {
		plot: 'Petak lahan kosong',
		forestSeedling: 'Hutan tahap bibit',
		forestYoung: 'Hutan tahap muda',
		forestTeen: 'Hutan tahap remaja',
		forestMature: 'Hutan tahap matang',
		paddyPlanted: 'Sawah saat tanam',
		paddyHarvest: 'Sawah saat panen',
		houseCream: 'Rumah beratap bata, dinding krem',
		houseMint: 'Rumah beratap bata, dinding hijau muda',
		housePeach: 'Rumah beratap bata, dinding jingga muda',
		settlement: 'Permukiman dengan pagar',
		denseSettlement: 'Permukiman padat dengan jemuran dan gang',
		factory: 'Pabrik dengan cerobong dan pipa ke sungai',
		openLand: 'Lahan terbuka dengan tunggul',
		ipal: 'IPAL, tangki biru dan pipa bersih',
		wasteBank: 'Bank Sampah, gubuk kayu dan tiga tong',
		retentionPond: 'Kolam Retensi berpagar batu',
		greenbelt: 'Sabuk Hijau di bibir sungai',
		floodgate: 'Pintu Air dan rumah pompa',
		boat: 'Perahu nelayan',
		hyacinth: 'Eceng gondok',
		bottle: 'Sampah botol',
		bag: 'Sampah kantong plastik',
		can: 'Sampah kaleng',
		deadFish: 'Ikan mati mengapung',
		birdEgret: 'Burung kuntul',
		birdFlying: 'Burung terbang',
		signboard: 'Papan nama segmen tanpa teks',
		mountains: 'Gunung berkabut di hulu',
		hills: 'Bukit dan sawah di tengah',
		city: 'Kota di hilir',
		beach: 'Pantai di muara',
		sea: 'Laut'
	},
	fish: {
		sensitive: 'Siluet ikan sensitif',
		intermediate: 'Siluet ikan menengah',
		tolerant: 'Siluet ikan toleran'
	} satisfies Record<FishGroup, string>,
	riverSigns: {
		good: 'Air jernih berkilau, ikan terlihat di bawah permukaan.',
		light: 'Busa tipis di tepi, air sedikit kehijauan, bintik busa jarang.',
		moderate: 'Sampah mengapung, air keruh kecoklatan, guratan lumpur diagonal.',
		heavy: 'Lapisan gelap berminyak, sampah padat, ikan mati mengapung, buih kotor di tepi.'
	} satisfies Record<WaterStatus, string>,
	size: (width: number, height: number) => `${width} × ${height} unit dunia`,
	sceneHeading: 'Potongan tepi sungai',
	sceneIntro:
		'Contoh susunan pada skala Segmen: hutan, permukiman, pabrik, dan IPAL di tepi seberang, sungai yang makin keruh ke hilir, lalu sabuk hijau, sawah, bank sampah, dan kolam retensi di tepi dekat.',
	uiHeading: 'Antarmuka',
	uiIntro:
		'Contoh antarmuka lengkap di tema terang dan gelap. Rasio kontras diukur dari warna yang benar-benar dirender browser, bukan disalin dari tabel.',
	themes: { light: 'Tema terang', dark: 'Tema gelap' },
	hud: {
		cash: 'Rp 120 miliar',
		cashLabel: 'Kas',
		month: 'Bulan 3, musim hujan',
		meters: [
			{ kind: 'waterQuality', value: 72 },
			{ kind: 'fish', value: 58 },
			{ kind: 'floodRisk', value: 34 },
			{ kind: 'economy', value: 81 }
		] satisfies { kind: keyof Indicators; value: number }[]
	},
	hotbarHeading: 'Hotbar alat',
	slots: {
		normal: { label: 'Tanam Hutan', cost: '6' },
		selected: { label: 'IPAL Industri', cost: '12' },
		unavailable: { label: 'Pintu Air', cost: '30' }
	},
	roundHeading: 'Tombol bundar',
	roundButtons: {
		play: 'Putar',
		zoomIn: 'Perbesar',
		zoomOut: 'Perkecil',
		overview: 'Lihat seluruh sungai'
	},
	cardHeading: 'Kartu kertas',
	cardTitle: 'Narator',
	cardBody:
		'Segmen Kota berubah menjadi cemar sedang. BOD naik menjadi 8,2 mg/L karena limbah permukiman padat di hulunya.',
	cardLink: 'Lihat Inspektor',
	newsHeading: 'Kabar Kali',
	newsMasthead: 'Kabar Kali',
	newsEdition: 'Edisi bulan ke-3',
	newsHeadline: 'Hujan Ekstrem Guyur Hulu',
	newsBody:
		'Hujan tiga hari berturut-turut membuat debit sungai melonjak. Warga Segmen Kota diminta menjauhi bantaran, sementara petugas memantau muka air di pintu air hilir.',
	scrollHeading: 'Gulungan pengarahan',
	scrollTitle: 'Pabrik di Tepi Kali',
	scrollBody:
		'Pulihkan Segmen Tengah menjadi cemar ringan dalam 12 bulan tanpa menutup pabrik. Kas awal Rp 120 miliar.',
	stampHeading: 'Cap bintang',
	stampTitle: 'Misi selesai',
	stampLabel: (stars: number) => `${stars} dari 3 bintang`,
	contrastHeading: 'Rasio kontras',
	contrastPass: 'lulus',
	contrastFail: 'belum lulus',
	contrastPending: 'mengukur',
	contrastTarget: (target: string) => `target ${target}`,
	pairs: {
		inkBg: 'Teks utama di latar halaman',
		mutedBg: 'Teks sekunder di latar halaman',
		inkSurface: 'Teks di permukaan panel',
		inkPaper: 'Teks di kartu kertas',
		mutedPaper: 'Teks sekunder di kertas',
		inkPaper2: 'Teks di area sekunder kertas',
		linkPaper: 'Tautan di kertas',
		onPrimary: 'Teks tombol utama',
		accentPaper: 'Teks beraksen di kertas',
		dangerPaper: 'Teks galat di kertas',
		plankLight: 'Teks krem di serat kayu paling terang',
		plankDark: 'Teks krem di kayu slot tidak tersedia',
		news: 'Teks koran Kabar Kali',
		stamp: 'Cap bintang di kertas, grafis'
	}
} as const;
