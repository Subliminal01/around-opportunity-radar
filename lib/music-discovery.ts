import type {Opportunity,SourceStatus} from './opportunities';
const URL='https://www.thepianoman.in/';
const clean=(s:string)=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#0?39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
export function upcomingMusic(html:string,now=Date.now()){
 return html.split('class="card card-1"').slice(1).flatMap(block=>{
  const title=block.match(/class="cs-title">([\s\S]*?)<\/div>/)?.[1],date=block.match(/class="cs-venue-date[^>]*>([\s\S]*?)<\/div>/)?.[1]?.match(/(\d{2})\.(\d{2})\.(\d{2})/),time=block.match(/SEATING TIME\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i),url=block.match(/href="(https:\/\/www\.thepianoman\.in\/event\/detail\/[^"<>]+)"/)?.[1],venue=block.match(/alt="(The Piano Man[^"]+)"/)?.[1];
  if(!title||!date||!time||!url||!venue||!/Safdarjung|Saket|Gurugram/i.test(venue)||/closed|cancelled/i.test(clean(title)))return [];
  const hour=(Number(time[1])%12)+(time[3].toUpperCase()==='PM'?12:0);
  const start=Date.parse(`20${date[3]}-${date[2]}-${date[1]}T${String(hour).padStart(2,'0')}:${time[2]}:00+05:30`);
  if(!Number.isFinite(start)||start<=now||start>now+60*86400000)return [];
  return [{title:clean(title),url,venue:clean(venue),start,label:`${date[1]}/${date[2]} · ${time[1]}:${time[2]} ${time[3]} IST`}];
 }).filter((c,i,a)=>a.findIndex(x=>x.url===c.url)===i).sort((a,b)=>a.start-b.start);
}
export async function discoverMusic():Promise<{items:Opportunity[];status:SourceStatus}>{
 const checkedAt=new Date().toISOString(),base={name:'The Piano Man · live calendar',url:URL,checkedAt};
 try{
  const r=await fetch(URL,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();
  const html=await r.text();if(html.length>3000000)throw Error();const shows=upcomingMusic(html).filter(s=>[0,6].includes(new Date(s.start+330*60000).getUTCDay()));if(!shows.length)throw Error();
  const items:Opportunity[]=shows.map(s=>({
   id:'pianoman-'+s.url.split('/').filter(Boolean).pop(),category:'events',experienceType:'dated',weekend:'yes',title:s.title,organisation:'The Piano Man',kind:'Watch & attend · live music',
   location:s.venue+' · Delhi NCR',value:'Ticket prices and food charges: check this show',
   why:'A dated live-music performance in Delhi NCR, matched to your music and concert interests.',
   fit:'An audience booking, not an open-mic performer slot. Check the artist, venue and ticket terms before deciding.',fitLabel:'Matches music & concerts',
   commitment:'Seating: '+s.label,deadline:new Date(s.start).toISOString(),deadlineLabel:s.label,
   uncertainties:'Calendar listing does not guarantee seats. Ticket price, taxes, food minimums, age rules and cancellation terms are unverified. Seating time may differ from show start.',
   rank:96,url:s.url,evidence:[{label:'Organizer show details',url:s.url},{label:'Live organizer calendar',url:URL}],checkedAt,reviewedAt:checkedAt.slice(0,10),verification:'official'
  }));
  return {items,status:{...base,ok:true,count:items.length,note:items.length+' distinct upcoming performances found on the organizer calendar. Ticket inventory and prices are not verified.'}};
 }catch{return {items:[],status:{...base,ok:false,count:0,checkedAt:null,note:'No upcoming calendar details confirmed. No old dates are presented as current.'}};}
}
