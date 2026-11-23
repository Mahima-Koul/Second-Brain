'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors, type DragMoveEvent, type DragEndEvent } from '@dnd-kit/core';
import { CalendarDays, Check, ChevronLeft, ChevronRight, LogOut, Menu, X, PanelRightClose, PanelRightOpen, House, CalendarRange, Inbox, CheckCheck, BrainCircuit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AddTaskBar from '@/components/add-task-bar';
import { createTask, deleteTask, saveSubtasks, setSubtasksDone, Subtask, SubtaskDraft, Task, TaskInput, updateTask } from '@/lib/tasks';
import { setTaskSchedule } from '@/lib/planner';
import { TaskModal } from '@/components/tasks-app';

const WEEK_STARTS_ON = 1; // Monday
const HOUR_HEIGHT = 56;
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;
const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayString = () => localDate(new Date());
function parseDate(value: string) { const [y,m,d]=value.split('-').map(Number); return new Date(y,m-1,d,12); }
function shiftDate(value: string, amount: number) { const d=parseDate(value); d.setDate(d.getDate()+amount); return localDate(d); }
function weekDates(value: string) { const d=parseDate(value); const offset=(d.getDay()-WEEK_STARTS_ON+7)%7; const monday=shiftDate(localDate(d),-offset); return Array.from({length:7},(_,i)=>shiftDate(monday,i)); }
function dateHeading(value: string) { return parseDate(value).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}); }
function timeLabel(minutes: number, withMinutes = true) { const h=Math.floor(minutes/60)%24, m=minutes%60; const suffix=h>=12?'PM':'AM'; const hour=h%12||12; return `${hour}${withMinutes?`:${String(m).padStart(2,'0')}`:''} ${suffix}`; }
function dateAtMinute(date: string, minute: number) { const d=parseDate(date); d.setHours(Math.floor(minute/60),minute%60,0,0); return d; }
function localMinute(task: Task) { const d=new Date(task.scheduled_start!); return d.getHours()*60+d.getMinutes(); }
function duration(task: Task) { return task.scheduled_minutes ?? 30; }
function priorityColor(priority: number | null) { return priority===1?'#D1453B':priority===2?'#EB8909':priority===3?'#246FE0':'#bdc1c6'; }
function getLayout(tasks: Task[]) {
  const sorted=tasks.slice().sort((a,b)=>localMinute(a)-localMinute(b));
  const positioned: {task:Task;column:number;columns:number}[]=[];
  for(let i=0;i<sorted.length;) {
    const group=[sorted[i]]; let groupEnd=localMinute(sorted[i])+duration(sorted[i]); let j=i+1;
    while(j<sorted.length&&localMinute(sorted[j])<groupEnd) { group.push(sorted[j]); groupEnd=Math.max(groupEnd,localMinute(sorted[j])+duration(sorted[j])); j++; }
    const ends:number[]=[]; const entries:{task:Task;column:number}[]=[];
    for(const task of group) { const start=localMinute(task), end=start+duration(task); let col=ends.findIndex(value=>value<=start); if(col<0) col=ends.length; ends[col]=end; entries.push({task,column:col}); }
    entries.forEach(entry=>positioned.push({...entry,columns:ends.length})); i=j;
  }
  return positioned;
}

type User={id:string;name:string;email:string;avatar:string};
type Preview={date:string;minute:number};
type QuickSlot={date:string;minute:number;x:number;y:number};
type Detail={task:Task;x:number;y:number};
export default function PlannerApp({initialTasks,initialSubtasks,user,initialView,initialDate}:{initialTasks:Task[];initialSubtasks:Subtask[];user:User;initialView?:string;initialDate?:string}) {
  const router=useRouter();
  const [tasks,setTasks]=useState(initialTasks), [subtasks,setSubtasks]=useState(initialSubtasks), [view,setView]=useState<'day'|'week'>(initialView==='day'?'day':'week');
  const [date,setDate]=useState(initialDate&&/^\d{4}-\d{2}-\d{2}$/.test(initialDate)?initialDate:todayString());
  const [now,setNow]=useState(new Date()), [panelOpen,setPanelOpen]=useState(true), [mobilePanel,setMobilePanel]=useState(false), [filter,setFilter]=useState<'all'|'week'>('all');
  const [active,setActive]=useState<Task|null>(null), [preview,setPreview]=useState<Preview|null>(null), [quickSlot,setQuickSlot]=useState<QuickSlot|null>(null);
  const [detail,setDetail]=useState<Detail|null>(null), [editing,setEditing]=useState<Task|null>(null), [menu,setMenu]=useState(false), [mobileNav,setMobileNav]=useState(false), [toast,setToast]=useState('');
  const scrollRef=useRef<HTMLDivElement>(null), quickInput=useRef<HTMLInputElement>(null);
  const sensors=useSensors(useSensor(PointerSensor,{activationConstraint:{distance:6}}),useSensor(TouchSensor,{activationConstraint:{delay:120,tolerance:6}}));
  useEffect(()=>{setTasks(initialTasks);},[initialTasks]);
  useEffect(()=>{setSubtasks(initialSubtasks);},[initialSubtasks]);
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),60000);return()=>window.clearInterval(timer);},[]);
  useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=7*HOUR_HEIGHT;},[view,date]);
  useEffect(()=>{if(quickSlot)quickInput.current?.focus();},[quickSlot]);
  useEffect(()=>{if(!toast)return;const t=window.setTimeout(()=>setToast(''),3000);return()=>window.clearTimeout(t);},[toast]);
  useEffect(()=>{const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'){setQuickSlot(null);setDetail(null);setEditing(null);setMobilePanel(false);}};window.addEventListener('keydown',esc);return()=>window.removeEventListener('keydown',esc);},[]);

  const dates=useMemo(()=>view==='day'?[date]:weekDates(date),[date,view]);
  const currentWeek=weekDates(date);
  const unscheduled=useMemo(()=>tasks.filter(t=>t.status==='todo'&&!t.scheduled_start).filter(t=>filter==='all'||(t.due_date&&t.due_date>=currentWeek[0]&&t.due_date<=currentWeek[6])).sort((a,b)=>{
    const bucket=(t:Task)=>!t.due_date?3:t.due_date<todayString()?0:t.due_date===todayString()?1:2;
    return bucket(a)-bucket(b)||(a.due_date??'9999').localeCompare(b.due_date??'9999');
  }),[tasks,filter,currentWeek]);
  const scheduled=useMemo(()=>tasks.filter(t=>!!t.scheduled_start),[tasks]);
  const subtaskCounts=useMemo(()=>{const counts=new Map<string,{done:number;total:number}>();for(const item of subtasks){const value=counts.get(item.task_id)??{done:0,total:0};value.total++;if(item.done)value.done++;counts.set(item.task_id,value);}return counts;},[subtasks]);
  const headerTitle=view==='day'?dateHeading(date):parseDate(currentWeek[0]).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  function updateUrl(nextView=view,nextDate=date){router.replace(`/planner?view=${nextView}&date=${nextDate}`,{scroll:false});}
  useEffect(()=>{const validDate=!!initialDate&&/^\d{4}-\d{2}-\d{2}$/.test(initialDate);const validView=initialView==='day'||initialView==='week';const nextDate=validDate?initialDate!:todayString();const nextView=validView?initialView!:'week';if(!validDate)setDate(nextDate);if(!validView||!validDate)router.replace(`/planner?view=${nextView}&date=${nextDate}`,{scroll:false});},[]);
  function selectView(next:'day'|'week'){setView(next);updateUrl(next,date);}
  function moveDate(direction:number){const next=shiftDate(date,direction*(view==='day'?1:7));setDate(next);updateUrl(view,next);}
  function goToday(){const next=todayString();setDate(next);updateUrl(view,next);}
  async function persistSchedule(task:Task,start:string|null,minutes:number|null){return setTaskSchedule(createClient(),task.id,start,minutes);}
  async function scheduleTask(task:Task,start:string|null,minutes:number|null){
    const dueDate=start&&!task.scheduled_start&&!task.due_date?localDate(new Date(start)):task.due_date;
    const optimistic={...task,scheduled_start:start,scheduled_minutes:minutes,due_date:dueDate};setTasks(prev=>prev.map(t=>t.id===task.id?optimistic:t));
    try{const saved=await setTaskSchedule(createClient(),task.id,start,minutes,dueDate!==task.due_date?dueDate:undefined);setTasks(prev=>prev.map(t=>t.id===task.id?saved:t));}
    catch{setTasks(prev=>prev.map(t=>t.id===task.id?task:t));setToast('Could not update the schedule. Please try again.');}
  }
  function updatePreview(event:DragMoveEvent){
    const overId=event.over?.id;
    if(typeof overId!=='string'||overId==='unscheduled'){setPreview(null);return;}
    const raw=event.activatorEvent as PointerEvent|TouchEvent;
    const pointerY='clientY' in raw?raw.clientY:raw.changedTouches?.[0]?.clientY;
    const container=scrollRef.current;
    if(!container||pointerY===undefined){setPreview(null);return;}
    const delta=event.delta?.y??0; const y=pointerY+delta-container.getBoundingClientRect().top-54+container.scrollTop;
    const minutes=Math.max(0,Math.min(1439,Math.round((y/HOUR_HEIGHT*60)/15)*15));
    setPreview({date:overId,minute:minutes});
  }
  function onDragEnd(event:DragEndEvent){
    const task=event.active.data.current?.task as Task|undefined; const overId=event.over?.id;
    if(task&&overId==='unscheduled') void scheduleTask(task,null,null);
    else if(task&&typeof overId==='string'&&overId!=='unscheduled'&&preview){const start=dateAtMinute(overId,preview.minute).toISOString();void scheduleTask(task,start,task.scheduled_minutes??30);}
    setActive(null);setPreview(null);
  }
  async function quickCreate(){if(!quickSlot)return;const title=quickInput.current?.value.trim();if(!title)return;
    const start=dateAtMinute(quickSlot.date,quickSlot.minute).toISOString();const input:TaskInput={title,notes:null,due_date:quickSlot.date,priority:null,scheduled_start:start,scheduled_minutes:30};const optimistic:Task={id:crypto.randomUUID(),user_id:user.id,...input,status:'todo',scheduled_start:start,scheduled_minutes:30,completed_at:null,created_at:new Date().toISOString()};
    setTasks(prev=>[...prev,optimistic]);setQuickSlot(null);
    try{const saved=await createTask(createClient(),user.id,input);setTasks(prev=>prev.map(t=>t.id===optimistic.id?saved:t));}
    catch{setTasks(prev=>prev.filter(t=>t.id!==optimistic.id));setToast('Could not create that task.');}
  }
  async function toggleTask(task:Task){const next=task.status==='done'?'todo':'done';const updated={...task,status:next as Task['status'],completed_at:next==='done'?new Date().toISOString():null};const children=subtasks.filter(s=>s.task_id===task.id);setTasks(prev=>prev.map(t=>t.id===task.id?updated:t));setSubtasks(prev=>prev.map(s=>s.task_id===task.id?{...s,done:next==='done'}:s));try{const client=createClient();const saved=await updateTask(client,task.id,{status:updated.status,completed_at:updated.completed_at});if(children.length)await setSubtasksDone(client,task.id,next==='done');setTasks(prev=>prev.map(t=>t.id===task.id?saved:t));}catch{setTasks(prev=>prev.map(t=>t.id===task.id?task:t));setSubtasks(prev=>[...prev.filter(s=>s.task_id!==task.id),...children]);setToast('Could not update that task.');}}
  async function saveEdit(input:TaskInput,drafts:SubtaskDraft[]=[]){if(!editing)return;try{const client=createClient();const allDone=drafts.length>0&&drafts.every(s=>s.done);const incomplete=drafts.some(s=>!s.done);const status=allDone?'done':editing.status==='done'&&incomplete?'todo':editing.status;const completed_at=status==='done'?(editing.completed_at??new Date().toISOString()):null;const saved=await updateTask(client,editing.id,{...input,status,completed_at});const children=await saveSubtasks(client,user.id,editing.id,drafts);setTasks(prev=>prev.map(t=>t.id===editing.id?saved:t));setSubtasks(prev=>[...prev.filter(s=>s.task_id!==editing.id),...children]);setEditing(null);setDetail(null);}catch{setToast('Could not save that task.');throw new Error('Save failed');}}
  async function removeTask(task:Task){setTasks(prev=>prev.filter(t=>t.id!==task.id));setSubtasks(prev=>prev.filter(s=>s.task_id!==task.id));setDetail(null);setEditing(null);try{await deleteTask(createClient(),task.id);}catch{setTasks(prev=>[...prev,task]);setToast('Could not delete that task.');}}
  async function logout(){await createClient().auth.signOut();router.replace('/login');router.refresh();}
  function resizeStart(event:React.PointerEvent,task:Task){event.preventDefault();event.stopPropagation();const startY=event.clientY,initial=duration(task);let finalMins=initial;const move=(e:PointerEvent)=>{const diff=e.clientY-startY;const steps=Math.round(diff/HOUR_HEIGHT*60/15);finalMins=Math.max(15,Math.min(480,initial+steps*15));setTasks(prev=>prev.map(t=>t.id===task.id?{...t,scheduled_minutes:finalMins}:t));};const up=async()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);try{const saved=await persistSchedule(task,task.scheduled_start,finalMins);setTasks(prev=>prev.map(t=>t.id===task.id?saved:t));}catch{setTasks(prev=>prev.map(t=>t.id===task.id?{...task,scheduled_minutes:initial}:t));setToast('Could not resize that task.');}};document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});}

  return <DndContext sensors={sensors} onDragStart={event=>{setActive(event.active.data.current?.task as Task);setDetail(null);}} onDragMove={updatePreview} onDragEnd={onDragEnd} onDragCancel={()=>{setActive(null);setPreview(null);}}>
    <div className="flex h-screen min-h-[560px] flex-col overflow-hidden bg-white text-text">
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-4"><div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={()=>setMobileNav(true)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-[#f1f3f4]"><Menu size={20}/></button><div className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-white"><BrainCircuit size={17}/></div><span className="text-[15px] font-medium">Second Brain</span><span className="ml-2 text-sm text-muted">/</span><span className="text-sm font-medium">Planner</span></div><div className="relative"><button onClick={()=>setMenu(!menu)} className="grid h-9 w-9 place-items-center rounded-full">{user.avatar?<img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover"/>:<span className="grid h-8 w-8 place-items-center rounded-full bg-[#d7e3fc] text-[#174ea6]">{user.name.slice(0,1)}</span>}</button>{menu&&<><button aria-label="Close menu" className="fixed inset-0 z-30" onClick={()=>setMenu(false)}/><div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-border bg-white p-4 shadow-lg"><div className="border-b border-border pb-3"><p className="font-medium">{user.name}</p><p className="truncate text-xs text-muted">{user.email}</p></div><button onClick={logout} className="mt-2 flex h-9 items-center gap-2"><LogOut size={16}/>Log out</button></div></>}</div></header>
      {mobileNav&&<div className="fixed inset-0 z-50 lg:hidden"><button onClick={()=>setMobileNav(false)} aria-label="Close navigation" className="absolute inset-0 bg-black/30"/><nav className="absolute bottom-0 left-0 top-0 w-[260px] bg-sidebar p-4 shadow-xl"><div className="mb-5 flex items-center justify-between font-medium">Second Brain<button onClick={()=>setMobileNav(false)} aria-label="Close"><X size={18}/></button></div>{[['Today','/tasks?view=today'],['Upcoming','/tasks?view=upcoming'],['All tasks','/tasks?view=all'],['Completed','/tasks?view=completed']].map(([label,href])=><button key={href} onClick={()=>{setMobileNav(false);router.push(href);}} className="flex h-10 w-full items-center rounded-lg px-3 text-left text-[#3c4043] hover:bg-[#f0f1f2]">{label}</button>)}<div className="my-3 border-t border-border"/><button onClick={()=>setMobileNav(false)} className="flex h-10 w-full items-center rounded-lg bg-[#fce9e7] px-3 text-left font-medium text-accent">Planner</button><div className="mt-2 flex h-10 items-center justify-between px-3 text-[#a1a5aa]">Habits <span className="rounded-full border border-[#e3e5e7] px-2 py-0.5 text-[10px]">Soon</span></div><div className="flex h-10 items-center justify-between px-3 text-[#a1a5aa]">Events <span className="rounded-full border border-[#e3e5e7] px-2 py-0.5 text-[10px]">Soon</span></div></nav></div>}
      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-[220px] shrink-0 flex-col border-r border-border bg-sidebar px-3 py-5 lg:flex"><button onClick={()=>router.push('/tasks?view=today')} className="mb-2 flex h-10 items-center gap-3 rounded-lg px-3 text-[#3c4043] hover:bg-[#f0f1f2]"><House size={18}/>Today</button><button onClick={()=>router.push('/tasks?view=upcoming')} className="mb-2 flex h-10 items-center gap-3 rounded-lg px-3 text-[#3c4043] hover:bg-[#f0f1f2]"><CalendarRange size={18}/>Upcoming</button><button onClick={()=>router.push('/tasks?view=all')} className="mb-2 flex h-10 items-center gap-3 rounded-lg px-3 text-[#3c4043] hover:bg-[#f0f1f2]"><Inbox size={18}/>All tasks</button><button onClick={()=>router.push('/tasks?view=completed')} className="mb-2 flex h-10 items-center gap-3 rounded-lg px-3 text-[#3c4043] hover:bg-[#f0f1f2]"><CheckCheck size={18}/>Completed</button><div className="my-3 border-t border-border"/><button className="flex h-10 items-center gap-3 rounded-lg bg-[#fce9e7] px-3 font-medium text-accent"><CalendarDays size={18}/>Planner</button><div className="mt-auto text-xs text-muted">A little more clarity, every day.</div></nav>
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-[62px] shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2 sm:px-6"><div className="flex min-w-0 items-center gap-2"><button onClick={goToday} className="h-9 rounded-lg border border-[#dadce0] px-3 text-sm hover:bg-[#f8f9fa]">Today</button><button aria-label="Previous" onClick={()=>moveDate(-1)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-[#f1f3f4]"><ChevronLeft size={19}/></button><button aria-label="Next" onClick={()=>moveDate(1)} className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-[#f1f3f4]"><ChevronRight size={19}/></button><h1 className="ml-2 truncate text-lg font-medium sm:text-xl">{headerTitle}</h1></div><div className="flex items-center gap-2"><button onClick={()=>setMobilePanel(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted md:hidden" aria-label="Show unscheduled tasks"><PanelRightOpen size={18}/></button><div className="flex rounded-lg border border-[#dadce0] p-0.5 text-sm"><button onClick={()=>selectView('day')} className={`rounded-md px-3 py-1.5 ${view==='day'?'bg-[#fce9e7] font-medium text-accent':'text-[#5f6368] hover:bg-[#f8f9fa]'}`}>Day</button><button onClick={()=>selectView('week')} className={`rounded-md px-3 py-1.5 ${view==='week'?'bg-[#fce9e7] font-medium text-accent':'text-[#5f6368] hover:bg-[#f8f9fa]'}`}>Week</button></div><button onClick={()=>setPanelOpen(!panelOpen)} className="hidden h-9 w-9 place-items-center rounded-lg text-muted hover:bg-[#f1f3f4] md:grid" aria-label="Toggle unscheduled panel">{panelOpen?<PanelRightClose size={18}/>:<PanelRightOpen size={18}/>}</button></div></div>
          {toast&&<div className="absolute left-1/2 top-[76px] z-50 -translate-x-1/2 rounded-lg bg-[#323232] px-4 py-2 text-sm text-white shadow-lg">{toast}</div>}
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto"><div className="min-w-[700px]" style={{display:'grid',gridTemplateColumns:`58px repeat(${dates.length}, minmax(115px, 1fr))`}}>
            <div className="sticky top-0 z-20 h-[54px] border-b border-border bg-white"/>{dates.map(day=><div key={day} className={`sticky top-0 z-20 flex h-[54px] flex-col items-center justify-center border-b border-l border-border bg-white ${day===todayString()?'text-accent':''}`}><span className="text-[10px] font-semibold uppercase tracking-[1px] text-muted">{parseDate(day).toLocaleDateString('en-US',{weekday:'short'})}</span><span className={`mt-0.5 grid h-7 min-w-7 place-items-center rounded-full px-1 text-base ${day===todayString()?'bg-accent font-semibold text-white':''}`}>{parseDate(day).getDate()}</span></div>)}
            <div className="relative bg-white" style={{height:TOTAL_HEIGHT}}>{Array.from({length:24},(_,hour)=><div key={hour} className="absolute right-2 text-[11px] text-[#7c8084]" style={{top:hour*HOUR_HEIGHT+2}}>{timeLabel(hour*60,false)}</div>)}</div>
            {dates.map(day=><DayColumn key={day} date={day} allTasks={scheduled.filter(t=>localDate(new Date(t.scheduled_start!))===day)} subtaskCounts={subtaskCounts} now={now} preview={preview?.date===day?preview:null} onEmpty={(e,minute)=>setQuickSlot({date:day,minute,x:e.clientX,y:e.clientY})} onTaskClick={(task,e)=>setDetail({task,x:e.clientX,y:e.clientY})} onToggle={toggleTask} onResize={resizeStart}/>)}
          </div></div>
        </section>
        <UnscheduledPanel tasks={unscheduled} subtasks={subtasks} userId={user.id} onOptimistic={(task,children)=>{setTasks(prev=>[task,...prev]);setSubtasks(prev=>[...prev,...children]);}} onSaved={(tempId,task,children)=>{setTasks(prev=>prev.map(t=>t.id===tempId?task:t));setSubtasks(prev=>[...prev.filter(s=>s.task_id!==tempId),...children]);}} onFailed={tempId=>{setTasks(prev=>prev.filter(t=>t.id!==tempId));setSubtasks(prev=>prev.filter(s=>s.task_id!==tempId));}} panelOpen={panelOpen} mobileOpen={mobilePanel} filter={filter} onFilter={setFilter} onClose={()=>setMobilePanel(false)} onToggle={()=>setPanelOpen(!panelOpen)} />
      </div>
    </div>
    <DragOverlay dropAnimation={null}>{active?<TaskBlockGhost task={active}/>:null}</DragOverlay>
    {quickSlot&&<div className="fixed z-50 w-[280px] rounded-lg border border-border bg-white p-3 shadow-[0_4px_16px_rgba(60,64,67,.2)]" style={{left:Math.max(8,Math.min(quickSlot.x,window.innerWidth-288)),top:Math.max(8,Math.min(quickSlot.y,window.innerHeight-110))}}><form onSubmit={e=>{e.preventDefault();void quickCreate();}}><div className="mb-2 flex items-center justify-between text-xs text-muted"><span>{dateHeading(quickSlot.date)} · {timeLabel(quickSlot.minute)}</span><button type="button" onClick={()=>setQuickSlot(null)} aria-label="Cancel"><X size={15}/></button></div><input ref={quickInput} placeholder="Task title" className="w-full border-b border-border py-2 text-sm outline-none focus:border-accent"/><button type="submit" className="mt-2 text-xs font-medium text-accent">Press Enter to add</button></form></div>}
    {detail&&<><button aria-label="Close task details" className="fixed inset-0 z-40 cursor-default" onClick={()=>setDetail(null)}/><div className="fixed z-50 w-[280px] rounded-lg border border-border bg-white p-4 shadow-[0_4px_18px_rgba(60,64,67,.2)]" style={{left:Math.max(8,Math.min(detail.x,window.innerWidth-288)),top:Math.max(8,Math.min(detail.y,window.innerHeight-280))}}><div className="mb-3 flex items-start justify-between gap-2"><div><h3 className="font-medium">{detail.task.title}</h3>{detail.task.notes&&<p className="mt-1 text-sm text-muted">{detail.task.notes}</p>}</div><button onClick={()=>setDetail(null)} aria-label="Close"><X size={16}/></button></div><div className="space-y-1.5 text-xs text-muted"><p>Priority: {detail.task.priority?`P${detail.task.priority}`:'None'}</p><p>Due: {detail.task.due_date??'No due date'}</p><p>Duration: {duration(detail.task)} minutes</p></div><div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3"><button onClick={()=>{setEditing(detail.task);setDetail(null);}} className="rounded-md bg-[#f1f3f4] px-3 py-1.5 text-sm">Edit</button><button onClick={()=>{void scheduleTask(detail.task,null,null);setDetail(null);}} className="rounded-md px-2 py-1.5 text-sm text-muted hover:bg-[#f1f3f4]">Unschedule</button><button onClick={()=>void removeTask(detail.task)} className="rounded-md px-2 py-1.5 text-sm text-overdue hover:bg-[#fce8e6]">Delete</button></div></div></>}
    {editing&&<TaskModal task={editing} subtasks={subtasks.filter(s=>s.task_id===editing.id)} onClose={()=>setEditing(null)} onSave={saveEdit} onDelete={()=>void removeTask(editing)}/>}
  </DndContext>;
}

function DayColumn({date,allTasks,subtaskCounts,now,preview,onEmpty,onTaskClick,onToggle,onResize}:{date:string;allTasks:Task[];subtaskCounts:Map<string,{done:number;total:number}>;now:Date;preview:Preview|null;onEmpty:(e:React.MouseEvent,minute:number)=>void;onTaskClick:(task:Task,e:React.MouseEvent)=>void;onToggle:(task:Task)=>void;onResize:(e:React.PointerEvent,task:Task)=>void}){
  const {setNodeRef,isOver}=useDroppable({id:date});
  const layout=getLayout(allTasks); const today=date===todayString(); const currentMinute=now.getHours()*60+now.getMinutes();
  function emptyClick(e:React.MouseEvent<HTMLDivElement>){if((e.target as HTMLElement).closest('[data-task-block]'))return;const rect=e.currentTarget.getBoundingClientRect();const minute=Math.max(0,Math.min(1439,Math.round(((e.clientY-rect.top)/HOUR_HEIGHT*60)/15)*15));onEmpty(e,minute);}
  return <div ref={setNodeRef} onClick={emptyClick} className={`relative border-l border-border ${today?'bg-[#fffdfd]':''}`} style={{height:TOTAL_HEIGHT,backgroundImage:'linear-gradient(to bottom, #e8eaed 1px, transparent 1px), linear-gradient(to bottom, #f3f4f4 1px, transparent 1px)',backgroundSize:`100% ${HOUR_HEIGHT}px, 100% ${HOUR_HEIGHT/2}px`,backgroundPosition:'top left'}}>
    {isOver&&<div className="pointer-events-none absolute inset-0 bg-accent/5"/>}
    {preview&&<div className="pointer-events-none absolute inset-x-0 z-10 border-t border-accent/40 bg-accent/10" style={{top:preview.minute/60*HOUR_HEIGHT,height:HOUR_HEIGHT/4}}><span className="absolute left-1 top-0 rounded bg-white/90 px-1 text-[10px] text-accent">{timeLabel(preview.minute)}</span></div>}
    {today&&<div className="pointer-events-none absolute left-0 right-0 z-20 border-t border-overdue" style={{top:currentMinute/60*HOUR_HEIGHT}}><span className="absolute -left-[4px] -top-[4px] h-2 w-2 rounded-full bg-overdue"/></div>}
    {layout.map(({task,column,columns})=><TaskBlock key={task.id} task={task} count={subtaskCounts.get(task.id)} column={column} columns={columns} onClick={e=>onTaskClick(task,e)} onToggle={()=>onToggle(task)} onResize={e=>onResize(e,task)}/>)}
  </div>;
}

function TaskBlock({task,count,column,columns,onClick,onToggle,onResize}:{task:Task;count?:{done:number;total:number};column:number;columns:number;onClick:(e:React.MouseEvent)=>void;onToggle:()=>void;onResize:(e:React.PointerEvent)=>void}){
  const {attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:task.id,data:{task}});
  const start=new Date(task.scheduled_start!); const end=new Date(start.getTime()+duration(task)*60000); const startMinute=localMinute(task); const past=end<new Date()&&task.status==='todo';
  const height=Math.max(18,duration(task)/60*HOUR_HEIGHT); const top=startMinute/60*HOUR_HEIGHT;
  return <div ref={setNodeRef} data-task-block="true" {...attributes} {...listeners} onClick={onClick} className={`absolute z-[2] overflow-hidden rounded-[6px] bg-white px-1.5 py-1 shadow-none ${task.status==='done'?'opacity-60':''} ${isDragging?'opacity-30':''}`} style={{top,height,left:`calc(${column*100/columns}% + 2px)`,width:`calc(${100/columns}% - 4px)`,border:`1px solid #dadce0`,borderLeft:`4px ${past?'dashed':'solid'} ${past?'#D1453B':priorityColor(task.priority)}`,transform:transform?`translate3d(${transform.x}px,${transform.y}px,0)`:undefined,touchAction:'none'}}>
    <div className="flex min-w-0 items-start gap-1"><button onPointerDown={e=>e.stopPropagation()} onTouchStart={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onToggle();}} aria-label={task.status==='done'?'Mark task incomplete':'Complete task'} className={`mt-[1px] grid h-4 w-4 shrink-0 place-items-center rounded-full border ${task.status==='done'?'border-today bg-today text-white':'border-[#aeb2b6] bg-white hover:bg-[#f1f3f4]'}`}>{task.status==='done'&&<Check size={11}/>}</button><div className="min-w-0 flex-1"><div className="flex items-center gap-1"><span className={`min-w-0 truncate text-[11px] leading-[14px] ${task.status==='done'?'line-through text-muted':'text-[#303134]'}`}>{task.title}</span>{count&&<span className="shrink-0 text-[8px] text-muted">{count.done}/{count.total}</span>}{past&&<span className="shrink-0 text-[9px] text-overdue">Missed</span>}</div>{height>=40&&<div className="mt-0.5 text-[10px] leading-3 text-muted">{start.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})} – {end.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div>}</div></div>
    {height>=18&&<div onPointerDown={onResize} onTouchStart={e=>e.stopPropagation()} onClick={e=>e.stopPropagation()} className="absolute bottom-0 left-1 right-1 z-10 h-2 cursor-ns-resize" aria-label="Resize task"/>}
  </div>;
}
function TaskBlockGhost({task}:{task:Task}){return <div className="flex max-w-[220px] items-center gap-2 rounded-md border border-[#dadce0] border-l-4 bg-white px-2 py-2 text-sm shadow-lg" style={{borderLeftColor:priorityColor(task.priority)}}><span className="h-4 w-4 shrink-0 rounded-full border border-[#aeb2b6]"/>{task.title}</div>;}

function UnscheduledPanel({tasks,subtasks,userId,onOptimistic,onSaved,onFailed,panelOpen,mobileOpen,filter,onFilter,onClose,onToggle}:{tasks:Task[];subtasks:Subtask[];userId:string;onOptimistic:(task:Task,subtasks:Subtask[])=>void;onSaved:(tempId:string,task:Task,subtasks:Subtask[])=>void;onFailed:(tempId:string)=>void;panelOpen:boolean;mobileOpen:boolean;filter:'all'|'week';onFilter:(v:'all'|'week')=>void;onClose:()=>void;onToggle:()=>void}){
  const {setNodeRef,isOver}=useDroppable({id:'unscheduled'});
  const panel=<aside ref={setNodeRef} className={`flex h-full shrink-0 flex-col border-l border-border bg-sidebar transition-[width] duration-150 ${panelOpen?'w-[300px]':'w-12'} ${mobileOpen?'fixed inset-y-0 right-0 z-50 shadow-xl':'hidden md:flex'} ${isOver?'bg-[#fce9e7]':''}`}>
    <div className={`flex h-[62px] shrink-0 items-center border-b border-border ${panelOpen?'justify-between px-4':'justify-center'}`}>{panelOpen&&<h2 className="font-medium">Unscheduled <span className="ml-1 text-sm font-normal text-muted">{tasks.length}</span></h2>}<button onClick={onToggle} aria-label="Collapse unscheduled panel" className="hidden h-8 w-8 place-items-center rounded-md text-muted hover:bg-[#f0f1f2] md:grid">{panelOpen?<PanelRightClose size={17}/>:<PanelRightOpen size={17}/>}</button>{panelOpen&&<button onClick={onClose} aria-label="Close panel" className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-[#f0f1f2] md:hidden"><X size={17}/></button>}</div>
    {panelOpen&&<><div className="flex gap-1 border-b border-border px-3 py-3"><button onClick={()=>onFilter('all')} className={`rounded-full px-3 py-1 text-xs ${filter==='all'?'bg-[#e8eaed] font-medium text-text':'text-muted hover:bg-[#f0f1f2]'}`}>All</button><button onClick={()=>onFilter('week')} className={`rounded-full px-3 py-1 text-xs ${filter==='week'?'bg-[#e8eaed] font-medium text-text':'text-muted hover:bg-[#f0f1f2]'}`}>Due this week</button></div><div className="min-h-0 flex-1 overflow-auto p-3">{tasks.length===0?<div className="flex h-full flex-col items-center justify-center text-center text-muted"><CalendarDays size={24} className="mb-2 text-[#9aa0a6]"/><p className="text-sm">Everything is scheduled</p></div>:tasks.map(task=><DraggableTaskCard key={task.id} task={task} count={subtasks.filter(s=>s.task_id===task.id)}/>)}</div><AddTaskBar userId={userId} mode="unscheduled" onOptimistic={onOptimistic} onSaved={onSaved} onFailed={onFailed}/></>}
  </aside>;
  return <>{mobileOpen&&<button onClick={onClose} aria-label="Close panel" className="fixed inset-0 z-40 bg-black/30 md:hidden"/>}{panel}</>;
}
function DraggableTaskCard({task,count}:{task:Task;count:Subtask[]}){const {attributes,listeners,setNodeRef,transform,isDragging}=useDraggable({id:task.id,data:{task}});const due=task.due_date;return <div ref={setNodeRef} {...attributes} {...listeners} className={`mb-2 rounded-md border border-[#dadce0] border-l-4 bg-white p-3 text-sm shadow-[0_1px_2px_rgba(60,64,67,.08)] ${isDragging?'opacity-40':''}`} style={{borderLeftColor:priorityColor(task.priority),transform:transform?`translate3d(${transform.x}px,${transform.y}px,0)`:undefined,touchAction:'none'}}><div className="flex items-start gap-2"><span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-[#aeb2b6]"/><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-medium text-[#303134]">{task.title}</p>{count.length>0&&<span className="shrink-0 text-[10px] text-muted">{count.filter(s=>s.done).length}/{count.length}</span>}</div>{due&&<p className={`mt-1 text-xs ${due<todayString()?'text-overdue':due===todayString()?'text-today':'text-muted'}`}><CalendarDays size={12} className="mr-1 inline"/>{parseDate(due).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</p>}</div></div></div>;}
