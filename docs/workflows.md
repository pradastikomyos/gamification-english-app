# Workflows

## Feature Workflow
1. Define UI/UX change in `src/`.
2. If schema changes are needed, add a forward migration in `supabase/migrations/`.
3. Validate app flow and DB behavior.
4. Update docs in `docs/decisions/` or `docs/runbooks/` as needed.

## Migration Workflow
1. Never rewrite already-applied production migrations.
2. Add corrective forward migrations for fixes.
3. Keep migration names descriptive and timestamped.

## Cleanup Workflow
1. Detect duplicates/redundant files.
2. Move uncertain files into `archive/` first.
3. Remove permanently only after usage validation.
