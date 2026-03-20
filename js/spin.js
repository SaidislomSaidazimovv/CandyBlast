// ═══ LUCKY SPIN ═══
// ═══ LUCKY SPIN — 3-TIER PRIZE WHEEL ═══
const SPIN_PRIZES=[
  {icon:'👑',label:'5 Lives',sub:'GOLD',type:'life',val:5,tier:'gold'},
  {icon:'💎',label:'All Boosters x3',sub:'GOLD',type:'all3',val:3,tier:'gold'},
  {icon:'❤️',label:'3 Lives',sub:'SILVER',type:'life',val:3,tier:'silver'},
  {icon:'🎁',label:'Booster Pack',sub:'SILVER',type:'pack',val:1,tier:'silver'},
  {icon:'⚡',label:'+10 Moves',sub:'SILVER',type:'moves',val:2,tier:'silver'},
  {icon:'🍬',label:'+1 Booster',sub:'BRONZE',type:'booster',val:1,tier:'bronze'},
  {icon:'❤️',label:'+1 Life',sub:'BRONZE',type:'life',val:1,tier:'bronze'},
  {icon:'🔨',label:'Hammer',sub:'BRONZE',type:'hammer',val:1,tier:'bronze'},
  {icon:'💣',label:'Bomb',sub:'BRONZE',type:'bomb',val:1,tier:'bronze'}
];
const TIER_STYLES={
  gold:{bg:'rgba(255,215,0,0.18)',border:'rgba(255,215,0,0.6)',label:'#ffd700',glow:'rgba(255,215,0,0.4)'},
  silver:{bg:'rgba(192,192,192,0.12)',border:'rgba(192,192,192,0.4)',label:'#c0c0c0',glow:'rgba(192,192,192,0.3)'},
  bronze:{bg:'rgba(205,127,50,0.1)',border:'rgba(205,127,50,0.3)',label:'#cd7f32',glow:'rgba(205,127,50,0.2)'}
};

function showLuckySpinPopup(){
  document.getElementById('spin-popup')?.remove();
  const weights=[10,10,16,17,17,8,8,7,7];const total=weights.reduce((a,b)=>a+b,0);
  let rand=Math.random()*total,winIdx=0;
  for(let i=0;i<weights.length;i++){rand-=weights[i];if(rand<=0){winIdx=i;break;}}
  const popup=document.createElement('div');popup.className='overlay';popup.id='spin-popup';popup.style.zIndex='500';
  popup.innerHTML=`<div class="overlay-card" style="text-align:center;max-width:380px;width:95%;padding:24px 20px;">
    <div style="font-family:'Fredoka One',cursive;font-size:1.6rem;background:linear-gradient(135deg,#ffe259,#ff5fa0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;">🎡 Lucky Spin!</div>
    <div style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:18px;">Spins left: <span id="spin-remaining" style="color:#ffe259;font-family:'Fredoka One',cursive;">${(dailyData.spinCount||0)+1}</span></div>
    <div id="spin-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
      ${SPIN_PRIZES.map((p,i)=>{const s=TIER_STYLES[p.tier];return`<div class="spin-slot" id="spin-slot-${i}" style="border-radius:14px;padding:12px 6px;background:${s.bg};border:2px solid ${s.border};cursor:default;transition:all 0.08s;position:relative;"><div style="font-size:1.6rem;line-height:1;margin-bottom:4px;">${p.icon}</div><div style="font-family:'Fredoka One',cursive;font-size:0.7rem;color:#fff;line-height:1.2;margin-bottom:2px;">${p.label}</div><div style="font-size:0.55rem;font-weight:700;color:${s.label};letter-spacing:0.5px;">${p.sub}</div></div>`;}).join('')}
    </div>
    <button id="spin-action-btn" class="btn btn-play" style="width:100%;padding:14px;font-size:1.1rem;" onclick="doSpin(${winIdx})">🎡 Spin!</button>
    <button onclick="document.getElementById('spin-popup').remove()" style="margin-top:10px;width:100%;background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:0.8rem;cursor:pointer;padding:6px;">Close</button>
  </div>`;
  document.body.appendChild(popup);
}

function doSpin(winIdx){
  const btn=document.getElementById('spin-action-btn');if(btn){btn.disabled=true;btn.textContent='Spinning...';}
  const totalSteps=27+winIdx;let step=0,dl=60,prevIdx=-1;
  function tick(){
    if(!document.getElementById('spin-popup'))return;
    if(prevIdx>=0){const prev=document.getElementById('spin-slot-'+prevIdx);if(prev){const s=TIER_STYLES[SPIN_PRIZES[prevIdx].tier];prev.style.background=s.bg;prev.style.borderColor=s.border;prev.style.transform='scale(1)';prev.style.boxShadow='none';}}
    const curIdx=step%9;const cur=document.getElementById('spin-slot-'+curIdx);
    if(cur){cur.style.background='rgba(255,255,255,0.25)';cur.style.borderColor='#ffffff';cur.style.transform='scale(1.08)';cur.style.boxShadow='0 0 16px rgba(255,255,255,0.5)';}
    prevIdx=curIdx;step++;
    if(step<totalSteps){if(step>totalSteps-6)dl=100+(totalSteps-step)*60;else if(step>totalSteps-12)dl=90;setTimeout(tick,dl);}
    else{setTimeout(()=>finalizeSpin(winIdx),400);}
  }
  setTimeout(tick,100);
}

function finalizeSpin(winIdx){
  const winner=SPIN_PRIZES[winIdx];const s=TIER_STYLES[winner.tier];
  const winSlot=document.getElementById('spin-slot-'+winIdx);
  if(winSlot){winSlot.style.background=winner.tier==='gold'?'rgba(255,215,0,0.45)':winner.tier==='silver'?'rgba(192,192,192,0.4)':'rgba(205,127,50,0.35)';winSlot.style.borderColor=s.label;winSlot.style.transform='scale(1.15)';winSlot.style.boxShadow='0 0 24px '+s.glow+',0 0 40px '+s.glow;}
  const rem=document.getElementById('spin-remaining');if(rem)rem.textContent=dailyData.spinCount||0;
  const btn=document.getElementById('spin-action-btn');
  if(btn){btn.disabled=false;btn.textContent='Claim '+winner.icon+' '+winner.label+'!';btn.style.background='linear-gradient(135deg,'+s.border+','+s.label+')';btn.onclick=()=>claimSpinPrize(winner);}
}

function claimSpinPrize(prize){
  document.getElementById('spin-popup')?.remove();
  switch(prize.type){
    case'life':addLife(prize.val);break;case'hammer':earnBooster('hammer',prize.val);break;
    case'bomb':earnBooster('bomb',prize.val);break;case'moves':earnBooster('extraMoves',prize.val);break;
    case'booster':earnBooster('extraMoves',1);break;
    case'pack':earnBooster('extraMoves',1);earnBooster('hammer',1);earnBooster('bomb',1);break;
    case'all3':addLife(3);earnBooster('extraMoves',3);earnBooster('hammer',3);earnBooster('bomb',3);break;
  }
  showRewardToast(prize.icon,prize.label+' claimed!');updateSpinUI();
}

// ═══ SPIN TRACKING ═══
function addSpin(amount){amount=amount||1;dailyData.spinCount=(dailyData.spinCount||0)+amount;saveDailyData();updateSpinUI();}
function useSpin(){if(!dailyData.spinCount||dailyData.spinCount<=0)return false;dailyData.spinCount--;saveDailyData();updateSpinUI();return true;}
function updateSpinUI(){
  const count=dailyData.spinCount||0;
  const db=document.getElementById('spin-desktop-btn');
  if(db){db.style.opacity=count>0?'1':'0.4';db.style.cursor=count>0?'pointer':'not-allowed';db.style.filter=count>0?'none':'grayscale(0.6)';
    const dc=document.getElementById('spin-desktop-count');if(dc){dc.textContent=count;dc.style.background=count>0?'rgba(255,220,0,0.2)':'rgba(100,100,100,0.2)';dc.style.color=count>0?'#ffe259':'#666';}}
  const mb=document.getElementById('spin-mobile-btn');
  if(mb){mb.style.opacity=count>0?'1':'0.4';mb.style.cursor=count>0?'pointer':'not-allowed';
    const mc=document.getElementById('spin-mobile-count');if(mc){mc.textContent=count;mc.style.background=count>0?'rgba(255,220,0,0.9)':'rgba(80,80,80,0.8)';mc.style.color=count>0?'#000':'#555';}}
}
function onSpinBtnClick(){
  const count=dailyData.spinCount||0;
  if(count<=0)return;
  useSpin();showLuckySpinPopup();
}
