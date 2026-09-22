# Hulu Hilir

Laboratorium sungai virtual untuk siswa SMP dan SMA. Siswa menempatkan pabrik, permukiman, sawah, atau hutan di bantaran sungai 6 segmen, lalu melihat dampaknya ke kualitas air, ikan, dan banjir dari hulu sampai muara.

## Dokumentasi

- `docs/SPEK.md` berisi spesifikasi lengkap: rumus, konstanta, komponen, aksesibilitas, dan urutan tahap F0 sampai F10.
- `CLAUDE.md` berisi aturan kerja yang berlaku di seluruh proyek.
- `PANDUAN-CLAUDE-CODE.md` berisi panduan menjalankan tiap tahap.

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

## Stack

SvelteKit 2, Svelte 5 runes, TypeScript strict, Tailwind v4, GSAP, Valibot, Vitest, Playwright. Package manager pnpm, deploy Vercel.
