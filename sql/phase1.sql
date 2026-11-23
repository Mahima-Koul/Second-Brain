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
  status text not null default 'todo' check (status in ('todo','done')),
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

alter table public.habits enable row level security;
alter table public.tasks enable row level security;
alter table public.habit_logs enable row level security;
alter table public.events enable row level security;

create policy "Users manage own habits" on public.habits for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own tasks" on public.tasks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own habit logs" on public.habit_logs for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own events" on public.events for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists tasks_user_status_due_date_idx on public.tasks (user_id, status, due_date);
