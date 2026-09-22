# Hulu Hilir

Laboratorium sungai virtual untuk siswa SMP dan SMA. Siswa menempatkan pabrik, permukiman, sawah, atau hutan di bantaran sungai 6 segmen, lalu melihat dampaknya ke kualitas air, ikan, dan banjir dari hulu sampai muara.

## Menjalankan

```sh
pnpm install
pnpm dev
```

## Perintah

```sh
pnpm dev
pnpm check
pnpm build
pnpm preview
```

Skrip pengujian dan pemeriksaan (`pnpm lint`, `pnpm test:unit`, `pnpm test:e2e`, `pnpm test:a11y`, `pnpm verify`) ditambahkan pada tahap F0.

## Mesin simulasi

Mesin simulasi di `src/lib/sim` adalah TypeScript murni tanpa Svelte, DOM, atau `Math.random`; semua keacakan lewat RNG mulberry32 ber-seed sehingga seed dan log aksi yang sama selalu menghasilkan riwayat identik. Modulnya: tipe dan konstanta, kalender, hidrologi, beban lahan, mutu air (Streeter-Phelps, Indeks Pencemaran Kepmen LH 115/2003), ekologi ikan, banjir, stok lambat, ekonomi dan kas, katalog aksi dan kejadian, model harian (cahaya, DO harian, fase bulan, pasang surut), langkah bulanan, replay, evaluasi misi, dampak keputusan, dan atribusi sebab. Tiga belas uji kalibrasi, uji properti fast-check, dan uji performa berjalan lewat `pnpm test:unit` dengan ambang cakupan baris 90%. Keputusan penafsiran dan konstanta yang disetel dicatat di [docs/METODOLOGI.md](docs/METODOLOGI.md).

## Stack

SvelteKit 2, Svelte 5 runes, TypeScript strict, Tailwind v4, GSAP, Valibot, Vitest, Playwright. Package manager pnpm, deploy Vercel.

Konfigurasi SvelteKit berada inline di `vite.config.ts`, bukan di `svelte.config.js`, mengikuti bawaan `sv` v0.17.
