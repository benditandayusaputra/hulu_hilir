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

Lab memakai mode `immersive` di `AppShell`: `main` menjadi lapisan `absolute inset-0` di belakang header, footer tidak dirender, dan halaman tidak pernah bergulir. Header tetap di tempatnya tetapi mengambang di atas dunia; tingginya diukur lewat `bind:offsetHeight` dan diteruskan sebagai `--shell-header`, sehingga grid HUD mulai tepat di bawahnya. Lapisan HUD di atas dunia adalah satu grid CSS dengan area bernama, sehingga tidak ada elemen yang saling tindih ketika tinggi layar berubah:

| Lebar           | Area grid                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------- |
| di bawah 640    | `hud`, `chips` (Peta Petak, Panel, Tabel), `free` dan kolom kanan (`time`, `side`), `bar` |
| 640 sampai 1023 | `hud`, `chips`, `free` dan `side` (tombol kamera serta laci panel), `bar` dan `time`      |
| 1024 ke atas    | `hud`, lalu `map` yang merentang dua baris di kiri, `free` dan `side`, `bar` dan `time`   |

Kolom `side` berisi tombol kamera dan panel samping dalam satu wadah flex, sehingga saat panel dilipat tombol kamera tetap menempel di tepi kanan. Kontrol waktu berada di kolom yang sama, jadi lebarnya mengikuti panel. Lebar layar dibaca lewat dua `matchMedia` karena wujud DOM berganti: panel samping terbuka di desktop, menjadi laci di tablet, dan menjadi `Sheet` di ponsel. Di ponsel tombol Pengaturan serta Bantuan hanya memperlihatkan ikon, dengan teks tersembunyi sebagai nama.

Panel aksi petak di desktop diposisikan dengan `@floating-ui/dom`. Rujukannya adalah elemen virtual yang titiknya dihitung dari pusat lahan (atau jangkar segmen untuk sel air) lewat `worldToScreen`, dan batasnya elemen kosong `lab-free` yang menutupi baris tengah dan baris hotbar di kolom tengah. Panel boleh menutupi hotbar karena ia popover sementara, tetapi tidak pernah menutupi HUD, Peta Petak, atau panel samping. `autoUpdate` menangani perubahan ukuran panel, sedangkan satu `$effect` terpisah memanggil ulang posisi setiap kali state `WorldCamera` berubah, supaya panel ikut bergeser saat kamera terbang tanpa memasang ulang observer tiap bingkai. Bacaan state kamera di dalam rujukan dibungkus `untrack`. Di lebar lain panel aksi menjadi `Sheet`.

Guliran panel aksi ada di elemen `section` luarnya, bukan di badan kertas. Firefox memasukkan wadah gulir ke urutan Tab, dan wadah yang berada setelah judul akan menyela urutan judul, pilihan aksi, lalu tombol Pasang. Ringkasan biaya serta tombol Pasang dan Tutup ada di footer `sticky` di dalam wadah gulir itu, sehingga selalu terlihat tanpa menggulir daftar. Offset `bottom` footer bernilai negatif sebesar padding wadah gulir, karena posisi `sticky` menghormati padding itu. Setiap baris pilihan mendapat `scroll-margin-bottom` setinggi footer, dan pilihan yang baru dipilih digulir ulang setelah footer bertambah tinggi, supaya pilihan yang difokus tidak tertutup footer (WCAG 2.4.11). Di dalam tiap kelompok, pilihan yang bisa dipasang tampil lebih dulu. Pilihan yang tidak bisa dipasang tampil redup dengan alasan singkat, dan alasan itu tetap terhubung lewat `aria-describedby`.

Tabel ringkasan sungai dipecah menjadi dua tabel lima kolom dan tidak ada wilayah gulir horizontal, karena wilayah gulir membutuhkan `tabindex="0"` yang ditolak compiler Svelte untuk elemen non-interaktif.

## Rute Lab dan sesi tersimpan

Lab punya dua rute. `/lab` adalah Layar Pilih Skenario: grid `<ul>` berisi empat kartu kertas, dan tautan di `h2` tiap kartu diperluas ke seluruh kartu lewat `::after`, sehingga satu kartu satu tab stop. Cincin fokus digambar pada `::after` itu, bukan pada teks tautan. Angka meter mini diambil dari `createInitialState` saat prerender, sedangkan lencana Tersimpan dan pratinjau state tersimpan baru dihitung di browser setelah halaman tampil, karena `localStorage` tidak ada saat prerender. `/lab?preset={id}` dialihkan di browser dengan `goto(..., { replaceState: true })`, karena parameter query tidak tersedia saat prerender.

`/lab/[skenario]` memakai `+page.ts` dengan `entries` untuk empat skenario Lab dan demo, serta `prerender = 'auto'`. Dengan begitu kelima rute tetap diprerender, sedangkan id yang tidak dikenal masih sampai ke `load` di server dan dialihkan ke `/lab`. Halaman membuat `SimulationSession` dari id rute, lalu satu `$effect` memanggil `openScenario` saat id berubah. Hal itu terjadi saat halaman pertama dibuka dan saat pindah langsung dari satu skenario ke skenario lain, karena SvelteKit memakai ulang komponen halaman yang sama.

Penyimpanan ada di `src/lib/state/labStorage.ts`. Kunci `hh:session:lab:{id}` berisi `schemaVersion`, id skenario, seed, bulan, dan aksi (`log` ditambah `pending`). State tidak ikut disimpan: `replayLabSession` memutar ulang aksi sampai bulan tersimpan lewat `replay` mesin, dan aksi bertanda bulan berikutnya menjadi `pending` lagi. `SimulationSession.restore` memasang snapshot hasil replay dan menurunkan `log` dari `state.actions` tiap snapshot, sama seperti yang dilakukan `step()`. Satu `$effect` menulis ulang kunci setiap kali bulan, `log`, atau `pending` berubah. Sesi tanpa bulan dan tanpa aksi menghapus kuncinya, sehingga Mulai ulang dan Kembali ke bulan 0 cukup mereset sesi. Demo tidak pernah dibaca maupun ditulis. Data yang gagal validasi Valibot atau gagal diputar ulang dihapus, lalu toast memberi tahu pemain bahwa Lab dimulai dari awal.

`WorldPreview` (`src/lib/components/world/WorldPreview.svelte`) memakai ulang lapisan dunia yang sama pada tingkat Peta DAS dengan `viewBox` tetap 4000 × 3000, tanpa kamera, dengan `data-paused` agar gelombang laut diam. Halaman yang memakainya wajib memasang `WorldArt` sekali. Pola air, `clipPath` laut, dan gradien laut pindah dari `WorldRiver` dan `WorldSea` ke `WorldArt`, karena empat pratinjau di satu halaman akan menggandakan id SVG.

## Layar penuh dan antarmuka tersembunyi

Tombol Sembunyikan antarmuka mengubah `shell.uiHidden`. Header dan grid HUD Lab memakai kelas `ui-layer`: saat elemen itu `inert`, CSS memudarkannya lalu memberi `visibility: hidden` setelah transisi selesai, sehingga elemen hilang dari urutan fokus dan pohon aksesibilitas. Saat tampil lagi, `visibility` langsung kembali agar fokus bisa dipulihkan tanpa menunggu transisi. `AppShell` tidak merender tautan lewati milik halaman selama antarmuka tersembunyi, sedangkan tautan ke konten utama tetap ada. Panel aksi yang terbuka ditutup saat menyembunyikan, dan klik lahan di dunia diabaikan selama tersembunyi, karena panelnya tidak akan terlihat.

Elemen yang terakhir difokus disimpan sebelum menyembunyikan, lalu fokus pindah ke tombol Tampilkan antarmuka di klaster kanan bawah. H, tombol itu, atau Escape (hanya bila tidak ada `dialog[open]`) mengembalikan fokus ke elemen tadi, atau ke tombol Sembunyikan bila elemen itu sudah hilang. Escape diperiksa sebelum pengaturan pintasan satu huruf, karena Escape bukan pintasan huruf. Keadaan tersembunyi direset setiap kali Lab dipasang atau dilepas.

Selain tombol untuk seluruh antarmuka, empat panel punya tombol lipat sendiri: indikator (papan Lab Bebas), Peta Petak di desktop, palet alat, dan kontrol waktu. Panel samping sudah punya tombolnya sejak R2. Tombol lipat adalah tombol bundar dengan `aria-expanded` dan `aria-controls`, dan elemennya tetap sama di kedua keadaan, sehingga fokus tidak hilang saat panel dilipat atau dibuka. Isi panel disembunyikan dengan atribut `hidden` dan tidak dilepas, jadi fokus petak, alat terpilih, dan grafik tetap utuh. Yang tersisa hanya plank kecil berisi judul panel dan tombolnya, dan judul `h1` Lab Bebas ikut tampil saat papan indikator dilipat. Keadaan lipatan tidak disimpan dan tidak berubah saat seluruh antarmuka disembunyikan lalu ditampilkan lagi. Tooltip tombol di papan atas muncul di bawah tombol dan rata kanan, kecuali di tablet saat tombolnya bertumpuk, supaya tooltip dari tombol yang sedang difokus tidak menutupi tombol di sebelahnya.

Tombol Layar penuh hanya dirender bila `document.fullscreenEnabled`, memanggil `requestFullscreen` pada elemen akar, dan labelnya mengikuti event `fullscreenchange`. Ikon maximize dipakai tombol ini, sehingga Lihat seluruh sungai memakai ikon peta.

Karena dunia sekarang juga mengisi area di luar 4000 × 3000 unit pada layar yang lebih lebar atau lebih tinggi dari rasio 4:3, rumput latar dan laut digambar melewati batas dunia. Gradien laut memakai `gradientUnits="userSpaceOnUse"` supaya warnanya di dalam dunia tidak berubah ketika bentuk laut diperpanjang.

## Cuaca di dunia

Keadaan cuaca dihitung oleh `src/lib/world/weather.ts` dari state yang sudah ada, tanpa angka baru dari mesin:

| `data-weather` | Sumber                                          | Gambar                                              |
| -------------- | ----------------------------------------------- | --------------------------------------------------- |
| `extreme`      | kejadian `extreme_rain` bulan ini               | 12 awan gelap menutupi DAS, hujan miring, redup 22% |
| `heavy`        | kejadian `heavy_rain` bulan ini                 | 8 awan hujan, paling rapat di hulu, redup 12%       |
| `drought`      | `droughtActive`, atau musim kemarau tanpa hujan | 1 awan putih kecil, rona hangat 6%                  |
| `cloudy`       | musim hujan tanpa hujan lebat                   | 5 awan putih keabuan, redup 5%                      |
| `clear`        | peralihan                                       | 3 awan putih                                        |

Baris Kemarau dan Kemarau Panjang di tabel spesifikasi punya gambar yang sama, jadi keduanya menulis `drought`. Jumlah awan, ketinggian, peredupan, dan pola hujan adalah konstanta di `src/lib/world/constants.ts`. Detail Dunia Ringan mengambil setiap awan kedua.

Lapisan cuaca ada di dalam `<g>` kamera, jadi ikut digeser dan di-zoom. `WorldRunoff` digambar di bawah lahan: tiga garis coklat pendek dari tiap lahan bukan hutan menuju tepi sungai, dengan tebal `runoffOf(tile) × RUNOFF_WIDTH_PER_C`, sehingga biopori dan kematangan hutan ikut terlihat. Bagian garis di bawah lahan tertutup lahan itu sendiri. `WorldWeather` digambar paling atas dengan urutan: tirai peredup, tetes resap di hutan matang dan sabuk hijau aktif, cipratan di air (hanya zoom Dekat dan Detail Penuh), bayangan awan, hujan, lalu awan. Semuanya `pointer-events="none"`, sehingga klik tetap sampai ke lahan.

Hujan adalah satu `<rect>` berisi pola garis yang dipotong `clipPath` berisi kolom hujan di bawah setiap awan. Animasinya hanya menggeser `rect` sejauh satu ubin pola, jadi pola tidak pernah terputus. Hujan ekstrem memakai ubin miring dan digeser serong sejauh satu ubin mendatar dan dua ubin tegak, sesuai kemiringan garisnya. Skala pola berganti per tingkat detail supaya di Peta DAS garisnya jarang dan tetap terlihat. Masuk dan keluarnya awan serta hujan memakai `fade` 1 detik.

Aturan gerak 9.5 dijalankan di `RiverWorld`. Lapisan cuaca mendapat `data-moving` bila tab terlihat, gerak tidak dikurangi, dan simulasi berjalan atau semburan 4 detik sedang aktif. Semburan dimulai sekali untuk setiap bulan hujan yang baru tampil saat simulasi dijeda (lewat Maju 1 bulan, pemulihan sesi, atau Kembali ke bulan), dan bila bulan itu membuka Kabar Kali, semburan menunggu dialog ditutup. Tanpa `data-moving`, animasi dijeda di tempat, sehingga garis hujan tetap terlihat sebagai gambar diam. Awan bergeser pelan, dan limpasan, tetes resap, serta cipratan mengikuti aturan yang sama. Pada zoom Dekat awan memudar ke 40%.

Di Chromium tanpa GPU, geser kamera saat Hujan Ekstrem di zoom Dekat mencatat sekitar 56 fps, juga dengan CPU diperlambat empat kali. Uji `tests/e2e/cuaca.spec.ts` menjaga batas minimal 30 fps.

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
