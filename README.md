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
pnpm lint
pnpm check:no-comments
pnpm test:unit
pnpm test:e2e
pnpm test:a11y
pnpm verify
pnpm build
pnpm preview
```

`pnpm verify` menjalankan semuanya dan wajib hijau sebelum commit.

## Lab Bebas

Halaman `/lab` memakai mesin simulasi lewat `SimulationSession` (`src/lib/state/simulation.svelte.ts`). Panggung sungai adalah grid HTML dengan petak sebagai tombol sungguhan, satu tab stop dengan roving tabindex, nama petak dan sel air mengikuti pola pembaca layar di spesifikasi, dan pintasan satu huruf (P, N, 1 sampai 3, I, T, ?) yang bisa dimatikan di Pengaturan. Palet alat, panel aksi, kontrol waktu, indikator, inspektor segmen, Tampilan Tabel, dan grafik riwayat tersusun ulang di tiga lebar layar: lembar di ponsel, tab di tablet, tiga kolom di desktop. Preset awal dipilih lewat `?preset=alami|desa|kota-padat|lahan-kosong`. Keputusan desainnya dicatat di [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md).

## Mesin simulasi

Mesin simulasi di `src/lib/sim` adalah TypeScript murni tanpa Svelte, DOM, atau `Math.random`; semua keacakan lewat RNG mulberry32 ber-seed sehingga seed dan log aksi yang sama selalu menghasilkan riwayat identik. Modulnya: tipe dan konstanta, kalender, hidrologi, beban lahan, mutu air (Streeter-Phelps, Indeks Pencemaran Kepmen LH 115/2003), ekologi ikan, banjir, stok lambat, ekonomi dan kas, katalog aksi dan kejadian, model harian (cahaya, DO harian, fase bulan, pasang surut), langkah bulanan, replay, evaluasi misi, dampak keputusan, dan atribusi sebab. Tiga belas uji kalibrasi, uji properti fast-check, dan uji performa berjalan lewat `pnpm test:unit` dengan ambang cakupan baris 90%. Keputusan penafsiran dan konstanta yang disetel dicatat di [docs/METODOLOGI.md](docs/METODOLOGI.md).

## Variabel lingkungan

Salin `.env.example` menjadi `.env`. Kunci API hanya dibaca di server dan tidak pernah masuk bundle klien.

| Nama              | Contoh                                                    | Keterangan                                                                                            |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `PUBLIC_AI_MODE`  | `server` atau `off`                                       | Mengaktifkan narasi AI. Nilai lain atau kosong berarti `off`, semua fitur tetap jalan dengan template |
| `AI_LLM_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta/openai` | Endpoint OpenAI-compatible untuk chat completions                                                     |
| `AI_LLM_API_KEY`  | (rahasia)                                                 | Kunci penyedia, hanya di server                                                                       |
| `AI_LLM_MODEL`    | `gemini-3.1-flash-lite`                                   | Nama model untuk narasi                                                                               |
| `ALLOWED_ORIGIN`  | `https://hulu-hilir.vercel.app`                           | Origin tambahan yang boleh memanggil `/api/ai/*`; origin situs sendiri selalu diizinkan               |

Ketiga variabel `AI_LLM_*` menggantikan `AI_PROVIDER`, `GEMINI_API_KEY`, dan `AI_MODEL_*` di spesifikasi karena penyedia diakses lewat endpoint OpenAI-compatible yang sama, tanpa SDK khusus.

## Narator dan kejadian

Narator menjelaskan perubahan yang layak dijelaskan: kejadian, banjir, ikan mati, status segmen yang berpindah, efek intervensi setelah tiga bulan, dan ringkasan tahunan. Setiap angka dalam narasi AI divalidasi terhadap payload dari mesin di server dan di klien; narasi yang gagal diganti narasi template yang punya tiga variasi per pemicu. Kejadian penting membuka dialog "Kabar Kali" yang menjeda simulasi dan menawarkan tanggapan dari katalog. Uji e2e memakai server LLM tiruan (`tests/mock-llm.mjs`) dan konfigurasi kedua dengan `PUBLIC_AI_MODE=off`, sehingga tidak ada permintaan ke penyedia AI sungguhan saat `pnpm verify`.

## Stack

SvelteKit 2, Svelte 5 runes, TypeScript strict, Tailwind v4, GSAP, Valibot, Vitest, Playwright. Package manager pnpm, deploy Vercel.

Konfigurasi SvelteKit berada inline di `vite.config.ts`, bukan di `svelte.config.js`, mengikuti bawaan `sv` v0.17.
