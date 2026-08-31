# CineMatch — Frontend Guide (Themes, Fonts & UI Structure)

This guide documents the **CineMatch** frontend ("Movie Room") — a React + Vite + Tailwind CSS app. It is written primarily for **other AI agents and developers** so they can extend the UI while staying consistent with the existing design language: a **dark glassmorphism aesthetic** with a two-font typography system.

> **Convention note**: All components are **default exports** in flat `src/` files. Helper/child components live in the same file as their parent (co-located), not in separate folders.

---

## 🧱 Project Overview

| Attribute | Value |
|-----------|-------|
| **Name** | `figma-make-app` (CineMatch) |
| **Stack** | React 19 · TypeScript 5.7 · Vite 8 · Tailwind CSS v4 |
| **Router** | `react-router` v8 (browser router) |
| **Package manager** | pnpm 10 |
| **Node** | 22 |
| **State management** | Native React `useState` / `useEffect` only (no Redux/Zustand) |
| **Animations** | CSS transitions + inline `style`, no animation library |
| **Icons** | Hand-drawn inline SVGs + Unicode emoji (no icon library) |
| **UI components** | Custom only (no shadcn/Radix/MUI) |
| **Path alias** | `@/` → `./src/` (available but currently unused) |
| **API integration** | **None yet** — all data currently hardcoded |

---

## 📁 Directory Structure

```
Rpeclicate Python vibeCode/
├── index.html                  # Vite HTML shell (#root mounts here)
├── package.json
├── vite.config.ts              # React, Tailwind v4, Figma Make plugins, @ alias
├── .mise.toml                  # Node 22, pnpm 10
├── tsconfig.json               # strict: true
├── AGENTS.md / CLAUDE.md       # Agent instructions
└── src/
    ├── main.tsx                # Entrypoint: imports index.css, mounts App.tsx
    ├── index.css               # Global CSS + Google Fonts import + Tailwind
    ├── App.tsx                 # RouterProvider
    ├── routes.tsx              # Route definitions
    ├── Landing.tsx             # Marketing/landing page (328 lines)
    ├── MovieRoom.tsx           # Main app page (569 lines)
    ├── vite-env.d.ts
    └── imports/                # (unused local asset)
```

---

## 🗺️ Routing

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `Landing` | Public marketing page |
| `/app` | `MovieRoom` | Main recommendation app |

No nested routes, no guards, no lazy loading.

---

## 🎨 Design System — Theme Colors

There are **no CSS variables / design tokens**. All colors are **inline literals** (Tailwind arbitrary values or React `style` props). To keep the theme consistent, reuse the exact values below.

### Backgrounds (deep navy → near-black radial gradients)

| Name | Value | Use |
|------|-------|-----|
| Radial center | `#0d1b3e` | Deep navy blue (top/center of page) |
| Radial mid | `#050a14` | Near-black dark |
| Radial edge | `#0a0510` | Nearly-black purple tint |
| Landing bg | `radial-gradient(ellipse at 30% 20%, #0d1b3e 0%, #050a14 55%, #0a0510 100%)` | Landing page |
| App bg | `radial-gradient(ellipse at 20% 50%, #0d1b3e 0%, #050a14 60%, #0a0510 100%)` | MovieRoom |

### Glass / Surface (glassmorphism panels)

| Style | Value |
|-------|-------|
| Glass panel bg | `rgba(255,255,255, 0.03 – 0.06)` |
| Glass border | `rgba(255,255,255, 0.06 – 0.15)` |
| Glass blur | `backdrop-filter: blur(12px – 20px)` |
| **Reusable `GlassPanel`** | bg `rgba(255,255,255,0.05)`, border `rgba(255,255,255,0.09)`, `blur(20px)`, `borderRadius: 16` |

### Text (white + opacity scale)

| Usage | Value |
|-------|-------|
| Primary | `white` / `text-white` |
| Secondary | `rgba(255,255,255, 0.35 – 0.5)` |
| Tertiary / muted | `rgba(255,255,255, 0.15 – 0.25)`, `text-white/25`, `text-white/40` |
| Headline gradient | `#93c5fd → #a78bfa → #f0abfc` (blue-300 → violet-400 → fuchsia-300) |

### Brand / Accent

| Item | Value | Notes |
|------|-------|-------|
| CTA gradient | `rgba(99,102,241,0.6)` → `rgba(139,92,246,0.6)` | indigo-500 → violet-500 |
| CTA border | `rgba(139,92,246,0.35 – 0.4)` | |
| CTA hover glow | `rgba(139,92,246,0.3)` | `boxShadow: 0 8px 32px …` |
| Favourite (active) | `#ff6b81` | heart icon |
| Save (active) | `#60a5fa` (blue-400) | bookmark icon |
| Top rank #1 badge | `#f4c430` (gold) | in Top 5 list |
| "Powered by K-NN" dot | `#34d399` (emerald-400) | glow `0 0 6px #34d39988` |

### Ambient Glow Blobs (decorative radial gradients, blurred)

| Color | Use |
|-------|-----|
| `#1e3a8a18` | Blue glow (top-left) |
| `#7c3aed12` / `#7c3aed18` | Violet glow (bottom-right) |
| `#0f766e10` | Teal glow (center) |
| `{selectedMovie.color}22` | Dynamic glow matching selected movie accent |

### Per-Movie Accent Colors

| Movie | Color |
|-------|-------|
| Blade Runner 2049 | `#4a90d9` (blue) |
| Dune: Part Two | `#c9a227` (gold) |
| Oppenheimer | `#e05c2a` (burnt orange) |
| The Batman | `#2d4a8a` (dark navy) |
| Past Lives | `#7a5c9e` (purple) |

> Each movie card also tints its genre badge using this accent: bg `${color}22`, text `${color}cc`, border `${color}33`.

---

## 🔤 Typography — Fonts

Two Google Fonts, imported once in `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
```

### 1. Outfit (Sans-serif) — Body & UI

- Applied globally to `<body>`: `font-family: 'Outfit', sans-serif;`
- Weights: **300, 400, 500, 600, 700**
- Use for: body text, labels, descriptions, buttons, inputs, feature text.

### 2. DM Serif Display (Serif) — Brand & Headings

- Applied via inline `fontFamily: "'DM Serif Display', serif"` **only on specific elements**.
- Use for: logo **"CineMatch"**, hero heading **"Find your next favorite film"**, section headers **"Your Recommendations"** / **"Saved Movies"**, bottom CTA **"Ready to discover something new?"**, movie titles.
- Normal + italic loaded.

### Font Sizes (scale)

| Element | Size |
|---------|------|
| Hero heading | `clamp(2.4rem, 6vw, 4rem)` (line-height 1.1) |
| Section headings | `text-xl` (1.25rem / 20px) |
| Body paragraphs | `text-base` (1rem / 16px), `text-sm` (0.875rem / 14px) |
| Small labels | `text-xs` (0.75rem / 12px) |
| Micro text | `text-[10px]`, `text-[9px]`, `text-[8px]` |
| Eyebrow / uppercase labels | `text-xs` + `tracking-widest uppercase` |

---

## 🧩 Styling Conventions

1. **Tailwind v4**: imported via `@import 'tailwindcss'` in `index.css`; configured through the `@tailwindcss/vite` plugin. **No `tailwind.config.js` / no PostCSS config.**
2. **Heavy inline styling**: ~60–70% of visual styling is React `style` props (gradients, glass effects, `backdropFilter`, dynamic colors, transitions). Always check for inline styles before adding classes.
3. **Hover via JS, not CSS**: hover effects are driven by `onMouseEnter` / `onMouseLeave` handlers that mutate `element.style` directly (e.g. background/color/boxShadow), **not** `:hover` pseudo-class.
4. **Transitions**: mixed usage of Tailwind (`transition-all`, `duration-300`, `duration-500`) and inline `style={{ transition: "..." }}`.
5. **Scrollbars hidden globally**:
   ```css
   * { scrollbar-width: none; }
   *::-webkit-scrollbar { display: none; }
   ```
6. **Responsive**: the hero heading uses `clamp()`; otherwise layout is largely fixed/pixel-based.
7. **Dark-theme only** — there is no light-mode variant.

---

## 🧱 Component Hierarchy

```
<React.StrictMode>
  └── <RouterProvider>
      ├── "/" → <Landing>
      │     ├── Nav (inline) — logo, tagline, "Open App →" button
      │     ├── Ambient blobs (fixed, decorative)
      │     ├── Hero — eyebrow chip, gradient headline, subcopy, 2 CTA buttons
      │     ├── Floating genre chips (cycling highlight every 3s)
      │     ├── Poster strip (5 hoverable posters, arced layout)
      │     ├── Feature cards (3 glass cards: ✦ ◈ ◉)
      │     ├── Bottom CTA banner ("Enter Movie Room →")
      │     └── Footer
      │
      └── "/app" → <MovieRoom>
            ├── Ambient glow (dynamic to selectedMovie.color)
            ├── <aside> Sidebar (w:72px glass) —
            │     ├── Back-to-landing button
            │     ├── <NavIcon> Home
            │     ├── <NavIcon> Saved
            │     └── <NavIcon> Profile (inactive, mt-auto)
            └── <main>
                  ├── "home" view:
                  │     ├── Header — eyebrow + "Your Recommendations" + Search input
                  │     ├── <GlassPanel> Selected movie detail —
                  │     │     ├── Poster (140×200) + ★ rating badge
                  │     │     ├── Title (DM Serif), genre·year·runtime
                  │     │     ├── <IconBtn> Favourite, <IconBtn> Save
                  │     │     ├── Description (line-clamp-3)
                  │     │     └── "Similar" thumbnails (54×76)
                  │     ├── Recommended grid (5 cols, k=5) — <DefaultCard> per movie
                  │     └── <aside> Right panel "Top 5" (w:220px glass) —
                  │           ├── Top 5 ranked list (gold #1 badge)
                  │           └── Quick Pick poster buttons
                  │
                  └── "saved" view:
                        ├── Library header ("Saved Movies")
                        ├── Empty state (🎬 + "No saved movies yet") OR
                        └── Grid of saved <DefaultCard>s (5 cols)
```

---

## 🧩 Reusable (co-located) Components — MovieRoom.tsx

These helper components are **defined in the same file** as `MovieRoom` (not exported separately). Reuse their props/behavior if you extend the UI.

### `GlassPanel`
```tsx
function GlassPanel({ children, className }: {
  children: React.ReactNode; className?: string;
})
```
Glass container: bg `rgba(255,255,255,0.05)`, border `rgba(255,255,255,0.09)`, `blur(20px)`, radius `16`.

### `NavIcon`
```tsx
function NavIcon({ icon, active, onClick, label }: {
  icon: React.ReactNode; active: boolean; onClick: () => void; label: string;
})
```
Sidebar nav button. Active: bg `rgba(255,255,255,0.12)` + border `0.15`, white icon. Inactive: transparent bg, `rgba(255,255,255,0.35)` icon.

### `IconBtn`
```tsx
function IconBtn({ children, active, onClick, label }: {
  children: React.ReactNode; active: boolean; onClick: () => void; label: string;
})
```
32×32 toggle button. Active: bg `0.15`, white. Inactive: bg `0.06`, `rgba(255,255,255,0.4)`.

### `DefaultCard`
```tsx
function DefaultCard({ movie, selected, isSaved, isFav, onSelect, onSave, onFav }: {
  movie: (typeof MOVIES)[0]; selected: boolean;
  isSaved: boolean; isFav: boolean;
  onSelect: () => void; onSave: () => void; onFav: () => void;
})
```
Movie poster card: 2:3 aspect ratio image, gradient overlay, hover action buttons (fav/save) with `stopPropagation`, title/year at bottom, accent-tinted genre badge below.

---

## 🧠 State Management (per page)

### `Landing.tsx`
| State | Type | Purpose |
|-------|------|---------|
| `hovered` | `number \| null` | which poster is hovered |
| `tick` | `number` | cycling index (3s interval) for genre chip highlight |

### `MovieRoom.tsx`
| State | Type | Purpose |
|-------|------|---------|
| `activeView` | `"home" \| "saved"` | current sidebar tab |
| `selectedMovie` | `Movie` | currently featured movie |
| `search` | `string` | search input value (filters MOVIES by title/genre) |
| `saved` | `number[]` | saved movie ids |
| `favorites` | `number[]` | favorited movie ids |

> **Note**: No persistence — `saved`/`favorites` reset on refresh/navigation. There is **no shared state between pages**.

---

## 🖼️ Images & Assets

- Movie posters currently come from **Unsplash URLs** (external CDN) — hardcoded.
- Icons = inline SVGs (heart, bookmark, home, profile, search, back arrow) + emoji (`🎬`, `✦`, `◈`, `◉`).
- Local file `src/imports/WIN_20260830_22_21_56_Pro.jpg` exists but is **unused**.

---

## 🔌 API Integration Status (Important for Agents)

The frontend currently makes **zero API calls**. All data is **hardcoded**:

- `Landing.tsx`: `FEATURE_CARDS`, `FLOATING_GENRES`, `PREVIEW_POSTERS`
- `MovieRoom.tsx`: `MOVIES` (5 hardcoded), `TOP5`, `SIMILAR`

The backend (FastAPI at `http://127.0.0.1:8080`) exposes the full API documented in **`API_GUIDE.md`** (same folder). If you connect them, match the frontend's data shapes to the backend models and map `<img>` sources from `poster_url`.

---

## ✅ Conventions Checklist for Agents

- Export every component as **default export** (`export default function X()`).
- Keep helper components in the **same file** as their parent.
- Use **Tailwind utility classes** for layout and general styling.
- Use **inline `style` props** for gradients, glass effects, blur, dynamic/accent colors, and JS-driven hover states.
- Keep global font wiring + Tailwind import in **`src/index.css`** with `@import` statements *first*.
- Use double quotes for strings containing apostrophes; escape otherwise.
- Do **not** introduce a state/component/icon/animation library unless required — match existing patterns.
- All UI is **dark glassmorphism** — keep `#0d1b3e / #050a14 / #0a0510` backgrounds and white-opacity text.
