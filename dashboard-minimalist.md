# Plan: Minimalist Dashboard Restructure

This plan details the visual refactoring and layout restructuring of the Digital Twin Dashboard to achieve a premium, high-density minimalist look without removing any features or options.

## Proposed Layout Architecture

We will implement a unified **Grid Command Center (Option A)** that consolidates the dashboard layout:
1. **Full-Bleed Map Container:** The interactive digital twin map serves as the central focal point, spanning the left and center sections.
2. **Unified Control Sidebar:** All secondary panels (Authority HQ, Simulation Studio, Citizen Portal, and Data Fusion/Analytics) are consolidated into a single, high-density, scroll-locked right sidebar. Switching tabs dynamically renders the selected module inside this sidebar without altering the viewport.
3. **Collapsible Design:** The sidebar can be collapsed to allow 100% screen width breathing room for map operations.

---

## Restructuring Tasks

### 1. Unified Shell Configuration
- **[MODIFY] [DashboardApp.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/dashboard/DashboardApp.tsx):**
  - Restructure the main grid from a full-page view switcher to a split-screen container (`flex` or `grid` layout).
  - Embed the map panel as a permanent left-pane, and render the tab components inside the right-pane sidebar.
  - Add a collapse toggle button to slide the sidebar out of view.

### 2. Header and Navigation Integration
- **[MODIFY] [Header.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/dashboard/components/Header.tsx):**
  - Simplify the top bar height and reduce paddings.
  - Integrate role selection and agent loop controls to align neatly without crowding the tab controls.

### 3. Component Refactoring for Sidebar Layout
- **[MODIFY] [AuthorityDashboard.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/dashboard/components/AuthorityDashboard.tsx):**
  - Pack recommendations and activity logs into a single column format that fits the sidebar container perfectly.
- **[MODIFY] [SimulationStudio.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/dashboard/components/SimulationStudio.tsx):**
  - Align scenario sliders and charts vertically in a single-column telemetry card.
- **[MODIFY] [CitizenPortal.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/dashboard/components/CitizenPortal.tsx):**
  - Format the incident reporting inputs and active reports list for clean scrolling within the sidebar.
- **[MODIFY] [AnalyticsHub.tsx](file:///c:/Users/mohan/Downloads/ResponseSync/src/dashboard/components/AnalyticsHub.tsx):**
  - Display sensor listings and telemetry meters in a dense list view.

---

## Verification Plan

### Automated Checks
- Validate type checking compiles cleanly: `npx tsc --noEmit`
- Verify production build packages correctly: `npm run build`

### Manual Verification
- Test viewport responsiveness at 1024px, 1280px, and 1920px.
- Confirm sidebar collapsible animations run smoothly and Leaflet map adjusts size correctly upon collapse.
