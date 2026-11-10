# AGENTS.md

Guidance for coding agents working in this repository. This file is the single
source of truth; `CLAUDE.md` only points here.

## Purpose

SeiunKinagi's (星雲希凪) personal home page: a single static page styled as a
terminal session over a starfield and nebula background.

- A short boot log plays on the first visit of a session.
- The hero shows the name (set vertically on desktop), role, location and a
  typewriter slogan.
- Six sections follow, each titled as a shell command: about (`fastfetch`),
  skills (`tree skills/`), projects (`ls projects/`), recent GitHub activity
  (`git log --oneline`), history (`history`) and contact (`cat contact.txt`).
- The header has a command palette (Cmd/Ctrl+K or `/`), a background-effects
  toggle, a Chinese/English toggle and a light/dark toggle.

## Stack

- Vue 3 (`<script setup lang="ts">`) + TypeScript, built with Vite.
- `vite-ssg` in single-page mode (`vite-ssg/single-page` in `src/main.ts`)
  pre-renders the page to static HTML at build time.
- Tailwind CSS v4 through the `@tailwindcss/vite` plugin. There is no
  `tailwind.config.js`; the CSS entry is `src/assets/index.css`, which defines
  the colour and font tokens (see Conventions).
- `vue-i18n` (composition mode), `@vueuse/core`, `lucide-vue-next` icons.
- `@unhead/vue` sets `<html lang>` (the pre-renderer would otherwise write
  `lang="en"`).
- Fonts: `@fontsource/maple-mono` for monospace text; a four-glyph subset of
  Shippori Mincho in `src/assets/fonts/` for the name in the hero.

## Layout

- `index.html` — HTML shell. Its inline script runs before first paint and
  applies the saved theme, the saved background-effects preference and the
  boot-skip flag, so none of them flash.
- `src/main.ts` — `ViteSSG` entry; imports the fonts and creates the i18n
  instance (`locale: 'zh'`, `fallbackLocale: 'en'`).
- `src/App.vue` — page shell: wires the header, hero, sections, footer,
  command palette and toast; owns the theme, language and effects toggles.
- `src/data/site.ts` — all content that is not translated: links, section
  list and commands, skill groups, projects, history dates, contacts.
- `src/locales/zh.ts`, `src/locales/en.ts` — all translated text, keyed by the
  ids in `site.ts`; keep both files on the same key structure.
- `src/components/` — `BootSequence`, `SkyBackground` (the canvas background),
  `SiteHeader`, `HeroSection`, `TreeNav` (desktop side nav), `TermSection`
  (section wrapper with the typed command heading), `SpotlightCard`,
  `CommandPalette`.
- `src/components/sections/` — one component per section.
- `src/composables/` — `useTypewriter`, `useFx` (effects toggle state),
  `useToast` (toast and clipboard helper).
- `src/lib/nebula.ts` — noise-based nebula textures and the star sprite.
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
- To change what the page says, edit `src/data/site.ts` and the two locale
  files; components should not hardcode content. Put every user-facing string
  in both locale files and render it with `t()`.
- Text containing `@` (handles, email) belongs in `src/data/site.ts`, not in
  the locale files: `@` starts a linked message in vue-i18n.
- An optional locale key (a project's `role`, a history entry's `note`) is
  left out when unused and checked with `te()`.
- Colours come from theme tokens defined in `src/assets/index.css` and exposed
  as Tailwind colours: `bg`, `surface`, `line`, `ink`, `dim`, `mint`, `rose`,
  `iris`. They switch with the `.dark` class, so use `text-ink`, `border-line`
  and so on rather than `dark:` variants.
- Component styles that Tailwind utilities must be able to override go in
  `@layer components` (see `.chip` and `.kbd`); unlayered CSS always wins over
  utilities.
- Entries in `site.ts` marked `draft: true` render with a dashed placeholder
  style.

## Gotchas

- Code that touches `window`/`document` must run in `onMounted` (or other
  client-only hooks), because the page is rendered on the server at build time.
  Values that differ between the server render and the client (theme, effects
  state, platform key label) are set after mount or driven by a class or
  attribute on `<html>`, to avoid hydration mismatches.
- Animations must degrade: section reveals only hide content when the inline
  script has added `html.js`, and everything respects
  `prefers-reduced-motion`. The boot overlay is timed by CSS alone, so it
  clears even without JavaScript.
- Persisted state: theme in `localStorage['vueuse-color-scheme']` (written by
  `useDark`), language in `localStorage['locale']`, background effects in
  `localStorage['fx']`, and `sessionStorage['booted']` to skip the boot log on
  later visits in the same session. With no saved language, a browser that is
  not set to Chinese gets English.
- The activity section fetches the public events of the GitHub user in
  `site.github` from the visitor's browser (unauthenticated, 60 requests per
  hour per IP) and shows an error line with a profile link when it fails.
- The hero name font only contains 星雲希凪. If the name changes, regenerate
  the subset (the command is in a comment at the top of `src/assets/index.css`).
- `SkyBackground` draws everything on one fixed canvas; the nebula is rendered
  to a half-resolution offscreen canvas about nine times a second. Tune the
  clouds in the `CLOUDS` table at the top of that file.
- Not used by the page: the shadcn-vue components in `src/components/ui/*`,
  `src/lib/utils.ts`, `components.json`, and the Vite template leftovers
  (`src/components/HelloWorld.vue`, `src/assets/hero.png`,
  `src/assets/vite.svg`, `src/assets/vue.svg`, `public/icons.svg`). The
  dependencies `radix-vue`, `reka-ui`, `class-variance-authority`, `clsx` and
  `tailwind-merge` are only referenced by those unused files.
