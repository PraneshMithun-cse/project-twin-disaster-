# Repository Agent Guidelines & Commit Standards

## Git Commit Message Convention

All git commit messages MUST strictly follow the Conventional Commits specification with explicit scopes as established in the repository history:

### Format
`<type>(<scope>): <short description in lowercase>`

### Allowed Types
- `feat`: A new feature or major capability
- `fix`: A bug fix or patch
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of code (formatting, colors, CSS, whitespace)
- `chore`: Maintenance, build tasks, dependency updates

### Allowed Scopes
- `simulation`: Simulation engine, what-if physics calculations, scenario matcher
- `backend`: Express server, API endpoints, SSE engine, Supabase integrations
- `frontend` or `ui`: React UI components, panels, modals, layout
- `pipeline`: Agent telemetry pipeline, 12-agent orchestration
- `engine`: Heuristic evaluation engines, decision engines
- `routing`: Portal URLs, OSRM detour routing
- `types`: TypeScript interfaces, data models, schema definitions
- `db`: Database schemas, SQL migrations, seed scripts
- `deps`: Dependency manifests, package configurations
- `architecture` or `spec`: System design docs, specifications

### Examples
- `feat(simulation): add hydrodynamic inundation progress timeline`
- `fix(backend): update Gemini model identifier and add TLS fallback`
- `refactor(pipeline): re-align sub-system state matrix & optimize parallel execution threads`
- `style(ui): align dashboard color palette with dark ink aesthetics`
- `chore(deps): update runtime dependencies`
