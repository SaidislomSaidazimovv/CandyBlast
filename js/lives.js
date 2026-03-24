// ═══════ LIVES + BOOSTERS ═══════
const MAX_LIVES=5;
const LIFE_REGEN_MS=30*60*1000;

let livesData={lives:5,lastLostAt:null,boosters:{extraMoves:2,hammer:1,bomb:1}};
let hammerMode=false;
let lifeTimerInterval=null;

// ═══ SAVE / LOAD ═══
function saveLives(){localStorage.setItem('cb_lives',JSON.stringify(livesData));}
function loadLives(){
  try{const saved=localStorage.getItem('cb_lives');if(saved)livesData={...livesData,...JSON.parse(saved)};}catch(e){localStorage.removeItem('cb_lives');}
  regenLives();
}
function regenLives(){
  if(livesData.lives>=MAX_LIVES){livesData.lastLostAt=null;saveLives();return;}
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
  if(heartsEl){heartsEl.innerHTML='';for(let i=0;i<MAX_LIVES;i++){const h=document.createElement('span');h.textContent=i<livesData.lives?'❤️':'🖤';h.style.cssText='font-size:1.2rem;line-height:1;';heartsEl.appendChild(h);}}
  // Mobile hearts
  const heartsElM=document.getElementById('lives-hearts-mobile');
  if(heartsElM){heartsElM.innerHTML='';for(let i=0;i<MAX_LIVES;i++){const h=document.createElement('span');h.textContent=i<livesData.lives?'❤️':'🖤';h.style.cssText='font-size:0.95rem;line-height:1;';heartsElM.appendChild(h);}}
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
function showBoosterEarned(type){
  const icons={extraMoves:'⚡',hammer:'🔨',bomb:'💣'};
  const popup=document.createElement('div');
  popup.style.cssText="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);font-family:'Fredoka One',cursive;font-size:1.4rem;color:#ffe259;background:rgba(80,20,120,0.95);border:1.5px solid rgba(255,255,255,0.2);border-radius:20px;padding:16px 28px;z-index:999;text-align:center;animation:popIn 0.4s ease forwards;";
  popup.textContent=icons[type]+' Booster earned!';
  document.body.appendChild(popup);setTimeout(()=>popup.remove(),1500);
}

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
    hammerMode=false;
  }
}

// ─── Bomb ───
function activateBomb(){
  // Remove all candies of random existing color
  const colorCounts={};
  for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){const v=grid[r][c];if(v>=0)colorCounts[v]=(colorCounts[v]||0)+1;}
  const colors=Object.keys(colorCounts).map(Number);
  if(colors.length===0){hidePreGame();return;}
  const target=colors[Math.floor(Math.random()*colors.length)];
  for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){if(grid[r][c]===target)grid[r][c]=-1;}
  renderBoard();
  hidePreGame();
  busy=true;
  setTimeout(async()=>{
    for(let col=0;col<GRID;col++){let empty=0;for(let r=GRID-1;r>=0;r--){if(grid[r][col]===-1)empty++;else if(empty>0){grid[r+empty][col]=grid[r][col];grid[r][col]=-1;}}for(let r=0;r<empty;r++)grid[r][col]=randType();}
    renderBoard();await processMatches();busy=false;
  },350);
}

// ═══ PRE-GAME ═══
function showPreGame(){const ov=document.getElementById('overlay-pregame');if(ov)ov.classList.remove('hidden');}
function hidePreGame(){
  const ov=document.getElementById('overlay-pregame');if(ov)ov.classList.add('hidden');
  // Start timer now that pregame is dismissed
  if(window._pendingTimer&&window._pendingTimer>0){
    if(typeof startGameTimer==='function')startGameTimer(window._pendingTimer);
    window._pendingTimer=0;
  }
}

// ═══ NO LIVES POPUP ═══
function showNoLivesPopup(){
  const t=getTimeUntilNextLife();
  const msg=t?'Next life in '+formatTime(t):'Wait 30 min per life.';
  const popup=document.createElement('div');popup.className='overlay';
  popup.innerHTML='<div class="overlay-card" style="max-width:280px;text-align:center;"><div style="font-size:3rem;margin-bottom:12px;">💔</div><div class="ov-title" style="font-size:1.6rem;">No Lives!</div><div style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin:12px 0 20px;">'+msg+'</div><button class="btn btn-play" style="padding:12px;width:100%;" onclick="this.closest(\'.overlay\').remove()">OK</button></div>';
  document.body.appendChild(popup);
}

// ═══ IN-GAME BOOSTERS ═══
function useIngameBooster(type){
  if(livesData.boosters[type]<=0){
    const btn=document.getElementById('ingame-btn-'+type);
    if(btn){btn.style.animation='shake 0.4s ease';setTimeout(()=>btn.style.animation='',420);}
    return;
  }
  if(busy)return;
  if(type==='hammer'&&hammerMode){
    hammerMode=false;showHammerHint(false);
    const hb=document.getElementById('ingame-btn-hammer');if(hb)hb.classList.remove('active-hammer');
    livesData.boosters.hammer++;saveLives();updateLivesUI();return;
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
}
function activateIngameBomb(){
  const counts=Array(TYPES).fill(0);
  for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)if(typeof grid[r][c]==='number'&&grid[r][c]>=0)counts[grid[r][c]]++;
  const target=counts.indexOf(Math.max(...counts));
  const cells=[];
  for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)if(grid[r][c]===target){cells.push({r,c});const el=getCell(r,c);if(el)el.classList.add('matched');grid[r][c]=-1;}
  busy=true;
  setTimeout(async()=>{
    for(let c=0;c<GRID;c++){let empty=0;for(let r=GRID-1;r>=0;r--){if(grid[r][c]===-1)empty++;else if(empty>0){grid[r+empty][c]=grid[r][c];grid[r][c]=-1;}}for(let r=0;r<empty;r++)grid[r][c]=randType();}
    renderBoard();await processMatches();busy=false;
  },380);
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
