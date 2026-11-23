'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3, ListTodo, Menu, MoreHorizontal, Pencil, Plus, Sparkles, Trash2, X, Inbox, House, CalendarRange, CheckCheck, LogOut, PanelLeftClose, BrainCircuit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createTask, deleteTask, Task, TaskInput, updateTask } from '@/lib/tasks';

type View = 'today' | 'upcoming' | 'all' | 'completed';
type User = { id: string; name: string; email: string; avatar: string };
const nav: { id: View; label: string; icon: typeof House }[] = [
  { id: 'today', label: 'Today', icon: House }, { id: 'upcoming', label: 'Upcoming', icon: CalendarRange },
  { id: 'all', label: 'All tasks', icon: Inbox }, { id: 'completed', label: 'Completed', icon: CheckCheck },
];
const isoToday = () => new Date().toLocaleDateString('en-CA');
const dateAt = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString('en-CA'); };
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
function dateCaption(view: View, count: number) { if (view === 'today') return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); return view === 'upcoming' ? 'Your days ahead' : `${count} ${count === 1 ? 'task' : 'tasks'}`; }

export default function TasksApp({ initialTasks, user, initialView }: { initialTasks: Task[]; user: User; initialView: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [pendingChecks, setPendingChecks] = useState<string[]>([]);
  const [view, setView] = useState<View>(nav.some(x => x.id === initialView) ? initialView as View : 'today');
  const [collapsed, setCollapsed] = useState(false), [drawer, setDrawer] = useState(false), [menu, setMenu] = useState(false);
  const [quick, setQuick] = useState(false), [addModal, setAddModal] = useState(false), [editing, setEditing] = useState<Task | null>(null), [notice, setNotice] = useState('');
  const router = useRouter();
  useEffect(() => { setTasks(initialTasks); }, [initialTasks]);
  useEffect(() => { const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setQuick(false); setEditing(null); setAddModal(false); setDrawer(false); } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, []);
  const todos = tasks.filter(t => t.status === 'todo');
  const todayCount = todos.filter(t => t.due_date && t.due_date <= isoToday()).length;
  const pageTasks = useMemo(() => {
    const byDue = (a: Task, b: Task) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999') || (a.priority ?? 4) - (b.priority ?? 4);
    if (view === 'completed') return tasks.filter(t => t.status === 'done').sort((a,b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''));
    if (view === 'today') return todos.filter(t => t.due_date && t.due_date <= isoToday()).sort(byDue);
    if (view === 'upcoming') return todos.filter(t => t.due_date && t.due_date > isoToday()).sort(byDue);
    return todos.slice().sort(byDue);
  }, [tasks, view]);
  const titles = { today: 'Today', upcoming: 'Upcoming', all: 'All tasks', completed: 'Completed' };
  function changeView(next: View) { setView(next); setQuick(false); setDrawer(false); router.replace(`/tasks?view=${next}`, { scroll: false }); }
  async function commitTask(input: TaskInput, id?: string) {
    const supabase = createClient();
    if (id) { const result = await updateTask(supabase, id, input); setTasks(prev => prev.map(t => t.id === id ? result : t)); }
    else { const tempId = crypto.randomUUID(); const optimistic: Task = { id: tempId, user_id: user.id, ...input, status: 'todo', completed_at: null, created_at: new Date().toISOString() }; setTasks(prev => [optimistic, ...prev]); try { const result = await createTask(supabase, user.id, input); setTasks(prev => prev.map(t => t.id === tempId ? result : t)); } catch (error) { setTasks(prev => prev.filter(t => t.id !== tempId)); throw error; } }
  }
  async function toggle(task: Task) {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const optimistic = { ...task, status: nextStatus as Task['status'], completed_at: nextStatus === 'done' ? new Date().toISOString() : null };
    if (nextStatus === 'done') { setPendingChecks(prev => [...prev, task.id]); await new Promise(r => setTimeout(r, 300)); }
    setTasks(prev => prev.map(t => t.id === task.id ? optimistic : t));
    setPendingChecks(prev => prev.filter(id => id !== task.id));
    try { const result = await updateTask(createClient(), task.id, { status: nextStatus, completed_at: optimistic.completed_at }); setTasks(prev => prev.map(t => t.id === task.id ? result : t)); }
    catch { setTasks(prev => prev.map(t => t.id === task.id ? task : t)); setNotice('Could not update that task.'); }
  }
  async function remove(task: Task) { try { await deleteTask(createClient(), task.id); setTasks(prev => prev.filter(t => t.id !== task.id)); } catch { setNotice('Could not delete that task.'); } }
  async function logout() { await createClient().auth.signOut(); router.replace('/login'); router.refresh(); }
  const side = <aside className={`flex h-full shrink-0 flex-col bg-sidebar transition-[width] duration-150 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
    <div className={`px-4 pt-5 ${collapsed ? 'px-3' : ''}`}><button onClick={() => { setAddModal(true); setDrawer(false); }} className={`flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 font-medium text-white shadow-sm transition-colors hover:bg-accent-hover ${collapsed ? 'w-11 px-0' : 'w-full'}`}><Plus size={20}/>{!collapsed && 'Add task'}</button></div>
    <nav className="mt-5 space-y-1 px-3">{nav.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => changeView(item.id)} title={collapsed ? item.label : undefined} className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors ${view === item.id ? 'bg-[#fce9e7] font-medium text-accent' : 'text-[#3c4043] hover:bg-[#f0f1f2]'}`}><Icon size={18} strokeWidth={1.8}/>{!collapsed && <><span className="flex-1">{item.label}</span>{item.id === 'today' && <span className="text-xs text-muted">{todayCount}</span>}{item.id === 'all' && <span className="text-xs text-muted">{todos.length}</span>}</>}</button>; })}</nav>
    <div className="mx-5 my-5 border-t border-border"/>
    {!collapsed && <div className="px-6 text-[10px] font-semibold uppercase tracking-[1.2px] text-[#80868b]">Your space</div>}
    <div className="mt-2 space-y-1 px-3">{[{label:'Planner',icon:CalendarDays},{label:'Habits',icon:Sparkles},{label:'Events',icon:Clock3}].map(({label,icon:Icon})=><div key={label} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[#a1a5aa] ${collapsed?'justify-center':''}`} title={collapsed ? `${label} · Soon` : undefined}><Icon size={18} strokeWidth={1.8}/>{!collapsed&&<><span className="flex-1">{label}</span><span className="rounded-full border border-[#e3e5e7] px-2 py-0.5 text-[10px] text-[#92969a]">Soon</span></>}</div>)}</div>
    <div className="mt-auto p-4">{!collapsed&&<div className="flex items-center gap-2 text-xs text-[#85898d]"><BrainCircuit size={15}/><span>A little more clarity, every day.</span></div>}</div>
  </aside>;
  return <div className="flex h-screen min-h-[560px] flex-col overflow-hidden bg-white">
    <header className="z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4"><div className="flex items-center gap-3"><button aria-label="Toggle sidebar" onClick={() => { if (window.innerWidth < 768) setDrawer(true); else setCollapsed(!collapsed); }} className="grid h-9 w-9 place-items-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"><Menu size={20}/></button><div className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-white"><BrainCircuit size={17}/></div><span className="text-[15px] font-medium tracking-[-.2px]">Second Brain</span></div><div className="relative"><button onClick={() => setMenu(!menu)} className="grid h-9 w-9 place-items-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#dadce0]">{user.avatar ? <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover"/> : <span className="grid h-8 w-8 place-items-center rounded-full bg-[#d7e3fc] font-medium text-[#174ea6]">{user.name.slice(0,1).toUpperCase()}</span>}</button>{menu&&<><button aria-label="Close account menu" className="fixed inset-0 z-30 cursor-default" onClick={()=>setMenu(false)}/><div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-border bg-white p-4 shadow-[0_4px_16px_rgba(60,64,67,.2)]"><div className="flex items-center gap-3 border-b border-border pb-4">{user.avatar?<img src={user.avatar} alt="" className="h-10 w-10 rounded-full"/>:<span className="grid h-10 w-10 place-items-center rounded-full bg-[#d7e3fc] text-[#174ea6]">{user.name.slice(0,1)}</span>}<div className="min-w-0"><p className="truncate font-medium">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div></div><button onClick={logout} className="mt-2 flex h-10 w-full items-center gap-3 rounded-lg px-2 text-left text-sm text-[#3c4043] hover:bg-[#f1f3f4]"><LogOut size={17}/>Log out</button></div></>}</div></header>
    <div className="flex min-h-0 flex-1"> <div className="hidden md:block">{side}</div>{drawer&&<div className="fixed inset-0 z-40 md:hidden"><button aria-label="Close navigation" onClick={()=>setDrawer(false)} className="absolute inset-0 bg-black/30"/><div className="absolute bottom-0 left-0 top-0 w-[280px] shadow-xl">{side}</div></div>}
      <main className="min-w-0 flex-1 overflow-y-auto"><div className="mx-auto w-full max-w-[760px] px-5 pb-16 pt-10 sm:px-8 sm:pt-12"><div className="mb-7 flex items-end justify-between"><div><h1 className="text-[28px] font-semibold leading-tight tracking-[-.7px]">{titles[view]}</h1><p className="mt-1.5 text-sm text-muted">{dateCaption(view, pageTasks.length)}</p></div>{view==='upcoming'&&<button onClick={()=>changeView('all')} className="mb-1 rounded-lg px-3 py-2 text-sm text-muted hover:bg-[#f6f7f8]">All tasks</button>}</div>
      {notice&&<div className="mb-4 flex items-center justify-between rounded-lg bg-[#fce8e6] px-3 py-2 text-sm text-overdue">{notice}<button onClick={()=>setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
      <TaskList view={view} tasks={pageTasks} pendingChecks={pendingChecks} quick={quick} setQuick={setQuick} toggle={toggle} edit={setEditing} remove={remove} add={async(input)=>{try{await commitTask(input);}catch{setNotice('Could not add that task.');throw new Error('Add failed');}}} />
      </div></main>
    </div>
    {editing&&<TaskModal task={editing} onClose={()=>setEditing(null)} onSave={async input=>{await commitTask(input,editing.id);setEditing(null);}} onDelete={async()=>{await remove(editing);setEditing(null);}} />}
    {addModal&&<TaskModal onClose={()=>setAddModal(false)} onSave={async input=>{await commitTask(input);setAddModal(false);}} />}
  </div>;
}

function TaskList({ view, tasks, pendingChecks, quick, setQuick, toggle, edit, remove, add }: { view: View; tasks: Task[]; pendingChecks: string[]; quick: boolean; setQuick: (v:boolean)=>void; toggle:(t:Task)=>void; edit:(t:Task)=>void; remove:(t:Task)=>void; add:(input:TaskInput)=>Promise<void> }) {
  const today = isoToday(), overdue = view==='today' ? tasks.filter(t=>t.due_date!<today) : [], current = view==='today' ? tasks.filter(t=>t.due_date!>=today) : tasks;
  const groups = view==='upcoming' ? Array.from(new Set(current.map(t=>t.due_date!))).map(date=>({date,tasks:current.filter(t=>t.due_date===date)})) : [];
  const isEmpty = tasks.length===0;
  return <div>
    {overdue.length>0&&<section className="mb-8"><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-overdue"><span>Overdue</span><span className="font-normal text-overdue/75">{overdue.length}</span></div>{overdue.map(t=><TaskRow key={t.id} task={t} pending={pendingChecks.includes(t.id)} overdue toggle={toggle} edit={edit} remove={remove}/>)}</section>}
    {groups.length>0 ? groups.map(({date,tasks:items})=><section key={date} className="mb-7"><div className="sticky top-0 z-10 -mx-2 mb-1 border-b border-border bg-white/95 px-2 py-2 text-[13px] font-medium text-[#5f6368] backdrop-blur-sm">{date===dateAt(1)?'Tomorrow':formatDate(date)}</div>{items.map(t=><TaskRow key={t.id} task={t} pending={pendingChecks.includes(t.id)} toggle={toggle} edit={edit} remove={remove}/>)}</section>) : current.map(t=><TaskRow key={t.id} task={t} pending={pendingChecks.includes(t.id)} toggle={toggle} edit={edit} remove={remove}/>)}
    {isEmpty&&!quick&&<div className="flex flex-col items-center py-16 text-center"><div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-[#f8f9fa] text-[#7b8085]">{view==='completed'?<CheckCheck size={22}/>:view==='upcoming'?<CalendarRange size={22}/>:<Inbox size={22}/>}</div><p className="text-[15px] font-medium">{view==='today'?'All clear for today':view==='upcoming'?'Nothing scheduled ahead':view==='completed'?'No completed tasks yet':'No tasks yet'}</p><p className="mt-1 text-sm text-muted">{view==='completed'?'Finished tasks will show up here.':'Add a task to get started.'}</p></div>}
    {quick?<QuickForm onCancel={()=>setQuick(false)} onAdd={add}/>:<button onClick={()=>setQuick(true)} className="mt-2 flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left text-sm text-muted transition-colors hover:bg-[#f8f9fa] hover:text-accent"><span className="grid h-5 w-5 place-items-center rounded-full border border-[#aeb2b6]"><Plus size={13}/></span>Add task</button>}
  </div>;
}

function TaskRow({ task, pending, overdue, toggle, edit, remove }: { task:Task; pending?:boolean; overdue?:boolean; toggle:(t:Task)=>void; edit:(t:Task)=>void; remove:(t:Task)=>void }) {
  const [hover,setHover]=useState(false); const priorityColor = task.priority === 1 ? 'border-priority-1' : task.priority === 2 ? 'border-priority-2' : task.priority === 3 ? 'border-priority-3' : 'border-[#bdc1c6]';
  const dueColor = task.due_date===isoToday()?'text-today':overdue?'text-overdue':'text-[#80868b]';
  const checked = task.status==='done'||pending;
  return <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} className="group flex min-h-[56px] items-center gap-3 border-b border-border px-2 transition-colors hover:bg-[#fcfcfc]"><button aria-label={checked?'Mark task incomplete':'Complete task'} onClick={()=>toggle(task)} className={`task-check grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${checked?'border-today bg-today text-white':priorityColor+' bg-white hover:bg-[#f3f4f5]'}`}>{checked&&<Check size={13} strokeWidth={2.7}/>}</button><button onClick={()=>edit(task)} className="min-w-0 flex-1 py-2 text-left"><span className={`block truncate text-[15px] leading-5 ${task.status==='done'?'text-[#8b9095] line-through':'text-[#303134]'}`}>{task.title}</span>{(task.due_date||task.notes)&&<span className="mt-1 flex items-center gap-1.5 text-[12px] leading-4 text-[#80868b]">{task.due_date&&<span className={`inline-flex items-center gap-1 ${dueColor}`}><CalendarDays size={12}/>{overdue?'Overdue · ':''}{formatDate(task.due_date)}</span>}{task.notes&&<span className="ml-1 inline-flex items-center gap-1 truncate" title={task.notes}><ListTodo size={12}/><span className="max-w-[250px] truncate">{task.notes}</span></span>}</span>}</button><div className={`flex items-center gap-1 transition-opacity ${hover?'opacity-100':'opacity-0'} focus-within:opacity-100`}><button aria-label="Edit task" onClick={()=>edit(task)} className="grid h-8 w-8 place-items-center rounded-full text-[#72777b] hover:bg-[#f0f1f2]"><Pencil size={16}/></button><button aria-label="Delete task" onClick={()=>remove(task)} className="grid h-8 w-8 place-items-center rounded-full text-[#72777b] hover:bg-[#fce8e6] hover:text-overdue"><Trash2 size={16}/></button></div></div>;
}

function TaskFields({ initial, onSubmit, onCancel, onDelete, submitLabel }: { initial?:Task; onSubmit:(input:TaskInput)=>Promise<void>; onCancel:()=>void; onDelete?:()=>void; submitLabel:string }) {
  const [title,setTitle]=useState(initial?.title??''), [notes,setNotes]=useState(initial?.notes??''), [due,setDue]=useState(initial?.due_date??''), [priority,setPriority]=useState(initial?.priority?.toString()??''), [saving,setSaving]=useState(false), [error,setError]=useState('');
  const titleRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{titleRef.current?.focus();},[]);
  async function submit(e:React.FormEvent){e.preventDefault(); if(!title.trim())return; setSaving(true);setError('');try{await onSubmit({title:title.trim(),notes:notes.trim()||null,due_date:due||null,priority:priority?Number(priority):null});}catch{setError('Could not save. Please try again.');setSaving(false);}}
  return <form onSubmit={submit}><input ref={titleRef} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task name" aria-label="Task name" className="w-full border-0 bg-transparent px-0 py-2 text-base font-medium outline-none placeholder:font-normal placeholder:text-[#9aa0a6]"/><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Description" rows={2} className="w-full resize-none border-0 bg-transparent px-0 py-1 text-sm outline-none placeholder:text-[#9aa0a6]"/><div className="mt-3 flex flex-wrap items-center gap-2"><label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-[#5f6368] hover:bg-[#f8f9fa]"><CalendarDays size={14}/><input aria-label="Due date" type="date" value={due} onChange={e=>setDue(e.target.value)} className="w-[100px] bg-transparent text-xs outline-none"/></label><label className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs text-[#5f6368] hover:bg-[#f8f9fa]"><Circle size={13}/><select aria-label="Priority" value={priority} onChange={e=>setPriority(e.target.value)} className="w-[63px] bg-transparent outline-none"><option value="">Priority</option><option value="1">P1 high</option><option value="2">P2 medium</option><option value="3">P3 low</option></select></label></div>{error&&<p className="mt-2 text-xs text-overdue">{error}</p>}<div className="mt-4 flex items-center justify-between border-t border-border pt-3">{onDelete?<button type="button" onClick={onDelete} className="text-sm text-overdue hover:underline">Delete</button>:<span/>}<div className="flex items-center gap-3"><button type="button" onClick={onCancel} className="text-sm text-muted hover:text-text">Cancel</button><button type="submit" disabled={!title.trim()||saving} className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40">{saving?'Saving…':submitLabel}</button></div></div></form>;
}
function QuickForm({ onCancel,onAdd }:{onCancel:()=>void;onAdd:(input:TaskInput)=>Promise<void>}){return <div className="mt-3 rounded-lg border border-[#dadce0] px-4 py-3"><TaskFields onSubmit={onAdd} onCancel={onCancel} submitLabel="Add task"/></div>;}
function TaskModal({task,onClose,onSave,onDelete}:{task?:Task;onClose:()=>void;onSave:(input:TaskInput)=>Promise<void>;onDelete?:()=>void}) { return <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/35 px-4 py-6" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div role="dialog" aria-modal="true" aria-label={task?'Edit task':'Add task'} className="modal-panel w-full max-w-[520px] rounded-xl border border-[#dadce0] bg-white p-5 shadow-[0_8px_28px_rgba(60,64,67,.26)] sm:p-6"><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-medium">{task?'Edit task':'Add task'}</h2><button onClick={onClose} aria-label="Close dialog" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-[#f1f3f4]"><X size={18}/></button></div><TaskFields key={task?.id??'new'} initial={task} onSubmit={onSave} onCancel={onClose} onDelete={task?onDelete:undefined} submitLabel="Save"/></div></div>; }
