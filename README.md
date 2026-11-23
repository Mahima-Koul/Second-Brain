# Second Brain

A productivity hub that combines a **to-do list**, a **planner**, and a **habit tracker** in one system.

Most to-do apps only store tasks. Google Calendar schedules things, but treats everything as an event. Second Brain does both: you can give a task a time slot on the planner, and it **stays a task**, with a checkbox, a done state, and the ability to be moved or unscheduled.

> **Status:** Phase 2 complete (Tasks + Planner). Habits, Events, and AI features are coming next.

---

## Features (so far)

### Phase 1: Foundation
- Google-only login (Supabase Auth)
- Protected routes with a logout menu and avatar
- Tasks page with four views: **Today**, **Upcoming**, **All tasks**, **Completed**
- Priorities (P1 / P2 / P3), due dates, notes
- Optimistic UI for instant add, edit, and tick
- Todoist-style design with a collapsible sidebar and a responsive mobile drawer

### Phase 2: Planner and scheduling
- Bottom add bar on Today and All tasks, with date, start time, end time (or duration), priority, and subtasks
- **Subtasks:** finishing the last subtask completes the parent task, and ticking the parent completes all subtasks
- **Planner** (`/planner`) with Day and Week views on a custom-built time grid
- Drag tasks from the **Unscheduled** panel onto a time slot, move them between slots and days, resize them, or drag them back to unschedule
- Tasks look different from events: white blocks with a priority-colored left border and a checkbox
- Overlapping tasks are laid out side by side
- A "Missed" style for scheduled tasks that ended without being completed
- Current-time indicator on today's column

### The "effective date" rule
A task's effective date is the local date of `scheduled_start` if it is scheduled, and its `due_date` otherwise. Today, Upcoming, and overdue logic all use it, so a task you schedule in the planner for 6 PM today also shows on the Today page.

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Auth and database | Supabase (Google OAuth, Postgres, Row Level Security) |
| Drag and drop | `@dnd-kit/core` |
| Icons | `lucide-react` |
| Hosting | Vercel |

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create a Supabase project

Create a free project at [supabase.com](https://supabase.com).

### 3. Set up the database

In Supabase, open **SQL Editor** and run, in this order:

1. **The Phase 1 schema SQL file** (creates `tasks`, `habits`, `habit_logs`, `events`, with Row Level Security and policies).
2. **Table grants** (the `authenticated` role needs table access on top of RLS):

```sql
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.habits to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert, update, delete on public.events to authenticated;
```

3. **Phase 2 subtasks table:**

```sql
create table if not exists public.subtasks (
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
create index if not exists subtasks_task_id_idx on public.subtasks(task_id);

notify pgrst, 'reload schema';
```

### 4. Set up Google login

1. In [Google Cloud Console](https://console.cloud.google.com), configure the OAuth consent screen with **External** audience, and add your Gmail as a **test user**.
2. Create an **OAuth client ID** of type **Web application**:
   - **Authorized JavaScript origins:** `http://localhost:3000` (and your Vercel URL later)
   - **Authorized redirect URI:** `https://<your-project-ref>.supabase.co/auth/v1/callback` (copy it from Supabase → Authentication → Providers → Google)
3. In Supabase → Authentication → Providers → **Google**, enable it and paste the Client ID and Client Secret.
4. In Supabase → Authentication → **URL Configuration**:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** `http://localhost:3000/**`

### 5. Environment variables

Copy `.env.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon / publishable key>
```

Use the variable names from your own `.env.example` if they differ. Never use the `service_role` key here, and never commit `.env.local`.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push the repo to GitHub (private is fine, and make sure `.env.local` is gitignored).
2. On [vercel.com](https://vercel.com), choose **Add New → Project**, import the repo, and add the same environment variables.
3. Deploy.
4. Update the login settings with your live URL:
   - **Supabase** → URL Configuration: set the Site URL to your Vercel URL and add `https://your-app.vercel.app/**` to Redirect URLs (keep the localhost one).
   - **Google Cloud** → OAuth client → add your Vercel URL to **Authorized JavaScript origins**.
5. Every `git push` to `main` redeploys automatically.

> **Note:** SQL changes are never deployed by git. Run them manually in the Supabase SQL editor *before* pushing code that depends on them.

---

## Data model

| Table | Purpose |
|---|---|
| `tasks` | Title, notes, status, priority, due date, `scheduled_start`, `scheduled_minutes`, optional `habit_id` and `embedding` |
| `subtasks` | Checklist items under a task (Phase 2) |
| `habits` | Repeating tasks (UI in Phase 3) |
| `habit_logs` | One row per habit per day (Phase 3) |
| `events` | Calendar events (UI in Phase 4) |

All tables have Row Level Security: users can only access their own rows.

---

## Troubleshooting

| Error | Cause and fix |
|---|---|
| `Error 401: invalid_client` on login | The Client ID in Supabase is wrong or has stray spaces. Re-copy it from Google Cloud. |
| `redirect_uri_mismatch` | The redirect URI in Google must exactly match the Supabase callback URL. |
| `Access blocked` | Your email isn't in the Google **test users** list. |
| `42501 permission denied for table ...` | Run the table grants SQL above. |
| `PGRST205 Could not find the table ...` | The table doesn't exist yet. Run the SQL, then `notify pgrst, 'reload schema';`. |
| `Invalid API key` or `supabaseUrl is required` | Check `.env.local` for typos, then restart `npm run dev`. |
| Env var changes not applying on Vercel | Redeploy from the Deployments tab after changing env vars. |

---

## Roadmap

- [x] **Phase 1:** Auth, schema, Tasks page
- [x] **Phase 2:** Planner, drag and drop scheduling, subtasks, start/end times
- [ ] **Phase 3:** Habits, with streaks, completion rate, and a heatmap
- [ ] **Phase 4:** Events, shown in the planner
- [ ] **Phase 5:** AI features
  - Semantic task search (pgvector embeddings)
  - Describe tasks vaguely and get a preview list of structured tasks to confirm and add

---

## Project notes

- Week starts on **Monday** (a single constant in the code).
- Times are displayed in the browser's local timezone and stored as `timestamptz`.
- The planner grid is built by hand with CSS and absolute positioning, with no calendar library.