function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}})}
async function ensureDatabase(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price > 0),
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`).run();
  await env.DB.prepare("INSERT OR IGNORE INTO products (id,name,price,description,image,sort_order) VALUES ('boiled-egg','Boiled Egg (1pc)',15,'A simple, satisfying favourite.','',1),('plain-maggi','Plain Maggi',30,'Warm and comforting Maggi.','',2),('egg-maggi','Egg Maggi',40,'Maggi prepared with egg.','',3)").run();
}
async function authorized(request,env){const cookie=request.headers.get("Cookie")||"";const token=cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith("mh_admin="))?.slice(9);if(!token)return false;const [payload,sig]=token.split(".");if(!payload||!sig)return false;try{const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["verify"]);const bytes=Uint8Array.from(atob(sig.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));const valid=await crypto.subtle.verify("HMAC",key,bytes,new TextEncoder().encode(payload));if(!valid)return false;const data=JSON.parse(atob(payload.replace(/-/g,"+").replace(/_/g,"/")));return data.exp>Date.now()}catch{return false}}
function sameOrigin(request){const origin=request.headers.get("Origin");return !origin||origin===new URL(request.url).origin}
export async function onRequest(context){const{request,env}=context;try{await ensureDatabase(env);if(request.method==="GET"){const{results}=await env.DB.prepare("SELECT id,name,price,description,image FROM products ORDER BY sort_order, name").all();return json(results)}if(!sameOrigin(request))return json({error:"Invalid request origin."},403);if(!await authorized(request,env))return json({error:"Please sign in again."},401);
if(request.method==="POST"){const p=await request.json();const name=String(p.name||"").trim(),price=Number(p.price),description=String(p.description||"").trim(),image=String(p.image||"").trim();if(!name||name.length>80||!Number.isInteger(price)||price<1||price>100000||description.length>180||image.length>500)return json({error:"Please check the product details."},400);if(image&&!/^https:\/\/.+/i.test(image))return json({error:"Photo URL must start with https://"},400);if(p.id){await env.DB.prepare("UPDATE products SET name=?,price=?,description=?,image=? WHERE id=?").bind(name,price,description,image,String(p.id)).run();return json({ok:true,id:p.id})}const id=crypto.randomUUID();await env.DB.prepare("INSERT INTO products (id,name,price,description,image,sort_order) VALUES (?,?,?,?,?,0)").bind(id,name,price,description,image).run();return json({ok:true,id})}
if(request.method==="DELETE"){const p=await request.json();if(!p.id)return json({error:"Missing product ID."},400);await env.DB.prepare("DELETE FROM products WHERE id=?").bind(String(p.id)).run();return json({ok:true})}return json({error:"Method not allowed."},405)}catch(e){return json({error:"Server error. Check the Cloudflare D1 setup."},500)}}
