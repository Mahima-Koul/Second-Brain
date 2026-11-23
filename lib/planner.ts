import type { SupabaseClient } from '@supabase/supabase-js';
import type { Task } from '@/lib/tasks';

export async function getPlannerTasks(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from('tasks').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function setTaskSchedule(client: SupabaseClient, id: string, scheduledStart: string | null, scheduledMinutes: number | null, dueDate?: string | null) {
  const changes={scheduled_start:scheduledStart,scheduled_minutes:scheduledMinutes,...(dueDate!==undefined?{due_date:dueDate}:{})};
  const { data, error } = await client.from('tasks').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data as Task;
}
