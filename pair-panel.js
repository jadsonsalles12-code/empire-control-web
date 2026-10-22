/* Empire Control v1.8.2 — pareamento e presença do agente. Sem acesso ao jogo. */
const OWNER_URL="https://iklkgqkbuvnwrkiqkxqu.supabase.co/functions/v1/empire-pair-owner";
export function attachPairing(authClient){
 let code=null,expiresAt=0,busy=false;
 const byId=id=>document.getElementById(id);
 function message(text,success=false){const t=byId("ec-pair-message");if(t){t.textContent=text;t.classList.toggle("ok",Boolean(success));}}
 function showCode(){
  const panel=byId("ec-pair-code");if(!panel)return;
  if(code&&Date.now()<expiresAt){
   panel.hidden=false;byId("ec-pair-code-value").textContent=code;
   byId("ec-pair-code-valid").textContent="Expira às "+new Date(expiresAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+". Use somente no agente Windows.";
  }else{panel.hidden=true;code=null;}
 }
 async function ownerAction(action,deviceId){
  const {data,error}=await authClient.auth.getSession();
  if(error||!data.session?.access_token)throw Error("Entre novamente no site.");
  const res=await fetch(OWNER_URL,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+data.session.access_token},body:JSON.stringify({v:1,action,...(deviceId?{device_id:deviceId}:{})})});
  let result;try{result=await res.json();}catch{throw Error("Resposta inválida do servidor: "+res.status);}
  if(!res.ok||!result.ok)throw Error(result.error||"Falha na comunicação.");
  return result;
 }
 async function refresh(){
  const root=byId("ec-pair-devices");if(!root)return;
  root.textContent="Consultando dispositivos...";
  const {data,error}=await authClient.from("engine_devices").select("id,label,engine_version,last_seen_at,revoked_at,created_at").order("created_at",{ascending:false}).limit(20);
  const current=byId("ec-pair-devices");if(!current)return;
  if(error){current.textContent="Falha ao consultar dispositivos: "+error.message;return;}
  current.replaceChildren();
  if(!data?.length){current.textContent="Nenhum computador pareado ainda.";return;}
  for(const device of data){
   const row=document.createElement("div");row.className="ec-device-row";
   const name=document.createElement("strong");name.textContent=device.label;
   const info=document.createElement("small");
   const seen=device.last_seen_at?new Date(device.last_seen_at):null;
   const online=!device.revoked_at&&seen&&Date.now()-seen.getTime()<150000;
   info.textContent=device.revoked_at?"Revogado":online?"Agente online — presença confirmada":seen?"Último sinal: "+seen.toLocaleString("pt-BR"):"Pareado, aguardando o primeiro sinal";
   const tech=document.createElement("small");tech.textContent="Sem leitura do jogo · "+(device.engine_version||"Agente aguardando");
   const desc=document.createElement("div");desc.append(name,info,tech);row.append(desc);
   if(!device.revoked_at){
    const btn=document.createElement("button");btn.type="button";btn.className="btn danger sm";
    btn.dataset.ecPair="revoke";btn.dataset.deviceId=device.id;btn.textContent="Revogar";row.append(btn);
   }
   current.append(row);
  }
 }
 async function handle(btn){
  if(busy)return;busy=true;btn.disabled=true;
  try{
   const action=btn.dataset.ecPair;
   if(action==="generate"){
    const r=await ownerAction("create");code=r.code;expiresAt=new Date(r.expires_at).getTime();
    showCode();message("Código gerado, de uso único e válido por dez minutos.",true);
   }else if(action==="copy"){
    if(!code||Date.now()>=expiresAt)throw Error("Código expirado. Gere outro.");
    await navigator.clipboard.writeText(code);message("Código copiado. Cole somente no agente Windows.",true);
   }else if(action==="refresh"){
    await refresh();message("Lista atualizada.",true);
   }else if(action==="revoke"){
    if(!btn.dataset.deviceId||!confirm("Revogar este computador? O agente perderá acesso."))return;
    await ownerAction("revoke",btn.dataset.deviceId);await refresh();message("Dispositivo revogado.",true);
   }
  }catch(e){message(e?.message||"Erro inesperado");}
  finally{busy=false;if(btn.isConnected)btn.disabled=false;}
 }
 document.addEventListener("click",ev=>{
  const btn=ev.target.closest("[data-ec-pair]");if(btn){ev.preventDefault();handle(btn);}
 });
 function mount(){if(byId("ec-pair-root")){showCode();refresh().catch(e=>message(e.message));}}
 return {mount};
}