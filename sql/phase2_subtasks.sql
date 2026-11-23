create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz default now()
);
alter table public.subtasks enable row level security;
create policy "own subtasks select" on public.subtasks for select using (user_id = auth.uid());
create policy "own subtasks insert" on public.subtasks for insert with check (user_id = auth.uid());
create policy "own subtasks update" on public.subtasks for update using (user_id = auth.uid());
create policy "own subtasks delete" on public.subtasks for delete using (user_id = auth.uid());
grant select, insert, update, delete on public.subtasks to authenticated;
create index on public.subtasks(task_id);
