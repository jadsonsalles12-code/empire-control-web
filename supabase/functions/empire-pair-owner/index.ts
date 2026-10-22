import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SITE_ORIGIN = "https://jadsonsalles12-code.github.io";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const userAuth = createClient(SUPABASE_URL,ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const cors = { "Access-Control-Allow-Origin":SITE_ORIGIN,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Vary":"Origin" };
function json(body:object,status=200):Response{return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});}
const validId=(x:unknown):x is string=>typeof x==="string"&&/^[0-9a-fA-F-]{36}$/.test(x);
const safeLabel=(x:unknown)=>typeof x==="string"&&x.trim().length>0&&x.trim().length<=70?x.trim():"Computador Windows";
function token():string{
 const bytes=new Uint8Array(18);crypto.getRandomValues(bytes);
 return "EC-"+btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}
async function hexDigest(input:string):Promise<string>{
 const bytes=new TextEncoder().encode(input);
 return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async req=>{
 const origin=req.headers.get("Origin");
 if(origin&&origin!==SITE_ORIGIN)return json({error:"Origem não permitida"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return json({error:"Método não permitido"},405);
 const tokenHeader=req.headers.get("Authorization")||"";
 const match=/^Bearer (.+)$/i.exec(tokenHeader);
 if(!match)return json({error:"Faça login no Empire Control"},401);
 const {data:verified,error:authError}=await userAuth.auth.getUser(match[1]);
 if(authError||!verified.user||verified.user.is_anonymous)return json({error:"Sessão inválida"},401);
 const user=verified.user;
 let body:any;
 try{
   const raw=await req.text();
   if(raw.length>4096) return json({error:"Requisição muito grande"},413);
   body=JSON.parse(raw);
 }catch{return json({error:"JSON inválido"},400);}
 if(!body||body.v!==1)return json({error:"Versão não suportada"},400);
 try{
   if(body.action==="create"){
      // One active code per user; new requests invalidate prior codes.
      const {error:clearErr}=await admin.from("engine_pairing_requests")
         .delete().eq("owner_id",user.id).is("consumed_at",null);
      if(clearErr)throw clearErr;
      const code=token();
      const expiresAt=new Date(Date.now()+10*60*1000).toISOString();
      const {error:insertErr}=await admin.from("engine_pairing_requests").insert({
         owner_id:user.id,code_hash:await hexDigest(code),expires_at:expiresAt
      });
      if(insertErr)throw insertErr;
      return json({ok:true,v:1,code,expires_at:expiresAt});
   }
   if(body.action==="revoke"){
      if(!validId(body.device_id))return json({error:"ID inválido"},400);
      const {data,error}=await admin.from("engine_devices").update({revoked_at:new Date().toISOString()})
        .eq("owner_id",user.id).eq("id",body.device_id).is("revoked_at",null).select("id").maybeSingle();
      if(error)throw error;
      return json({ok:true,v:1,revoked:Boolean(data)});
   }
   return json({error:"Ação não suportada"},400);
 }catch(e){
   console.error("empire-pair-owner failed", e instanceof Error?e.name:"request");
   return json({error:"Falha ao processar operação"},500);
 }
});