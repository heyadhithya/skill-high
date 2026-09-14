---
name: Skill-High
description: Student-first work, made clear and credible.
colors:
  ink: "#13243a"
  ink-soft: "#31465d"
  paper: "#f6f1e8"
  panel: "#fffdf8"
  line: "#ddd1bf"
  teal: "#08756a"
  teal-deep: "#07584f"
  teal-wash: "#dcefe8"
  amber: "#c77814"
  danger: "#a43d32"
  danger-deep: "#843128"
  white: "#fff"
  secondary-fill: "#e8dfd0"
  secondary-hover: "#ded2c0"
  input-paper: "#fffefa"
  input-line: "#cbbda8"
  input-line-hover: "#a79780"
  placeholder: "#788897"
  process-ink: "#d1e5e1"
  metric-ink: "#e5f1ef"
  metric-muted: "#b6cfcb"
  listing-wash: "#faf5ec"
  message-wash: "#f0e9dd"
  error-wash: "#f8e5e1"
  error-ink: "#862f27"
  scroll-thumb: "#b7aa96"
  market-ink: "#1d1f20"
  market-ink-soft: "#383a3d"
  market-ink-hover: "#303235"
  market-forest: "#18372e"
  market-focus: "#8bd7b5"
  market-black: "#000"
  market-line: "#e5e5e5"
  market-nav: "#595d62"
  market-copy: "#62676d"
  market-meta: "#6a706f"
  market-control-line: "#d1d3d4"
  market-card-line: "#e4e5e5"
  market-card-hover: "#8faaa0"
  market-service-cover: "#eaf2ee"
  market-project-cover: "#f3eee6"
  market-alt-cover: "#e8eff3"
  market-project-ink: "#5d4529"
  market-alt-ink: "#24495c"
  market-link: "#127455"
  market-link-hover: "#0a503b"
  market-empty-line: "#b9bfbd"
  market-auth-line: "#e2e3e3"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(3rem, 7vw, 6.3rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 750
  brand:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.55rem"
    fontWeight: 700
  mark:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 800
  headline:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.65rem, 2.7vw, 2.25rem)"
    fontWeight: 600
  title:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.3rem"
    fontWeight: 600
  lede:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "clamp(1.06rem, 1.5vw, 1.22rem)"
    fontWeight: 400
  journey:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 800
  metric:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 600
  chip:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.74rem"
    fontWeight: 800
  small:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.86rem"
    fontWeight: 400
  listing:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 700
  demo-title:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.94rem"
    fontWeight: 700
  mobile-brand:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "1.35rem"
    fontWeight: 700
  market-brand:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
  market-hero:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(2.4rem, 5.5vw, 4.8rem)"
    fontWeight: 700
  market-section:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.35rem)"
    fontWeight: 700
  market-cover:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "1.55rem"
    fontWeight: 700
  market-card-title:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "1.12rem"
    fontWeight: 700
  market-mobile-hero:
    fontFamily: "Manrope, Arial, sans-serif"
    fontSize: "clamp(2.2rem, 11vw, 3.25rem)"
    fontWeight: 700
rounded:
  control: "10px"
  button: "12px"
  panel: "16px"
  mobile-panel: "14px"
  pill: "999px"
  compact: "6px"
  navigation: "8px"
  market-mobile: "9px"
spacing:
  compact: "0.65rem"
  standard: "1rem"
  panel: "clamp(1.25rem, 2.5vw, 2rem)"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "#fff"
    rounded: "{rounded.button}"
    padding: "0.68rem 1rem"
  button-secondary:
    backgroundColor: "#e8dfd0"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0.68rem 1rem"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  input:
    backgroundColor: "#fffefa"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0.65rem 0.75rem"
---

# Design System: Skill-High

## Overview

**Creative North Star: "The Campus Marketplace"**

Skill-High’s public surface is direct and searchable: a clear white navigation bar, one dark forest search field, and real listing records. It borrows the familiar marketplace rhythm of discovery and comparison without importing another platform’s branding, imagery, copy, or UI chrome.

**Key Characteristics:**

- Search and live listings lead the page before product storytelling.
- Restrained white and forest surfaces make work records easier to compare.
- Compact navigation and plain language replace decorative marketing treatment.

## Colors

The public marketplace treats forest as the discovery surface and near-black as navigation and search action; all other color stays quiet.

### Primary

- **Working Teal** (`#08756a`): primary actions, emphasis, and verified-status language.
- **Deep Teal** (`#07584f`): hover state and linked text.

### Tertiary

- **Focused Amber** (`#c77814`): focus ring and restrained attention marker.

### Neutral

- **Proof Navy** (`#13243a`): heading ink, nav selection, and high-trust metric panels.
- **Studio Paper** (`#f6f1e8`): page ground.
- **Clean Sheet** (`#fffdf8`): panels and forms.
- **Pencil Line** (`#ddd1bf`): structural separators.

**The One Signal Rule.** Teal is the only ordinary primary action color; amber never competes with it.

## Typography

**Display Font:** Manrope (with Arial fallback)
**Body Font:** DM Sans (with Arial fallback)

**Character:** Manrope and DM Sans keep search, listing titles, financial values, and order activity direct and scanable.

### Hierarchy

- **Display** (600, `clamp(3rem, 7vw, 6.3rem)`, `0.98`): landing and marketplace statements only.
- **Headline** (600, `clamp(1.65rem, 2.7vw, 2.25rem)`, `0.98`): panel and workflow headings.
- **Body** (400, `16px`, `1.55`): product explanation and records.
- **Label** (750, `0.9rem`): field labels and task metadata.

**The Quiet Label Rule.** Labels support the task; only the action and the information it changes receive visual weight.

## Layout

The content shell tops out at `1240px` with responsive side padding. Landing and marketplace introductions use a 1.35:0.65 editorial split; operational views use three-column metrics and two-column work panels before collapsing to a single column at `680px`. Records are separated by a line and generous vertical rhythm, not nested container chrome.

## Elevation & Depth

Panels use one ambient elevation vocabulary: `0 18px 40px rgba(19, 36, 58, 0.09)`. The dark process panel receives a deeper ambient shadow to establish it as an explanatory aside. There is no default border-plus-shadow combination.

## Shapes

Controls are rounded but not pill-shaped: inputs use `10px`, buttons use `12px`, and panels use `16px`. Pills are reserved for compact state metadata such as career stage, order status, and match score.

## Components

### Buttons

- **Shape:** tactile `12px` corners with compact, confident padding.
- **Primary:** Working Teal on white; hover deepens the teal and lifts by one pixel.
- **Secondary:** warm neutral fill with navy text; no shadow.
- **Focus:** 3px amber ring offset by 3px.

### Chips

- **Style:** teal wash background with deep teal text and compact all-caps-adjacent label spacing.
- **Use:** status and metadata only; never a primary navigation control.

### Cards / Containers

- **Corner Style:** `16px` for panels, `12px` for embedded work records.
- **Background:** clean-sheet panels on studio paper; navy for metrics and the process explanation.
- **Internal Padding:** responsive panel token.

### Inputs / Fields

- **Style:** clean-sheet fill, warm pencil-line stroke, and `10px` corners.
- **Focus:** teal border plus a low-opacity teal focus area; keyboard focus remains amber.

### Navigation

Workspace tabs use a horizontal scroll-safe strip on narrow screens. The active tab is navy with white text; inactive tabs are quiet warm-neutral controls.

## Do's and Don'ts

### Do:

- **Do** use navy for high-trust totals and selected navigation.
- **Do** make the next workflow action teal and keep metadata in a teal wash.
- **Do** let real order, proof, and marketplace content create density.

### Don't:

- **Don't** use amber as a second CTA color.
- **Don't** place headings under decorative eyebrow labels.
- **Don't** use colored side rails, emoji-as-icons, or gradient text as substitutes for hierarchy.
