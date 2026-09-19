// ═══ LUCKY SPIN — FULL SCREEN VERSION ═══
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

// Opens spin as a full screen (like settings/leaderboard)
function openSpinScreen(){
  goScreen('spin');
  renderSpinScreen();
}

function renderSpinScreen(){
  const container=document.getElementById('spin-screen-container');
  if(!container)return;
  container.innerHTML='';

  const count=dailyData.spinCount||0;

  // Close button (top-right, same style as settings/leaderboard)
  const closeBtn=document.createElement('button');
  closeBtn.className='app-icon-button spin-close';closeBtn.setAttribute('aria-label','Close');
  closeBtn.textContent='✕';
  closeBtn.onclick=()=>{if(!spinRunning&&!spinPending)goScreen('start');};
  container.appendChild(closeBtn);

  // Card wrapper
  const card=document.createElement('div');
  card.className='spin-card';

  if(count<=0){
    // No spins state
    card.innerHTML=`
      <div class="spin-emblem" aria-hidden="true">🎡</div><div class="ov-kicker">Daily bonus</div>
      <div class="spin-title">Lucky Spin</div>
      <div class="spin-subtitle">No spins available.<br>Earn another spin from Daily Rewards.</div>
      <button class="btn btn-secondary" onclick="goScreen('rewards');renderRewardsScreen();">View rewards</button>
    `;
    container.appendChild(card);
    return;
  }

  // Has spins — show wheel
  const weights=[10,10,16,17,17,8,8,7,7];const total=weights.reduce((a,b)=>a+b,0);
  let rand=Math.random()*total,winIdx=0;
  for(let i=0;i<weights.length;i++){rand-=weights[i];if(rand<=0){winIdx=i;break;}}

  card.innerHTML=`
    <div class="ov-kicker">Daily bonus</div><div class="spin-title">🎡 Lucky Spin</div>
    <div class="spin-subtitle">Spins left: <strong id="spin-remaining">${count}</strong></div>
    <div id="spin-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:20px;">
      ${SPIN_PRIZES.map((p,i)=>{const s=TIER_STYLES[p.tier];return`<div class="spin-slot" id="spin-slot-${i}" style="border-radius:14px;padding:12px 6px;background:${s.bg};border:2px solid ${s.border};cursor:default;transition:all 0.08s;position:relative;"><div style="font-size:1.6rem;line-height:1;margin-bottom:4px;">${p.icon}</div><div style="font-family:'Fredoka One',cursive;font-size:0.7rem;color:#fff;line-height:1.2;margin-bottom:2px;">${p.label}</div><div style="font-size:0.55rem;font-weight:700;color:${s.label};letter-spacing:0.5px;">${p.sub}</div></div>`;}).join('')}
    </div>
    <button id="spin-action-btn" class="btn btn-play" style="width:100%;padding:14px;font-size:1.1rem;" onclick="doSpin(${winIdx})">🎡 Spin!</button>
  `;
  container.appendChild(card);
}

// Called from daily rewards when spin is earned as prize
function showLuckySpinPopup(){
  openSpinScreen();
}

let spinRunning=false, spinPending=null;
function doSpin(winIdx){
  if(spinRunning||spinPending||!Number.isInteger(winIdx)||!SPIN_PRIZES[winIdx])return;
  if(!useSpin())return;
  spinRunning=true;
  const ac=getAC();if(ac?.state==='suspended')ac.resume().catch(()=>{});
  // Deduct spin

  const btn=document.getElementById('spin-action-btn');if(btn){btn.disabled=true;btn.textContent='Spinning...';}
  const totalSteps=28+winIdx;let step=0,dl=60,prevIdx=-1;
  function tick(){
    if(!document.getElementById('spin-grid')){spinRunning=false;return;}
    if(prevIdx>=0){const prev=document.getElementById('spin-slot-'+prevIdx);if(prev){const s=TIER_STYLES[SPIN_PRIZES[prevIdx].tier];prev.style.background=s.bg;prev.style.borderColor=s.border;prev.style.transform='scale(1)';prev.style.boxShadow='none';}}
    const curIdx=step%9;const cur=document.getElementById('spin-slot-'+curIdx);
    if(cur){cur.style.background='rgba(255,255,255,0.25)';cur.style.borderColor='#ffffff';cur.style.transform='scale(1.08)';cur.style.boxShadow='0 0 16px rgba(255,255,255,0.5)';}
    document.querySelectorAll('.spin-slot').forEach((slot,i)=>slot.classList.toggle('is-active',i===curIdx));
    playTone(500+curIdx*35,.045,'triangle',.09);
    prevIdx=curIdx;step++;
    if(step<totalSteps){if(step>totalSteps-6)dl=100+(6-(totalSteps-step))*65;else if(step>totalSteps-12)dl=90;setTimeout(tick,dl);}
    else{setTimeout(()=>finalizeSpin(winIdx),400);}
  }
  setTimeout(tick,100);
}

function finalizeSpin(winIdx){
  if(!spinRunning)return;spinRunning=false;spinPending=winIdx;
  document.querySelectorAll('.spin-slot').forEach((slot,i)=>{slot.classList.remove('is-active');slot.classList.toggle('is-winner',i===winIdx);slot.style.transform='';slot.style.boxShadow='none';});
  playWin();
  const winner=SPIN_PRIZES[winIdx];const s=TIER_STYLES[winner.tier];
  const winSlot=document.getElementById('spin-slot-'+winIdx);
  if(winSlot){winSlot.style.background=winner.tier==='gold'?'rgba(255,215,0,0.45)':winner.tier==='silver'?'rgba(192,192,192,0.4)':'rgba(205,127,50,0.35)';winSlot.style.borderColor=s.label;winSlot.style.transform='scale(1.15)';winSlot.style.boxShadow='0 0 24px '+s.glow+',0 0 40px '+s.glow;}
  const rem=document.getElementById('spin-remaining');if(rem)rem.textContent=dailyData.spinCount||0;
  const btn=document.getElementById('spin-action-btn');
  if(btn){btn.disabled=false;btn.textContent='Claim '+winner.icon+' '+winner.label+'!';btn.style.background='linear-gradient(135deg,'+s.border+','+s.label+')';btn.onclick=()=>claimSpinPrize(winner);}
}

function claimSpinPrize(prize){
  if(spinPending===null||SPIN_PRIZES[spinPending]!==prize)return;
  spinPending=null;
  switch(prize.type){
    case'life':addLife(prize.val);break;case'hammer':earnBooster('hammer',prize.val);break;
    case'bomb':earnBooster('bomb',prize.val);break;case'moves':earnBooster('extraMoves',prize.val);break;
    case'booster':earnBooster('extraMoves',1);break;
    case'pack':earnBooster('extraMoves',1);earnBooster('hammer',1);earnBooster('bomb',1);break;
    case'all3':addLife(3);earnBooster('extraMoves',3);earnBooster('hammer',3);earnBooster('bomb',3);break;
  }
  showRewardToast(prize.icon,prize.label+' claimed!');updateSpinUI();
  // Re-render to show updated count or "no spins" state
  const count=dailyData.spinCount||0;
  if(count>0){renderSpinScreen();}
  else{goScreen('start');}
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
  openSpinScreen();
}
