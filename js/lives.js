// ═══════ LIVES + BOOSTERS ═══════
const MAX_LIVES=5;
const LIFE_REGEN_MS=30*60*1000;

let livesData={lives:5,lastLostAt:null,boosters:{extraMoves:2,hammer:1,bomb:1}};
let hammerMode=false,bombMode=false;
let lifeTimerInterval=null;

// ═══ SAVE / LOAD ═══
function saveLives(){localStorage.setItem('cb_lives',JSON.stringify(livesData));}
function loadLives(){
  try{const saved=localStorage.getItem('cb_lives');if(saved)livesData={...livesData,...JSON.parse(saved)};}catch(e){localStorage.removeItem('cb_lives');}
  regenLives();
}
function regenLives(){
  if(livesData.lives>=MAX_LIVES){if(livesData.lastLostAt!==null){livesData.lastLostAt=null;saveLives();}return;}
  if(!livesData.lastLostAt)return;
  const elapsed=Date.now()-livesData.lastLostAt;
  const regened=Math.floor(elapsed/LIFE_REGEN_MS);
  if(regened>0){
    livesData.lives=Math.min(MAX_LIVES,livesData.lives+regened);
    if(livesData.lives>=MAX_LIVES)livesData.lastLostAt=null;
    else livesData.lastLostAt+=regened*LIFE_REGEN_MS;
    saveLives();
  }
}

// ═══ LIVES OPS ═══
function loseLife(){
  if(livesData.lives<=0)return;
  livesData.lives--;
  if(livesData.lives<MAX_LIVES&&!livesData.lastLostAt)livesData.lastLostAt=Date.now();
  saveLives();updateLivesUI();
}
function addLife(amount){
  amount=amount||1;livesData.lives=Math.min(MAX_LIVES,livesData.lives+amount);
  if(livesData.lives>=MAX_LIVES)livesData.lastLostAt=null;
  saveLives();updateLivesUI();
}
function hasLives(){return livesData.lives>0;}

// ═══ TIMER ═══
function startLifeTimer(){
  if(lifeTimerInterval)clearInterval(lifeTimerInterval);
  lifeTimerInterval=setInterval(()=>{regenLives();updateLivesUI();updateTimerDisplay();},1000);
}
function getTimeUntilNextLife(){
  if(livesData.lives>=MAX_LIVES||!livesData.lastLostAt)return null;
  const elapsed=Date.now()-livesData.lastLostAt;
  return LIFE_REGEN_MS-(elapsed%LIFE_REGEN_MS);
}
function formatTime(ms){
  if(!ms)return '';
  const totalSec=Math.ceil(ms/1000);
  const min=Math.floor(totalSec/60);
  const sec=totalSec%60;
  return min+':'+sec.toString().padStart(2,'0');
}

// ═══ UI ═══
function updateLivesUI(){
  // Desktop hearts
  const heartsEl=document.getElementById('lives-hearts');
  if(heartsEl&&heartsEl.dataset.lives!==String(livesData.lives)){heartsEl.dataset.lives=String(livesData.lives);heartsEl.innerHTML='';for(let i=0;i<MAX_LIVES;i++){const h=document.createElement('span');h.textContent=i<livesData.lives?'❤️':'🖤';h.style.cssText='font-size:1.2rem;line-height:1;';heartsEl.appendChild(h);}}
  // Mobile hearts
  const heartsElM=document.getElementById('lives-hearts-mobile');
  if(heartsElM&&heartsElM.dataset.lives!==String(livesData.lives)){heartsElM.dataset.lives=String(livesData.lives);heartsElM.innerHTML='';for(let i=0;i<MAX_LIVES;i++){const h=document.createElement('span');h.textContent=i<livesData.lives?'❤️':'🖤';h.style.cssText='font-size:0.95rem;line-height:1;';heartsElM.appendChild(h);}}
  // Boosters
  ['extraMoves','hammer','bomb'].forEach(type=>{
    const el=document.getElementById('booster-count-'+type);if(el)el.textContent=livesData.boosters[type];
    const btn=document.getElementById('booster-btn-'+type);if(btn)btn.classList.toggle('empty',livesData.boosters[type]<=0);
  });
  // Play button
  const playBtn=document.querySelector('#screen-start .btn-play');
  if(playBtn){playBtn.disabled=livesData.lives<=0;playBtn.style.opacity=livesData.lives<=0?'0.5':'1';playBtn.style.cursor=livesData.lives<=0?'not-allowed':'pointer';}
  updateIngameBoosterUI();
}
function updateTimerDisplay(){
  const remaining=getTimeUntilNextLife();
  const txt=remaining?formatTime(remaining):'Full';
  const clr=remaining?'#ff88cc':'#43e97b';
  // Desktop
  const timerEl=document.getElementById('lives-timer');
  if(timerEl){timerEl.textContent=txt;timerEl.style.color=clr;}
  // Mobile
  const timerElM=document.getElementById('lives-timer-mobile');
  if(timerElM){timerElM.textContent=txt;timerElM.style.color=clr;}
}

// ═══ BOOSTERS ═══
function useBooster(type){
  if(type==='bomb'){if(livesData.boosters.bomb<=0)return false;hidePreGame();selectBombTarget();return true;}
  if(livesData.boosters[type]<=0){shakeBoosterBtn(type);return false;}
  livesData.boosters[type]--;saveLives();updateLivesUI();
  if(type==='extraMoves')activateExtraMoves();
  else if(type==='hammer')activateHammer();
  else if(type==='bomb')activateBomb();
  return true;
}
function earnBooster(type,amount){
  amount=amount||1;livesData.boosters[type]+=amount;saveLives();updateLivesUI();
  showBoosterEarned(type);
}
function shakeBoosterBtn(type){
  const btn=document.getElementById('booster-btn-'+type);
  if(!btn)return;btn.style.animation='shake 0.4s ease';setTimeout(()=>btn.style.animation='',420);
}
function showBoosterEarned(type){showRewardToast({extraMoves:'⚡',hammer:'🔨',bomb:'💣'}[type],{extraMoves:'+5 moves',hammer:'Hammer',bomb:'Color bomb'}[type]);}

// ─── Extra Moves ───
function activateExtraMoves(){
  moves+=5;updateStats();
  const movesBox=document.querySelectorAll('.stat-box')[2];
  if(movesBox){movesBox.style.animation='boosterFlash 0.5s ease 3';setTimeout(()=>movesBox.style.animation='',1600);}
  hidePreGame();
}

// ─── Hammer ───
function activateHammer(){
  hammerMode=true;hidePreGame();
  showHammerHint(true);
}
function showHammerHint(show){
  let hint=document.getElementById('hammer-hint');
  if(show){
    if(!hint){
      hint=document.createElement('div');hint.id='hammer-hint';
      hint.style.cssText="text-align:center;color:#ffe259;font-family:'Fredoka One',cursive;font-size:1rem;padding:6px;animation:floatUD 1s ease-in-out infinite;";
      hint.textContent='🔨 Tap any candy to remove it!';
      const bw=document.getElementById('board-wrap');
      if(bw)bw.insertAdjacentElement('beforebegin',hint);
    }
  }else{
    if(hint)hint.remove();
    document.getElementById('ingame-btn-hammer')?.classList.remove('active-hammer');
    hammerMode=false;bombMode=false;document.getElementById('ingame-btn-bomb')?.classList.remove('active-hammer');
  }
}

// ─── Bomb ───
function selectBombTarget(){
  if(hammerMode)return;
  bombMode=!bombMode;selected=null;document.querySelectorAll('.cell.selected').forEach(el=>el.classList.remove('selected'));
  document.getElementById('ingame-btn-bomb')?.classList.toggle('active-hammer',bombMode);
  document.getElementById('board-message').textContent=bombMode?'Tap a candy: clear every candy of that color. Tap Bomb again to cancel.':'';
}
function activateBomb(){hidePreGame();selectBombTarget();}

// ═══ PRE-GAME ═══
function showPreGame(){pregame=true;document.getElementById('pregame-title').textContent='Level '+level;document.getElementById('pregame-objective').textContent=objectiveDescription(objective);const ov=document.getElementById('overlay-pregame');if(ov)ov.classList.remove('hidden');}
function hidePreGame(){
  pregame=false;
  const ov=document.getElementById('overlay-pregame');if(ov)ov.classList.add('hidden');
  // Start timer now that pregame is dismissed
  if(window._pendingTimer&&window._pendingTimer>0){
    if(typeof startGameTimer==='function')startGameTimer(window._pendingTimer);
    window._pendingTimer=0;
  }
  startPlayTimer();saveGameState();
}
function cancelPreGame(){
  window._pendingTimer=0;stopGameTimer();gameEnded=true;pregame=false;clearGameState();
  if(mapData.selectedRegion){goScreen('levelselect');renderLevelSelect(mapData.selectedRegion);}
  else{goScreen('map');renderMapScreen();}
}

// ═══ NO LIVES POPUP ═══
function showNoLivesPopup(){
  const t=getTimeUntilNextLife();
  const msg=t?'Next life in '+formatTime(t):'Wait 30 min per life.';
  const popup=document.createElement('div');popup.className='overlay';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-label','No lives');
  popup.innerHTML='<div class="overlay-card game-dialog lives-dialog"><div class="dialog-candy" aria-hidden="true"><img src="images/candies/berry.svg" alt=""></div><div class="ov-kicker">Hearts are resting</div><div class="ov-title">More lives soon</div><div class="ov-sub">'+msg+'</div><button class="btn btn-play" onclick="this.closest(\'.overlay\').remove()">Got it</button></div>';
  document.body.appendChild(popup);
}

// ═══ IN-GAME BOOSTERS ═══
function useIngameBooster(type){
  if(busy||paused||pregame||gameEnded)return;
  if(type==='bomb'){if(bombMode||livesData.boosters.bomb>0)selectBombTarget();return;}
  if(bombMode)return;
  if(type==='hammer'&&hammerMode){
    showHammerHint(false);livesData.boosters.hammer++;saveLives();updateLivesUI();saveGameState();return;
  }
  if(livesData.boosters[type]<=0){
    const btn=document.getElementById('ingame-btn-'+type);
    if(btn){btn.style.animation='shake 0.4s ease';setTimeout(()=>btn.style.animation='',420);}
    return;
  }

  livesData.boosters[type]--;saveLives();updateLivesUI();
  if(type==='extraMoves'){
    moves+=5;updateStats();
    const mv=document.getElementById('moves-val');
    if(mv){mv.style.animation='boosterFlash 0.4s ease 3';setTimeout(()=>mv.style.animation='',1300);}
  }else if(type==='hammer'){
    hammerMode=true;showHammerHint(true);
    const hb=document.getElementById('ingame-btn-hammer');if(hb)hb.classList.add('active-hammer');
  }else if(type==='bomb'){
    activateIngameBomb();
  }
  if(!busy)saveGameState();
}
function activateIngameBomb(r,c){
  if(!bombMode||busy||paused||gameEnded||livesData.boosters.bomb<=0)return;
  const target=getType(r,c);if(target<0)return;
  bombMode=false;livesData.boosters.bomb--;saveLives();updateLivesUI();
  document.getElementById('ingame-btn-bomb')?.classList.remove('active-hammer');document.getElementById('board-message').textContent='';
  let removed=0;busy=true;const session=gameSession;
  for(let row=0;row<GRID;row++)for(let col=0;col<GRID;col++)if(getType(row,col)===target){getCell(row,col)?.classList.add('matched');removeCandy(row,col);removed++;}
  score+=removed*30;levelScore+=removed*30;updateStats();showBombEffect(r,c);playMatch(removed);
  setTimeout(async()=>{if(session!==gameSession)return;await dropCandies();if(session!==gameSession)return;await processMatches();if(session!==gameSession)return;finishMove();},settings.anim?300:0);
}
function updateIngameBoosterUI(){
  ['extraMoves','hammer','bomb'].forEach(type=>{
    const btn=document.getElementById('ingame-btn-'+type);
    const cnt=document.getElementById('ingame-count-'+type);
    if(cnt)cnt.textContent=livesData.boosters[type];
    if(btn)btn.classList.toggle('empty',livesData.boosters[type]<=0);
  });
}

// ═══ INIT ═══
function initLives(){loadLives();updateLivesUI();updateTimerDisplay();startLifeTimer();}
