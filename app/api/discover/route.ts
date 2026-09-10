import {discover} from '@/lib/opportunity-sources';
export const dynamic='force-dynamic';
export async function GET(){return Response.json(await discover(),{headers:{'Cache-Control':'no-store'}});}
