# Local-Only Archived Migrations

Files in this folder were moved out of active `supabase/migrations` during reconciliation on 2026-03-31.

Reason:
- Their version IDs were not present in remote Supabase migration history.
- Several were older/superseded patches by name and could override newer remote function/policy definitions.

These files are kept for audit/manual review, not for automatic migration application.

If you need any of these changes in remote DB, create a new forward migration with a new timestamp after manual review.
