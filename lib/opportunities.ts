export type Evidence={label:string;url:string};
export type Opportunity={id:string;title:string;organisation:string;kind:string;category?:Category;location:string;value:string;why:string;fit:string;uncertainties:string;commitment:string;deadline:string|null;deadlineLabel:string;fitLabel:string;rank:number;url:string;evidence:Evidence[];checkedAt:string;reviewedAt:string;verification:'official'|'listing'|'reviewed';publishedAt?:string};
export type SourceStatus={name:string;url:string;ok:boolean;count:number;checkedAt:string|null;note:string};
export type Feed={checkedAt:string;opportunities:Opportunity[];sources:SourceStatus[];travel:{connected:boolean;qualifiedCount:number;note:string}};
export type TripQuote={currency:string;departureAirport:string;destination:string;start:string;end:string;travellers:number;flightClass:string;hotelStandard:string;components:{flights:number;stay:number;visa:number;baggage:number;transfers:number;fees:number};sourceUrl:string;checkedAt:string};
export function qualifiesHalfPrice(deal:TripQuote,usual:TripQuote,now=Date.now()){
 const fields=['currency','departureAirport','destination','start','end','travellers','flightClass','hotelStandard'] as const;
 if(fields.some(k=>deal[k]!==usual[k]))return false;
 if(![deal,usual].every(q=>/^https:\/\//.test(q.sourceUrl)&&Number.isFinite(Date.parse(q.checkedAt))&&now-Date.parse(q.checkedAt)<=86400000&&now>=Date.parse(q.checkedAt)&&Object.values(q.components).every(n=>Number.isFinite(n)&&n>=0)))return false;
 const sum=(q:TripQuote)=>Object.values(q.components).reduce((a,b)=>a+b,0);
 return sum(usual)>0&&sum(deal)<=sum(usual)*0.5;
}
export function eligibleNow(o:Opportunity,now=Date.now()){if(o.verification==='reviewed'&&now-Date.parse(o.reviewedAt+'T00:00:00Z')>14*86400000)return false;return !o.deadline||Date.parse(o.deadline)>now;}
export const categories=[
 {id:'world',label:'World experiences',title:'Experiences worth travelling for',description:'Unusual participatory experiences. Published activity fees are separate from the full trip cost; these are not verified half-price holidays.',empty:'No world experience cleared the source checks.'},
 {id:'access',label:'Travel access',title:'Travel doors open to an Indian passport',description:'Visa concessions and easier entry, with the paperwork still required. An entry concession is not permission to work or a trip discount.',empty:'No travel concession cleared the source checks.'},
 {id:'abroad',label:'Live abroad',title:'A different place to live for a while',description:'Conditional residence and remote-work routes. These require your own qualifying income and documents; they are not job offers.',empty:'No living-abroad route cleared the source checks.'},
 {id:'events',label:'Experiences',title:'Things you can be part of',description:'Participatory experiences and cultural encounters in Delhi NCR and beyond.',empty:'No current experience cleared the checks.'},
 {id:'challenges',label:'Build & contribute',title:'Build, collaborate and contribute',description:'Hands-on challenges and opportunities to develop ideas with other people.',empty:'No current challenge cleared the checks.'},
 {id:'creative',label:'Creative & prizes',title:'A different use for your creativity',description:'Photography, design, film and original ideas with a concrete reward or audience.',empty:'No current creative opportunity cleared the checks.'},
 {id:'quick',label:'Quick chances',title:'Small time commitment, a chance at a reward',description:'Short prize challenges. Awards are competitive or drawn from qualifying entries, never guaranteed income.',empty:'No short prize challenge cleared the checks.'},
 {id:'grants',label:'Ideas & grants',title:'Support for an idea of your own',description:'Small project grants with a feasible entry route. A concrete proposal and delivery commitment are still required.',empty:'No current grant matches the checks.'},
 {id:'education',label:'Education',title:'Analytics master’s & funding',description:'MS or MBA routes with an analytics connection and a clear funding advantage. Admission and career ROI still need assessment.',empty:'No analytics master’s funding opportunity cleared the checks.'},
 {id:'jobs',label:'Jobs & remote',title:'Jobs worth a move',description:'High-paying remote work accessible from India, or overseas roles with explicit visa sponsorship.',empty:'No current work opportunity passed the checks. We will not substitute ordinary listings.'},
 {id:'vacations',label:'Vacations',title:'Exceptional vacations',description:'At least 50% less than the documented usual total cost of the same trip from Delhi.',empty:'Live flight and hotel pricing are not connected yet. No trip is claimed to meet your half-price rule. Travel prizes appear under Creative & prizes.'}
] as const;
export type Category=(typeof categories)[number]['id'];
export function categoryOf(o:Pick<Opportunity,'kind'|'category'>):Category{if(o.category)return o.category;if(/study|education|fellowship/i.test(o.kind))return 'education';if(/\bwork\b|job|remote/i.test(o.kind))return 'jobs';if(/vacation|holiday|travel deal/i.test(o.kind))return 'vacations';return 'events';}
export function variedFeed(items:Opportunity[]){const pools=new Map<Category,Opportunity[]>();for(const o of [...items].sort((a,b)=>b.rank-a.rank)){const c=categoryOf(o);pools.set(c,[...(pools.get(c)||[]),o]);}const result:Opportunity[]=[];while([...pools.values()].some(p=>p.length)){for(const p of pools.values()){const next=p.shift();if(next)result.push(next);}}return result;}
