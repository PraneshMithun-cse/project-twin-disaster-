# Plan: Project Folder Structure Organization

This plan outlines the restructuring tasks to organize the repository folders cleanly for a backend, a landing page, and a digital twin dashboard.

## Proposed Steps

### 1. Refactor Preparation
- Audit imports and cross-dependencies between the landing page, dashboard components, and the backend.
- Verify which type declarations (`src/types/index.ts`) are shared between frontend and backend.

### 2. File Relocations (Based on Chosen Structure)
- Create dedicated module directories to isolate concerns:
  - `src/backend/` for server endpoints, Gemini APIs, and database adapters.
  - `src/landing/` for the cloned UgoRound landing page and its assets.
  - `src/dashboard/` for map rendering, simulations, and authority screens.
- Move shared elements (types, common hooks, configurations) to a `src/shared/` or `src/common/` folder.

### 3. Build & Routing Configuration
- Update `vite.config.ts` or multi-page build entry points if separation of bundles is needed.
- Align `tsconfig.json` paths to point to the new folder directories.

---

## Target Structures to Choose From

### Option A: Monolithic Multi-Route (Single Package / Modular src)
- **Folder Layout:**
  ```
  ├── dist/
  ├── src/
  │   ├── backend/        # Express server & API routes
  │   ├── landing/        # UgoRound landing page code
  │   ├── dashboard/      # Chennai Digital Twin modules
  │   └── shared/         # Shared interfaces & types
  ```

### Option B: Monorepo Workspaces (npm workspaces)
- **Folder Layout:**
  ```
  ├── packages/
  │   ├── backend/        # Server package
  │   ├── landing/        # Landing page package (Vite)
  │   └── dashboard/      # Dashboard package (Vite)
  ```

---

## Verification Plan

### Automated Checks
- Validate typescript configuration compiles cleanly: `npx tsc --noEmit`
- Verify bundling outputs correctly: `npm run build`
