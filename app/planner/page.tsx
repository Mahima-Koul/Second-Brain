import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getPlannerTasks } from '@/lib/planner';
import { getSubtasks } from '@/lib/tasks';
import PlannerApp from '@/components/planner-app';

export default async function PlannerPage({ searchParams }: { searchParams: { view?: string; date?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const tasks = await getPlannerTasks(supabase, user.id);
  const subtasks = await getSubtasks(supabase,user.id,tasks.map(t=>t.id));
  const profile = { id: user.id, name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'Your account', email: user.email ?? '', avatar: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '' };
  return <PlannerApp initialTasks={tasks} initialSubtasks={subtasks} user={profile} initialView={searchParams.view} initialDate={searchParams.date} />;
}
