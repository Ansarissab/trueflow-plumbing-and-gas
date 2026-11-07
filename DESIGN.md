# TrueFlow Plumbing & Gas, design system

This document keeps the site feeling custom designed rather than vibe coded.
Every future round should change only what these rules allow, and should run
the QA bar at the end. Sold as a fictional demo brand: Sydney-based plumbing
and gas, StoryBrand PEACE structure, blue trust palette with an amber action
colour.

Source of truth: `src/styles/global.css`. All values live as tokens; nothing
hardcodes hex values, radii or shadows outside that file.

## Palette

Five families only, each with a `-rgb` triplet for translucent shades.

| Family   | Tokens |
| ---      | --- |
| Ink      | `--ink #0a1f30`, `--ink-deep #081625` (headings, dark surfaces) |
| Ice      | `--bg #f6f9fc`, `--bg-raised`, `--card #fff`, `--line`, `--line-strong` |
| Blue     | `--brand #0a6ad4`, `--brand-dark`, `--brand-deep`, `--brand-bright`, `--brand-tint` |
| Amber    | `--cta #ffb020`, `--cta-dark`, `--cta-bright`, `--cta-ink #201401` |
| Red      | `--danger #e5484d` and family, problem states only |

Green exists as a success family for guarantees (`--ok`, tint, ink variants).

Rules:

- Never introduce a hue outside these families. No new accent per section.
- Dark sections are ink, not grey. Copy on dark uses `--on-ink` /
  `--on-ink-dim`, never a raw low-contrast grey.
- `--muted` is calibrated AA on ice backgrounds; do not lighten it further.
- Text selection is solid amber with `--cta-ink` text, so it stays legible on
  light and dark sections alike.

## Type

- Body and UI: Plus Jakarta Sans Variable, self-hosted via
  `@fontsource-variable/plus-jakarta-sans`. Nothing uses a system default.
- Display headings (`h1`, `h2` and the `.guide-stats b` numerals):
  Bricolage Grotesque Variable via `@fontsource-variable/bricolage-grotesque`,
  token `--font-display`. It gives the brand a distinct voice while Plus
  Jakarta Sans keeps the body calm and legible. h3 and below stay in PJS to
  keep hierarchy obvious.
- Scale is clamped, never jumps per breakpoint: h1
  `clamp(2.35rem, 4.6vw, 3.4rem)` at weight 800, h2
  `clamp(1.75rem, 3.2vw, 2.45rem)`, h3 `1.18rem`. Headings share
  `line-height: 1.15`, letter-spacing `--track-tight (-0.022em)` and
  `text-wrap: balance`; paragraphs use `text-wrap: pretty`.
- Eyebrows: uppercase, 0.78rem, weight 800, 0.14em tracking, brand blue, with
  a small amber dot.

## Shape and depth

Two tokens cover every rounded corner, plus two deliberate exceptions:

- `--radius-lg: 24px` for large cards and imagery.
- `--radius-sm: 12px` for chips, inputs, small cards, the skip link, icon
  chips. Do not invent new intermediate values (a six-value radius census of
  10/11/12/13/14px is exactly the ad hoc smell this token exists to prevent).
- `--radius-pill` for buttons and badges.
- Exceptions: `6px` on `:focus-visible` and `1px` on the header notification
  dot. Changing them is fine, proliferating is not.

Shadow family, three tiers only (`--shadow-sm/md/lg`), all warm navy based on
`--ink-rgb`, soft and low opacity. `--ring` is the single focus style (3px
brand-tinted box-shadow, `:focus-visible` only). Elevation on hover moves at
most one tier plus a 3 to 5px lift.

## Motion

One rise, reused everywhere. `tf-rise`: opacity 0 to 1, `translate` 26px to
none. It animates `translate`, not `transform`, so a filling reveal never
overrides the hover-lift `transform` rules on cards.

- Hero: one-shot `.hero-copy` 0.8s ease-out, `.hero-logos` same with 0.15s
  delay, under `@media (prefers-reduced-motion: no-preference)`.
- Section content (`.section-head`, `.problem-card`, `.service-card`,
  `.plan-card`, `.review-card`, `.contact-card`, `.quote-form`, `.faq-item`,
  `.guarantee`, `.guide-copy`, `.guide-stats`): scroll-driven reveal on a
  `view()` timeline, `animation-range: entry 0% entry 40%`, guarded by
  `@supports (animation-timeline: view())`.
- No per-child stagger: delay semantics break on scroll timelines, and the
  alternation of dark and light bands already breaks grid monotony.
- Browsers without scroll timelines and users with reduced motion get fully
  visible static content. Never hide content behind motion that may not run.

## Imagery

Free Pexels only, visually verified before use. Credits are recorded in
`public/llms.txt` and `README.md`; never guess a photographer name. Plan
photos show real plumbing work being done, not smiling stock handshakes.
The guide section sits on a full-bleed photo under the ink scrim.

## Copy

Australian English, curly apostrophes, no em dashes (en dashes only for
numeric ranges). StoryBrand: the customer is the hero, TrueFlow is the guide,
so copy leads with the problem and the plan, not with our trophy cabinet.
Specificity beats adjectives: numbers, names, roles, suburbs, hours
(1300 478 879, QBCC 1234567, ABN 12 345 678 901, Mon to Sat 6:30am to 7pm).

## Anti-vibe-code checklist (run before every commit)

1. Copy is specific, no generic filler; apostrophes curly; no em dashes.
2. Every colour traces to a token family; no orphan hues.
3. Type is self-hosted variable fonts on the clamp scale; headings balanced.
4. Radii and shadows come from the tokens; no new one-off values.
5. Section rhythm varies: dark and light bands alternate, photo cards break
   the grid, icon-chip grids stay small (the 23 same-shaped chips are
   deliberate; adding more is not).
6. Motion is tokenised, guarded, and degrades to visible static content.
7. `npm run build` passes; no horizontal overflow at any breakpoint.
8. Lighthouse: accessibility, best practices and SEO each 1.0 with zero
   failed assertions. Fastest 3G still feels quick.
9. Section screenshots re-taken and compared against the previous round.
