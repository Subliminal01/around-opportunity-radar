"use client";
import {useEffect,useRef,useState} from 'react';
import {MessageCircle,Send,ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Opportunity} from '@/lib/opportunities';
type Message={role:'user'|'assistant';content:string;sources?:{id:string;title:string;url:string}[];snapshot:string};
export function EventChat({events,checkedAt,refreshing}:{events:Opportunity[];checkedAt:string|null;refreshing:boolean}){
 const [open,setOpen]=useState(false),[available,setAvailable]=useState<boolean|null>(null),[messages,setMessages]=useState<Message[]>([]),[question,setQuestion]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const end=useRef<HTMLDivElement>(null),controller=useRef<AbortController|null>(null),requestNumber=useRef(0);
 const signature=JSON.stringify([checkedAt,events.map(e=>e.id)]),latest=useRef(signature);latest.current=signature;
 useEffect(()=>{const c=new AbortController();fetch('/api/chat',{signal:c.signal,cache:'no-store'}).then(r=>r.json()).then(d=>setAvailable(!!d&&typeof d==='object'&&'available' in d&&d.available===true)).catch(()=>setAvailable(false));return ()=>c.abort();},[open]);
 useEffect(()=>{requestNumber.current++;controller.current?.abort();setBusy(false);setError('');},[signature]);
 useEffect(()=>()=>controller.current?.abort(),[]);
 useEffect(()=>{if(open)end.current?.scrollIntoView({block:'nearest'});},[messages,busy,open]);
 async function ask(text=question){
  if(busy||refreshing||!available||!checkedAt||!events.length||!text.trim())return;
  const snapshot=signature,n=++requestNumber.current,user:Message={role:'user',content:text.trim(),snapshot};
  const history=[...messages,user].slice(-11);setMessages(history);setQuestion('');setError('');setBusy(true);
  const c=new AbortController();controller.current=c;const timeout=setTimeout(()=>c.abort(),50000);
  try{const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({checkedAt,events,messages:history.map(({role,content})=>({role,content}))}),signal:c.signal});const d=await r.json() as {error?:string;answer?:string;sources?:{id:string;title:string;url:string}[]};if(!r.ok)throw Error(d.error||'Chat is unavailable.');if(typeof d.answer!=='string'||!Array.isArray(d.sources))throw Error('The answer could not be read.');
   if(n!==requestNumber.current||latest.current!==snapshot)return;
   const answer=d.answer;const sources=d.sources.filter((s:{id:string;url:string})=>events.some(e=>e.id===s.id&&e.url===s.url));
   setMessages(m=>[...m,{role:'assistant',content:answer,sources,snapshot}]);
  }catch(e){if(n===requestNumber.current){setError(e instanceof Error&&e.name!=='AbortError'?e.message:'The reply timed out. Please try again.');setQuestion(text);setMessages(m=>m.filter(x=>x!==user));}}
  finally{clearTimeout(timeout);if(n===requestNumber.current)setBusy(false);}
 }
 return <div className="event-chat"><Button className="chat-launcher" aria-expanded={open} aria-controls="event-chat-panel" onClick={()=>setOpen(v=>!v)}><MessageCircle size={18}/>{open?'Close event chat':'Ask about these events'}</Button>{open&&<section id="event-chat-panel" aria-labelledby="event-chat-title" className="chat-panel"><header><div><h2 id="event-chat-title">Ask Around</h2><p>{events.length} visible opportunities · follows your filters</p></div><Button variant="ghost" size="sm" aria-label="Close event chat" onClick={()=>setOpen(false)}><ChevronDown/></Button></header><p className="chat-scope">Answers use the cards you can see, including their catches and source dates. Chat does not check live seats or book anything.</p>
 {available===false&&<p className="chat-notice" role="status">AI chat is not connected yet. AI setup must be completed before questions can be answered.</p>}
 {!events.length&&<p className="chat-notice">No visible cards. Clear a filter or refresh opportunities to give the assistant context.</p>}
 <div className="chat-messages" role="log" aria-label="Event conversation" aria-live="polite">{messages.length===0&&<p>Ask about costs, dates, beginner suitability or differences between events.</p>}{messages.map((m,i)=><div className={'chat-message '+m.role} key={i}><strong>{m.role==='user'?'You':'Around'}</strong><p>{m.content}</p>{m.snapshot!==signature&&<small>Earlier feed context · details may have changed</small>}{m.sources?.map(s=><a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a>)}</div>)}{busy&&<p role="status">Reading your current cards…</p>}<div ref={end}/></div>
 {error&&<p role="alert" className="chat-notice">{error}</p>}<div className="chat-suggestions">{['Which events let me sing?','What is beginner-friendly?','Compare the costs and catches.'].map(q=><button key={q} disabled={!available||busy||refreshing||!events.length} onClick={()=>void ask(q)}>{q}</button>)}</div>
 <form onSubmit={e=>{e.preventDefault();void ask();}}><label htmlFor="event-question">Your question</label><textarea id="event-question" rows={2} maxLength={2000} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about a card by name…" disabled={!available||!events.length}/><div><small>Messages are sent to OpenAI when you ask. History lasts for this page visit.</small><Button type="submit" disabled={!available||busy||refreshing||!events.length||!question.trim()}><Send size={16}/>Send</Button></div></form><Button variant="ghost" size="sm" disabled={busy||!messages.length} onClick={()=>{setMessages([]);setError('');}}>Clear conversation</Button></section>}</div>;
}
