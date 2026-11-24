function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
async function ensure(env){
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS store_settings (id TEXT PRIMARY KEY, value TEXT NOT NULL)").run();
  await env.DB.prepare("INSERT OR IGNORE INTO store_settings (id,value) VALUES ('ordering_enabled','true'),('closed_message','We are temporarily not accepting online orders. Please visit again later.')").run();
}
async function authorized(request,env){
  const cookie=request.headers.get("Cookie")||"";
  const token=cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("mh_admin="))?.slice(9);
  if(!token)return false;
  const [payload,sig]=token.split(".");
  if(!payload||!sig)return false;
  try{
    const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
    const bytes=Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
    if(!await crypto.subtle.verify("HMAC",key,bytes,new TextEncoder().encode(payload)))return false;
    return JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/"))).exp>Date.now();
  }catch{return false}
}
function sameOrigin(request){const origin=request.headers.get("Origin");return !origin||origin===new URL(request.url).origin}
export async function onRequest({request,env}){
  try{
    await ensure(env);
    if(request.method==="GET"){
      const {results}=await env.DB.prepare("SELECT id,value FROM store_settings WHERE id IN ('ordering_enabled','closed_message')").all();
      const settings=Object.fromEntries((results||[]).map(x=>[x.id,x.value]));
      return json({orderingEnabled:settings.ordering_enabled!=="false",closedMessage:settings.closed_message||"We are temporarily not accepting online orders. Please visit again later."});
    }
    if(request.method!=="POST")return json({error:"Method not allowed."},405);
    if(!sameOrigin(request))return json({error:"Invalid request origin."},403);
    if(!await authorized(request,env))return json({error:"Please sign in again."},401);
    const p=await request.json();
    const enabled=!!p.orderingEnabled;
    const message=String(p.closedMessage||"We are temporarily not accepting online orders. Please visit again later.").trim().slice(0,180);
    await env.DB.prepare("INSERT INTO store_settings (id,value) VALUES ('ordering_enabled',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(String(enabled)).run();
    await env.DB.prepare("INSERT INTO store_settings (id,value) VALUES ('closed_message',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").bind(message||"We are temporarily not accepting online orders. Please visit again later.").run();
    return json({ok:true,orderingEnabled:enabled,closedMessage:message});
  }catch{return json({error:"Server error. Check the Cloudflare D1 setup."},500)}
}
