# Plan: Dashboard Spacing, Layout, and Typography Refactoring

This plan details the visual alignment, spacing, scrollbar track removal, and typography fixes to polish the Digital Twin Dashboard and ensure it looks clean, high-density, and free of browser rendering bugs.

## Proposed Changes

### 1. Header & Navigation Fixes
- **Remove Scrollbars:** Hide the default browser scrollbar track from the header navigation container using Tailwind utility classes (`[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`). This will eliminate the horizontal scrollbar bar shown in the layout.
- **Vertical Alignment:** Ensure all elements in the header (logo, pilot region, nav tabs, role selector dropdown, Agent Loop button, status badge) align perfectly along the center vertical axis (`items-center`).
- **Typography Polish:** Pair `Plus Jakarta Sans` for primary headers and logo elements, and `Geist Mono` for commands, pilot details, role options, and status telemetry.

### 2. Map Control Overlays Spacing
- **Control Sizing:** Clean up the map overlay buttons (Layer selections and Timeline selections) so they have matching paddings and height, aligning them nicely.
- **Scrollbar & Border Consistency:** Use clean `#10b98125` borders for panel frames and clean monospaced layout elements.

### 3. Telemetry Pages & Dashboard Spacing (Authority HQ, Simulation Studio, Citizen Portal, Data Fusion)
- **Container Paddings:** Standardize inner container margins and paddings to prevent cramped text blocks or unnecessary wrapping.
- **Input and Selector Heights:** Match form field and dropdown heights to prevent visual misalignments.

---

## Files to Modify

### [MODIFY] [Header.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/components/Header.tsx)
- Hide scrollbar on `<nav>` container.
- Clean up text alignment in logo/pilot block.
- Refine padding and borders around button tabs.

### [MODIFY] [DigitalTwinMap.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/components/DigitalTwinMap.tsx)
- Standardize timeline slider height and layer panel paddings.
- Center align panel text labels.

### [MODIFY] [index.css](file:///c:/Users/mohan/Downloads/ResponseSync/src/index.css)
- Integrate global scrollbar-hiding utilities if needed, and verify font declarations for `Geist Mono` and `Plus Jakarta Sans`.

---

## Verification Plan

### Automated Checks
- Run compiler checks: `npx tsc --noEmit`
- Run build compilation: `npm run build`

### Manual Verification
- Inspect the header navigation bar on viewport widths from 768px to 1440px to confirm that the scrollbar is fully hidden.
- Confirm all dropdowns, select boxes, and buttons align vertically on the same baseline.
