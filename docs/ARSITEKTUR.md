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

## Dunia Sungai

Panggung utama Lab adalah satu `<svg>` 4000 × 3000 unit dengan satu `<g>` kamera yang ditransformasi (`src/lib/components/world/RiverWorld.svelte`). Seluruh lapisan dunia `aria-hidden`; semua yang bisa dilakukan tetikus di dunia juga bisa dilakukan lewat Peta Petak.

Logika dunia dipisah dari komponen di `src/lib/world/` supaya bisa diuji tanpa DOM:

- `layout.ts` menyusun garis tengah sungai huruf S dari potongan lurus berkelok dan busur, mengambil sampel tiap 24 unit, lalu menurunkan jangkauan enam segmen, 24 lahan dengan ID yang sama dengan mesin (`S{segmen}-{sisi}{urutan}`), dan posisi papan nama. Sisi kiri dan kanan mengikuti arah aliran, jadi kiri berada di atas pada ruas yang mengalir ke timur dan di bawah pada ruas yang mengalir ke barat.
- `camera.ts` berisi matematika kamera murni: zoom paling jauh memperlihatkan seluruh dunia, pusat kamera dibatasi agar dunia tidak hilang dari layar, zoom di titik kursor menahan titik dunia di bawah kursor, dan jendela culling dibulatkan ke grid 200 unit agar daftar objek tidak dihitung ulang tiap piksel geser.
- `camera.svelte.ts` (`WorldCamera`) memegang state reaktif dan fly-to 600 ms lewat GSAP. Saat gerak dikurangi, kamera berpindah seketika. Kamera dibagikan lewat context, sehingga Peta Petak, narator, dan dialog kejadian bisa memanggil `flyToTile` atau `flyToSegment`.
- `scene.ts` menurunkan apa yang digambar dari `SimState`: aset per lahan (tahap hutan, sawah tanam atau panen menurut bulan), properti intervensi petak, cincin progres selama masa bangun, sabuk hijau di bibir sungai, kolam retensi, pintu air, dan tanda benda air per status. Ujinya memastikan setiap status tercemar selalu membawa tanda benda, tidak hanya warna.
- `detail.ts` memilih Detail Dunia: pilihan manual menang, sedangkan Otomatis memakai pemeriksaan instan bagian 8.6 (inti prosesor, memori, Save-Data, gerak dikurangi).

Tingkat detail mengikuti zoom. Pada Peta DAS hanya sungai, lahan, papan nama besar, dan lencana status yang tampil. Pada Segmen muncul sampah, ikan, eceng gondok, perahu, dan aliran. Pada Dekat, asap cerobong, sampah hanyut, dan ikan berenang ikut bergerak. Animasi air memakai `stroke-dashoffset` dan geser pola, tidak memakai filter SVG. Animasi berulang memakai kelas `world-loop` yang berhenti lewat `[data-paused]` saat simulasi dijeda atau tab tersembunyi, dan objek di luar jendela kamera tidak dirender.

Umpan balik game dipicu dari perubahan state, bukan dari tombol. Tanda tangan penggunaan lahan dan intervensi tiap lahan dibandingkan untuk memantulkan lahan dan menaburkan debu, penambahan aksi yang menunggu memunculkan angka biaya melayang, dan status segmen yang membaik memunculkan ikan melompat.

## Peta Petak

`RiverStage` tetap grid HTML: setiap segmen `role="group"` dengan lima `<button>` (petak L2, L1, air, R1, R2). Navigasi memakai roving tabindex sehingga Peta Petak menjadi satu tab stop, dengan pemetaan tombol di `navigation.ts` sebagai fungsi murni. Di desktop Peta Petak berupa varian ringkas di kiri bawah dengan kotak jendela kamera yang menandai segmen yang titik jangkarnya terlihat. Di bawah 1024 px Peta Petak dibuka sebagai `Sheet`. Fokus pada petak menerbangkan kamera ke lahan itu dan menyorotnya di dunia, klik lahan di dunia memilih petak yang sama, dan keduanya membuka panel aksi yang sama.

Nama petak dan sel air dirangkai oleh `content/lab.ts` mengikuti pola bagian 9.3 spesifikasi. Saat alat terpilih, tiap sel mendapat `aria-describedby` ke teks tersembunyi yang berisi hasil pratinjau `applyAction`.

## Tata letak responsif

Lab memakai mode `immersive` di `AppShell`: dunia memenuhi layar di antara header dan footer ringkas, dan halaman tidak pernah bergulir. Lapisan HUD di atas dunia adalah satu grid CSS dengan area bernama, sehingga tidak ada elemen yang saling tindih ketika tinggi layar berubah:

| Lebar           | Area grid                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------- |
| di bawah 640    | `hud`, `chips` (Peta Petak, Panel, Tabel), `free` dan kolom kanan (`time`, `side`), `bar` |
| 640 sampai 1023 | `hud`, `chips`, `free` dan `side` (tombol kamera serta laci panel), `bar` dan `time`      |
| 1024 ke atas    | `hud`, lalu `map` yang merentang dua baris di kiri, `free` dan `side`, `bar` dan `time`   |

Kolom `side` berisi tombol kamera dan panel samping dalam satu wadah flex, sehingga saat panel dilipat tombol kamera tetap menempel di tepi kanan. Kontrol waktu berada di kolom yang sama, jadi lebarnya mengikuti panel. Lebar layar dibaca lewat dua `matchMedia` karena wujud DOM berganti: panel samping terbuka di desktop, menjadi laci di tablet, dan menjadi `Sheet` di ponsel. Di ponsel footer disembunyikan dan tombol Pengaturan serta Bantuan hanya memperlihatkan ikon, dengan teks tersembunyi sebagai nama.

Panel aksi petak di desktop diposisikan dengan `@floating-ui/dom`. Rujukannya adalah elemen virtual yang titiknya dihitung dari pusat lahan (atau jangkar segmen untuk sel air) lewat `worldToScreen`, dan batasnya elemen kosong `lab-free` yang menutupi baris tengah dan baris hotbar di kolom tengah. Panel boleh menutupi hotbar karena ia popover sementara, tetapi tidak pernah menutupi HUD, Peta Petak, atau panel samping. `autoUpdate` menangani perubahan ukuran panel, sedangkan satu `$effect` terpisah memanggil ulang posisi setiap kali state `WorldCamera` berubah, supaya panel ikut bergeser saat kamera terbang tanpa memasang ulang observer tiap bingkai. Bacaan state kamera di dalam rujukan dibungkus `untrack`. Di lebar lain panel aksi menjadi `Sheet`.

Guliran panel aksi ada di elemen `section` luarnya, bukan di badan kertas. Firefox memasukkan wadah gulir ke urutan Tab, dan wadah yang berada setelah judul akan menyela urutan judul, pilihan aksi, lalu tombol Pasang.

Tabel ringkasan sungai dipecah menjadi dua tabel lima kolom dan tidak ada wilayah gulir horizontal, karena wilayah gulir membutuhkan `tabindex="0"` yang ditolak compiler Svelte untuk elemen non-interaktif.

## Kulit game

Kulit kayu, kertas, dan tombol bundar tinggal di `src/app.css` sebagai kelas bersama `.wood`, `.wood-nails`, `.paper`, `.plank-title`, `.knob`, `.knob-sm`, dan `.knob-on`. Komponen di `src/lib/components/hud/art` hanya pembungkus tipis, sehingga `<dialog>`, `<section>`, dan `<header>` bisa memakai kulit yang sama tanpa elemen tambahan.

Aturan warnanya: teks yang langsung berada di atas kayu hanya krem `--color-plank-ink` dengan garis tepi `--plank-outline`, dan semua komponen generik (Button, Tabs, chip) duduk di atas kertas. Karena itu `.wood` dan `.paper` sama-sama memetakan ulang `--color-surface` dan `--color-surface-2` ke warna kertas, sehingga tombol sekunder di atas kayu tampil sebagai secarik kertas dan tidak ada teks gelap yang mendarat di kayu. Koran Kabar Kali memetakan `--color-ink` dan `--color-surface` ke tinta dan kertas koran.

Kontras dikunci oleh `src/lib/color/tokens.test.ts`, yang membaca nilai `light-dark()` langsung dari `app.css` dan menghitung rasio setiap pasangan di `src/lib/color/pairs.ts` pada tema terang dan gelap. Galeri `/dev/galeri` memakai daftar pasangan yang sama tetapi mengukur warna yang benar-benar dirender browser.

Beberapa keputusan kecil:

- `Dialog` punya kulit `paper` (bawaan) dan `table` (meja kayu), serta slot `content` yang menerima `titleId`, `descriptionId`, dan `close`. Kabar Kali memakai slot itu supaya judul berita berada di dalam koran setelah kepala surat kabar. Kepala surat kabar adalah satu paragraf deskripsi dengan pemisah koma tersembunyi, sehingga deskripsi dialog tetap terbaca "Kabar Kali, Tahun 1, Februari (bulan 2)".
- Slot hotbar adalah radio native yang menutupi label bergaya slot. Slot memperlihatkan nama pendek (`actionShortNames`) yang selalu bagian dari nama lengkap, sedangkan nama lengkap menjadi nama radio, sesuai syarat label dalam nama. Alasan tidak tersedia tampil sebagai tag "Kas kurang", dan kalimat lengkapnya ada di deskripsi radio.
- Bulan dan musim pindah dari kontrol waktu ke HUD atas sesuai 8.9. Kontrol waktu hanya berisi tombol bundar.
- Angka Kas dihitung naik atau turun dengan `requestAnimationFrame` selama 600 ms. Angka yang bergerak `aria-hidden`, dan nilai akhir tersedia sebagai teks tersembunyi. Saat gerak dikurangi, angka langsung berganti, dan slot terpilih tidak terangkat maupun memantul.

## Narator dan kejadian

Narasi lahir dari `step()` di sesi, bukan dari komponen. `detectTrigger` (`src/lib/ai/triggers.ts`) memilih satu pemicu per bulan dengan urutan prioritas tinggi (banjir, ikan mati, kejadian selain hujan lebat), sedang (status berpindah, ikan punah atau kembali, tiga bulan setelah intervensi), rendah (ringkasan tiap 12 bulan). `buildNarrationPayload` mengubah state mesin menjadi payload bagian 5.2: angka dibulatkan satu desimal, sumber beban dari `attributeCauses`, dan daftar aksi yang masuk akal untuk segmen itu. Payload inilah satu-satunya bahan bagi narator template maupun AI.

`Narrator` (`src/lib/state/narrator.svelte.ts`) memegang antrean satu slot: pemicu baru yang datang saat menunggu menggantikan yang lama, jeda minimal 4 detik waktu nyata dijaga lewat `setTimeout`, dan pada kecepatan 4x hanya prioritas tinggi yang diproses. Frekuensi narasi di Pengaturan dibaca di sini. Teks utuh diumumkan sekali ke live region setelah selesai; efek ketik di `NarratorPanel` hanya visual dan mati saat gerak dikurangi.

Klien (`src/lib/ai/client.ts`) membaca `PUBLIC_AI_MODE` lewat `$env/dynamic/public` sehingga halaman prerender tetap bisa berganti mode dari variabel deploy. Mode `off`, perangkat offline, respons bukan 2xx, batas waktu 8 detik, bentuk salah, atau angka asing semuanya berakhir di `narrateTemplate`. Template memakai tiga variasi per pemicu yang dipilih dari `month % 3`, dan ujinya memastikan teks template sendiri lolos validator angka.

Server (`src/lib/server`) memanggil endpoint OpenAI-compatible lewat `fetch` dengan `response_format: json_object`, lalu menyaring hasil dalam urutan: skema Valibot, ganti em dash, tolak bila ada angka di luar payload (`foreignNumbers`, dengan toleransi pembulatan satu desimal, porsi kali seratus, dan bilangan bulat 0 sampai 12), potong di batas kalimat pada 90 kata, dan buang `suggestedAction` atau `factId` yang tidak ada di daftar. Cache memakai payload yang diserialisasi sebagai kunci karena payload kecil dan deterministik. Rate limit adalah token bucket per alamat plus batas harian di memori, cukup untuk skala demo.

Dialog kejadian memakai katalog berita di `content/narration.ts`, bukan AI, agar mekanik permainan tetap persis. `dialogEventOf` memilih satu kejadian per bulan (banjir, ikan mati, lalu kejadian lain kecuali hujan lebat), sesi dijeda, dan tanggapan dari katalog dipetakan ke aksi mesin di segmen kejadian.

Uji e2e memakai server LLM tiruan (`tests/mock-llm.mjs`) yang membalas angka asing untuk pemicu status dan teks valid untuk pemicu lain, sehingga jalur penolakan dan penerimaan sama-sama teruji tanpa kunci API. Konfigurasi Playwright kedua menjalankan Lab dengan `PUBLIC_AI_MODE=off` untuk memastikan tidak ada permintaan ke `/api/ai`.
