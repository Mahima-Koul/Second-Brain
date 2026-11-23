'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Clock3, Plus, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createTaskWithSubtasks, Subtask, Task, TaskInput } from '@/lib/tasks';

type Mode = 'today' | 'all' | 'unscheduled';
const localToday = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
function plusThirty(value:string){const [h,m]=value.split(':').map(Number);const date=new Date();date.setHours(h,m+30,0,0);return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;}
function timeMinutes(value:string){const [hours,minutes]=value.split(':').map(Number);return hours*60+minutes;}

export default function AddTaskBar({userId,mode,onOptimistic,onSaved,onFailed}:{userId:string;mode:Mode;onOptimistic:(task:Task,subtasks:Subtask[])=>void;onSaved:(tempId:string,task:Task,subtasks:Subtask[])=>void;onFailed:(tempId:string)=>void}){
  const [title,setTitle]=useState(''),[focused,setFocused]=useState(false),[due,setDue]=useState(''),[start,setStart]=useState(''),[end,setEnd]=useState(''),[priority,setPriority]=useState(''),[showSubtasks,setShowSubtasks]=useState(false),[subtasks,setSubtasks]=useState<string[]>([]),[error,setError]=useState(''),[saving,setSaving]=useState(false);
  const input=useRef<HTMLInputElement>(null),subtaskInputs=useRef<(HTMLInputElement|null)[]>([]);
  const invalid=!!start&&(!end||timeMinutes(end)<=timeMinutes(start));
  const minutes=!!start&&!invalid?timeMinutes(end)-timeMinutes(start):0;
  useEffect(()=>{setDue(mode==='today'?localToday():'');},[mode]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&focused){e.preventDefault();reset();}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
  function reset(){setTitle('');setFocused(false);setDue(mode==='today'?localToday():'');setStart('');setEnd('');setPriority('');setSubtasks([]);setShowSubtasks(false);setError('');setSaving(false);}
  function onStart(value:string){setStart(value);setEnd(value?plusThirty(value):'');}
  function taskInput():TaskInput{
    const scheduleDate=due||localToday();
    return {title:title.trim(),notes:null,due_date:due|| (mode==='today'?localToday():start?scheduleDate:null),priority:priority&&priority!=='none'?Number(priority):null,scheduled_start:start?new Date(`${scheduleDate}T${start}:00`).toISOString():null,scheduled_minutes:start?minutes:null};
  }
  async function submit(e?:React.FormEvent){e?.preventDefault();if(!title.trim()||saving)return;if(invalid){setError('End time must be after start time.');return;}setError('');setSaving(true);
    const tempId=crypto.randomUUID(),inputData=taskInput(),now=new Date().toISOString();
    const optimistic:Task={id:tempId,user_id:userId,...inputData,status:'todo',scheduled_start:inputData.scheduled_start??null,scheduled_minutes:inputData.scheduled_minutes??null,completed_at:null,created_at:now};
    const optimisticSubtasks=subtasks.map((text,position)=>({id:`${tempId}-${position}`,task_id:tempId,user_id:userId,title:text.trim(),done:false,position,created_at:now})).filter(item=>item.title);
    onOptimistic(optimistic,optimisticSubtasks);
    try{const result=await createTaskWithSubtasks(createClient(),userId,inputData,subtasks);onSaved(tempId,result.task,result.subtasks);reset();}
    catch{onFailed(tempId);setError('Could not add that task. Try again.');setSaving(false);}
  }
  function addSubtask(){setSubtasks(prev=>[...prev,'']);requestAnimationFrame(()=>subtaskInputs.current[subtasks.length]?.focus());}
  return <form onSubmit={submit} className={`sticky bottom-0 z-20 border-t border-border bg-white px-4 py-3 shadow-[0_-3px_12px_rgba(60,64,67,.08)] ${focused?'':'cursor-text'}`} onClick={()=>{if(!focused){setFocused(true);input.current?.focus();}}}>
    <div className="flex items-center gap-3"><Plus size={18} className="shrink-0 text-accent"/><input ref={input} value={title} onFocus={()=>setFocused(true)} onChange={e=>setTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void submit();}}} placeholder="Add a task…" className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-[#80868b]"/><button type="button" onClick={e=>{e.stopPropagation();setFocused(true);input.current?.focus();}} className="hidden text-xs text-muted sm:block">Options</button></div>
    {focused&&<div className="mt-3 border-t border-border pt-3" onClick={e=>e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted"><CalendarDays size={13}/><input aria-label="Due date" type="date" value={due} onChange={e=>setDue(e.target.value)} className="w-[112px] bg-transparent text-xs outline-none"/></label>
        <label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted"><Clock3 size={13}/><input aria-label="Start time" type="time" value={start} onChange={e=>onStart(e.target.value)} className="w-[92px] bg-transparent text-xs outline-none"/></label>
        {start&&<><label className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted"><Clock3 size={13}/><input aria-label="End time" type="time" value={end} onChange={e=>setEnd(e.target.value)} className="w-[92px] bg-transparent text-xs outline-none"/></label>{!invalid&&<span className="text-xs text-muted">{minutes}m</span>}</>}
        <label className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs text-muted"><select aria-label="Priority" value={priority} onChange={e=>setPriority(e.target.value)} className="bg-transparent outline-none"><option value="">Priority</option><option value="1">P1</option><option value="2">P2</option><option value="3">P3</option><option value="none">None</option></select></label>
      </div>
      {invalid&&<p className="mt-2 text-xs text-overdue">End time must be after start time.</p>}
      {showSubtasks&&<div className="mt-3 space-y-1.5">{subtasks.map((subtask,index)=><div key={index} className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-full border border-[#c4c7c5]"/><input ref={el=>{subtaskInputs.current[index]=el;}} value={subtask} onChange={e=>setSubtasks(prev=>prev.map((v,i)=>i===index?e.target.value:v))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSubtask();}}} placeholder="Subtask" className="min-w-0 flex-1 bg-transparent py-1 text-xs outline-none placeholder:text-[#9aa0a6]"/><button type="button" aria-label="Remove subtask" onClick={()=>setSubtasks(prev=>prev.filter((_,i)=>i!==index))} className="text-muted hover:text-overdue"><X size={14}/></button></div>)}</div>}
      {!showSubtasks&&<button type="button" onClick={()=>{setShowSubtasks(true);setSubtasks(['']);requestAnimationFrame(()=>subtaskInputs.current[0]?.focus());}} className="mt-3 text-xs text-muted hover:text-accent">+ Add subtask</button>}
      {error&&<p className="mt-2 text-xs text-overdue">{error}</p>}
      <div className="mt-3 flex items-center justify-end gap-3"><button type="button" onClick={reset} className="text-sm text-muted hover:text-text">Cancel</button><button type="submit" disabled={!title.trim()||saving||invalid} className="h-8 rounded-lg bg-accent px-3 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-40">{saving?'Adding…':'Add task'}</button></div>
    </div>}
  </form>;
}
