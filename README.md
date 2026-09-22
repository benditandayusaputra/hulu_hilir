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

## Stack

SvelteKit 2, Svelte 5 runes, TypeScript strict, Tailwind v4, GSAP, Valibot, Vitest, Playwright. Package manager pnpm, deploy Vercel.

Konfigurasi SvelteKit berada inline di `vite.config.ts`, bukan di `svelte.config.js`, mengikuti bawaan `sv` v0.17.
