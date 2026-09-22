# Arsitektur antarmuka Lab

Catatan ini menggantikan komentar kode. Ia menjelaskan keputusan yang tidak terbaca dari kode itu sendiri.

## Sesi simulasi (`src/lib/state/simulation.svelte.ts`)

`SimulationSession` dibuat satu per halaman dan dibagikan lewat `setContext`, bukan singleton, agar Lab dan Misi tidak saling mengganggu dan uji unit bisa membuat sesi baru tanpa membersihkan state global.

Tiga kumpulan data menjadi sumber kebenaran:

| Data        | Isi                                                        | Siapa yang menulis                      |
| ----------- | ---------------------------------------------------------- | --------------------------------------- |
| `snapshots` | Satu `SimState` per bulan, indeks 0 adalah keadaan awal    | `step()` menambah, `rewindTo` memotong  |
| `log`       | Semua aksi yang sudah diterima mesin, lengkap dengan bulan | `step()` dari `state.actions` mesin     |
| `pending`   | Aksi yang menunggu bulan berikutnya                        | `install`, `removeIntervention`, `undo` |

Mesin menerapkan aksi di awal bulan berikutnya (`stepMonth(state, actions)`), sehingga aksi yang baru dipasang belum ada di snapshot terakhir. Supaya petak, kas, dan lencana langsung berubah di layar, `state` adalah turunan: snapshot terakhir dengan `pending` diterapkan lewat `applyAction`. Saat `step()`, mesin menerima `pending` dari snapshot terakhir, bukan dari `state` turunan, sehingga aksi tidak pernah diterapkan dua kali dan `replay(scenario, seed, log, month)` selalu menghasilkan snapshot yang identik. Uji `simulation.test.ts` mengunci sifat ini.

`snapshots`, `log`, dan `pending` memakai `$state.raw` supaya objek mesin tidak dibungkus proxy; mesin membaca ribuan properti per bulan dan proxy akan memperlambatnya.

Batalkan aksi terakhir hanya mencabut aksi yang masih menunggu. Aksi yang sudah dihitung mesin dibatalkan lewat "Kembali ke bulan X", yang memotong `snapshots` dan `log` lalu mengosongkan `pending`.

## Pengumuman pembaca layar

Semua pesan dibuat oleh sesi, bukan komponen, karena sesi tahu kecepatan dan frekuensi narasi:

- Pesan bulan berganti hanya pada frekuensi Normal dan kecepatan 1x.
- Perubahan status segmen diumumkan pada semua kecepatan selama narasi tidak Mati.
- Kejadian, banjir, dan ikan tampil sebagai toast di semua kecepatan, tetapi hanya diumumkan pada 1x.
- Aksi ditolak selalu lewat saluran assertive.

`Toaster.show` mengirim pesan ke `Announcer`, sehingga toast visual dan pengumuman selalu sejalan. `Announcer` menggabungkan pesan polite yang menumpuk dalam jeda 2 detik.

## Panggung sungai

Panggung adalah grid HTML: setiap segmen `role="group"` dengan lima `<button>` (petak L2, L1, air, R1, R2). Navigasi memakai roving tabindex: hanya sel yang terakhir difokus yang punya `tabindex="0"`, sehingga panggung menjadi satu tab stop. Pemetaan tombol panah, Home, End, dan Ctrl ada di `navigation.ts` sebagai fungsi murni agar bisa diuji tanpa DOM. Penangan keydown dipasang pada tiap tombol, bukan pada wadah, supaya tidak ada elemen non-interaktif yang memegang penangan keyboard.

Nama petak dan sel air dirangkai oleh `content/lab.ts` mengikuti pola bagian 9.3 spesifikasi. Saat alat terpilih, tiap sel mendapat `aria-describedby` ke teks tersembunyi yang berisi hasil pratinjau `applyAction`, sehingga alasan penolakan terbaca sebelum Enter ditekan.

Ilustrasi petak memakai sprite `<symbol>` yang dirender sekali oleh `RiverSprites`, dan strip air diperbarui lewat custom property (`--water-color`, `--flow-duration`) tanpa merender ulang SVG.

## Gerak

Partikel arus dan ikan memakai animasi CSS yang berhenti lewat `[data-paused]` saat simulasi dijeda atau tab tersembunyi. Mode gerak dikurangi mengganti partikel dengan chevron diam lewat CSS. Muka air banjir adalah satu-satunya tween GSAP: dibuat di dalam `gsap.matchMedia()` pada elemen akar panggung, ditambahkan ke `gsap.context()` lewat `context.add`, dan di-revert saat komponen dilepas. Warna air berpindah lewat transisi CSS 600 ms.

## Tata letak responsif

Lebar layar dibaca lewat dua `matchMedia` (`phoneQuery`, `desktopQuery`) karena palet dan panel harus berganti wujud DOM, bukan sekadar gaya: `Sheet` di ponsel, `Tabs` di tablet, tiga kolom di desktop. Panel aksi petak menjadi kartu inline di kolom kanan pada desktop dan `Sheet` di lebar lain. HTML hasil prerender memakai tata letak desktop, lalu efek memperbaikinya saat hidrasi.

Tabel ringkasan sungai dipecah menjadi dua tabel lima kolom dan tidak ada wilayah gulir horizontal. Wilayah gulir membutuhkan `tabindex="0"` agar bisa digulir dengan keyboard, tetapi compiler Svelte menolak tabindex pada elemen non-interaktif, dan aturan proyek melarang menyembunyikan peringatan. Membuat konten muat di 320 px adalah jalan yang jujur.
