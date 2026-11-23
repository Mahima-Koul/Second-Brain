import type { SupabaseClient } from '@supabase/supabase-js';

export type Task = {
  id: string; user_id: string; title: string; notes: string | null; status: 'todo' | 'done';
  priority: number | null; due_date: string | null; scheduled_start: string | null; scheduled_minutes: number | null; completed_at: string | null; created_at: string;
};
export type TaskInput = Pick<Task, 'title' | 'notes' | 'priority' | 'due_date'> & Partial<Pick<Task, 'scheduled_start' | 'scheduled_minutes'>>;
export type Subtask = { id: string; task_id: string; user_id: string; title: string; done: boolean; position: number; created_at: string };
export type SubtaskDraft = { id?: string; title: string; done: boolean; position: number };

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
export async function getSubtasks(client: SupabaseClient, userId: string, taskIds?: string[]) {
  if (taskIds && taskIds.length === 0) return [] as Subtask[];
  let query = client.from('subtasks').select('*').eq('user_id', userId).order('position');
  if (taskIds) query = query.in('task_id', taskIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Subtask[];
}
export async function createTaskWithSubtasks(client: SupabaseClient, userId: string, input: TaskInput, titles: string[]) {
  const task = await createTask(client, userId, input);
  const rows = titles.map((title, position) => ({ task_id: task.id, user_id: userId, title: title.trim(), done: false, position })).filter(row => row.title);
  if (!rows.length) return { task, subtasks: [] as Subtask[] };
  const { data, error } = await client.from('subtasks').insert(rows).select();
  if (error) {
    await client.from('tasks').delete().eq('id', task.id).eq('user_id', userId);
    throw error;
  }
  return { task, subtasks: (data ?? []) as Subtask[] };
}
export async function saveSubtasks(client: SupabaseClient, userId: string, taskId: string, drafts: SubtaskDraft[]) {
  const { error: removeError } = await client.from('subtasks').delete().eq('task_id', taskId).eq('user_id', userId);
  if (removeError) throw removeError;
  const rows = drafts.map((item, position) => ({ task_id: taskId, user_id: userId, title: item.title.trim(), done: item.done, position })).filter(item => item.title);
  if (!rows.length) return [] as Subtask[];
  const { data, error } = await client.from('subtasks').insert(rows).select();
  if (error) throw error;
  return (data ?? []) as Subtask[];
}
export async function updateSubtask(client: SupabaseClient, id: string, input: Partial<Pick<Subtask, 'title' | 'done' | 'position'>>) {
  const { data, error } = await client.from('subtasks').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as Subtask;
}
export async function deleteSubtask(client: SupabaseClient, id: string) {
  const { error } = await client.from('subtasks').delete().eq('id', id);
  if (error) throw error;
}
export async function setSubtasksDone(client: SupabaseClient, taskId: string, done: boolean) {
  const { data, error } = await client.from('subtasks').update({ done }).eq('task_id', taskId).select();
  if (error) throw error;
  return (data ?? []) as Subtask[];
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
