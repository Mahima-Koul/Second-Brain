-- Second Brain database schema
-- Canonical schema for a new Supabase project. Safe to rerun after the original
-- Phase 1 and Phase 2 SQL files because tables and indexes are guarded and the
-- policies maintained by this file are recreated.

create extension if not exists vector with schema extensions;

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  recurrence jsonb not null default '{}'::jsonb,
  preferred_time time,
  duration_minutes int,
  start_date date not null default current_date,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  status text not null default 'todo' check (status in ('todo', 'done')),
  priority int check (priority between 1 and 3),
  due_date date,
  scheduled_start timestamptz,
  scheduled_minutes int,
  habit_id uuid references public.habits(id) on delete set null,
  embedding vector(1536),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  done boolean not null default false,
  unique (habit_id, date)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean not null default false,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz default now()
);

alter table public.habits enable row level security;
alter table public.tasks enable row level security;
alter table public.habit_logs enable row level security;
alter table public.events enable row level security;
alter table public.subtasks enable row level security;

drop policy if exists "Users manage own habits" on public.habits;
create policy "Users manage own habits" on public.habits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage own tasks" on public.tasks;
create policy "Users manage own tasks" on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage own habit logs" on public.habit_logs;
create policy "Users manage own habit logs" on public.habit_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users manage own events" on public.events;
create policy "Users manage own events" on public.events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own subtasks select" on public.subtasks;
create policy "own subtasks select" on public.subtasks
  for select using (user_id = auth.uid());

drop policy if exists "own subtasks insert" on public.subtasks;
create policy "own subtasks insert" on public.subtasks
  for insert with check (user_id = auth.uid());

drop policy if exists "own subtasks update" on public.subtasks;
create policy "own subtasks update" on public.subtasks
  for update using (user_id = auth.uid());

drop policy if exists "own subtasks delete" on public.subtasks;
create policy "own subtasks delete" on public.subtasks
  for delete using (user_id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.subtasks to authenticated;

create index if not exists tasks_user_status_due_date_idx
  on public.tasks (user_id, status, due_date);
create index if not exists subtasks_task_id_idx
  on public.subtasks (task_id);

notify pgrst, 'reload schema';
