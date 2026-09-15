export type CardPreferences={favourites:string[];removed:Record<string,string>};
export const preferencesKey='around.card-preferences.v1';
export const emptyPreferences=():CardPreferences=>({favourites:[],removed:{}});
export function readPreferences(raw:string|null):CardPreferences{
 try{const d=JSON.parse(raw||'null');if(!d||!Array.isArray(d.favourites)||typeof d.removed!=='object'||!d.removed)return emptyPreferences();
 return {favourites:[...new Set<string>(d.favourites.filter((id:unknown)=>typeof id==='string'))],removed:Object.fromEntries(Object.entries(d.removed).filter(([id,title])=>id.length<200&&typeof title==='string')) as Record<string,string>};
 }catch{return emptyPreferences();}
}
export function toggleFavourite(p:CardPreferences,id:string):CardPreferences{return {...p,favourites:p.favourites.includes(id)?p.favourites.filter(x=>x!==id):[...p.favourites,id]};}
export function removeCard(p:CardPreferences,id:string,title:string):CardPreferences{return {favourites:p.favourites.filter(x=>x!==id),removed:{...p.removed,[id]:title}};}
export function restoreCard(p:CardPreferences,id:string):CardPreferences{return {...p,removed:Object.fromEntries(Object.entries(p.removed).filter(([key])=>key!==id))};}
