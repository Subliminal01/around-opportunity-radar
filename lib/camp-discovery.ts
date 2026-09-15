import type {Opportunity,SourceStatus} from './opportunities';
const INDEX='https://www.seeds.is/workcamps';
const clean=(s:string)=>s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;|&#160;/g,' ').replace(/&#0?39;/g,"'").replace(/\s+/g,' ').trim();
export function upcomingCamps(html:string,now=Date.now()){
 const date=(s:string)=>{const [d,m,y]=s.split('.').map(Number);const n=Date.UTC(y,m-1,d);return new Date(n).toISOString().slice(0,10)===`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`?n:NaN;};
 const found=[...html.matchAll(/<a\b[^>]*href="(https:\/\/www\.seeds\.is\/volunteer-workcamps-iceland\/\d+)"[^>]*>([\s\S]*?)<\/a>/g)].flatMap(m=>{
  const dates=m[2].match(/(\d{2}\.\d{2}\.\d{4})\s*\|\s*(\d{2}\.\d{2}\.\d{4})/),title=m[2].match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i);
  if(!dates||!title||/fully booked|cancelled/i.test(clean(m[2])))return [];
  const start=date(dates[1]),end=date(dates[2]);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start||start<now+21*86400000||start>now+183*86400000||!/Environment.*Photography/i.test(clean(title[1])))return [];
  return [{url:m[1],title:clean(title[1]),start,end,label:dates[1]+' – '+dates[2]}];
 });
 return [...new Map(found.map(c=>[c.url,c])).values()].sort((a,b)=>a.start-b.start);
}
async function page(url:string){const r=await fetch(url,{signal:AbortSignal.timeout(10000),headers:{'User-Agent':'AroundOpportunityReader/2.0'}});if(!r.ok)throw Error('Calendar unavailable');const t=await r.text();if(t.length>3000000)throw Error('Calendar too large');return t;}
export async function discoverCamps():Promise<{item:Opportunity|null;status:SourceStatus}>{
 const checkedAt=new Date().toISOString();
 const base={name:'SEEDS Iceland · live camp calendar',url:INDEX,checkedAt};
 try{
  const camps=upcomingCamps(await page(INDEX));
  // Repeated cohorts are one programme, not separate cards to inflate coverage.
  const details=await Promise.allSettled(camps.slice(0,3).map(async c=>{
   const text=clean(await page(c.url)),fee=text.match(/Participation fee[:\s]*(?:EUR\s*)?(\d+)\s*(?:Euro|\(Euros\))/i);
   if(!fee||!/Age:\s*18\+/.test(text)||!/shared rooms/i.test(text)||!/food supplies/i.test(text)||/fully booked|cancelled/i.test(text)||!text.includes(c.label.split(' – ')[0]))return null;
   return {...c,fee:Number(fee[1])};
  }));
  const verified=details.flatMap(d=>d.status==='fulfilled'&&d.value?[d.value]:[]);
  if(!verified.length)return {item:null,status:{...base,ok:false,count:0,note:'No upcoming cohort with fees and participation details confirmed. Calendar options need at least 21 days of planning time; visa processing may require longer.'}};
  const first=verified[0];
  return {item:{id:'seeds-iceland-camps',category:'world',kind:'Live-discovered cultural camp',title:'Join a photography and environment camp in Iceland',organisation:'SEEDS Iceland',location:'Reykjavík · Iceland',value:`Next checked camp: €${first.fee} participation fee · shared stay and food supplies`,why:'Learn with an international group, take photographs and explore environmental topics. Future cohorts are discovered from the organizer’s calendar when you refresh.',fitLabel:'Age fits · application and visa required',fit:'Open to adults 18+ interested in photography and environmental learning. English conversation, outdoor walking and shared cooking are part of participation.',uncertainties:'A paid learning camp, not a salary, research placement or free holiday. Flights, visa, airport transfers and optional excursions cost extra. Confirm acceptance and the correct visa for the activities before paying. Northern lights are not guaranteed. Listed dates do not guarantee remaining places.',commitment:verified.map(c=>c.label+` (€${c.fee})`).join(' · '),deadline:null,deadlineLabel:'Upcoming cohorts · apply to organizer; no published closing date',rank:98,url:first.url,evidence:verified.map(c=>({label:c.label+` · €${c.fee}`,url:c.url})),checkedAt,reviewedAt:checkedAt.slice(0,10),verification:'official'},status:{...base,ok:true,count:1,note:`${camps.length} future cohorts found; ${verified.length} detail pages confirmed. Similar cohorts grouped into one programme. At least 21 days allowed for planning, not a visa-processing guarantee.`}};
 }catch{return {item:null,status:{...base,checkedAt:null,ok:false,count:0,note:'Live camp calendar unavailable. No dates invented or reused as current.'}};}
}
