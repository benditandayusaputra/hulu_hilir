# Hulu Hilir

Laboratorium sungai virtual untuk siswa SMP dan SMA. Siswa menempatkan pabrik, permukiman, sawah, atau hutan di bantaran sungai 6 segmen, lalu melihat dampaknya ke kualitas air, ikan, dan banjir dari hulu sampai muara.

Spesifikasi lengkap ada di `docs/SPEK.md`. Baca bagian yang relevan sebelum mengerjakan sesuatu, bukan seluruh file. Peta bagian:

| Butuh | Bagian |
| --- | --- |
| Rumus, konstanta, aksi, kejadian, uji kalibrasi | 4 |
| Siklus harian, matahari, bulan, pasang surut | 4.15 |
| Kontrak AI, validasi angka, penyedia | 5 |
| Halaman, misi, jenjang SMP dan SMA | 6 |
| Daftar komponen dan propsnya | 7 |
| Token warna, gerak, mode 2D dan 3D | 8 |
| Aturan aksesibilitas | 9 |
| Skema penyimpanan dan file rapor | 10 |
| Pengujian dan anggaran performa | 11 |
| Urutan tahap F0 sampai F10 | 12 |

## Aturan yang tidak bisa ditawar

1. **Tanpa komentar di kode.** Dilarang `//`, `/* */`, JSDoc, `<!-- -->` di Svelte dan HTML, komentar CSS, dan `#` di YAML. Berlaku juga di file konfigurasi, file uji, dan aset SVG. Dilarang `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `svelte-ignore`. Kalau butuh penjelasan, pakai nama yang deskriptif atau tulis di `docs/`. Markdown boleh berisi penjelasan.
2. **Tanpa em dash** di teks antarmuka, konten, dan dokumen. Pakai koma, titik dua, tanda kurung, atau susun ulang kalimat.
3. **Tanpa template dan tanpa UI kit bertampilan jadi.** Mulai dari SvelteKit minimal. Dilarang shadcn-svelte, Skeleton, Flowbite, DaisyUI, Material, dan template situs apa pun, karena tampilannya bawaan dan itu yang dinilai. Primitif UI dibangun sendiri di atas elemen HTML native: `<button>`, `<dialog>`, `<details>`, `<input type="range">`, radio dalam `<fieldset>`. Boleh memakai `@floating-ui/dom` untuk perhitungan posisi tooltip dan popover, karena itu library matematika penempatan, bukan komponen bertampilan.
4. **Mesin simulasi murni.** `src/lib/sim` tidak mengimpor Svelte, DOM, atau `Math.random`. Semua keacakan lewat RNG ber-seed. Seed dan log aksi yang sama wajib menghasilkan riwayat identik.
5. **Aksesibilitas bukan tambahan.** Panggung sungai memakai grid HTML dan SVG dengan petak sebagai `<button>`, bukan canvas. Setiap fitur baru harus bisa dijalankan dengan keyboard saja.
6. **AI tidak pernah menghitung.** Semua angka dari mesin simulasi. AI hanya menjelaskan, meramu kejadian, dan menilai, dan setiap angka di keluarannya divalidasi terhadap payload.
7. **Setiap fitur inti jalan tanpa AI.** Dengan `PUBLIC_AI_MODE=off` aplikasi tetap utuh.

## Stack

SvelteKit 2, Svelte 5 runes, TypeScript strict, Tailwind v4, GSAP, Valibot, Vitest, Playwright, deploy Vercel. Package manager pnpm.

Hanya runes (`$state`, `$derived`, `$effect`, `$props`) dan atribut event baru (`onclick`). Dilarang `export let`, `$:`, `on:click`. Dilarang `any`, `as unknown as`, dan non-null assertion `!`.

Semua teks antarmuka bahasa Indonesia dan tinggal di `src/lib/content/`. Identifier kode bahasa Inggris. Tidak ada angka ajaib: konstanta model tinggal di `src/lib/sim/constants.ts`.

## Perintah

```
pnpm dev
pnpm check
pnpm lint
pnpm check:no-comments
pnpm test:unit
pnpm test:e2e
pnpm test:a11y
pnpm verify
```

`pnpm verify` menjalankan semuanya dan wajib hijau sebelum tahap dianggap selesai.

## Cara kerja yang diharapkan

- Kerjakan satu tahap (F0 sampai F10 di bagian 12) per sesi. Jangan lompat tahap.
- Mesin simulasi lebih dulu, antarmuka menyusul. Tiap fungsi mesin ditulis bersama ujinya.
- Uji kalibrasi 1 sampai 13 di bagian 4.14 dan 4.15 adalah kontrak. Kalau konstanta diubah, uji itu tetap harus lulus.
- Selesai satu bagian berarti `pnpm verify` hijau, bukan sekadar kode tertulis.
- Kalau spesifikasi terasa keliru atau bertabrakan, katakan dan usulkan perbaikan sebelum menulis kode. Jangan diam-diam menyimpang.
- Jangan tambah dependensi di luar yang disebut spesifikasi tanpa bertanya lebih dulu.

## Git

Folder proyek `hulu-hilir`, remote `origin` di `https://github.com/benditandayusaputra/hulu_hilir.git`, branch utama `main`. Commit dan push dikerjakan sendiri oleh Claude lewat perintah `/commit`.

- Format pesan: `:gitmoji: Kalimat imperatif bahasa Indonesia`, maksimal 72 karakter di baris pertama.
- Pesan menyebut pekerjaan nyata, bukan nomor tahap, bukan nama berkas, bukan "update" tanpa objek. Contoh benar: `:sparkles: Tambah perhitungan oksigen terlarut per segmen`, `:wheelchair: Navigasi keyboard petak bantaran`. Contoh salah: `update F1`, `perbaikan kecil`, `fix constants.ts`.
- Kode gitmoji: `:tada:` mulai bagian besar, `:sparkles:` fitur, `:lipstick:` tampilan, `:wheelchair:` aksesibilitas, `:white_check_mark:` uji, `:bug:` bug, `:recycle:` refactor, `:zap:` performa, `:memo:` dokumentasi, `:construction_worker:` CI, `:wrench:` konfigurasi, `:fire:` hapus, `:seedling:` data konten, `:lock:` keamanan.
- Satu commit untuk satu pekerjaan yang berdiri sendiri, bukan satu commit per berkas dan bukan satu commit untuk seluruh tahap.
- `pnpm verify` wajib hijau sebelum commit. Kalau gagal, jangan commit: laporkan apa yang gagal.
- Dilarang keras menambahkan `Co-Authored-By`, `Claude-Session`, `Generated with`, atau nama alat AI apa pun ke pesan commit, deskripsi PR, dan README.
- Push ke branch kerja lalu `origin`. Dilarang `git push --force`, `git reset --hard`, dan `git rebase`.
