-- supabase/migrations/20250703062500_create_leaderboard_rpc.sql

create or replace function get_leaderboard(p_user_id uuid)
returns table (
  id uuid,
  name text,
  total_points integer,
  level integer,
  current_streak integer,
  class_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    s.id,
    s.name,
    s.total_points,
    s.level,
    s.current_streak,
    c.name as class_name
  from students s
  left join classes c on s.class_id = c.id
  order by s.total_points desc, s.level desc, s.current_streak desc;
end;
$$;
