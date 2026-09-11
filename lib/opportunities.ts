export type Evidence={label:string;url:string};
export type Opportunity={id:string;title:string;organisation:string;kind:string;location:string;value:string;why:string;fit:string;uncertainties:string;commitment:string;deadline:string|null;deadlineLabel:string;fitLabel:string;rank:number;url:string;evidence:Evidence[];checkedAt:string;reviewedAt:string;verification:'official'|'listing';publishedAt?:string};
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
export function eligibleNow(o:Opportunity,now=Date.now()){return !o.deadline||Date.parse(o.deadline)>now;}
export const categories=[
 {id:'education',label:'Education',title:'Education & research',description:'Funded degrees, fellowships and research placements with a clear benefit.',empty:'Funded opportunities will appear here when the source facts and application window check out.'},
 {id:'jobs',label:'Jobs & remote',title:'Jobs & remote work',description:'Work with meaningful pay, flexibility or an unusual experience, matched to your skills.',empty:'No current work opportunity passed the checks. We will not substitute ordinary listings.'},
 {id:'vacations',label:'Vacations',title:'Exceptional vacations',description:'At least 50% less than the documented usual total cost of the same trip from Delhi.',empty:'Live flight and hotel pricing are not connected yet. No trip is claimed to meet your half-price rule. Funded study and research belong under Education.'},
 {id:'events',label:'Events & competitions',title:'Unique events & competitions',description:'Unusual hands-on experiences, selective gatherings and worthwhile challenges.',empty:'No verified unique event or competition is connected yet. Ordinary ticketed shows are not used as filler.'}
] as const;
export type Category=(typeof categories)[number]['id'];
export function categoryOf(o:Pick<Opportunity,'kind'>):Category{if(/research|study|education|fellowship/i.test(o.kind))return 'education';if(/work|job|remote/i.test(o.kind))return 'jobs';if(/vacation|holiday|travel deal/i.test(o.kind))return 'vacations';return 'events';}
