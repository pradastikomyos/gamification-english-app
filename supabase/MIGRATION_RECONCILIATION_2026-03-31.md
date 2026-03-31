# Migration Reconciliation Report (2026-03-31)

## Scope
- Reconcile local SQL migrations with remote Supabase migration history.
- Keep active local `supabase/migrations` aligned to remote.
- Avoid applying stale local patches that could regress remote schema/function definitions.

## Actions Performed
1. Fetched remote migration history from `supabase_migrations.schema_migrations`.
2. Generated missing local migration files from remote SQL history.
3. Archived local-only migration files that were not present in remote version history.

## Results
- Remote migrations found: 216 versions.
- Missing local migrations created: 144 files.
- Local-only migrations archived: 11 files.
- Active local migration folder now represents remote migration lineage.

## Archived Files
Moved from `supabase/migrations/` to `supabase/migrations_local_only_archive/`:

- 20250705072142_update_storage_policies.sql
- 20250705072152_update_questions_table_policies.sql
- 20250705100000_alter_final_score_to_numeric.sql
- 20250705100000_fix_assign_quiz_to_classes_admin_rpc.sql
- 20250705100500_add_status_to_quizzes.sql
- 20250705103000_drop_score_column_from_quiz_attempts.sql
- 20250705103500_create_get_study_materials_with_status_rpc.sql
- 20250705110000_fix_get_study_materials_rpc.sql
- 20250705120000_fix_study_materials_rpc_structure.sql
- 20250705172000_create_get_study_material_details_rpc.sql
- 20250705223000_create_delete_quiz_for_teacher_rpc.sql

## Why These Were Archived
- Their versions were not present in remote history.
- Most are function/policy patches that appear superseded by later remote migrations with different versions.
- Applying them directly to remote could overwrite newer function signatures/logic.

## Remote Safety
- No schema/data mutation was applied to remote as part of this reconciliation.
- This run focused on alignment and cleanup of local migration history.

## Next Safe Step (Optional)
If you want strict provenance for the 11 archived files:
- Review each archived file manually.
- For genuinely required business logic not already represented in newer remote migrations, create a new forward migration (new timestamp) and apply it to remote.
