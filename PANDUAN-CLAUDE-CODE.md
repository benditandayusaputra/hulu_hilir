# Menjalankan Claude Code di VS Code untuk Hulu Hilir

Panduan ini mengubah spesifikasi menjadi aplikasi jadi. Urutannya: siapkan repo, siapkan Claude Code, lalu jalankan tahap F0 sampai F10 satu per satu.

## 1. Yang kamu kerjakan sendiri di Terminal

Hanya tiga perintah. Sisanya dikerjakan Claude Code.

```
mkdir -p ~/Documents/hulu-hilir
cd ~/Documents/hulu-hilir
unzip ~/Downloads/hulu-hilir-starter.zip -d .
```

Pastikan hasilnya benar:

```
ls -la
```

Harus terlihat `CLAUDE.md`, `PANDUAN-CLAUDE-CODE.md`, `docs/`, `.claude/`, dan `.githooks/`. Folder masih belum berisi proyek SvelteKit, dan itu memang disengaja.

Buka di VS Code:

```
code .
```

Kalau perintah `code` belum dikenali, buka VS Code manual, tekan `Cmd+Shift+P`, jalankan "Shell Command: Install 'code' command in PATH", lalu ulangi.

## 2. Siapkan Claude Code di VS Code

1. Di VS Code tekan `Cmd+Shift+X`, cari **Claude Code**, klik Install. Butuh VS Code 1.94 ke atas.
2. Buka `CLAUDE.md` supaya ikon Spark muncul di pojok kanan atas editor, lalu klik ikonnya untuk membuka panel Claude.
3. Masuk dengan akun Claude berbayar. Tidak perlu API key.
4. Ketik `/model fable`. Ini memilih Claude Fable 5.1, model paling kuat untuk tugas panjang. Butuh Claude Code v2.1.257 ke atas, jadi jalankan `claude update` dulu bila perlu.
5. Ketik `/status` untuk memastikan `.claude/settings.json` terbaca.

Satu catatan macOS: pada macOS Tahoe ke atas, pintasan `Cmd+Esc` direbut Game Overlay sistem. Kalau pintasan itu tidak jalan, matikan lewat System Settings, Keyboard, Keyboard Shortcuts, Game Controllers, hapus centang Game Overlay.

Catatan biaya: di sebagian paket langganan, pemakaian Fable ditagihkan ke usage credits, dan Claude Code akan menampilkan konfirmasi sebelum permintaan pertama. Kalau kredit menipis, turunkan ke `/model opus` atau `/model sonnet` untuk tahap yang tidak berat (F6, F8, F10), dan simpan Fable untuk F1, F2, F2b, dan F2c.

Dua kebiasaan yang layak dipakai sejak awal:

- **Mode Plan** untuk tahap besar (F1, F2, F4), bukan untuk Bootstrap. Klik indikator mode di bawah kotak prompt, pilih Plan. Claude menulis rencana sebagai dokumen Markdown yang bisa kamu komentari sebelum satu baris kode pun ditulis.
- **Checkpoint.** Arahkan kursor ke pesanmu, klik tombol rewind untuk mengembalikan kode ke titik itu bila sebuah tahap melenceng.

## 3. Aturan main tiap sesi

- Satu sesi untuk satu tahap. Setelah tahap selesai dan `pnpm verify` hijau, jalankan `/commit`, lalu mulai percakapan baru (`Cmd/Ctrl+N` atau Open in New Tab). Sesi baru membuat konteks bersih dan biaya lebih murah.
- Selalu mulai dengan hasil akhir yang diinginkan, bukan daftar langkah. Fable lebih baik kalau diberi tujuan dan ruang untuk merencanakan sendiri.
- Tidak perlu mengingatkan "jangan lupa tes" atau "verifikasi dulu". Fable memverifikasi pekerjaannya sendiri, dan pengingat semacam itu justru memboroskan token.
- Kalau ada yang salah, jangan menambal di prompt berikutnya. Rewind ke checkpoint sebelum kesalahan, perbaiki instruksinya, jalankan ulang.

### Perintah /commit

Ketik `/commit` di panel Claude. Perintah ini membaca `git status` dan `git diff`, mengelompokkan perubahan menjadi commit yang berdiri sendiri, menulis pesan gitmoji bahasa Indonesia sesuai pekerjaan nyata, menjalankan `pnpm verify`, lalu push ke `origin`.

Bisa diberi catatan tambahan: `/commit pisahkan perubahan konstanta dari perubahan uji`.

Contoh pesan yang dihasilkan:

```
:sparkles: Tambah perhitungan oksigen terlarut per segmen
:white_check_mark: Kunci tiga belas uji kalibrasi mesin simulasi
:wheelchair: Navigasi keyboard petak bantaran dengan roving tabindex
:lipstick: Terapkan skala warna mutu air aman buta warna
```

Kalau `pnpm verify` gagal, Claude berhenti dan melapor, tidak commit.

## 4. Prompt per tahap

Prompt di bawah bisa disalin apa adanya. Semua merujuk ke `docs/SPEK.md` supaya Claude membaca sendiri detailnya. Mulai dari Bootstrap, baru F0.

### Bootstrap: buat proyek dan sambungkan ke GitHub

Jalankan ini di sesi pertama, dengan mode Manual atau Auto (jangan Plan, karena ini tugas mekanis).

```
Folder ini sudah berisi CLAUDE.md, docs/SPEK.md, .claude/, dan .githooks/,
tetapi belum berisi proyek SvelteKit. Tugasmu menyiapkannya.

1. Scaffold SvelteKit ke dalam folder ini tanpa prompt interaktif:
   pnpm dlx sv create . --template minimal --types ts --no-add-ons --install pnpm --no-dir-check

2. Pasang Tailwind v4 secara manual, jangan lewat add-on interaktif:
   pnpm add -D tailwindcss @tailwindcss/vite
   Daftarkan plugin @tailwindcss/vite di vite.config.ts, buat src/app.css berisi
   @import "tailwindcss", dan impor app.css di src/routes/+layout.svelte.

3. Pastikan .gitignore memuat node_modules, .svelte-kit, build, .vercel, dan .env*
   kecuali .env.example.

4. Siapkan git:
   git init
   git config user.name "Bendi Tandayu Saputra"
   git config user.email "benditandayusaputra@gmail.com"
   git config core.hooksPath .githooks
   chmod +x .githooks/commit-msg

5. Pastikan pnpm dev bisa jalan dan halaman kosongnya terbuka, lalu hentikan servernya.

6. Commit dan sambungkan ke GitHub:
   git add .
   git commit -m ":tada: Siapkan proyek SvelteKit, spesifikasi, dan aturan kerja"
   git branch -M main
   git remote add origin https://github.com/benditandayusaputra/hulu_hilir.git
   git push -u origin main

   Kalau push ditolak karena repo sudah berisi README bawaan, jalankan
   git pull --rebase origin main lalu ulangi push.

7. Terakhir tampilkan git log -1 --format='%an <%ae>%n%B' supaya saya bisa
   memastikan pesan commit bersih dari jejak AI.

Jangan mengerjakan tahap F0 di sesi ini. Berhenti setelah push berhasil.
```

Setelah ini selesai, mulai percakapan baru dan lanjut ke F0.

### F0 Fondasi

```
Baca CLAUDE.md dan bagian 2, 3, 8, dan 11 di docs/SPEK.md.

Proyek SvelteKit dan Tailwind sudah terpasang dari sesi Bootstrap. Sekarang
lengkapi fondasinya sampai `pnpm verify` hijau: TypeScript strict dengan
noUncheckedIndexedAccess dan exactOptionalPropertyTypes, token warna dan
tipografi bagian 8.2 dan 8.3 di app.css, font Fraunces dan Plus Jakarta Sans
self-host woff2, ESLint dan Prettier, Vitest, Playwright dengan axe, skrip
scripts/check-no-comments.ts sesuai bagian 11.2 lengkap dengan uji fixture
jebakannya, seluruh skrip pnpm di bagian 11.1, hook pre-commit, dan workflow
CI GitHub Actions.

Tambahkan primitif Button, Dialog, Announcer, SkipLink, AppShell, state
Pengaturan, dan modul gerak GSAP dengan matchMedia.

Selesai berarti: pnpm verify hijau, axe nol pelanggaran di halaman kosong,
dan pemeriksa komentar lulus uji fixture-nya.
```

### F1 Mesin simulasi

```
Baca bagian 4 docs/SPEK.md seluruhnya, termasuk 4.15.

Bangun mesin simulasi di src/lib/sim sebagai TypeScript murni: tipe,
konstanta, hidrologi, mutu air dan Indeks Pencemaran, ekologi ikan, banjir,
stok, ekonomi, kejadian, RNG mulberry32, replay, evaluasi misi,
measureDecisionImpact, attributeCauses, dan model harian 4.15.

Tulis ujinya bersama kodenya. Tiga belas uji kalibrasi di 4.14 dan 4.15
adalah kontrak: semuanya harus lulus. Tambahkan uji berbasis properti dengan
fast-check untuk NaN, rentang, monotonik, dan determinisme.

Kalau sebuah konstanta membuat uji kalibrasi tidak mungkin lulus, setel
konstantanya dan catat perubahannya di docs/METODOLOGI.md, jangan longgarkan
ujinya.
```

### F2 Panggung dan Lab

```
Baca bagian 6.3, 7, 8, dan 9 docs/SPEK.md.

Bangun halaman /lab: panggung sungai 6 segmen sebagai grid HTML dan SVG
dengan petak berupa <button>, palet alat, panel aksi, kontrol waktu,
indikator, inspektor segmen, Tampilan Tabel, dan grafik riwayat.

Navigasi keyboard mengikuti tabel 9.2 persis, dan pengumuman pembaca layar
mengikuti 9.3. Semua interaksi wajib punya jalur non-seret.

Selesai berarti: satu misi bisa dimainkan penuh hanya dengan keyboard, axe
nol pelanggaran, dan tidak ada gulir mendatar di lebar 320 px.
```

### F3 Narator dan kejadian

```
Baca bagian 5 docs/SPEK.md.

Bangun narator template lebih dulu di src/lib/ai: pendeteksi pemicu,
minimal tiga variasi kalimat per pemicu, dan dialog kejadian Kabar Kali.
Setelah itu tambahkan jalur AI: antarmuka AiProvider dengan implementasi
geminiProvider dan anthropicProvider, server route, validator angka 5.2,
rate limit, dan fallback ke template.

Aplikasi harus tetap utuh dengan PUBLIC_AI_MODE=off. Buktikan dengan uji e2e
yang memastikan tidak ada permintaan ke /api/ai saat mode itu aktif.
```

### F4 Misi dan rapor

```
Baca bagian 6.4, 6.11, dan 10 docs/SPEK.md.

Bangun tujuh misi termasuk Oksigen Subuh dan Rob di Muara, pengarahan,
pelacak target, evaluasi dan bintang, Dampak Keputusan, Catatan Pemandu,
kartu Prediksi Amati Jelaskan, dan unduh file rapor .hulu.

Untuk setiap misi tulis satu solusi referensi sebagai fixture uji, dan
pastikan solusi itu meraih 3 bintang. Uji ini yang menjaga misi tetap bisa
dimenangkan setiap kali konstanta berubah.
```

### F5 Beranda

```
Baca bagian 6.2 dan 8.4 docs/SPEK.md.

Bangun beranda: cerita scroll dari mata air sampai muara dengan GSAP
ScrollTrigger, dan mini lab "Bagaimana jika?" yang memakai mesin simulasi
asli, bukan animasi palsu.

Pin hanya di lebar 768 px ke atas, tanpa scroll-jacking. Dengan reduced
motion semua adegan menjadi bagian biasa tanpa animasi. Target Lighthouse
Performance minimal 90 di mobile.
```

### F6 Metodologi dan Aksesibilitas

```
Baca bagian 6.7, 9.8, dan 13.3 docs/SPEK.md.

Bangun halaman Metodologi dan Pernyataan Aksesibilitas. Tabel konstanta di
halaman Metodologi dibangkitkan dari src/lib/sim/constants.ts saat build,
jadi halaman itu tidak pernah berbeda dari mesin yang berjalan. Rumus
ditulis sebagai MathML hasil konversi dari TeX saat build.
```

### F2b Tampilan 3D, F2c Langit dan rasa game

```
Baca bagian 8.6 dan 8.7 docs/SPEK.md.

[F2c dulu] Tambahkan lapisan langit, Mode Sehari dengan matahari dan bulan
yang bisa diseret, pengukur pasang, grafik DO harian, Eksperimen Langit, dan
umpan balik bergaya game sesuai 8.7.

[F2b setelahnya] Tambahkan Tampilan 3D dengan Threlte: decideRenderMode
sebagai fungsi murni yang diuji unit, pemeriksa perangkat tiga tahap, adegan
low-poly, dan peta petak ringkas untuk keyboard dan pembaca layar.

Mengganti 2D ke 3D di tengah simulasi tidak boleh mengubah state, log aksi,
atau skor. Buktikan dengan uji e2e.
```

### F7, F8, F9 lalu F10

Jalankan sisanya dengan pola yang sama: sebut bagian spesifikasi, sebut hasil akhir, sebut apa artinya selesai. F10 terakhir:

```
Jalankan protokol uji lengkap di bagian 9.8 docs/SPEK.md, lalu perbaiki
semua temuannya. Catat tanggal, alat, temuan, dan perbaikan di
docs/AKSESIBILITAS.md. Terakhir, sisir seluruh teks antarmuka dan konten
untuk memastikan tidak ada em dash, dan seluruh kode untuk memastikan tidak
ada komentar tersisa.
```

## 5. Yang tetap harus kamu kerjakan sendiri

Claude Code tidak bisa menggantikan ini, dan justru bagian ini yang dinilai juri:

1. Survei dan uji coba dengan responden nyata, termasuk lampiran dan dokumentasinya.
2. Memahami model simulasi sampai bisa menjawab "dari mana angka ini?" di sesi tanya jawab. Baca bagian 4 sendiri, jangan hanya menerima kodenya.
3. Keputusan desain visual. Claude membangun sesuai token, tetapi rasa dan detail akhir tetap keputusanmu.
4. Menanyakan ke panitia apakah serverless function untuk AI masih memenuhi syarat web statis.
5. Memeriksa riwayat git secara berkala dengan `git log --format=%B` agar benar-benar bersih dari jejak AI.

## 6. Kenapa primitif UI dibangun sendiri

Pertanyaan yang wajar: kenapa tidak pakai UI kit supaya Button, Dialog, dan kawan-kawan tidak perlu dibuat lagi. Alasannya bukan soal gengsi, tapi soal di mana nilainya berada dan berapa hemat yang sebenarnya didapat.

| Jenis                    | Contoh                                          | Putusan                      | Alasan                                                                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI kit bertampilan jadi  | shadcn-svelte, Skeleton, Flowbite, DaisyUI      | Tidak dipakai                | Tampilannya bawaan dan mudah dikenali juri. Interface dan desain berbobot 30% di INVENTION, dan aturan melarang template. Arah visual Hulu Hilir adalah buku lapangan bergambar dengan kertas hangat, yang justru harus melawan tampilan bawaan kit itu |
| Headless, tanpa tampilan | Bits UI, Melt UI                                | Boleh, tapi tidak disarankan | Aman dari sisi aturan karena tidak membawa tampilan, tetapi hanya menghemat 3 komponen (Tooltip, Tabs, Popover) dengan tukar rugi satu dependensi besar dan gaya penulisan baru                                                                         |
| Library posisi           | `@floating-ui/dom`                              | Dipakai                      | Hanya perhitungan posisi tooltip dan popover, bukan komponen. Ini bagian yang paling sering salah kalau dihitung manual                                                                                                                                 |
| Elemen HTML native       | `<dialog>`, `<details>`, `<input type="range">` | Dipakai                      | Sudah membawa fokus, Escape, dan semantik pembaca layar secara gratis, dan kodenya pendek                                                                                                                                                               |

Hitungan kasarnya: Button dan IconButton sekitar 60 baris, Switch, SegmentedControl, dan Slider sekitar 120 baris karena semuanya input native, Dialog dan Sheet sekitar 120 baris karena `<dialog>` sudah mengurus fokus dan Escape, Disclosure 20 baris karena `<details>`. Total primitif generik sekitar 700 baris, sekali kerja di tahap F0, dan Fable menyelesaikannya dalam satu sesi.

Yang penting: sebagian besar komponen di bagian 7 spesifikasi tidak ada di UI kit mana pun. RiverStage, BankTile, WaterStrip, SegmentInspector, TimeControls, DayScrubber, TideGauge, semuanya khas proyek ini dan tetap harus dibangun sendiri. Jadi UI kit hanya memotong sebagian kecil pekerjaan, di bagian yang paling murah, dengan risiko di bagian yang paling mahal.

Kalau tenggat ternyata sangat mepet, kompromi yang masuk akal adalah menambahkan Bits UI hanya untuk Tooltip dan Tabs, dan tetap menulis sendiri sisanya. Sampaikan ke Claude kalau kamu memilih jalan itu, karena `CLAUDE.md` saat ini melarangnya.
