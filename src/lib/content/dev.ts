import type { WaterStatus } from '$lib/sim';

export const gallery = {
	title: 'Galeri Aset',
	intro:
		'Halaman pengembang untuk menilai gaya aset dunia dan antarmuka sebelum dipakai di Lab. Semua aset dunia digambar pada skala yang sama, dua piksel per unit dunia, sehingga tebal garis dan proporsinya bisa dibandingkan langsung.',
	worldHeading: 'Aset dunia',
	assets: {
		forestMature: 'Rumpun pohon matang',
		house: 'Rumah beratap bata',
		factory: 'Pabrik dengan cerobong dan pipa ke sungai'
	},
	riverHeading: 'Potongan sungai per status mutu',
	riverIntro:
		'Setiap status membawa tanda benda, sehingga mutu air terbaca tanpa harus membedakan warna.',
	riverSigns: {
		good: 'Air jernih berkilau, ikan terlihat di bawah permukaan.',
		light: 'Busa tipis di tepi, air sedikit kehijauan, bintik busa jarang.',
		moderate: 'Sampah mengapung, air keruh kecoklatan, guratan lumpur diagonal.',
		heavy: 'Lapisan gelap berminyak, sampah padat, ikan mati mengapung, buih kotor di tepi.'
	} satisfies Record<WaterStatus, string>,
	hudHeading: 'Papan kayu HUD',
	hudIntro:
		'Teks di papan adalah teks HTML asli. Papan melebar mengikuti wadahnya, sedangkan paku dan serat kayu tetap utuh.',
	plank: {
		title: 'Kali Bening',
		cash: 'Kas Rp 120 miliar',
		month: 'Bulan 3, musim hujan',
		fish: 'Ikan 72 dari 100',
		narrowTitle: 'Segmen 2 Hulu'
	},
	size: (width: number, height: number) => `${width} × ${height} unit dunia`
} as const;
