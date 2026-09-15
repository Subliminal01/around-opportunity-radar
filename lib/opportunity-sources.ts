import type {Feed,Opportunity,SourceStatus} from './opportunities';
import {eligibleNow} from './opportunities';
import {reviewed} from './reviewed-opportunities';
import {expanded} from './expanded-opportunities';
import {world} from './world-opportunities';
import {discoverCamps} from './camp-discovery';
const collection=[...reviewed,...expanded,...world];
export function plain(html:string){return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&#0?39;|&apos;|&#8217;/g,"'").replace(/&quot;/g,'"').replace(/&#8211;|&ndash;/g,'–').replace(/&#8212;|&mdash;/g,'—').replace(/&#36;/g,'$').replace(/\s+/g,' ').trim();}
async function textPage(url:string){const r=await fetch(url,{cache:'no-store',headers:{Accept:'text/html','User-Agent':'AroundOpportunityReader/2.0'},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('Source unavailable');const t=await r.text();if(t.length>3000000)throw Error('Source too large');const body=plain(t);if(/Request unsuccessful.*Incapsula|Just a moment|Access Denied|verify you are human/i.test(body))throw Error('Automated access blocked');return body;}
export function matchesEvidence(text:string,patterns:RegExp[]){return !/this (?:job|position) (?:is no longer|has been filled)|no longer accepting applications|applications (?:are now|have) closed/i.test(text)&&patterns.every(p=>p.test(text));}
export type RemoteJob={id:number;title:string;company_name:string;candidate_required_location:string;salary:string;description:string;publication_date:string;url:string;tags?:string[]};
export function matchRemote(j:RemoteJob,checkedAt:string):Opportunity|null{
 const region=j.candidate_required_location||'';
 if(!/\bindia\b|^worldwide$|^anywhere(?: in the world)?$/i.test(region))return null;
 const text=plain(j.description||'');
 if(/\b(?:US|USA|United States|Canada|UK|United Kingdom|Europe|European Union) (?:only|residents only)|must (?:be based|reside|live) in (?:the )?(?:US|USA|United States|Canada|UK|United Kingdom|Europe)/i.test(text))return null;
 if(!/engineer|analyst|developer|quality assurance|\bQA\b|\bSDET\b|automation|data scientist|AI evaluator|LLM evaluat/i.test(j.title))return null;
 const skills=[['Python',/\bpython\b/i],['SQL',/\bsql\b/i],['Power BI',/\bpower\s?bi\b/i],['Playwright',/\bplaywright\b/i],['Test automation',/test automation|automation testing|automated test/i],['Analytics',/\bdata analys(?:is|t)|\banalytics\b|business intelligence/i],['Prompt engineering',/prompt engineering|prompt engineer|prompt design|prompt evaluation/i],['Excel',/\bexcel\b/i]].filter(([,r])=>(r as RegExp).test(text+' '+j.title)).map(([s])=>s as string);
 if(!skills.length)return null;
 const pay=j.salary||'';
 if(!/\bUSD\b|US\$|\$/i.test(pay)||/CAD|AUD|NZD|SGD|HKD|hour|month|week/i.test(pay)||!/year|annual|annum|\/yr/i.test(pay))return null;
 const numbers=[...pay.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k)?/gi)].map(m=>Number(m[1].replaceAll(',',''))*(m[2]?1000:1));
 if(!numbers.length||Math.min(...numbers)<50000)return null;
 const published=Date.parse(j.publication_date);if(!Number.isFinite(published)||published>Date.now()||Date.now()-published>45*86400000)return null;
 if(!/^https:\/\/remotive\.com\//.test(j.url))return null;
 return {id:'remotive-'+j.id,title:j.title,organisation:j.company_name,kind:'High-paying remote lead',location:region,value:pay,why:'A published annual salary floor of at least US$50,000 and a remote region that includes India.',fit:`Your ${skills.join(', ')} skills appear in this listing. Employer requirements and seniority still need review.`,uncertainties:'Third-party listing, not an employer verification. Confirm India hiring, employment terms, working hours and salary with the employer. Remotive data is delayed by 24 hours.',commitment:'See employer for hours and contract',deadline:null,deadlineLabel:'No closing date provided · check listing',fitLabel:'Skill overlap · employer eligibility unconfirmed',rank:85+Math.min(skills.length,4)+(/test|quality assurance|\bQA\b|\bSDET\b/i.test(j.title)?6:/analyst|analytics/i.test(j.title)?4:/prompt/i.test(j.title)?3:0),url:j.url,evidence:[{label:'Listing on Remotive',url:j.url}],checkedAt,reviewedAt:checkedAt.slice(0,10),verification:'listing',publishedAt:j.publication_date};
}
const REMOTIVE='https://remotive.com/api/remote-jobs';
let memory:{time:number;feed:RemoteJob[]}|undefined;
async function remoteData(){
 const now=Date.now();if(memory&&now-memory.time<21600000)return {jobs:memory.feed,checkedAt:new Date(memory.time).toISOString(),cached:true};
 const storage=(globalThis as unknown as {caches?:{default:Cache}}).caches?.default;
 const key=new Request(REMOTIVE);
 if(storage){try{const found=await storage.match(key);if(found){const d=await found.json() as {time:number;feed:RemoteJob[]};memory=d;return {jobs:d.feed,checkedAt:new Date(d.time).toISOString(),cached:true};}}catch{}}
 const r=await fetch(REMOTIVE,{signal:AbortSignal.timeout(15000),headers:{Accept:'application/json'}});if(!r.ok)throw Error('Feed unavailable');const data=await r.json() as {jobs:RemoteJob[]};if(!Array.isArray(data.jobs))throw Error('Feed changed');memory={time:now,feed:data.jobs};
 if(storage){try{await storage.put(key,new Response(JSON.stringify(memory),{headers:{'Cache-Control':'public,max-age=21600','Content-Type':'application/json'}}));}catch{}}
 return {jobs:data.jobs,checkedAt:new Date(now).toISOString(),cached:false};
}
export async function discover():Promise<Feed>{
 const campCheck=discoverCamps();
 const now=new Date().toISOString();const requests=new Map<string,Promise<string>>();
 const get=(url:string)=>{if(!requests.has(url))requests.set(url,textPage(url));return requests.get(url)!;};
 const checked=await Promise.allSettled(collection.map(async item=>{
  if(!eligibleNow({...item,checkedAt:now,verification:'official'}))return {item:null,status:{name:item.organisation,url:item.url,ok:true,count:0,checkedAt:now,note:'Application deadline has passed.'} satisfies SourceStatus};
  let facts:boolean[];
  try {
   const results=await Promise.allSettled(item.checks.map(async c=>matchesEvidence(await get(c.url),c.patterns)));
   // A confirmed contradiction takes precedence over another source being offline.
   if(results.some(r=>r.status==='fulfilled'&&!r.value))facts=[false];
   else if(results.some(r=>r.status==='rejected'))throw Error('Source unavailable');
   else facts=[true];
  }
  catch(error){
   const reviewedTime=Date.parse(item.reviewedAt+'T00:00:00Z');
   if(!item.allowReviewedFallback||Date.now()-reviewedTime>14*86400000||Date.now()<reviewedTime)throw error;
   const {checks,allowReviewedFallback,...opportunity}=item;
   return {item:{...opportunity,checkedAt:new Date(reviewedTime).toISOString(),verification:'reviewed' as const},status:{name:item.organisation,url:item.url,ok:false,count:1,checkedAt:null,note:`Automated source unavailable. Showing the ${item.reviewedAt} editorial review, valid for at most 14 days; current availability must be checked with the organizer.`} satisfies SourceStatus};
  }
  if(!facts.every(Boolean))return {item:null,status:{name:item.organisation,url:item.url,ok:false,count:0,checkedAt:now,note:'Key details changed or could not be confirmed. Lead withheld.'} satisfies SourceStatus};
  const {checks,allowReviewedFallback,...opportunity}=item;return {item:{...opportunity,checkedAt:now,verification:'official' as const},status:{name:item.organisation,url:item.url,ok:true,count:1,checkedAt:now,note:'Key facts rechecked on the organizer source.'} satisfies SourceStatus};
 }));
 const opportunities:Opportunity[]=[],sources:SourceStatus[]=[];
 checked.forEach((r,i)=>{if(r.status==='fulfilled'){if(r.value.item)opportunities.push(r.value.item);sources.push(r.value.status);}else sources.push({name:collection[i].organisation,url:collection[i].url,ok:false,count:0,checkedAt:null,note:'Source unavailable. Lead withheld.'});});
 try{const d=await remoteData();const matches=d.jobs.map(j=>matchRemote(j,d.checkedAt)).filter((o):o is Opportunity=>!!o);opportunities.push(...matches);sources.push({name:'Remotive',url:'https://remotive.com/',ok:true,count:matches.length,checkedAt:d.checkedAt,note:`${d.jobs.length} listings screened. Feed reused for up to 6 hours; publisher data is delayed 24 hours.`});}catch{sources.push({name:'Remotive',url:'https://remotive.com/',ok:false,count:0,checkedAt:null,note:'Job feed unavailable.'});}
 const camp=await campCheck;if(camp.item)opportunities.push(camp.item);sources.push(camp.status);
 const unique=[...new Map(opportunities.map(o=>[(o.organisation+' '+o.title).toLowerCase(),o])).values()].sort((a,b)=>b.rank-a.rank);
 return {checkedAt:now,opportunities:unique,sources,travel:{connected:false,qualifiedCount:0,note:'Live airfare and hotel pricing are not connected. No holiday is claimed to meet your 50% saving rule.'}};
}
