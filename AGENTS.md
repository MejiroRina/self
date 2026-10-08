# AGENTS.md

Guidance for coding agents working in this repository. This file is the single
source of truth; `CLAUDE.md` only points here.

## Purpose

SeiunKinagi's (星雲希凪) personal home page: a single static page with a hero
section (avatar, name, role, typewriter slogan, location), a skills list, a
project card (Project Haruki) and contact links (GitHub, Bilibili, Discord,
email). It supports a light/dark theme toggle and a Chinese/English language
toggle.

## Stack

- Vue 3 (`<script setup lang="ts">`) + TypeScript, built with Vite.
- `vite-ssg` in single-page mode (`vite-ssg/single-page` in `src/main.ts`)
  pre-renders the page to static HTML at build time.
- Tailwind CSS v4 through the `@tailwindcss/vite` plugin. There is no
  `tailwind.config.js`; the CSS entry is `src/assets/index.css`
  (`@import "tailwindcss"` plus a class-based `dark` custom variant).
- shadcn-vue style UI components (built on `reka-ui`,
  `class-variance-authority`, `tailwind-merge`); `components.json` holds the
  shadcn-vue settings.
- `vue-i18n` (composition mode), `@vueuse/core` (`useDark`/`useToggle`),
  `lucide-vue-next` icons.

## Layout

- `index.html` — HTML shell, page `<title>` and favicon.
- `src/main.ts` — `ViteSSG` entry; creates the i18n instance
  (`locale: 'zh'`, `fallbackLocale: 'en'`).
- `src/App.vue` — the whole page: markup, skills arrays, typewriter effect,
  theme and locale toggles, project/contact links.
- `src/locales/zh.ts`, `src/locales/en.ts` — UI strings; keep both files on
  the same key structure.
- `src/components/ui/*` — shadcn-vue components (avatar, badge, button, card,
  dropdown-menu, tooltip). Import them via the `@/components/ui/<name>` alias.
- `src/lib/utils.ts` — `cn()` class-merging helper.
- `public/` — static files copied as-is (`favicon.svg`, `icons.svg`).
- `vite.config.ts` — Vue + Tailwind plugins, `@` → `./src` alias,
  `vue-i18n` bundled for SSR via `ssr.noExternal`.

## Commands

There is no CI, test suite, linter or formatter configured. Use npm (the repo
ships `package-lock.json`):

```bash
npm ci            # install dependencies
npm run dev       # Vite dev server
npm run build     # vue-tsc -b (type check) then vite-ssg build -> dist/
npm run preview   # serve the built output locally
```

`npm run build` is the only correctness check: `vue-tsc -b` enforces the
tsconfig settings (`noUnusedLocals`, `noUnusedParameters`,
`erasableSyntaxOnly`, `noFallthroughCasesInSwitch`), so unused imports or
variables fail the build.

## Deployment

The build output in `dist/` is a fully static site (pre-rendered
`index.html` plus assets). No hosting or deployment configuration is kept in
this repository.

## Conventions

- Commit titles use a bracketed type prefix, e.g. `[Feat] Update home page`.
- Only part of the page is localized: the hero name/role/slogan/location, the
  section titles, the "Learning" badge suffix and the project description come
  from `src/locales/{zh,en}.ts` via `t('...')`. Card titles (`Project Haruki`,
  `GitHub`, `Bilibili`, ...), the project byline, the contact descriptions,
  the `Learning...` tooltip, the footer text, button `title` attributes, all
  URLs and the skills arrays are hardcoded in `src/App.vue`.
- The locale keys `header.language`, `header.theme` and
  `contact.github`/`bilibili`/`discord`/`email` exist in both files but are
  not used by `src/App.vue`.
- Put new user-facing text in both locale files and render it with `t()`.
- Style with Tailwind utility classes and provide `dark:` variants for colours,
  matching the existing markup.

## Gotchas

- Code that touches `window`/`document` must run in `onMounted` (or other
  client-only hooks), because the page is rendered on the server at build time.
- The chosen theme is persisted by `useDark` in `localStorage`; the language
  toggle is not persisted and always starts in Chinese.
- Leftovers from the Vite template are not used by the page:
  `src/components/HelloWorld.vue`, `src/assets/hero.png`, `src/assets/vite.svg`,
  `src/assets/vue.svg`, `public/icons.svg`. The `dropdown-menu` component and
  the `radix-vue` dependency are also unused (the UI components import
  `reka-ui`).
