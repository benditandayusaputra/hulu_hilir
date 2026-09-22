export interface Fact {
	id: string;
	text: string;
}

export const facts: readonly Fact[] = [
	{
		id: 'fact_do_fish',
		text: 'Ikan sensitif seperti ikan dewa butuh oksigen terlarut di atas 6 mg/L, sedangkan lele masih bertahan di 1,5 mg/L.'
	},
	{
		id: 'fact_bod',
		text: 'BOD adalah oksigen yang dipakai bakteri untuk mengurai limbah organik. Makin tinggi BOD, makin sedikit oksigen yang tersisa untuk ikan.'
	},
	{
		id: 'fact_coliform',
		text: 'Fecal coliform adalah bakteri dari kotoran. Baku mutu kelas 2 membatasinya 1.000 MPN per 100 mL.'
	},
	{
		id: 'fact_tss',
		text: 'Air keruh oleh TSS menghalangi cahaya dan menutup insang ikan. Lahan terbuka mengirim lumpur puluhan kali lebih banyak daripada hutan.'
	},
	{
		id: 'fact_forest_runoff',
		text: 'Hutan meresapkan sebagian besar air hujan, sehingga debit puncak banjir di hilir jauh lebih kecil daripada dari lahan terbuka.'
	},
	{
		id: 'fact_hyacinth',
		text: 'Eceng gondok meledak saat fosfat tinggi dan arus lambat, lalu menghalangi oksigen masuk dari udara.'
	},
	{
		id: 'fact_chromium',
		text: 'Kromium heksavalen dari limbah industri beracun bagi ikan bahkan pada kadar 0,05 mg/L.'
	},
	{
		id: 'fact_greenbelt',
		text: 'Sabuk hijau di tepi sungai menyaring lumpur dan pupuk dari limpasan sebelum mencapai air.'
	},
	{
		id: 'fact_dry_season',
		text: 'Saat kemarau debit sungai turun, sehingga limbah yang sama menjadi lebih pekat dan air lebih hangat.'
	},
	{
		id: 'fact_ipal',
		text: 'IPAL menurunkan BOD limbah sampai 85% sebelum air dibuang ke sungai.'
	}
];

export const factIds: readonly string[] = facts.map((fact) => fact.id);

export function factById(id: string): Fact | null {
	return facts.find((fact) => fact.id === id) ?? null;
}
