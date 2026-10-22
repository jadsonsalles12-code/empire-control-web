/* Empire Control v1.8.1: authentication to this website only.
   Supabase publishable key, never game credentials or service_role.
   Static code and catalogue remain public; private data requires database RLS. */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.76.1/+esm';

const SITE_URL = 'https://jadsonsalles12-code.github.io/empire-control-web/';
const SUPABASE_URL = 'https://iklkgqkbuvnwrkiqkxqu.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_bNz5XiMmTtd5bDQWAnlcZw_5xgL9Zec';
const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true,
    storageKey: 'empire-control-supabase-session-v1' }
});
const gate = document.getElementById('authGate');
const shell = document.querySelector('.app-shell');
const form = document.getElementById('siteAuthForm');
const email = document.getElementById('siteEmail');
const password = document.getElementById('sitePassword');
const passwordWrap = document.getElementById('sitePasswordWrap');
const message = document.getElementById('siteAuthMessage');
const heading = document.getElementById('siteAuthTitle');
const description = document.getElementById('siteAuthDescription');
const submit = document.getElementById('siteSubmit');
const secondary = document.getElementById('siteSecondary');
const recovery = document.getElementById('siteRecovery');
let mode = 'login', appLoaded = false, busy = false, recovering = false;
let lastVerifiedId = null;

function status(text, ok=false) {
  message.textContent = text || '';
  message.classList.toggle('ok', Boolean(ok));
}
function setMode(next) {
  mode = next;
  form.reset();
  status('');
  passwordWrap.hidden = next === 'forgot';
  password.required = next !== 'forgot';
  password.autocomplete = next === 'signup' ? 'new-password' :
    next === 'recover' ? 'new-password' : 'current-password';
  heading.textContent = ({ login:'Entrar no Empire Control', signup:'Criar acesso ao site',
    forgot:'Recuperar acesso', recover:'Definir nova senha' })[next];
  description.textContent = next === 'login' ? 'Entre com o e-mail e a senha deste site, não do Goodgame Empire.' :
    next === 'signup' ? 'Seu cadastro é independente da conta do jogo.' :
    next === 'forgot' ? 'Enviaremos um link de recuperação para seu e-mail.' :
    'Escolha uma nova senha para entrar no site.';
  submit.textContent = ({ login:'Entrar', signup:'Criar conta',
    forgot:'Enviar link', recover:'Atualizar senha' })[next];
  secondary.hidden = next === 'recover';
  recovery.hidden = next !== 'login';
  secondary.textContent = next === 'login' ? 'Criar conta' : 'Voltar ao login';
  email.parentElement.hidden = next === 'recover';
  email.required = next !== 'recover';
}
function setBusy(working) { busy=working; submit.disabled=working; submit.textContent=working?'Aguarde...':({login:'Entrar',signup:'Criar conta',forgot:'Enviar link',recover:'Atualizar senha'})[mode]; }
function showLogin(messageText='') {
  shell.hidden = true;
  gate.hidden = false;
  if (!recovering) setMode('login');
  if(messageText)status(messageText);
}
async function showDashboard(user) {
  if (!user || !user.id || recovering) return;
  if (appLoaded && window.__empireUserId !== user.id) {
    location.reload(); return;
  }
  window.__empireUserId = user.id;
  lastVerifiedId = user.id;
  const userLabel = document.getElementById('siteUserLabel');
  if(userLabel) userLabel.textContent = user.email || 'Usuário autenticado';
  gate.hidden = true;
  shell.hidden = false;
  if (!appLoaded) {
    appLoaded=true;
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='app.js';
      script.onload=resolve;
      script.onerror=()=>reject(new Error('O painel não carregou. Atualize a página.'));
      document.body.appendChild(script);
    }).catch(error=>{ appLoaded=false; showLogin(error.message); });
  }
}
async function checkIdentity() {
  if (recovering) return;
  try {
    const { data, error } = await authClient.auth.getUser();
    if (error || !data.user) { if(appLoaded) location.reload(); else showLogin(); return; }
    await showDashboard(data.user);
  } catch (_) {
    if(appLoaded) location.reload();
    else showLogin('Não foi possível verificar sua sessão. Confira a conexão.');
  }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if(busy) return;
  const e=email.value.trim(), p=password.value;
  setBusy(true); status('');
  try {
    if(mode==='login') {
      const {error} = await authClient.auth.signInWithPassword({email:e,password:p});
      if(error)throw error;
      await checkIdentity();
    } else if(mode==='signup') {
      if(p.length<8)throw Error('Escolha uma senha de pelo menos 8 caracteres.');
      const {data,error}=await authClient.auth.signUp({
        email:e,password:p,options:{emailRedirectTo:SITE_URL}
      });
      if(error)throw error;
      if(data.session)await checkIdentity();
      else {setMode('login');status('Confira seu e-mail e confirme o cadastro antes de entrar.',true);}
    } else if(mode==='forgot') {
      const {error}=await authClient.auth.resetPasswordForEmail(e,{redirectTo:SITE_URL});
      if(error)throw error;
      setMode('login');status('Se existir uma conta com esse e-mail, o link será enviado.',true);
    } else if(mode==='recover') {
      if(p.length<8)throw Error('Escolha uma senha de pelo menos 8 caracteres.');
      const {error}=await authClient.auth.updateUser({password:p});
      if(error)throw error;
      recovering=false;
      await authClient.auth.signOut({scope:'local'});
      setMode('login');status('Senha alterada. Entre com sua nova senha.',true);
    }
  } catch(error) {
    status(error?.message || 'Não foi possível concluir. Tente novamente.');
  } finally {setBusy(false);}
});
secondary.addEventListener('click',()=>setMode(mode==='login'?'signup':'login'));
recovery.addEventListener('click',()=>setMode('forgot'));
document.getElementById('siteSignOut').addEventListener('click',async()=>{
  try { await authClient.auth.signOut(); }
  finally { location.reload(); }
});
authClient.auth.onAuthStateChange((event) => {
  if(event==='PASSWORD_RECOVERY') {recovering=true;gate.hidden=false;shell.hidden=true;setMode('recover');return;}
  if(event==='SIGNED_OUT') { if(appLoaded) location.reload(); else showLogin();return; }
  if(event==='SIGNED_IN' || event==='TOKEN_REFRESHED') {
    // Never call auth APIs synchronously inside an auth-state callback.
    setTimeout(checkIdentity,0);
  }
});
if (new URLSearchParams(location.hash.substring(1)).get('type')==='recovery') {
  recovering=true;setMode('recover');
}
if (!recovering) checkIdentity();
