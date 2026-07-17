---
name: Modern Humanist
colors:
  surface: '#fcf9f5'
  surface-dim: '#dcdad6'
  surface-bright: '#fcf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ef'
  surface-container: '#f0edea'
  surface-container-high: '#ebe8e4'
  surface-container-highest: '#e5e2de'
  on-surface: '#1c1c1a'
  on-surface-variant: '#3f484a'
  inverse-surface: '#31302e'
  inverse-on-surface: '#f3f0ec'
  outline: '#6f797a'
  outline-variant: '#bec8ca'
  surface-tint: '#1b6870'
  primary: '#005158'
  on-primary: '#ffffff'
  primary-container: '#1e6a72'
  on-primary-container: '#a2e7f0'
  inverse-primary: '#8dd2da'
  secondary: '#00696d'
  on-secondary: '#ffffff'
  secondary-container: '#91f2f7'
  on-secondary-container: '#007074'
  tertiary: '#634200'
  on-tertiary: '#ffffff'
  tertiary-container: '#825800'
  on-tertiary-container: '#ffd597'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9eef7'
  primary-fixed-dim: '#8dd2da'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#004f56'
  secondary-fixed: '#91f2f7'
  secondary-fixed-dim: '#74d6db'
  on-secondary-fixed: '#002021'
  on-secondary-fixed-variant: '#004f52'
  tertiary-fixed: '#ffddaf'
  tertiary-fixed-dim: '#f8bc5a'
  on-tertiary-fixed: '#281800'
  on-tertiary-fixed-variant: '#614000'
  background: '#fcf9f5'
  on-background: '#1c1c1a'
  surface-variant: '#e5e2de'
  cream-surface: '#FDFAE4'
  warm-sand: '#D9C8A2'
  terracotta-error: '#87211E'
  olive-success: '#6B7A41'
  clay-brown: '#A6654E'
  dusty-rose: '#D8A39D'
typography:
  display-lg:
    fontFamily: Raleway
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Raleway
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-md:
    fontFamily: Raleway
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Raleway
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.04em
  headline-lg-mobile:
    fontFamily: Raleway
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system embodies a "Witty yet Wise" personality—balancing a professional, bioregional mission with a warm, artisanal, "handmade" touch. The aesthetic avoids generic corporate tropes in favor of a "Modern Humanist" style that feels planet-positive and deeply rooted in tradition.

The visual narrative is defined by:
- **Warmth & Earthiness:** Utilizing a cream-based surface strategy rather than clinical whites or cold grays.
- **Generous Whitespace:** Promoting a "Slow to make, Fast to experience" philosophy through breathable layouts.
- **Organic Geometry:** Softened edges and circular motifs that mirror natural forms like tree rings and fingerprints.
- **Premium Approachability:** Combining high-quality typography with soft, tactile depth to create a trustworthy yet inviting interface.

## Colors

The color strategy is built on a rigid accessibility framework known as the "Inverted Text Rule."

### Core Anchors
- **Primary Teal (#1E6A72):** Used for primary actions and active states. **Requirement:** Must only ever use White text labels.
- **Secondary Teal (#46ABB0):** Used for secondary accents and highlights. **Requirement:** Must only ever use Charcoal (#1D1D1B) text labels. Never use white text.
- **Gold (#DDA444):** Used for badges and status highlights. **Requirement:** Must only ever use Charcoal (#1D1D1B) text labels.
- **Cream (#FDFAE4):** The primary page surface color, providing a soft, organic alternative to pure white.

### Functional & Extended
- **Charcoal (#1D1D1B):** The universal color for all body text, headings, and iconography to ensure grounding and legibility.
- **Success & Error:** Success states use Olive (#6B7A41) with white text; error or high-priority states use Terracotta (#87211E) with white text.
- **Surface Tints:** Warm Sand (#D9C8A2) is reserved for subtle fills like table zebra striping and secondary containers.

## Typography

The typography system pairs the structured elegance of **Raleway** for headings with the friendly, approachable nature of **Nunito Sans** for UI elements and body copy.

- **Headings:** Use Raleway with Semibold (600) or Bold (700) weights. Maintain tight line heights for larger displays to ensure a modern look.
- **UI & Body:** Use Nunito Sans for all functional text. It provides high legibility at small sizes while maintaining the system's "rounded" personality.
- **Wordmarks:** Since brand-specific fonts (Caros Soft) are reserved for packaging and logos, use **Poppins** or **Nunito** as a substitute for any plain-text wordmark representations.
- **Hierarchy:** Ensure a clear distinction between informational body text and functional labels (buttons, chips) by using increased weights for the latter.

## Layout & Spacing

The layout follows a **fluid grid** model with a maximum content width of 1280px to maintain readability on ultra-wide monitors. 

- **Spacing Rhythm:** Based on an 8px base unit. This ensures all components—from button padding to section margins—feel mathematically consistent.
- **Mobile:** Uses a 4-column grid with 16px side margins.
- **Tablet:** Uses an 8-column grid with 24px margins.
- **Desktop:** Uses a 12-column grid with 40px margins and 24px gutters.
- **Whitespace:** Emphasize "Generous Whitespace." Component groups should be clearly separated by larger margins (32px+) to prevent the UI from feeling cluttered or "SaaS-like."

## Elevation & Depth

Visual hierarchy is conveyed through **tonal layers** and **ambient shadows**, moving away from flat design toward a more tactile, physical feel.

- **Surface Tiers:** Use White (#FFFFFF) for the most elevated elements like primary cards and floating modals. These sit atop the Cream (#FDFAE4) page background.
- **Shadows:** Shadows should be soft, diffused, and "warm." Use a low-opacity charcoal tint rather than pure black (e.g., `rgba(29, 29, 27, 0.08)`). Shadows should have a large blur radius (16px+) and minimal offset to simulate natural, ambient light.
- **Interactive States:** On hover, slightly increase the shadow spread and lift the element to provide a "squishy" tactile response.

## Shapes

The shape language is organic and approachable, heavily utilizing rounded corners to soften the interface.

- **Standard Radius:** 0.5rem (8px) for buttons, inputs, and small cards.
- **Large Radius:** 1rem (16px) for main containers and larger cards.
- **Pill Shapes:** Use for chips, tags, and badges to echo the circular brand motifs found in the sub-brand iconography.
- **Borders:** When borders are necessary (e.g., in input fields), use low-contrast charcoal outlines or "Warm Sand" fills rather than harsh dark lines.

## Components

### Buttons
- **Primary:** Primary Teal (#1E6A72) background with White text. Bold weight.
- **Secondary:** Secondary Teal (#46ABB0) background with Charcoal (#1D1D1B) text.
- **Accent/Ghost:** Gold (#DDA444) for unique highlights or simple charcoal outlines for neutral actions.
- **Shape:** 8px rounded corners.

### Input Fields
- **Surface:** White (#FFFFFF) background with a 1px border in Warm Sand or light Charcoal.
- **Active State:** Border changes to Primary Teal with a subtle 2px outer glow.
- **Labels:** Always in Charcoal, positioned above the field.

### Cards
- **Surface:** White (#FFFFFF) cards sitting on Cream (#FDFAE4) backgrounds.
- **Detail:** 12px corner radius and a soft ambient shadow. 
- **Padding:** Minimum 24px internal padding to maintain the "generous whitespace" rule.

### Chips & Badges
- **Status:** Use Gold for informational badges (charcoal text), Olive for success (white text), and Terracotta for alerts (white text).
- **Shape:** Fully pill-shaped (rounded-full).

### Lists & Tables
- **Styling:** Use Warm Sand (#D9C8A2) for zebra-striping or row-hover states to maintain the earthy palette. Use thin charcoal dividers at 10% opacity.