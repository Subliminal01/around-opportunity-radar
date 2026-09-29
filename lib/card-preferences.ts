import type {Opportunity} from './opportunities';
export type CardPreferences={favourites:string[];removed:Record<string,string>;saved?:Record<string,Opportunity>};
export const preferencesKey='around.card-preferences.v1';
export const emptyPreferences=():CardPreferences=>({favourites:[],removed:{},saved:{}});
function validCard(v:unknown):v is Opportunity{
 if(!v||typeof v!=='object')return false;const o=v as Opportunity;
 const fields=['id','title','organisation','kind','location','value','why','fit','uncertainties','commitment','deadlineLabel','fitLabel','url','checkedAt','reviewedAt'] as const;
 return fields.every(k=>typeof o[k]==='string')&&/^https:\/\//.test(o.url)&&Array.isArray(o.evidence)&&o.evidence.every(e=>e&&typeof e.label==='string'&&typeof e.url==='string'&&/^https:\/\//.test(e.url))&&typeof o.rank==='number'&&(o.deadline===null||typeof o.deadline==='string');
}
export function readPreferences(raw:string|null):CardPreferences{
 try{const d=JSON.parse(raw||'null');if(!d||!Array.isArray(d.favourites)||typeof d.removed!=='object'||!d.removed)return emptyPreferences();
 const favourites=[...new Set<string>(d.favourites.filter((id:unknown)=>typeof id==='string'))];
 return {favourites,removed:Object.fromEntries(Object.entries(d.removed).filter(([id,title])=>id.length<200&&typeof title==='string')) as Record<string,string>,saved:Object.fromEntries(Object.entries(d.saved||{}).filter(([id,v])=>favourites.includes(id)&&validCard(v)&&v.id===id)) as Record<string,Opportunity>};
 }catch{return emptyPreferences();}
}
export function toggleFavourite(p:CardPreferences,id:string,item?:Opportunity):CardPreferences{
 const exists=p.favourites.includes(id),saved={...p.saved};if(exists)delete saved[id];else if(item)saved[id]=item;
 return {...p,favourites:exists?p.favourites.filter(x=>x!==id):[...p.favourites,id],saved};
}
export function rememberSaved(p:CardPreferences,items:Opportunity[]):CardPreferences{
 const saved={...p.saved};for(const item of items)if(p.favourites.includes(item.id))saved[item.id]=item;return {...p,saved};
}
export function savedCards(p:CardPreferences,live:Opportunity[]):Opportunity[]{const map=new Map(Object.values(p.saved||{}).map(o=>[o.id,o]));for(const o of live)map.set(o.id,o);return p.favourites.flatMap(id=>map.has(id)?[map.get(id)!]:[]);}
export function removeCard(p:CardPreferences,id:string,title:string):CardPreferences{const saved={...p.saved};delete saved[id];return {...p,favourites:p.favourites.filter(x=>x!==id),removed:{...p.removed,[id]:title},saved};}
export function restoreCard(p:CardPreferences,id:string):CardPreferences{return {...p,removed:Object.fromEntries(Object.entries(p.removed).filter(([key])=>key!==id))};}
