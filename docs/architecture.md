# Architecture Overview

## Frontend
- Framework: React + TypeScript + Vite
- UI composition: `src/components/*`
- Routing/pages: `src/pages/*`
- App entry: `src/main.tsx`, `src/App.tsx`

## Backend/Data
- Platform: Supabase
- Schema and change history: `supabase/migrations/*`
- Seed data: `supabase/seed.sql`
- Edge functions: `supabase/functions/*`

## Integration Boundaries
- Supabase client usage should be centralized and consistent.
- Business-sensitive operations should remain server-side (RPC/functions/policies).
- Frontend should consume RPCs/types in a stable, typed manner.
