# Admin panel – design system & migration notes

## Tailwind v4, CSS-first
* No `tailwind.config.js`. Everything lives in `src/styles/`:
  `theme.css` (tokens + `@theme inline`), `base.css` (element defaults), `utilities.css` (`@utility` helpers + legacy class aliases), `editor.css` (Editor.js theming).
* `index.css` only imports them. Tailwind `^4.3`, `@tailwindcss/vite`.

## Colours come from variables
Every colour is a CSS variable in `styles/theme.css` (`:root` = light, `.dark` = dark) exposed to Tailwind through `@theme inline`:

| group | utilities |
|---|---|
| surfaces | `bg-canvas` `bg-surface` `bg-surface-2` `bg-surface-3` `bg-overlay` |
| text | `text-fg` `text-fg-muted` `text-fg-subtle` `text-fg-faint` |
| lines | `border-line` `border-line-strong` `ring-ring` |
| brand | `bg-primary` (+`-hover` `-soft` `-fg`), `bg-accent` (+`-hover` `-soft` `-fg`) |
| status | `success` `warning` `danger` `info` (+`-soft`) |
| always-dark / always-white | `ink` / `paper` |
| sidebar | `bg-sidebar` `text-sidebar-fg` `bg-sidebar-active` … |
| charts | `chart-1…6` (also used as `var(--chart-n)` in recharts) |
| premium (Ora AI) | `gold-100…900` |

Opacity modifiers work (`bg-primary/10`). **Re-branding = edit the values in section 1 of `theme.css`.**
Because tokens switch with the theme, components need no `dark:` variants (the 1,358 existing ones were removed).

Migration done by `tools/codemod_tokens.py` (kept in the repo): 1,837 palette classes (`bg-gray-100`, `text-blue-600`, `bg-(--main2)`, `bg-[#fcfcfc]` …) and ~165 raw hex values in JS / CSS were mapped to tokens.
Theme: `light | dark | system`, saved in `localStorage.theme`, class on `<html>`, applied before first paint (no flash).

## Component kit – `src/components/ui`
`Button · IconButton · Field · Input · SearchInput · Textarea · Select · Switch · Checkbox · MultiSelect · ChipInput · Card · Badge · StatusBadge · Avatar · Modal · Drawer · ConfirmDialog · Menu · Tabs · Pagination · DataTable · PageHeader · StatCard · EmptyState · ErrorState · Alert · Skeleton · Spinner · BrandLoader`
* variants through `class-variance-authority`, class merging through `lib/cn` (tailwind-merge that knows the tokens)
* accessible: labels / hints / errors wired with `aria-*`, focus trap + Esc + scroll lock in dialogs, visible focus rings, `prefers-reduced-motion`
* responsive: `DataTable` turns rows into cards on phones, `Modal` becomes a bottom sheet, sidebar becomes a drawer
* the old helpers (`InputFields`, `SelectField`, `TextareaFields`, `Table`, `Pagination`, `Confirmation`, `PopUp`, `SlidePannel`, `DropDown`, `Loader`) keep their props but render the new components, so the 50+ untouched screens got the new look

## App shell – `src/components/layout`
`AdminLayout` (sidebar rail / drawer + sticky top bar) · `Sidebar` · `Topbar` (theme switch, notifications, Ora AI, account menu) · `Breadcrumbs` · `Can` · `navConfig.js` (the menu, filtered by permission).

## Permissions in the UI
The backend sends `user.permissions` + `user.isSuper` (login response and `/me`). `usePermission()` → `can("news.publish")`, `canAny([...])`.
`<ProtectedRoute permission="role.view" />` (string or any-of array), `<Can perm="…">`. Menu items, routes and row actions all use the same keys as the API.

## New / rebuilt screens
Login · Overview (cached `/analytics/dashboard`) · Analytics (overview, content by category/state/district/tag, team, timing heat-map; reporters without `analytics.view` see "My performance") ·
News / Drafts / Review queue (one shared `NewsList`) · Reporters (roles, block with reason + expiry, per-user permission overrides, trust, reset password, delete) ·
**Roles & permissions** · **Tags** (create, edit, aliases, merge, delete) · **Categories & locations** (categories + sub-categories, states, districts) · **Shorts & videos** (upload to Cloudflare, YouTube link, approve, sync) ·
news form: API-driven categories / sub-categories / states / districts and tag picker (`TaxonomyFields`, `TagPicker`).

## Tests
`pnpm test` (Vitest + Testing Library): permission helpers, menu visibility per role, route guards, the UI kit (a11y wiring, dialogs, focus trap, pagination, tables, multi-select).

## Not touched (still on the old API / old styling shape)
Legacy YouTube-news pages (`Videos`, `CreateVideo`, `UpdateVideo` …) keep their own state/district strings (the backend `YtNews` model is unchanged); they are re-coloured by the codemod but not re-designed.
