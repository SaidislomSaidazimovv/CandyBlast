const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'..','js','entry.js'),'utf8');
const oldSession=()=>({access_token:'old-access',refresh_token:'old-refresh',expires_at:Math.floor(Date.now()/1000)-5*86400});

function authHarness({online=true,fetcher=async()=>{throw new Error('Unexpected fetch');}}={}){
  class Storage{constructor(){this.items=new Map();}getItem(key){return this.items.get(key)??null;}setItem(key,value){this.items.set(key,String(value));}removeItem(key){this.items.delete(key);}}
  const localStorage=new Storage(),timers=[],listeners={};
  const window={CANDY_SUPABASE:{url:'https://supabase.test',publishableKey:'public'},CandyProfiles:{mount(){}},addEventListener(name,callback){listeners[name]=callback;}};
  const document={readyState:'loading',visibilityState:'visible',createElement:()=>({}),querySelector:()=>null,getElementById:()=>null,addEventListener(){},querySelectorAll:()=>[]};
  const navigator={onLine:online};
  const context=vm.createContext({window,document,localStorage,Storage,navigator,fetch:fetcher,Date,Promise,Math,JSON,setTimeout:(callback,delay)=>{timers.push({callback,delay});return timers.length;},clearTimeout(){},console});
  vm.runInContext(source,context,{filename:'entry.js'});
  return {window,localStorage,timers,listeners,navigator,context};
}

test('a session saved days ago rotates its refresh token and authorizes the next cloud request',async()=>{
  const calls=[];
  const h=authHarness({fetcher:async(url,options)=>{
    calls.push({url,options});
    if(url.includes('grant_type=refresh_token'))return {ok:true,status:200,json:async()=>({access_token:'new-access',refresh_token:'new-refresh',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600})};
    return {ok:true,status:200,json:async()=>({ok:true})};
  }});
  h.localStorage.setItem('cb_supabase_session',JSON.stringify(oldSession()));
  const restored=await Promise.all([h.window.CandyCloud.refreshSession(),h.window.CandyCloud.refreshSession()]);
  assert.equal(restored[0].refresh_token,'new-refresh');
  assert.equal(restored[1].refresh_token,'new-refresh');
  assert.equal(JSON.parse(h.localStorage.getItem('cb_supabase_session')).refresh_token,'new-refresh');
  await h.window.CandyCloud.rpc('test');
  assert.equal(calls.length,2);
  assert.equal(calls[1].options.headers.Authorization,'Bearer new-access');
  assert.ok(h.timers.some(timer=>timer.delay>0&&timer.delay<3600000));
});

test('offline and temporary network failures keep the saved account for a later retry',async()=>{
  const offline=authHarness({online:false});offline.localStorage.setItem('cb_supabase_session',JSON.stringify(oldSession()));
  assert.equal((await offline.window.CandyCloud.refreshSession()).refresh_token,'old-refresh');
  assert.ok(offline.localStorage.getItem('cb_supabase_session'));
  const flaky=authHarness({fetcher:async()=>{throw new Error('Network unavailable');}});
  flaky.localStorage.setItem('cb_supabase_session',JSON.stringify(oldSession()));
  assert.equal((await flaky.window.CandyCloud.refreshSession()).refresh_token,'old-refresh');
  assert.ok(flaky.localStorage.getItem('cb_supabase_session'));
});

test('a revoked refresh token ends the saved session',async()=>{
  const h=authHarness({fetcher:async()=>({ok:false,status:400,json:async()=>({error_code:'refresh_token_not_found',msg:'Invalid refresh token'})})});
  h.localStorage.setItem('cb_supabase_session',JSON.stringify(oldSession()));
  assert.equal(await h.window.CandyCloud.refreshSession(),null);
  assert.equal(h.localStorage.getItem('cb_supabase_session'),null);
});

test('reconnecting after days offline renews the account without sign-in',async()=>{
  let rotations=0;
  const h=authHarness({online:false,fetcher:async(url)=>{
    if(url.includes('grant_type=refresh_token')){rotations++;return {ok:true,status:200,json:async()=>({access_token:'online-access',refresh_token:'online-refresh',expires_at:Math.floor(Date.now()/1000)+3600})};}
    if(url.endsWith('/auth/v1/user'))return {ok:true,status:200,json:async()=>({id:'player-1',user_metadata:{}})};
    if(url.includes('player_progress')&&!url.includes('on_conflict'))return {ok:true,status:200,json:async()=>[]};
    return {ok:true,status:204,json:async()=>null};
  }});
  h.localStorage.setItem('cb_supabase_session',JSON.stringify(oldSession()));
  await h.window.CandyCloud.refreshSession();
  h.navigator.onLine=true;
  await h.listeners.online();
  assert.equal(rotations,1);
  assert.equal(h.window.CandyCloud.session.refresh_token,'online-refresh');
});
