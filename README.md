# Second Brain

Second Brain is a task planner built around one idea: scheduling a task should not turn it into a calendar event. Scheduled items keep their task checkbox, completion state, and ability to move or unschedule them.

**Current scope:** Google sign-in, task management, subtasks, and a Day/Week planner. Habit and event tables are included in the database schema, but their user interfaces are not part of the current release.

## Features

- Google-only authentication through Supabase Auth
- Protected application routes and account sign-out
- Task views for Today, Upcoming, All tasks, and Completed
- Due dates, notes, priorities, and scheduled times
- Subtasks with inline progress and automatic parent completion behavior
- Day and Monday-starting Week planner with drag-and-drop scheduling
- Resizing task blocks, overlap layout, and an unscheduled task panel
- Effective dates use the browser's local date for scheduled tasks and the due date otherwise

## Technology

- Next.js App Router and TypeScript
- Tailwind CSS
- Supabase Auth and Postgres with row-level security
- `@supabase/ssr`
- `@dnd-kit/core` for planner drag and drop
- `lucide-react` icons

## Requirements

- Node.js and npm
- A Supabase project
- A Google Cloud project with OAuth credentials

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. In the Supabase SQL Editor, run the canonical schema at [`sql/schema.sql`](sql/schema.sql). It creates the Phase 1 and Phase 2 tables, indexes, row-level security policies, and authenticated-role grants. Keep future database changes in this file.

3. Configure Google OAuth:
   - In Google Cloud Console, set up the OAuth consent screen and create a **Web application** OAuth client.
   - Add `http://localhost:3000` as an authorized JavaScript origin.
   - Add your Supabase callback URL as an authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`.
   - In Supabase, enable **Authentication → Providers → Google** and enter the Google client ID and secret.
   - In **Authentication → URL Configuration**, set the Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/callback` as a redirect URL.

4. Copy `.env.example` to `.env.local` and enter the Supabase project URL and anon/publishable key:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
   ```

   Do not put a Supabase `service_role` key in frontend environment variables. `.env.local` is gitignored.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Description |
|---|---|
| `/login` | Google sign-in |
| `/tasks?view=today` | Tasks due today or overdue by effective date |
| `/tasks?view=upcoming` | Future tasks grouped by effective date |
| `/tasks?view=all` | All uncompleted tasks, including undated tasks |
| `/tasks?view=completed` | Completed tasks |
| `/planner?view=week&date=YYYY-MM-DD` | Weekly task planner; `view=day` selects Day view |

## Database source of truth

[`sql/schema.sql`](sql/schema.sql) is the single maintained SQL schema file. Run it in the Supabase SQL Editor when setting up a project or applying schema updates. It includes `vector`, `habits`, `tasks`, `habit_logs`, `events`, and `subtasks`, plus indexes, RLS policies, and grants.

## Deploying

1. Import the repository into Vercel and add the two environment variables from `.env.example`.
2. In Supabase URL Configuration, set the production Site URL and add `https://<your-domain>/auth/callback` to allowed redirect URLs. Keep the localhost URL for development.
3. Add the production site origin to the Google OAuth client's authorized JavaScript origins. The authorized redirect URI remains the Supabase Auth callback URL.
4. Deploy the application.

Database SQL is managed separately from Vercel deployments; apply schema updates in Supabase before deploying code that depends on them.

## Project structure

```text
app/                 Next.js routes and global styles
components/          Tasks, planner, and shared task-entry UI
lib/                 Supabase clients and task/planner data access
sql/schema.sql       Canonical database schema
```

## Roadmap

- **Current:** Authentication, tasks, subtasks, and planner
- **Planned:** Habit tracking and event management
- **Future:** AI-assisted task workflows
