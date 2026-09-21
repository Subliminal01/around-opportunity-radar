import type {Opportunity} from './opportunities';

export const batchSize=12;
function keys(o:Opportunity){
 const url=new URL(o.url);url.hash='';
 for(const key of [...url.searchParams.keys()])if(/^utm_|^fbclid$|^gclid$/i.test(key))url.searchParams.delete(key);
 return ['id:'+o.id,'url:'+url.toString(),'title:'+o.organisation.trim().toLowerCase()+':'+o.title.trim().toLowerCase()+':'+(o.deadline||'')];
}
export function rememberEvents(previous:string[],items:Opportunity[]){return [...new Set([...previous,...items.flatMap(keys)])];}
export function unseenEvents(items:Opportunity[],seen:string[]){
 const used=new Set(seen);
 return items.filter(o=>{const identity=keys(o);if(identity.some(k=>used.has(k)))return false;identity.forEach(k=>used.add(k));return true;});
}
