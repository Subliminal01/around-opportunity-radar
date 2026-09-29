import type {Opportunity} from './opportunities';
export const interests=['Runs & fitness','Volunteering','Making & crafts','Open mics','Acting & theatre','Singing','Music & concerts','Books','Chess','Cricket','Table tennis','Trekking & hiking','Travel','Food','Social connections'] as const;
export type Interest=typeof interests[number];
const rules:Record<Interest,RegExp>={
 'Runs & fitness':/run|5k|10k|climb|boulder|cycling/i,Volunteering:/volunteer|goonj|robin hood/i,'Making & crafts':/pottery|ceramic|workshop|cyanotype/i,
 'Open mics':/open.?mic/i,'Acting & theatre':/acting|theatre|theater|quijote|improv/i,Singing:/singing|vocal|karaoke|open.?mic/i,'Music & concerts':/music|concert|jazz|singing|sufi/i,Books:/books?|reading|djinns/i,Chess:/chess/i,Cricket:/cricket/i,'Table tennis':/table tennis/i,'Trekking & hiking':/trek|hiking|hike|forest|nature walk/i,Travel:/travel|trip|vacation/i,Food:/food|culinary|cooking|picnic|buffet|cake|dining/i,'Social connections':/social|community|meetup|workshop|book.club|open.?mic|chess|group/i
};
export function interestsFor(o:Pick<Opportunity,'title'|'kind'|'why'|'id'>):Interest[]{
 const text=[o.title,o.kind,o.why].join(' ');return interests.filter(i=>rules[i].test(text));
}
export const communitySources=[
 {name:'PlayAll player communities',interests:['Cricket','Table tennis','Social connections'],url:'https://www.playall.in/',note:'Find a group by sport, skill level and city. Match dates, fees and available players need confirmation; this is not a booked game.'},
 {name:'Playo · Delhi table tennis',interests:['Table tennis'],url:'https://playo.co/venues/delhi/sports/table_tennis',note:'Browse courts and current slots. A court booking does not guarantee a playing partner; confirm both.'},
 {name:'Lodhi Reads',interests:['Books','Social connections'],url:'https://www.instagram.com/lodhireads/',note:'Check the community’s latest post for its next reading session. Current date and meeting point are not verified in this app.'},
 {name:'Trail-it Hiking',interests:['Trekking & hiking','Travel','Social connections'],url:'https://trail-it-hiking.fripo.in/trail-it-hiking',note:'Find future local group hikes. Check the precise trail, fee, fitness requirements and weather plan before joining.'},
 {name:'Chess Coffee Connect',interests:['Chess','Social connections'],url:'https://srchessacademy.com/public/chess-coffee-connect',note:'Organizer calendar for NCR chess meetups and tournaments. Check the Open category, entry deadline and skill level.'}
];
