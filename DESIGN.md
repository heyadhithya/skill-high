---
name: Skill-High
description: Student-first work, made clear and credible.
colors:
  ink: "#1d1f20"
  ink-soft: "#45494b"
  muted: "#6a706f"
  paper: "#ffffff"
  forest: "#18372e"
  forest-dark: "#0f2b22"
  teal: "#127455"
  line: "#e3e5e4"
  line-dark: "#c9cecb"
  wash: "#f5f7f5"
  focus: "#127455"
  danger: "#9a3027"
  success: "#0b684d"
typography:
  display:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(1.9rem, 3.2vw, 2.7rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  control: "7px"
  card: "8px"
  pill: "999px"
spacing:
  content: "1280px"
  standard: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: ".58rem .95rem"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: ".58rem .95rem"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: ".58rem .65rem"
  marketplace-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: ".85rem .9rem .95rem"
  tag:
    backgroundColor: "#eef4f0"
    textColor: "{colors.forest}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: ".25rem .55rem"
---

# Design System: Skill-High

## Overview

**Creative North Star: "The Clear Workbench"**

Skill-High is a practical campus marketplace. It feels like a well-organized workbench: the next useful action is visible, scope and effort are easy to compare, and every record can lead to a real detail or order view. White surfaces, quiet dividers, initials, and restrained category photography keep attention on the offer rather than on decorative polish.

The system borrows the density and directness of a familiar service marketplace while keeping Skill-High’s own voice, fictional development catalog, and honest product limits. It is explicitly not a slogan-heavy AI landing page, and category photography is editorial context—not seller portfolio evidence.

## Colors

Near-black ink and cool white provide the working ground. Deep forest is reserved for the discovery band; teal marks actions, links, and focus. Quiet gray lines separate records without turning the page into a dashboard.

### Primary

- **Working Teal** (#127455): Primary actions, active links, and focus rings.

### Secondary

- **Discovery Forest** (#18372e): Compact discovery surface and high-contrast contextual band.

### Neutral

- **Marketplace Ink** (#1d1f20): Headings, prices, and primary text.
- **Soft Ink** (#45494b): Supporting copy and metadata.
- **Muted Gray** (#6a706f): Secondary labels and quiet states.
- **Paper** (#ffffff): Main page and card surface.
- **Quiet Line** (#e3e5e4) and **Line Dark** (#c9cecb): Dividers and control borders.
- **Soft Wash** (#f5f7f5): Secondary surfaces and message bubbles.

### Named Rules

**The Clear Scope Rule.** A listing should expose its title, seller identity, effort, price, and next action without invented claims or filler copy.

## Typography

**Display Font:** Manrope (with Arial, sans-serif fallback)

**Body Font:** DM Sans (with Arial, sans-serif fallback)

**Character:** Manrope gives headings and prices a compact marketplace voice; DM Sans keeps forms, metadata, and operational records readable. Headings use a tight -0.04em ceiling, while body copy remains open and plain.

## Layout

The shared shell centers content in a 1280px container. The header is approximately 72px, followed by horizontally scrollable category shortcuts. The unfiltered discovery band stays at or below 200px so the first service row remains above the fold at desktop. Catalogs use four columns at desktop, two at tablet, and one on small phones.

Detail pages put title and seller identity before the category image in document order. On desktop the purchase panel sits beside the scope; on mobile it follows the image before the long description. Query state keeps search, category, price, sort, and detail routes shareable.

## Elevation & Depth

The system is flat and layered rather than shadow-led. Cards and panels use a thin border, with a small hover lift on marketplace cards only. The account menu is the one floating surface and uses a restrained shadow so it remains legible without becoming a visual focal point.

## Shapes

Controls use a 7px corner, cards and panels use an 8px corner, and status tags use a full pill. Borders carry most of the grouping work. Focus is a visible dark-teal ring with a short offset. Inputs and textareas retain labels and visible validation states.

## Components

- **Primary action:** Teal, white text, 7px corner, and a disabled pending state. Use for requesting, publishing, accepting, and saving.
- **Secondary action:** White fill with a quiet border. Use for navigation and reversible alternatives.
- **Search and form fields:** White controls with gray borders, visible labels, and a minimum 42px height.
- **Marketplace card:** Category image, seller initials/name, linked title, compact metadata, and a right-aligned rupee price.
- **Tags and statuses:** Small, readable pills for skills and lifecycle metadata; never use pills for primary navigation.
- **Account menu:** Native details/summary menu shared across signed-in views; navigation closes it after selection.

## Do's and Don'ts

- **Do** lead with the catalog and keep the first row useful without scrolling.
- **Do** link titles, proof records, matching projects, and order states to their real detail routes.
- **Do** label simulated payments, fictional seed data, and category illustrations honestly.
- **Don’t** add giant slogans, fake testimonials, generic delivery promises, or fabricated seller portfolios.
- **Don’t** hide API failures behind an empty catalog; show a retry action.
- **Don’t** use uppercase tracking as decoration or turn operational records into marketing copy.
