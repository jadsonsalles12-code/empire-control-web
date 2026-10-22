import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SITE_ORIGIN = "https://jadsonsalles12-code.github.io";
const PROJECT_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(PROJECT_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={"Access-Control-Allow-Origin":SITE_ORIGIN,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"content-type,apikey,x-client-info","Vary":"Origin"};
function json(body:object,status=200):Response{return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});}
function idOk(x:unknown):x is string{return typeof x==="string"&&/^[0-9a-fA-F-]{36}$/.test(x);}
async function hash(str:string):Promise<string>{const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(str));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("");}
function equal64(a:string,b:string){if(a.length!==64||b.length!==64)return false;let diff=0;for(let i=0;i<64;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
Deno.serve(async req=>{
 const origin=req.headers.get("Origin");
 if(origin&&origin!==SITE_ORIGIN)return json({error:"Origem não permitida"},403);
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return json({error:"Método não permitido"},405);
 let body:any;
 try{const raw=await req.text();if(raw.length>2048)return json({error:"Mensagem muito grande"},413);body=JSON.parse(raw);}catch{return json({error:"JSON inválido"},400);}
 if(!body||body.v!==1)return json({error:"Versão inválida"},400);
 try{
  if(body.action==="redeem"){
    if(typeof body.code!=="string"||!/^EC-[a-zA-Z0-9_-]{24}$/.test(body.code))
      return json({error:"Código inválido ou expirado"},401);
    if(typeof body.secret!=="string"||!/^[a-zA-Z0-9_-]{43,100}$/.test(body.secret))
      return json({error:"Credencial do dispositivo inválida"},400);
    const now=new Date().toISOString();
    const codeHash=await hash(body.code);
    const {data:pair,error:lookupError}=await admin.from("engine_pairing_requests")
      .select("id,owner_id").eq("code_hash",codeHash).is("consumed_at",null)
      .gt("expires_at",now).maybeSingle();
    if(lookupError)throw lookupError;
    if(!pair)return json({error:"Código inválido ou expirado"},401);
    // Conditional UPDATE is an atomic claim: only one agent can redeem.
    const {data:claimed,error:claimError}=await admin.from("engine_pairing_requests")
      .update({consumed_at:now}).eq("id",pair.id).is("consumed_at",null)
      .gt("expires_at",now).select("id").maybeSingle();
    if(claimError)throw claimError;
    if(!claimed)return json({error:"Código já utilizado ou expirado"},401);
    const label=typeof body.label==="string"&&body.label.trim().length<=70&&body.label.trim().length>0?body.label.trim():"Computador Windows";
    const {data:device,error:deviceError}=await admin.from("engine_devices")
      .insert({owner_id:pair.owner_id,label,engine_version:"Agente Windows v0.1 (motor não integrado)"})
      .select("id").single();
    if(deviceError)throw deviceError;
    const {error:secretError}=await admin.from("engine_device_credentials")
      .insert({device_id:device.id,secret_hash:await hash(body.secret)});
    if(secretError){
      await admin.from("engine_devices").delete().eq("id",device.id);
      throw secretError;
    }
    return json({ok:true,v:1,device_id:device.id,heartbeat_interval_seconds:60});
  }
  if(body.action==="heartbeat"){
    if(!idOk(body.device_id)||typeof body.secret!=="string"||
       !/^[a-zA-Z0-9_-]{43,100}$/.test(body.secret))
      return json({error:"Dispositivo não autorizado"},401);
    const {data:device,error:dErr}=await admin.from("engine_devices")
      .select("id,owner_id,revoked_at").eq("id",body.device_id).maybeSingle();
    if(dErr)throw dErr;
    if(!device||device.revoked_at)return json({error:"Dispositivo não autorizado ou revogado"},401);
    const {data:credential,error:cErr}=await admin.from("engine_device_credentials")
      .select("secret_hash").eq("device_id",body.device_id).maybeSingle();
    if(cErr)throw cErr;
    if(!credential||!equal64(credential.secret_hash,await hash(body.secret)))
      return json({error:"Dispositivo não autorizado ou revogado"},401);
    const ts=new Date().toISOString();
    const {error:updateErr}=await admin.from("engine_devices")
      .update({last_seen_at:ts,engine_version:"Agente Windows v0.1 (somente presença)"})
      .eq("id",device.id).is("revoked_at",null);
    if(updateErr)throw updateErr;
    // Only a minimal heartbeat. No session, commander, game status or commands.
    return json({ok:true,v:1,received_at:ts,next_after_seconds:60});
  }
  return json({error:"Ação não suportada"},400);
 }catch(e){
   console.error("empire-agent failed",e instanceof Error?e.name:"request");
   return json({error:"Falha ao processar operação"},500);
 }
});