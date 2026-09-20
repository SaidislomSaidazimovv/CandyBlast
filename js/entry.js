// Supabase authentication and offline-first cloud progress for Candy Blast.
(()=>{
 const CONFIG=window.CANDY_SUPABASE;
 const TRACKED_KEYS=['cb_profile','cb_best','cb_settings','cb_personal','cb_tutorial_done','cb_lives','cb_daily','cb_daily_done','cb_map','cb_gamestate','cb_spin_given'];
 const SESSION_KEY='cb_supabase_session',GUEST_KEY='cb_guest_mode',LOCAL_STAMP='cb_cloud_local_updated';
 const nativeSet=Storage.prototype.setItem,nativeRemove=Storage.prototype.removeItem;
 let session=null,syncTimer=0,syncing=false,callbackError='';

 function readJSON(key,fallback=null){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}}
 function writeRaw(key,value){nativeSet.call(localStorage,key,String(value));}
 function removeRaw(key){nativeRemove.call(localStorage,key);}
 function message(error){return error?.message||error?.msg||error?.error_description||error?.error||'Something went wrong. Please try again.';}
 function setStatus(text,isError=false){const el=document.getElementById('entry-error');if(el){el.textContent=text||'';el.classList.toggle('is-error',isError);}}
 function setBusy(busy){document.querySelectorAll('#entry-overlay button,#entry-overlay input').forEach(el=>el.disabled=busy);}
 function redirectUrl(){return location.origin+location.pathname;}

 async function request(path,{method='GET',body,token=session?.access_token,headers={}}={}){
  const response=await fetch(CONFIG.url+path,{method,headers:{apikey:CONFIG.publishableKey,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
  const data=response.status===204?null:await response.json().catch(()=>null);
  if(!response.ok)throw new Error(message(data)||`Request failed (${response.status})`);
  return data;
 }
 function saveSession(next){session=next&&next.access_token?next:null;if(session)writeRaw(SESSION_KEY,JSON.stringify(session));else removeRaw(SESSION_KEY);updateProfileButton();}
 function parseCallback(){
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.get('error_description')||hash.get('error')){callbackError=hash.get('error_description')||hash.get('error');history.replaceState({},document.title,location.pathname+location.search);return false;}
  if(!hash.get('access_token'))return false;
  saveSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token'),expires_in:+hash.get('expires_in')||3600,expires_at:Math.floor(Date.now()/1000)+(+hash.get('expires_in')||3600),token_type:'bearer'});
  const type=hash.get('type');history.replaceState({},document.title,location.pathname+location.search);return type==='recovery'?'recovery':true;
 }
 async function refreshSession(){
  const saved=readJSON(SESSION_KEY);if(!saved?.refresh_token)return null;
  if(saved.expires_at&&saved.expires_at>Date.now()/1000+60){saveSession(saved);return saved;}
  try{const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:saved.refresh_token},token:null});saveSession(next);return next;}catch{saveSession(null);return null;}
 }
 async function currentUser(){if(!session)return null;try{return await request('/auth/v1/user');}catch{return null;}}

 function snapshot(){const state={__updatedAt:+localStorage.getItem(LOCAL_STAMP)||0};for(const key of TRACKED_KEYS){const value=localStorage.getItem(key);if(value!==null)state[key]=value;}return state;}
 function parseValue(state,key,fallback){try{return JSON.parse(state?.[key])??fallback;}catch{return fallback;}}
 function mergeMap(local,remote){
  const a=parseValue(local,'cb_map',null),b=parseValue(remote,'cb_map',null);if(!a)return b;if(!b)return a;
  const rows=new Map();for(const item of [...(b.levels||[]),...(a.levels||[])]){const old=rows.get(item.id)||{};rows.set(item.id,{...old,...item,stars:Math.max(+old.stars||0,+item.stars||0),completed:!!(old.completed||item.completed),locked:old.locked===false||item.locked===false?false:true});}
  return {...b,...a,currentLevel:Math.max(+a.currentLevel||1,+b.currentLevel||1),levels:[...rows.values()].sort((x,y)=>x.id-y.id)};
 }
 function mergeScores(local,remote){const rows=[...parseValue(local,'cb_personal',[]),...parseValue(remote,'cb_personal',[])],seen=new Set;return rows.filter(row=>{const id=[row.score,row.level,row.date].join(':');if(seen.has(id))return false;seen.add(id);return true;}).sort((a,b)=>(+b.score||0)-(+a.score||0)).slice(0,10);}
 function mergeSnapshots(local,remote){
  const localNew=(+local.__updatedAt||0)>=(+remote.__updatedAt||0),base={...(localNew?remote:local),...(localNew?local:remote)};
  base.__updatedAt=Math.max(+local.__updatedAt||0,+remote.__updatedAt||0);base.cb_best=String(Math.max(+local.cb_best||0,+remote.cb_best||0));
  const map=mergeMap(local,remote);if(map)base.cb_map=JSON.stringify(map);const scores=mergeScores(local,remote);if(scores.length)base.cb_personal=JSON.stringify(scores);
  if(local.cb_tutorial_done||remote.cb_tutorial_done)base.cb_tutorial_done='1';if(local.cb_spin_given||remote.cb_spin_given)base.cb_spin_given='1';
  const localGame=parseValue(local,'cb_gamestate',null),remoteGame=parseValue(remote,'cb_gamestate',null);if(localGame||remoteGame)base.cb_gamestate=JSON.stringify((+localGame?.savedAt||0)>=(+remoteGame?.savedAt||0)?localGame:remoteGame);
  return base;
 }
 function applySnapshot(state){let changed=false;for(const key of TRACKED_KEYS){if(state[key]!==undefined&&localStorage.getItem(key)!==state[key]){writeRaw(key,state[key]);changed=true;}}writeRaw(LOCAL_STAMP,state.__updatedAt||Date.now());return changed;}
 async function pushCloud(){
  if(!session||syncing||!navigator.onLine)return false;syncing=true;
  try{const user=await currentUser();if(!user)throw new Error('Your session expired. Please sign in again.');const state=snapshot();if(!state.__updatedAt){state.__updatedAt=Date.now();writeRaw(LOCAL_STAMP,state.__updatedAt);}const profile=parseValue(state,'cb_profile',{});await request('/rest/v1/player_progress?on_conflict=user_id',{method:'POST',body:{user_id:user.id,display_name:profile?.name||user.user_metadata?.display_name||'',state,client_updated_at:new Date(state.__updatedAt).toISOString()},headers:{Prefer:'resolution=merge-duplicates,return=minimal'}});writeRaw('cb_cloud_last_sync',String(Date.now()));removeRaw('cb_cloud_error');return true;}catch(error){writeRaw('cb_cloud_error',message(error));throw error;}finally{syncing=false;}
 }
 function queueSync(){clearTimeout(syncTimer);if(session)syncTimer=setTimeout(()=>pushCloud().catch(()=>{}),1400);}
 async function reconcileCloud(){
  if(!session||!navigator.onLine)return {changed:false,offline:true};const user=await currentUser();if(!user)throw new Error('Your session expired. Please sign in again.');
  const rows=await request('/rest/v1/player_progress?select=state,updated_at&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1');
  if(!rows?.length){await pushCloud();return {changed:false,created:true};}
  const remote=rows[0].state||{},local=snapshot(),merged=mergeSnapshots(local,remote),changed=applySnapshot(merged);if(JSON.stringify(merged)!==JSON.stringify(remote))await pushCloud();return {changed};
 }
 async function hydrateProfile(){
  if(readJSON('cb_profile'))return;const user=await currentUser();if(!user)return;const metadata=user.user_metadata||{},name=metadata.display_name||metadata.full_name||metadata.name||(user.email?user.email.split('@')[0]:'Player');localStorage.setItem('cb_profile',JSON.stringify({name:String(name).slice(0,24)}));
 }
 function markChanged(key){if(!TRACKED_KEYS.includes(String(key)))return;writeRaw(LOCAL_STAMP,String(Date.now()));queueSync();}
 Storage.prototype.setItem=function(key,value){nativeSet.call(this,key,value);if(this===localStorage)markChanged(key);};
 Storage.prototype.removeItem=function(key){nativeRemove.call(this,key);if(this===localStorage)markChanged(key);};

 function leave(){document.querySelectorAll('.screen').forEach(el=>el.inert=false);document.getElementById('entry-overlay')?.remove();if(typeof checkFirstTime==='function')checkFirstTime();}
 function shell(content,label='Candy Blast account'){
  document.querySelectorAll('.screen').forEach(el=>el.inert=true);let overlay=document.getElementById('entry-overlay');if(!overlay){overlay=document.createElement('div');overlay.id='entry-overlay';overlay.className='entry-overlay';document.body.append(overlay);}overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label',label);overlay.innerHTML=`<div class="entry-card"><img src="images/ui/app.svg" alt=""><div id="entry-content">${content}</div><p id="entry-error" role="status" aria-live="polite"></p></div>`;return overlay;
 }
 function authScreen(mode='signin'){
  const signup=mode==='signup';const overlay=shell(`<h1>${signup?'Create account':'Welcome back'}</h1><p>${signup?'Save your journey and continue on any device.':'Sign in to restore your Candy Blast journey.'}</p><div class="auth-providers"><button type="button" class="auth-provider" data-provider="google"><span class="provider-mark google-mark">G</span>Continue with Google</button><button type="button" class="auth-provider" data-provider="apple"><span class="provider-mark apple-mark">●</span>Continue with Apple</button></div><div class="auth-divider"><span>or use email</span></div><form id="auth-form">${signup?'<label for="auth-name">Player name</label><input id="auth-name" autocomplete="nickname" maxlength="24" required placeholder="Your name">':''}<label for="auth-email">Email</label><input id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com"><label for="auth-password">Password</label><input id="auth-password" type="password" autocomplete="${signup?'new-password':'current-password'}" minlength="8" required placeholder="At least 8 characters"><button class="btn btn-play" type="submit">${signup?'Create account':'Sign in'}</button></form>${signup?'':'<button class="auth-link" type="button" id="auth-forgot">Forgot password?</button>'}<button class="auth-switch" type="button" id="auth-switch">${signup?'Already have an account? Sign in':'New here? Create account'}</button><button class="btn btn-secondary" type="button" id="entry-guest">Play as guest</button>`);
  overlay.querySelectorAll('[data-provider]').forEach(btn=>btn.onclick=()=>oauth(btn.dataset.provider));overlay.querySelector('#auth-switch').onclick=()=>authScreen(signup?'signin':'signup');overlay.querySelector('#entry-guest').onclick=()=>{writeRaw(GUEST_KEY,'1');leave();};if(!signup)overlay.querySelector('#auth-forgot').onclick=forgotScreen;
  overlay.querySelector('#auth-form').onsubmit=async event=>{event.preventDefault();setBusy(true);setStatus('');const email=overlay.querySelector('#auth-email').value.trim(),password=overlay.querySelector('#auth-password').value;try{if(signup){const name=overlay.querySelector('#auth-name').value.trim(),data=await request('/auth/v1/signup',{method:'POST',body:{email,password,data:{display_name:name},email_redirect_to:redirectUrl()},token:null});localStorage.setItem('cb_profile',JSON.stringify({name}));if(data.access_token){saveSession(data);removeRaw(GUEST_KEY);await finishSignIn();}else setStatus('Check your email and confirm the account. Then return here and sign in.');}else{const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password},token:null});saveSession(data);removeRaw(GUEST_KEY);await finishSignIn();}}catch(error){setStatus(message(error),true);}finally{setBusy(false);}};
 }
 function forgotScreen(){const overlay=shell(`<h1>Reset password</h1><p>We will send a secure recovery link to your email.</p><form id="recover-form"><label for="auth-email">Email</label><input id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com"><button class="btn btn-play" type="submit">Send recovery link</button></form><button class="auth-switch" type="button" id="auth-back">Back to sign in</button>`);overlay.querySelector('#auth-back').onclick=()=>authScreen();overlay.querySelector('form').onsubmit=async e=>{e.preventDefault();setBusy(true);try{await request('/auth/v1/recover',{method:'POST',body:{email:overlay.querySelector('input').value.trim(),redirect_to:redirectUrl()},token:null});setStatus('Recovery email sent. Open its link on this device.');}catch(error){setStatus(message(error),true);}finally{setBusy(false);}};}
 function resetScreen(){const overlay=shell(`<h1>Choose a new password</h1><p>Use at least 8 characters.</p><form id="reset-form"><label for="new-password">New password</label><input id="new-password" type="password" autocomplete="new-password" minlength="8" required><button class="btn btn-play" type="submit">Update password</button></form>`);overlay.querySelector('form').onsubmit=async e=>{e.preventDefault();setBusy(true);try{await request('/auth/v1/user',{method:'PUT',body:{password:overlay.querySelector('input').value}});setStatus('Password updated. Your journey is ready.');setTimeout(()=>finishSignIn(),650);}catch(error){setStatus(message(error),true);}finally{setBusy(false);}};}
 function oauth(provider){location.assign(CONFIG.url+'/auth/v1/authorize?provider='+encodeURIComponent(provider)+'&redirect_to='+encodeURIComponent(redirectUrl()));}
 async function finishSignIn(){try{await hydrateProfile();const result=await reconcileCloud();if(result.changed){location.reload();return;}leave();}catch(error){writeRaw('cb_cloud_error',message(error));leave();}}
 async function signOut(){try{if(session)await request('/auth/v1/logout',{method:'POST'});}catch{}saveSession(null);removeRaw(GUEST_KEY);authScreen();}
 function updateProfileButton(){const button=document.querySelector('.profile-menu');if(!button)return;const profile=readJSON('cb_profile',{});button.textContent=session?`${profile?.name||'Player'} · Cloud account`:'Player account';}
 async function accountScreen(){
  if(!session){authScreen();return;}const user=await currentUser(),profile=readJSON('cb_profile',{}),last=+localStorage.getItem('cb_cloud_last_sync')||0;
  const cloudError=localStorage.getItem('cb_cloud_error'),cloudText=cloudError?'Database setup required':navigator.onLine?(last?'Synced '+new Date(last).toLocaleString():'Ready to sync'):'Offline · changes stay on this device';
  const overlay=shell(`<h1>Your account</h1><p class="account-email"></p><div class="cloud-state${cloudError?' has-error':''}"><span class="cloud-dot"></span><div><strong>Cloud progress</strong><small>${cloudText}</small></div></div><form id="profile-form"><label for="player-name">Player name</label><input id="player-name" autocomplete="nickname" maxlength="24" required><button class="btn btn-play" type="submit">Save & sync</button></form><button class="btn btn-secondary" id="account-close" type="button">Back to settings</button><button class="auth-link danger-link" id="account-signout" type="button">Sign out</button>`,'Player account');overlay.querySelector('.account-email').textContent=user?.email||'';overlay.querySelector('#player-name').value=profile?.name||user?.user_metadata?.display_name||user?.user_metadata?.full_name||user?.user_metadata?.name||'';overlay.querySelector('#account-close').onclick=leave;overlay.querySelector('#account-signout').onclick=signOut;overlay.querySelector('form').onsubmit=async e=>{e.preventDefault();const name=overlay.querySelector('#player-name').value.trim();if(!name)return;localStorage.setItem('cb_profile',JSON.stringify({name}));setBusy(true);try{await request('/auth/v1/user',{method:'PUT',body:{data:{display_name:name}}});await pushCloud();setStatus('Profile and progress synced.');updateProfileButton();}catch(error){setStatus(message(error),true);}finally{setBusy(false);}};
 }
 const profile=document.createElement('button');profile.type='button';profile.className='profile-menu';profile.onclick=accountScreen;document.querySelector('#screen-settings .panel')?.append(profile);
 window.CandyCloud={sync:pushCloud,openAccount:accountScreen,get session(){return session;}};window.addEventListener('online',queueSync);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pushCloud().catch(()=>{});else queueSync();});
 async function ready(){if(!CONFIG?.url||!CONFIG?.publishableKey){authScreen();setStatus('Supabase configuration is missing.',true);return;}const callback=parseCallback();if(!session)await refreshSession();updateProfileButton();if(callback==='recovery'){resetScreen();return;}if(session){await finishSignIn();return;}if(localStorage.getItem(GUEST_KEY)==='1'&&!callbackError){leave();return;}authScreen();if(callbackError)setStatus(callbackError,true);}
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
})();
