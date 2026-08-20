---
name: ResponSync Liquid-Glass Light
colors:
  primary: "#0EA5E9"       # Vibrant Blue / Cyan / Info highlight
  secondary: "#10B981"     # Vibrant Emerald / Safe
  tertiary: "#F59E0B"      # Vibrant Amber / Advisory
  error: "#EF4444"         # Vibrant Red / Critical
  neutral: "#F1F5F9"       # Slate Light / Page Background
  surface: "rgba(255, 255, 255, 0.7)" # Frosted White Glass Background
  border: "rgba(255, 255, 255, 0.6)"  # White Specular Border
  text: "#0F172A"          # Slate Dark Text
  text-muted: "#475569"    # Slate Subdued Text
  wash: "#F8FAFC"          # Very light wash
  wash-strong: "#E2E8F0"   # Hover/strong wash
rounded:
  sm: 6px
  md: 12px
  lg: 18px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.border}"
  glass:
    backgroundColor: "rgba(255, 255, 255, 0.7)"
    backdropFilter: "blur(20px) saturate(180%)"
    rounded: "{rounded.lg}"
    border: "1px solid rgba(255, 255, 255, 0.6)"
---

# ResponSync Liquid-Glass Light Design System

## Overview
This design system defines a premium, high-density, and highly vibrant **Liquid-Glass Light Aesthetic** for the **ResponSync Digital Twin Dashboard**.
The base theme is light, leveraging a soft slate-gray background (`#F1F5F9`) that allows frosted white glass containers (`rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(20px)`) to float dynamically. Spacing is compacted and edges are rounder (`18px`) to evoke a clean, modern, liquid feel.

## Colors
- **Primary / Info (#0EA5E9):** Vibrant cyan/blue for live telemetry, active streams, and interactive highlights.
- **Secondary / Safe (#10B981):** Represents safe evacuation routes, open shelters, and ready fleets.
- **Tertiary / Warning (#F59E0B):** Signifies advisory zones, medium water levels, and warning incidents.
- **Error / Critical (#EF4444):** Indicates submerged subways, critical incidents, and active dam discharges.
- **Neutral (#F1F5F9):** Soft slate-gray page background.
- **Surface (rgba(255, 255, 255, 0.7)):** Frosted glass surface.
- **Text (#0F172A):** Slate dark text for readability on light backgrounds.
- **Text Muted (#475569):** Subdued Slate gray for secondary details.

## Typography
- Paired with `Plus Jakarta Sans` for titles/navigation and `Geist Mono` for logs, coordinates, and telemetry readings.
- Monospace type features high contrast for fast data scanning under emergency conditions.

## Elevation & Depth
- **Frosted Glass Panels:** Panels, cards, and dashboards use a white frosted glass container with `backdrop-filter: blur(20px)` and a specular top-light white border (`rgba(255, 255, 255, 0.6)`) to stand out against the soft gray background.
- **Fluid Shadows:** Specular light shadows (`0 8px 32px rgba(15, 23, 42, 0.05)`) provide a clean, floating look.

## Shapes
- **Corner Radii:** Cards and components use rounded `18px` (`rounded-lg`) corners for a smooth liquid feel. Interactive buttons and tags use `rounded-full` or `12px` (`rounded-md`).

## Do's and Don'ts
- **Do** keep the base page background light slate-gray (`#F1F5F9`) so white glass panels are visible.
- **Do** use highly vibrant, saturated status colors for active badges and charts.
- **Don't** use sharp square edges (`0px`); maintain smooth rounded shapes.
- **Don't** use heavy dark borders; stick to soft translucent white borders.
