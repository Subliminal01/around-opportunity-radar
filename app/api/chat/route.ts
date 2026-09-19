import {getChatGPTUser} from '@/app/chatgpt-auth';
import {chatRequest,buildChatBody,parseChatAnswer} from '@/lib/event-chat';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const pending=new Set<string>();
const recent=new Map<string,number>();
export async function GET(){return reply({available:!!process.env.OPENAI_API_KEY});}
export async function POST(request:Request){
 if(request.headers.get('sec-fetch-site')==='cross-site')return reply({error:'Open chat from your Around page.'},403);
 const user=await getChatGPTUser();if(!user)return reply({error:'Sign in to your site to use the event assistant.'},401);
 if(!process.env.OPENAI_API_KEY)return reply({error:'AI chat is not connected yet. The site owner needs to finish AI setup.'},503);
 let input;
 try{const raw=await request.text();if(raw.length>300000)return reply({error:'Too much chat context. Clear the conversation or narrow the feed.'},413);input=chatRequest.parse(JSON.parse(raw));}catch{return reply({error:'The message or feed could not be read. Refresh the page and try again.'},400);}
 if(input.messages.at(-1)?.role!=='user')return reply({error:'Please enter a question.'},400);
 if(!input.events.length)return reply({error:'There are no visible opportunities to ask about. Clear a filter or refresh the feed.'},400);
 if(Date.parse(input.checkedAt)>Date.now()+60000||Date.now()-Date.parse(input.checkedAt)>86400000)return reply({error:'Refresh your opportunities first; this feed snapshot is over a day old.'},409);
 if(pending.has(user.userId)||Date.now()-(recent.get(user.userId)||0)<3000)return reply({error:'Please wait for the current reply before asking again.'},429);
 pending.add(user.userId);recent.set(user.userId,Date.now());
 for(const [id,t] of recent)if(Date.now()-t>60000)recent.delete(id);
 try{
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(buildChatBody(input,process.env.OPENAI_CHAT_MODEL||'gpt-5.4-mini')),signal:AbortSignal.timeout(45000)});
  if(!r.ok)return reply({error:r.status===429?'The AI service is temporarily at its limit. Please try again later.':'The AI service could not answer. Your feed is still available.'},502);
  return reply(parseChatAnswer(await r.json(),input));
 }catch{return reply({error:'A reliable answer could not be completed. Please try again; no event details have been changed.'},502);}
 finally{pending.delete(user.userId);}
}
