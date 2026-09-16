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
export async function discoverMusic():Promise<{item:Opportunity|null;status:SourceStatus}>{
 const checkedAt=new Date().toISOString(),base={name:'The Piano Man · live calendar',url:URL,checkedAt};
 try{const r=await fetch(URL,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();const html=await r.text();if(html.length>3000000)throw Error();const shows=upcomingMusic(html).slice(0,5);if(!shows.length)throw Error();
 return {status:{...base,ok:true,count:1,note:`${shows.length} upcoming performances grouped in one calendar card. New dates are discovered on refresh; ticket inventory and prices are not verified.`},item:{id:'pianoman-upcoming',category:'events',title:'Find your next intimate live-music evening',organisation:'The Piano Man',kind:'Watch & attend · live music calendar',location:'Safdarjung / Saket / Gurugram · Delhi NCR',value:'Ticket prices and food charges: check each show',why:'A live organizer calendar matched to your music and concert interests. New performances can appear when you refresh.',fit:'These are audience bookings, not open-mic performer slots. Choose an artist and venue from the upcoming dates below.',fitLabel:'Matches music & concerts',commitment:shows.map(s=>s.title+' · '+s.label).join(' | '),deadline:new Date(shows[0].start).toISOString(),deadlineLabel:'Next seating: '+shows[0].label+' · refresh for later dates',uncertainties:'Listings do not guarantee seats. Check ticket price, taxes, food minimums, age rules and cancellation terms before paying. Seating time may differ from show start.',rank:96,url:URL,evidence:shows.map(s=>({label:s.title+' · '+s.venue+' · '+s.label,url:s.url})),checkedAt,reviewedAt:checkedAt.slice(0,10),verification:'official'}};
 }catch{return {item:null,status:{...base,ok:false,count:0,checkedAt:null,note:'No upcoming calendar details confirmed. No old dates are presented as current.'}};}
}
