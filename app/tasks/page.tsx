import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getSubtasks, getTasks } from '@/lib/tasks';
import TasksApp from '@/components/tasks-app';

export default async function TasksPage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const tasks = await getTasks(supabase, user.id);
  const subtasks = await getSubtasks(supabase,user.id,tasks.map(t=>t.id));
  return <TasksApp initialTasks={tasks} initialSubtasks={subtasks} user={{ id: user.id, name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? 'Your account', email: user.email ?? '', avatar: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '' }} initialView={searchParams.view ?? 'today'} />;
}
