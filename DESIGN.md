---
name: Skill-High
description: Practical work and portable proof on a warm paper canvas.
colors:
  ink: "#172238"
  ink-soft: "#46536a"
  muted: "#5c6678"
  cobalt: "#3046d3"
  cobalt-dark: "#2536a8"
  saffron: "#f4c76b"
  line: "#dcdddc"
  line-dark: "#858ea0"
  paper: "#f8f7f3"
  wash: "#f8f7f3"
  white: "#ffffff"
  cobalt-tint: "#edf0ff"
  cobalt-on: "#dbe1ff"
  danger: "#a62d3c"
  success: "#22654d"
  focus: "#3046d3"
typography:
  display:
    fontFamily: "Schibsted Grotesk, Arial, sans-serif"
    fontSize: "clamp(1.9rem, 3.2vw, 2.7rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Schibsted Grotesk, Arial, sans-serif"
    fontSize: "clamp(3.2rem, 7vw, 5.75rem)"
    fontWeight: 700
    lineHeight: 0.93
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Schibsted Grotesk, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  control: "7px"
  card: "8px"
  pill: "999px"
  avatar: "50%"
spacing:
  page-max: "1280px"
  header: "72px"
  control-min: "42px"
  standard: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: ".58rem .95rem"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: ".58rem .95rem"
    height: "42px"
  input-field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: ".58rem .65rem"
    height: "42px"
  navigation:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    padding: "0 1.25rem"
    height: "{spacing.header}"
    width: "{spacing.page-max}"
  listing-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.card}"
    padding: ".85rem .9rem .95rem"
  tag:
    backgroundColor: "{colors.cobalt-tint}"
    textColor: "{colors.cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: ".25rem .55rem"
  journey-preview:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
---

# Design System: Skill-High

## Overview

**Creative North Star: "The Brief-to-Proof Studio"**

Skill-High is a practical workbench for students, recent graduates, and the people hiring focused help. Its visual world follows a clear brief through delivery to a useful record: cobalt supplies the signal, warm paper gives the system room to breathe, and studio photography makes the work feel made rather than merely listed. The shared shell keeps discovery and workspace screens quiet, legible, and direct.

The landing uses real studio and desk imagery as editorial context; catalog imagery remains category context, not seller evidence. White working surfaces, fine rules, compact records, and a restrained cobalt action color carry the same voice into accounts and work management. The former forest/Fiverr-style marketplace treatment is not part of this world.

**Key Characteristics:**

- Cobalt actions and selected states on a warm paper canvas.
- Schibsted Grotesk headlines paired with DM Sans operational copy.
- Photographic context balanced by flat, bordered records.
- A user-driven Brief → Delivery → Proof state change with an immediate reduced-motion fallback.

## Colors

The palette is a clear cobalt signal over warm paper, with ink for durable reading and saffron for a small, human emphasis.

### Primary

- **Cobalt:** Primary actions, selected navigation, links, focus, and the proof chapter.

### Secondary

- **Saffron:** Warm selection and proof-record emphasis; use as a deliberate accent, not a second action color.

### Neutral

- **Ink:** Headings, prices, body text, and the strongest workspace hierarchy.
- **Soft ink:** Supporting explanations and readable secondary copy.
- **Muted:** Metadata, quiet labels, and empty/loading states.
- **Paper / wash:** The warm page canvas and low-contrast supporting surfaces.
- **White:** Working cards, controls, and the landing journey surface.
- **Quiet line / control border:** Thin grouping rules and native form control boundaries.
- **Cobalt tint / cobalt-on:** Light selected-state surfaces and readable copy on cobalt.
- **Danger / success:** Semantic error and success states only.

**The Cobalt Signal Rule.** Cobalt is the action and navigation signal; saffron is reserved for emphasis and proof, and semantic success remains separate.

## Typography

**Display Font:** Schibsted Grotesk (with Arial, sans-serif fallback)

**Body Font:** DM Sans (with Arial, sans-serif fallback)

**Character:** Schibsted Grotesk gives the product a compact, confident work voice. DM Sans keeps forms, records, explanatory copy, and status text open and serviceable.

### Hierarchy

- **Headline** (700, clamp(3.2rem, 7vw, 5.75rem), 0.93): Landing proposition and other high-attention entry statements.
- **Display** (700, clamp(1.9rem, 3.2vw, 2.7rem), 1.1): Operational page headings and catalog titles.
- **Title** (700, 1.25rem, 1.1): Record headings, section titles, and compact workspace hierarchy.
- **Body** (400, 16px, 1.5): Forms, descriptions, messages, and explanatory copy.
- **Label** (700, 0.75rem, 1.5): Skills, statuses, metadata, and field labels. Uppercase is reserved for functional state/category labels.

**The Tight Type Rule.** Display headings use restrained negative tracking around -0.04em; body copy stays sentence-case and readable.

## Layout

The shared shell is centered in a 1280px maximum content frame. Desktop header content uses a 72px minimum row and 1.25rem side padding; catalog, detail, and workspace shells use the same frame with 1.25rem desktop and 1rem small-screen padding. Records are given room by thin rules and open gaps rather than by stacking every element inside a card.

The responsive breakpoints are 1080px for the first density change, 760px for the phone layout, and 470px for the smallest controls. Service cards move from four columns to three, two, then one. Detail, order, and workspace columns collapse to one at the phone breakpoint; category and workspace navigation remain horizontally scrollable where needed. Filters wrap instead of becoming a dense table.

The landing's hero uses a two-column editorial grid on wide screens and puts the headline/actions before the visible collaboration image on phones. Its image treatment is intentionally cropped and dimensioned; lower content stacks without requiring hover. The shared Brief, Delivery, and Proof selector controls the adjacent journey preview and reveals that preview before its bounded horizontal handoff.

## Elevation & Depth

The system is flat at rest and layered through borders, tonal contrast, and a small number of purposeful responses. Cards lift only on hover; the process photograph and account menu are the notable ambient surfaces. There are no decorative review stripes, floating badge fields, or persistent shadow stacks.

### Shadow Vocabulary

- **Process-photo lift:** 0 16px 40px rgba(23, 34, 56, .17), separating the small overlapping landing photograph from the paper canvas.
- **Account-menu lift:** 0 12px 30px rgba(17, 34, 28, .12), keeping the native details menu legible above the shell.
- **Card hover:** A 2px upward transform with border-color change; no resting card shadow.

**The Flat-at-Rest Rule.** Use a border or tonal shift first; reserve shadows for a surface that actually needs separation.

## Shapes

Controls use gently squared 7px corners; cards and panels use 8px; skill/status tags and avatars use pill and circular silhouettes. Borders do most of the grouping work. Inputs and textareas keep native labels, a 42px minimum control height, and visible validation/focus states. The shared focus treatment is a 3px cobalt outline with a 2px offset.

The world has no receipt edges, perforations, literal stamps, collage badges, or icon-font substitutes. Shape is quiet and useful so the work record stays primary.

## Components

### Buttons

- **Shape:** 7px control corner with a 42px minimum height.
- **Primary:** Cobalt fill, white text, 700-weight body type, and .58rem .95rem padding. Use for the next concrete action.
- **Hover / Focus:** Cobalt darkens on hover; focus uses the shared visible outline; disabled actions reduce opacity and wait.
- **Secondary:** White fill with a control-border stroke and ink text; hover shifts to the warm wash.

### Cards / Containers

- **Corner Style:** 8px on service cards, panels, and profile metric surfaces.
- **Background:** Listing cards stay paper-backed; white is used for controls and selected record surfaces, with cobalt or saffron reserved for intentional signature records.
- **Shadow Strategy:** Flat at rest; service cards use a 2px hover lift and border-color response.
- **Border:** Quiet 1px line for cards, panels, records, and section rules.
- **Internal Padding:** Service card content uses .85rem .9rem .95rem; panels use approximately 1.3rem.

### Inputs / Fields

- **Style:** Native labelled fields on white, 1px control-border stroke, 7px corner, 42px minimum height, and .58rem .65rem padding. Textareas grow vertically from a 110px minimum.
- **Focus:** A visible 3px cobalt outline with a 2px offset.
- **Error / Disabled:** Errors are text-bearing notices in the danger treatment; disabled controls visibly reduce opacity.

### Navigation

- **Style:** The header is a paper/white working row with an ink SH mark, Schibsted Grotesk wordmark, quiet text links, and a cobalt Join/action button. Workspace navigation is native labelled text navigation with semantic current-page state; it is not a pill rail.
- **Catalog treatment:** Category controls are horizontally scrollable, with a 2px cobalt underline for the selected category. The landing has Find work, Find talent, and How it works; private workspace navigation exposes Overview, Orders, Inbox, and Earnings.
- **Mobile:** Header links wrap into a labelled horizontal row; search and category controls retain real labels and remain usable at 320px.

### Chips

- **Style:** Cobalt-tint background, cobalt text, 999px pill, compact label sizing, and .25rem .55rem padding.
- **State:** Tags identify skills and statuses. They do not become primary navigation or carry an action by decoration alone.

### Brief → Delivery → Proof Journey

The distinctive interactive component is a three-state, user-controlled preview. Brief, Delivery, and Proof use pressed button semantics; the heading and supporting copy update immediately, while the bounded preview handoff uses a 250ms horizontal transition. The hero selector reveals the shared preview before that handoff, so the control never changes state offscreen. Proof is a semantic saffron record, not a claim that a seed order completed. Reduced motion removes the spatial movement while preserving the state change.

## Do's and Don'ts

### Do:

- **Do** use cobalt for the next concrete action and selected navigation, with warm paper as the default canvas.
- **Do** pair studio/editorial photography with honest category context and dimensioned responsive crops.
- **Do** keep catalog, order, profile, and proof records flat, bordered, and readable.
- **Do** preserve native labels, visible focus, semantic current/pressed states, and reduced-motion behavior.
- **Do** label fictional listings, illustrative proof, simulated payment, and local mail honestly.

### Don't:

- **Don't** reintroduce the discarded forest/teal or Fiverr-like visual identity.
- **Don't** add giant slogans, fake testimonials, invented ratings/metrics, or seller portfolio claims.
- **Don't** use decorative eyebrow kickers, Unicode icon substitutes, receipt/perforation motifs, or review stripes.
- **Don't** let motion become an autonomous reveal system; keep the authored 600ms hero entrance and 250ms journey handoff bounded.
- **Don't** turn tags into primary navigation or publish proof beyond its explicit title, skills, and completion date consent.
