(()=>{
  const config=window.CANDY_SUPABASE;
  let activeTab='global',socket=null,heartbeat=null,refreshTimer=null,joined=false;

  function session(){return window.CandyCloud?.session||null;}
  function userId(){
    const token=session()?.access_token;if(!token)return null;
    try{let body=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');body+='='.repeat((4-body.length%4)%4);return JSON.parse(atob(body)).sub||null;}catch{return null;}
  }
  function playerName(){
    try{return (JSON.parse(localStorage.getItem('cb_profile')||'{}').name||'Player').trim().slice(0,24)||'Player';}catch{return 'Player';}
  }
  function playerAvatar(){try{return window.CandyProfiles?.get(JSON.parse(localStorage.getItem('cb_profile')||'{}').avatar)?.id||'berry';}catch{return 'berry';}}
  function headers(json=false){
    const token=session()?.access_token||config.publishableKey;
    return {apikey:config.publishableKey,Authorization:`Bearer ${token}`,...(json?{'Content-Type':'application/json',Prefer:'return=minimal'}:{})};
  }
  async function scores(){
    const select='user_id,display_name,avatar,score,level,stars,created_at';
    let response=await fetch(`${config.url}/rest/v1/leaderboard_scores?select=${select}&order=score.desc&limit=500`,{headers:headers()});
    if(response.status===400)response=await fetch(`${config.url}/rest/v1/leaderboard_scores?select=user_id,display_name,score,level,stars,created_at&order=score.desc&limit=500`,{headers:headers()});
    if(!response.ok)throw new Error(response.status===404?'Live Scores table is not set up yet.':'Scores could not be refreshed.');
    return response.json();
  }
  function aggregate(rows,tab){
    const me=userId();
    if(tab==='weekly'){
      const now=new Date(),day=(now.getUTCDay()+6)%7,start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()-day));
      rows=rows.filter(row=>new Date(row.created_at)>=start);
    }
    if(tab==='personal')return rows.filter(row=>row.user_id===me).slice(0,30).map(row=>({...row,me:true}));
    const best=new Map();
    rows.forEach(row=>{const previous=best.get(row.user_id);if(!previous||Number(row.score)>Number(previous.score))best.set(row.user_id,row);});
    return [...best.values()].sort((a,b)=>Number(b.score)-Number(a.score)).slice(0,50).map(row=>({...row,me:row.user_id===me}));
  }
  function addStatus(list,text,isError=false){
    list.innerHTML='';const row=document.createElement('div');row.className='lb-live-state'+(isError?' is-error':'');row.textContent=text;list.append(row);
  }
  function render(rows){
    const list=document.getElementById('lb-list');if(!list)return;
    const data=aggregate(rows,activeTab);list.innerHTML='';
    if(!data.length){addStatus(list,activeTab==='personal'&&!userId()?'Sign in to keep your scores live on every device.':'No completed levels here yet. Be the first!');return;}
    data.forEach((row,index)=>{
      const item=document.createElement('div');item.className='lb-row'+(row.me?' lb-me':'');
      const rank=document.createElement('div');rank.className='lb-rank '+(index===0?'gold':index===1?'silver':index===2?'bronze':'other');rank.textContent=index===0?'1':index===1?'2':index===2?'3':`#${index+1}`;
      const avatar=document.createElement('div');avatar.className='lb-avatar';window.CandyProfiles?.mount(avatar,row.avatar,{label:false});
      const info=document.createElement('div');info.className='lb-info';const name=document.createElement('div');name.className='lb-name';name.textContent=(row.display_name||'Player')+(row.me?' · You':'');const level=document.createElement('div');level.className='lb-level';level.textContent=`Level ${Math.max(1,Number(row.level)||1)} · ${Math.max(0,Number(row.stars)||0)} stars`;info.append(name,level);
      const score=document.createElement('div');score.className='lb-score';score.textContent=Number(row.score||0).toLocaleString();item.append(rank,avatar,info,score);list.append(item);
    });
  }
  async function refresh(){
    const list=document.getElementById('lb-list');if(!list||currentScreen!=='leaderboard')return;
    try{render(await scores());}catch(error){addStatus(list,error.message,true);}
  }
  function connect(){
    if(socket||!config?.url)return;
    const ws=config.url.replace(/^http/,'ws')+`/realtime/v1/websocket?apikey=${encodeURIComponent(config.publishableKey)}&vsn=1.0.0`;
    socket=new WebSocket(ws);let ref=1;
    socket.onopen=()=>{
      socket.send(JSON.stringify({topic:'realtime:public:leaderboard_scores',event:'phx_join',payload:{config:{broadcast:{ack:false,self:false},presence:{key:''},postgres_changes:[{event:'*',schema:'public',table:'leaderboard_scores'}]},access_token:session()?.access_token||config.publishableKey,private:false},ref:String(ref++)}));
      heartbeat=setInterval(()=>{if(socket?.readyState===1)socket.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(ref++)}));},25000);
    };
    socket.onmessage=event=>{try{const message=JSON.parse(event.data);if(message.event==='phx_reply')joined=true;if(message.event==='postgres_changes'||message.event==='INSERT')refresh();}catch{}};
    socket.onclose=()=>{socket=null;joined=false;clearInterval(heartbeat);heartbeat=null;setTimeout(connect,5000);};
    socket.onerror=()=>socket?.close();
  }
  function open(tab='global'){
    activeTab=tab;const list=document.getElementById('lb-list');if(!list)return false;
    addStatus(list,'Refreshing live scores…');refresh();connect();clearInterval(refreshTimer);refreshTimer=setInterval(refresh,15000);return true;
  }
  async function submit(result){
    const id=userId();if(!id||!result||!Number.isFinite(Number(result.score)))return false;
    const body={user_id:id,display_name:playerName(),avatar:playerAvatar(),score:Math.max(0,Math.round(Number(result.score))),level:Math.max(1,Math.min(20,Math.round(Number(result.level)||1))),stars:Math.max(0,Math.min(3,Math.round(Number(result.stars)||0)))};
    try{let response=await fetch(`${config.url}/rest/v1/leaderboard_scores`,{method:'POST',headers:headers(true),body:JSON.stringify(body)});if(response.status===400){delete body.avatar;response=await fetch(`${config.url}/rest/v1/leaderboard_scores`,{method:'POST',headers:headers(true),body:JSON.stringify(body)});}if(!response.ok)throw new Error('Score upload failed');if(currentScreen==='leaderboard')refresh();return true;}catch{return false;}
  }
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&currentScreen==='leaderboard')refresh();});
  window.CandyLeaderboard={open,submit,refresh,get connected(){return joined;}};
})();
