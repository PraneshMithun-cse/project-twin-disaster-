# ResponSync Design System — Squarespace-derived, fully monochrome

This is the binding style contract for the UI restyle. Read it before editing any component.

## The brief

Make ResponSync look like **squarespace.com**: minimal, editorial, generous whitespace,
hairline rules, restrained type. Then go one step further than Squarespace — **there is no
hue anywhere in this product**. Black, white, and a four-step gray ramp. Nothing else.

This is a *visual* restyle. **Do not change behavior, data flow, props, state, handlers,
API calls, or component structure** beyond what styling requires. No renamed props, no
refactors, no "while I was in here" improvements. If a change would alter what the app
does, don't make it — report it instead.

## Palette — the complete list

| token | value | use |
|---|---|---|
| `--paper` / `bg-paper` | `#ffffff` | every surface, by default |
| `--wash` / `bg-wash` | `#f5f5f5` | recessed strips, table headers, inactive tabs |
| `--wash-strong` / `bg-wash-strong` | `#ebebeb` | pressed / selected fills |
| `--line` / `border-line` | `#dddddd` | **every** border and divider |
| `--muted` / `text-muted` | `#898989` | de-emphasised labels, placeholders, meta |
| `--subtle` / `text-subtle` | `#5a5a5a` | secondary body copy |
| `--near` / `text-near` | `#1a1a1a` | body copy on white |
| `--ink` / `text-ink` `bg-ink` | `#000000` | headings, primary buttons, emphasis |

Tailwind classes `bg-paper text-ink border-line text-muted text-subtle bg-wash` are all
wired up in `src/index.css` via `@theme`. Prefer them over arbitrary values.

### Accents — green and blue only

The palette is **not** fully monochrome any more. Two accents carry meaning, chosen for
colour psychology and colour-blind safety (green + blue avoids the red/green axis entirely):

| token | value | meaning |
|---|---|---|
| `--safe` / `text-safe` `bg-safe` | `#0e8a5f` | cleared, safe, operational, available, delivered, protected, resolved, connected |
| `--safe-strong` | `#0a6b4a` | text on white |
| `--safe-wash` | `#0e8a5f14` | 8% fill |
| `--info` / `text-info` `bg-info` | `#0072f0` | water, flood, rainfall, telemetry, informational, non-urgent official data |
| `--info-strong` | `#0059bd` | text on white |
| `--info-wash` | `#0072f014` | 8% fill |

**Critical stays black.** Maximum contrast reads as the gravest state, and it keeps the
urgent tier legible for every kind of colour vision. Advisory stays the black hatch.

So the severity ladder is now: critical = black solid · advisory = black hatch ·
info = blue · ok/safe = green. `.sev-mark--info` / `--ok`, `.sev-text--info` / `--ok`,
`.sev-row--info` / `--ok`, `.badge--info` / `.badge--safe` already carry these — use the
classes and the colour comes for free.

On a black surface the base accents sit near the contrast floor. Wrap that region in
`.on-dark` and the marks lift automatically (`--safe-on-dark #2fbf88`, `--info-on-dark
#4d9dff`, and critical inverts to a white mark). Do **not** put `.on-dark` on a container
that also holds white `.panel`s — it cascades and would invert their marks too.

For "not yet reached / inactive / disabled" use `.sev-mark--neutral`. That state carries no
meaning, so it must not take an accent — a pending step tinted blue reads as "informational",
which is wrong.

Use an accent **only where it carries that meaning**. Never as decoration, never as a brand
wash, never two accents on the same axis of one chart. Everything that is not "safe" or
"informational" stays on the black/gray ramp.

### Banned outright

Delete on sight, everywhere you touch:

- `bg-brand`, `text-brand`, `border-brand`, `shadow-brand/*`, `#d25f38`, `#a54121`
- every `cyan-*`, `teal-*`, `emerald-*`, `green-*`, `amber-*`, `orange-*`, `yellow-*`,
  `red-*`, `rose-*`, `blue-*`, `indigo-*`, `violet-*`, `purple-*`, `fuchsia-*`, `sky-*`,
  `lime-*`, `pink-*` Tailwind class — including `/10` `/20` opacity variants.
  Green and blue come from the `safe` / `info` tokens above, never from Tailwind's ramps.
- `slate-*`, `zinc-*`, `neutral-*`, `gray-*`, `stone-*` — map these onto the ramp above
- dark surfaces: `bg-[#050507]`, `bg-[#07080e]`, `bg-[#0b0c10]`, `bg-[#0d0e14]`,
  `bg-[#0e0e14]`, `bg-black`, `bg-slate-950`, `bg-neutral-900`, and friends
- glows and colored shadows: any `shadow-[0_0_Npx_rgba(...)]`, `shadow-cyan-*`,
  `drop-shadow-*` with a hue
- `backdrop-blur-*` on flat content panels. Blur belongs to the glass layer below, and
  only there — a blurred flat panel over a white page is grey mush.
- `.dot-grid`, `.dot-grid-light`, `.dot-grid-on-ink` — those helpers are gone
- gradient fills used as decoration (`bg-gradient-to-*` with hues). A neutral
  white→transparent scrim over media is fine.
- emoji used as UI iconography (🏛️ 🚒 🚓 🏥 …) — replace with a lucide icon or plain text
- `font-mono` / the `.mono` helper as an *aesthetic* choice. There is one typeface now.
  Keep tabular figures for coordinates/timers via `tabular-nums` instead.

## Typography

One family: **Clarkson** (self-hosted, `font-sans`). `Clarkson Serif` (`font-serif`) exists
but is reserved — use it only where an editorial serif genuinely helps, never for UI chrome.

Use the ported scale classes rather than ad-hoc Tailwind sizes:

| class | size @desktop | use |
|---|---|---|
| `.text--title1` | 100–120px | landing hero only |
| `.text--title2` | 70–106px | large landing section headings |
| `.text--title3` | 60–72px | landing section headings |
| `.text--title4` | 50–74px | closing CTA headings |
| `.text--subtitle1` | 36–40px | **the standard section heading** |
| `.text--subtitle2` | 26px | card titles, panel headings |
| `.text--subtitle3` | 20px, weight 500 | dense panel headings, stat labels |
| `.text--body` | 15px | body copy |
| `.text--body-medium` | 15px, weight 500 | emphasised body, column headings |
| `.text--footnote` | 12px | meta, captions, timestamps |
| `.text--eyebrow` | 11px, uppercase, 500 | section eyebrows, table headers |

Headings are **weight 300** with tight negative tracking — that is the Squarespace signature.
Do not bold headings. Do not letterspace body copy.

Inside dense dashboard panels the big title sizes are wrong; use `subtitle2` / `subtitle3` /
`body` / `footnote` / `eyebrow` there. The large scale is for the landing page.

## Buttons

Use the CTA classes from `src/index.css`, not bespoke Tailwind:

- `.cta.cta--primary` — solid black, white uppercase 14px/500, 4px radius, `padding: 23px 28px`
- `.cta.cta--secondary` — transparent, 1px black inset ring
- `.cta.cta--tertiary` — underlined uppercase text link, underline retracts on hover
- `.cta.cta--inline` — unstyled inline button
- add `.cta--compact` (12px 18px) or `.cta--mini` (8px 14px, 12px type) for dashboard density
- add `.cta--light` on a dark surface to invert
- an arrow goes in `<span className="cta__arrow">→</span>`; it slides 2px on hover

## Severity — monochrome, by weight and shape

**There is no red.** Severity reads through fill, rule weight and type weight:

| level | mark | row rule | type |
|---|---|---|---|
| critical | `.sev-mark.sev-mark--critical` — solid black square | `.sev-row--critical` (2px black left rule) | `.sev-text--critical` (black, 500) |
| advisory / high | `.sev-mark--advisory` — 45° hatch, black ring | `.sev-row--advisory` (1px `#898989`) | `.sev-text--advisory` (`#1a1a1a`, 400) |
| info / medium | `.sev-mark--info` — outline only, gray ring | `.sev-row--info` (1px `#ddd`) | `.sev-text--info` (`#5a5a5a`, 400) |
| ok / low / resolved | `.sev-mark--ok` — faint outline | none | `.sev-text--ok` (`#898989`) |

Add `.sev-mark--round` for circular pins/dots.

Badges: `.badge.badge--critical` (solid black), `.badge--advisory` (black ring),
`.badge--info` (gray ring), `.badge--quiet` (wash fill).

Because hue is gone, severity must be **more** explicit, not less: always pair the mark with
a text label ("CRITICAL", "ADVISORY"), and order lists by severity where the code already
knows it. Never rely on the mark alone.

Status that used to be green (online / healthy / ready) → `.sev-mark--ok` plus the word.
Never invent a green.

## Liquid glass — floating layers only

`src/index.css` provides `.glass`, `.glass--raised`, `.glass--interactive`, `.glass--dark`,
`.glass-pill`, `.glass-seg` / `.glass-seg--active`, `.glass-rule`.

**The rule that keeps this from turning to mush: glass is only for things that float _above_
content.** Map chrome, modals, popovers, dropdowns, toasts, sticky bars, floating toolbars.
Anything sitting in the document flow — cards, tables, form sections, list rows — stays an
opaque `.panel`. Glass over a flat white page is just grey.

- `.glass` — blur(20px) + saturate(180%), 62% white, specular top rim, soft wide shadow.
- `.glass--raised` — for modals and anything that must clearly out-rank other glass.
- `.glass--interactive` — adds hover brightening and a 0.985 press scale. Use on buttons.
- `.glass--dark` — for glass over a dark surface (dark map, black hero, scrim).
- `.glass-pill` — 999px radius, for toolbars and chips.
- `.glass-seg--active` — the selected segment inside a glass toolbar.

**Radius:** glass is 12–16px, not the 4px of flat chrome. Glass is liquid; it should look
like it has surface tension. Do not put a 4px radius on a glass element.

Never nest glass inside glass — the blurs compound and the inner element loses its rim.
Put flat content inside a glass container instead.

Fallbacks are already handled: `@supports not (backdrop-filter)` and
`prefers-reduced-transparency` both drop to a near-opaque surface, so chrome stays readable.
Do not add your own fallback.

## Surfaces and structure

- Cards/panels: `.panel` (white, 1px `#ddd`, 4px radius). Recessed variant `.panel--wash`.
- **No shadows by default.** Hover lift is `.lift` (border darkens to `#898989`, a 12px
  4%-black shadow). Nothing heavier.
- Dividers are 1px `#ddd`. Use rules and whitespace to separate, not boxes inside boxes.
- Radius is 4px. Pills/avatars may be full-round. Nothing else.
- Give sections room: Squarespace's rhythm is large vertical padding and a lot of air.
  In the dashboard keep density, but replace colored fills with whitespace + hairlines.
- Selected/active nav item: black text, weight 500, plus a 2px black left rule or a
  `bg-wash` fill — never a colored pill.

## Icons

lucide-react stays. Render at `strokeWidth={1.5}`, `currentColor`, size 14–18px in chrome.
No colored icon backgrounds, no icon "chips" with tinted fills.

## Motion

`--ease-sqsp: cubic-bezier(.23,1,.32,1)` for reveals, `--ease-cta: cubic-bezier(.645,.045,.355,1)`
for buttons. Available: `.animate-reveal`, `.animate-marquee`, `.animate-pulse-mono`, `.lift`.
Durations 0.25–0.8s. No neon pulse, no `animate-ping` glow, no breathing dots.

## Map

`src/index.css` already: sets CARTO Positron as the basemap, applies `grayscale(1)` to the
tile pane, and restyles Leaflet tooltips/popups/zoom/attribution to the white hairline look.
**Map overlays are drawn in JS and are NOT covered by that filter** — any `color`,
`fillColor`, `divIcon` HTML or inline style in a component must be converted to the ramp by
hand: risk zones become black/gray strokes with very low-alpha black fills and hatching for
severity; markers become white pins with a 1px black ring and a `.sev-mark` inside.

## Checks

`npx tsc --noEmit` from `/Users/pranesh/Downloads/RS-main` must pass clean before you finish.
Report: files changed, what you converted, tsc result, anything you deliberately left alone.
