import type { SupabaseClient } from '@supabase/supabase-js';

export type Task = {
  id: string; user_id: string; title: string; notes: string | null; status: 'todo' | 'done';
  priority: number | null; due_date: string | null; completed_at: string | null; created_at: string;
};
export type TaskInput = Pick<Task, 'title' | 'notes' | 'priority' | 'due_date'>;

// All task database reads and writes live here.
export async function getTasks(client: SupabaseClient, userId: string) {
  const { data, error } = await client.from('tasks').select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as Task[];
}
export async function createTask(client: SupabaseClient, userId: string, input: TaskInput) {
  const { data, error } = await client.from('tasks').insert({ ...input, user_id: userId }).select().single();
  if (error) throw error;
  return data as Task;
}
export async function updateTask(client: SupabaseClient, id: string, input: Partial<TaskInput> & { status?: Task['status']; completed_at?: string | null }) {
  const { data, error } = await client.from('tasks').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Task;
}
export async function deleteTask(client: SupabaseClient, id: string) {
  const { error } = await client.from('tasks').delete().eq('id', id);
  if (error) throw error;
}
