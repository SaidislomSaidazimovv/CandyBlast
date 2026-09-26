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
const SPIN_SHORT_LABELS=['5 hearts','Boost x3','3 hearts','Gift pack','+10 moves','Booster','1 heart','Hammer','Bomb'];

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
    card.innerHTML=`<div class="spin-empty-art" aria-hidden="true"><svg viewBox="0 0 24 24"><use href="images/ui/icons.svg#spin"></use></svg><b>0</b></div><div class="ov-kicker">Daily bonus</div>
      <h1 class="spin-title">Lucky Spin</h1><p class="spin-subtitle">Your wheel is resting. Collect a spin from Daily Rewards and come back for a surprise.</p>
      <button class="btn btn-secondary spin-rewards-link" onclick="goScreen('rewards');renderRewardsScreen();">See daily rewards <span aria-hidden="true">→</span></button>`;
    container.appendChild(card);
    return;
  }

  // Has spins — show wheel
  card.classList.add('has-spins');
  const weights=[10,10,16,17,17,8,8,7,7];const total=weights.reduce((a,b)=>a+b,0);
  let rand=Math.random()*total,winIdx=0;
  for(let i=0;i<weights.length;i++){rand-=weights[i];if(rand<=0){winIdx=i;break;}}

  card.innerHTML=`<div class="ov-kicker">DAILY BONUS</div><h1 class="spin-title">Lucky Spin</h1>
    <p class="spin-subtitle">One turn, one sweet surprise. Spins ready: <strong id="spin-remaining">${count}</strong></p>
    <div class="spin-wheel-shell"><span class="spin-pointer" aria-hidden="true"></span><div id="spin-grid" class="spin-rotor" role="img" aria-label="Wheel with nine possible rewards">
      ${SPIN_PRIZES.map((p,i)=>{const angle=-Math.PI/2+i*2*Math.PI/9,x=(50+35*Math.cos(angle)).toFixed(2),y=(50+35*Math.sin(angle)).toFixed(2);return`<div class="spin-slot tier-${p.tier}" id="spin-slot-${i}" style="--slot-x:${x}%;--slot-y:${y}%;" aria-hidden="true"><span class="spin-prize-icon">${p.icon}</span><strong>${SPIN_SHORT_LABELS[i]}</strong></div>`;}).join('')}
    </div><span class="spin-wheel-hub" aria-hidden="true">✦</span></div>
    <button id="spin-action-btn" class="btn btn-play" onclick="doSpin(${winIdx})">Spin the wheel</button>
    <p class="spin-hint" role="status">The pointer shows your prize.</p>`;
  container.appendChild(card);
}

// Called from daily rewards when spin is earned as prize
function showLuckySpinPopup(){
  openSpinScreen();
}

let spinRunning=false, spinPending=null,spinPendingServer=false;
async function doSpin(winIdx){
  if(spinRunning||spinPending||!Number.isInteger(winIdx)||!SPIN_PRIZES[winIdx])return;
  const serverSpin=globalThis.CandyEconomy?.isAuthoritative?.();
  if(serverSpin){spinRunning=true;const waiting=document.getElementById('spin-action-btn');if(waiting){waiting.disabled=true;waiting.textContent='Checking server…';}try{const result=await globalThis.CandyEconomy.spin();winIdx=result.prize_index;spinPendingServer=true;}catch(error){spinRunning=false;if(waiting){waiting.disabled=false;waiting.textContent='Try again';}showRewardToast('⏱️','Spin needs an internet connection');return;}}
  else{if(!useSpin())return;spinRunning=true;spinPendingServer=false;}
  const ac=getAC();if(ac?.state==='suspended')ac.resume().catch(()=>{});
  if(typeof playNoise==='function')playNoise(.055,.045,520);
  const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const rotor=document.getElementById('spin-grid');if(rotor?.style){rotor.style.transitionDuration=reduced?'250ms':'3300ms';rotor.style.transform='rotate('+(1800-winIdx*40)+'deg)';}
  // Deduct spin

  const btn=document.getElementById('spin-action-btn');if(btn){btn.disabled=true;btn.textContent='Spinning...';}
  const totalSteps=28+winIdx;let step=0,dl=60,prevIdx=-1;
  if(reduced){setTimeout(()=>finalizeSpin(winIdx),280);return;}
  function tick(){
    if(!document.getElementById('spin-grid')){spinRunning=false;return;}
    if(prevIdx>=0)document.getElementById('spin-slot-'+prevIdx)?.classList.toggle('is-active',false);
    const curIdx=step%9;const cur=document.getElementById('spin-slot-'+curIdx);
    cur?.classList.toggle('is-active',true);
    playTone(680-step*6,.045,'triangle',.075);
    if(step%3===0&&typeof vibrate==='function')vibrate(8);
    prevIdx=curIdx;step++;
    if(step<totalSteps){if(step>totalSteps-6)dl=100+(6-(totalSteps-step))*65;else if(step>totalSteps-12)dl=90;setTimeout(tick,dl);}
    else{setTimeout(()=>finalizeSpin(winIdx),500);}
  }
  setTimeout(tick,100);
}

function finalizeSpin(winIdx){
  if(!spinRunning)return;spinRunning=false;spinPending=winIdx;
  document.querySelectorAll('.spin-slot').forEach((slot,i)=>{slot.classList.remove('is-active');slot.classList.toggle('is-winner',i===winIdx);slot.style.transform='';slot.style.boxShadow='none';});
  playWin();
  const winner=SPIN_PRIZES[winIdx];
  const winSlot=document.getElementById('spin-slot-'+winIdx);
  if(winSlot)winSlot.classList.toggle('is-winner',true);
  const rem=document.getElementById('spin-remaining');if(rem)rem.textContent=dailyData.spinCount||0;
  const btn=document.getElementById('spin-action-btn');
  if(btn){btn.disabled=false;btn.textContent='Claim '+winner.label;btn.classList?.add?.('spin-claim');btn.onclick=()=>claimSpinPrize(winner);}
  const hint=document.querySelector?.('.spin-hint');if(hint)hint.textContent='You won '+winner.label+'!';
}

function claimSpinPrize(prize){
  if(spinPending===null||SPIN_PRIZES[spinPending]!==prize)return;
  spinPending=null;
  if(!spinPendingServer)switch(prize.type){
    case'life':addLife(prize.val);break;case'hammer':earnBooster('hammer',prize.val);break;
    case'bomb':earnBooster('bomb',prize.val);break;case'moves':earnBooster('extraMoves',prize.val);break;
    case'booster':earnBooster('extraMoves',1);break;
    case'pack':earnBooster('extraMoves',1);earnBooster('hammer',1);earnBooster('bomb',1);break;
    case'all3':addLife(3);earnBooster('extraMoves',3);earnBooster('hammer',3);earnBooster('bomb',3);break;
  }
  spinPendingServer=false;
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
