// ═══════ LIVES + BOOSTERS ═══════
const MAX_LIVES=5;
const LIFE_REGEN_MS=30*60*1000;
const MAX_INVENTORY=999;

let livesData={lives:5,lastLostAt:null,boosters:{extraMoves:2,hammer:1,bomb:1}};
let hammerMode=false,bombMode=false;
let lifeTimerInterval=null;

// ═══ SAVE / LOAD ═══
function safeWholeNumber(value,min,max,fallback){
  return Number.isFinite(value)?Math.min(max,Math.max(min,Math.floor(value))):fallback;
}
function normalizeLivesData(value){
  const source=value&&typeof value==='object'?value:{};
  const stock=source.boosters&&typeof source.boosters==='object'?source.boosters:{};
  const lives=safeWholeNumber(source.lives,0,MAX_LIVES,MAX_LIVES);
  let lastLostAt=Number.isFinite(source.lastLostAt)&&source.lastLostAt>0?Math.floor(source.lastLostAt):null;
  if(lastLostAt!==null&&lastLostAt>Date.now())lastLostAt=Date.now();
  if(lives>=MAX_LIVES)lastLostAt=null;
  else if(lastLostAt===null)lastLostAt=Date.now();
  return {lives,lastLostAt,boosters:{
    extraMoves:safeWholeNumber(stock.extraMoves,0,MAX_INVENTORY,0),
    hammer:safeWholeNumber(stock.hammer,0,MAX_INVENTORY,0),
    bomb:safeWholeNumber(stock.bomb,0,MAX_INVENTORY,0)
  }};
}
function saveLives(){livesData=normalizeLivesData(livesData);localStorage.setItem('cb_lives',JSON.stringify(livesData));}
function loadLives(){
  try{const saved=localStorage.getItem('cb_lives');livesData=normalizeLivesData(saved?JSON.parse(saved):livesData);}catch(e){localStorage.removeItem('cb_lives');livesData=normalizeLivesData(null);}
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
  amount=safeWholeNumber(amount||1,0,MAX_LIVES,1);livesData.lives=Math.min(MAX_LIVES,livesData.lives+amount);
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
  const elapsed=Math.max(0,Date.now()-livesData.lastLostAt);
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
  const heart=(full,size)=>`<span class="life-heart${full?'':' is-empty'}" style="--heart-size:${size}"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="images/ui/icons.svg#${full?'heart':'heart-empty'}"></use></svg></span>`;
  // Desktop hearts
  const heartsEl=document.getElementById('lives-hearts');
  if(heartsEl&&heartsEl.dataset.lives!==String(livesData.lives)){heartsEl.dataset.lives=String(livesData.lives);heartsEl.innerHTML=Array.from({length:MAX_LIVES},(_,i)=>heart(i<livesData.lives,'20px')).join('');}
  // Mobile hearts
  const heartsElM=document.getElementById('lives-hearts-mobile');
  if(heartsElM&&heartsElM.dataset.lives!==String(livesData.lives)){heartsElM.dataset.lives=String(livesData.lives);heartsElM.innerHTML=Array.from({length:MAX_LIVES},(_,i)=>heart(i<livesData.lives,'17px')).join('');}
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
  if(!Object.hasOwn(livesData.boosters,type))return;
  amount=safeWholeNumber(amount||1,0,MAX_INVENTORY,1);livesData.boosters[type]=Math.min(MAX_INVENTORY,livesData.boosters[type]+amount);saveLives();updateLivesUI();
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
  document.getElementById('hammer-hint')?.remove();
  const message=document.getElementById('board-message');
  if(show){
    if(message)message.textContent='Tap the candy you want the hammer to remove.';
  }else{
    document.getElementById('ingame-btn-hammer')?.classList.remove('active-hammer');
    hammerMode=false;bombMode=false;document.getElementById('ingame-btn-bomb')?.classList.remove('active-hammer');
    if(message&&!gameEnded)message.textContent=boardInstruction();
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
  mapData.selectedLevel=null;window._mapLevelSettings=null;
  goScreen('map');renderMapScreen();
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
