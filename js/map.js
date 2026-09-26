// ═══ REGIONS ═══
const REGIONS = [
  { id:'berry-meadow', name:'Berry Meadow', emoji:'🍒', levels:[1,5], image:'berry-meadow.webp', color:'#e66f9b', description:'Learn the rhythm among berry hills.' },
  { id:'sundae-harbour', name:'Sundae Harbour', emoji:'🌅', levels:[6,10], image:'sundae-harbour.webp', color:'#f1a45f', description:'Break frost along the sugar coast.' },
  { id:'mintwood', name:'Mintwood Grove', emoji:'🌸', levels:[11,15], image:'mintwood.webp', color:'#68b991', description:'Build specials beneath the mint canopy.' },
  { id:'caramel-peaks', name:'Caramel Peaks', emoji:'🏔️', levels:[16,20], image:'caramel-peaks.webp', color:'#f2c46d', description:'Master every goal on the final climb.' },
];

// Release one: authored goals; timers are reserved for a later challenge mode.
const RELEASE_LEVEL_COUNT=20;
const OPENING_LEVELS=[
 {title:'First sweets',kind:'score',moves:24,score:3500,colors:4},
 {title:'Berry basket',kind:'collect',moves:26,score:1600,colors:4,targets:[{type:0,count:18}]},
 {title:'A little frost',kind:'ice',moves:26,score:1800,colors:4,pattern:'corners'},
 {title:'Diamond rush',kind:'collect',moves:27,score:2000,colors:5,targets:[{type:1,count:24}]},
 {title:'Garden treats',kind:'collect',moves:28,score:2200,colors:5,targets:[{type:0,count:16},{type:2,count:16}]},
 {title:'Frozen ring',kind:'ice',moves:28,score:2400,colors:5,pattern:'ring'},
 {title:'Mint on ice',kind:'mixed',moves:30,score:2500,colors:5,targets:[{type:2,count:22}],pattern:'corners'},
 {title:'Golden meadow',kind:'score',moves:26,score:6500,colors:5},
 {title:'Snow diamonds',kind:'ice',moves:32,score:2800,colors:5,pattern:'diamond',iceLayers:2},
 {title:'Honey harvest',kind:'collect',moves:28,score:3000,colors:5,targets:[{type:3,count:30}]},
 {title:'Berry frost',kind:'mixed',moves:34,score:3200,colors:5,targets:[{type:0,count:24}],pattern:'ring',iceLayers:2},
 {title:'Winter trail',kind:'mixed',moves:36,score:3400,colors:5,targets:[{type:1,count:24}],pattern:'diagonal',iceLayers:2},
 {title:'Grape grove',kind:'collect',moves:30,score:3400,colors:6,targets:[{type:4,count:22}]},
 {title:'Orchard duet',kind:'collect',moves:32,score:3600,colors:6,targets:[{type:0,count:22},{type:4,count:22}]},
 {title:'Crystal crossing',kind:'ice',moves:38,score:3800,colors:6,pattern:'cross',iceLayers:2},
 {title:'Sweet summit',kind:'score',moves:28,score:6500,colors:6},
 {title:'Frosted grapes',kind:'mixed',moves:40,score:4000,colors:6,targets:[{type:4,count:26}],pattern:'ring',iceLayers:2},
 {title:'Three baskets',kind:'collect',moves:34,score:4400,colors:6,targets:[{type:0,count:20},{type:1,count:20},{type:2,count:20}]},
 {title:'Diamond garden',kind:'mixed',moves:40,score:4600,colors:6,targets:[{type:1,count:28}],pattern:'diamond',iceLayers:2},
 {title:'Sweet celebration',kind:'mixed',moves:44,score:5000,colors:6,targets:[{type:3,count:28},{type:4,count:24}],pattern:'cross',iceLayers:2},
];
function generateLevels(){return OPENING_LEVELS.map((spec,i)=>({id:i+1,moves:spec.moves,timeSeconds:0,targetScore:spec.score,star2:Math.round(spec.score*1.25),star3:Math.round(spec.score*1.6),colors:spec.colors,title:spec.title,objective:{kind:spec.kind,targets:(spec.targets||[]).map(t=>({...t})),pattern:spec.pattern||null,iceLayers:spec.iceLayers||1},stars:0,completed:false,locked:i>0}));}

// ═══ STATE ═══
let mapData = { currentLevel:1, levels:[], selectedRegion:null, selectedLevel:null };
let selectedStartingBoosters = new Set();
let journeyReveal = null;

// ═══ SAVE / LOAD ═══
const MAP_VERSION = 6; // Progress is migrated by stable level id.
function saveMapData() {
  localStorage.setItem('cb_map', JSON.stringify({
    version: MAP_VERSION,
    currentLevel: mapData.currentLevel,
    levels: mapData.levels.map(l => ({ id:l.id, stars:l.stars, completed:l.completed, locked:l.locked }))
  }));
}
function loadMapData() {
  mapData.levels = generateLevels();
  try {
    const saved = localStorage.getItem('cb_map');
    if (saved) {
      const p = JSON.parse(saved);
      if (!Array.isArray(p.levels)) throw new Error('Invalid map');
      if(p.levels.some(l=>l.id>RELEASE_LEVEL_COUNT)&&!localStorage.getItem('cb_map_legacy_100'))localStorage.setItem('cb_map_legacy_100',saved);
      mapData.currentLevel = Math.max(1,Math.min(RELEASE_LEVEL_COUNT,Math.floor(Number(p.currentLevel)||1)));
      p.levels.forEach(s => {
        const lv = mapData.levels.find(l => l.id === s.id);
        if (lv) { lv.stars = Math.max(0,Math.min(3,Number(s.stars)||0)); lv.completed = s.completed||false; lv.locked = s.locked!==undefined ? s.locked : lv.locked; }
      });
    }
  } catch(e) { localStorage.removeItem('cb_map'); }
  mapData.levels[0].locked = false;
}

function completeLevel(levelId, starsCount, finalScore) {
  const lv = mapData.levels.find(l => l.id === levelId);
  if (!lv) return;
  const next = mapData.levels.find(l => l.id === levelId + 1);
  const unlockedNext=!!next?.locked;
  if (starsCount > lv.stars) lv.stars = starsCount;
  lv.completed = true;
  mapData.currentLevel=Math.max(mapData.currentLevel,Math.min(RELEASE_LEVEL_COUNT,levelId+1));
  if (next) { next.locked = false; mapData.currentLevel = Math.max(mapData.currentLevel, levelId + 1); }
  if(unlockedNext)journeyReveal={from:levelId,to:levelId+1};
  saveMapData();
  window.CandyCloud?.refreshProfile?.();
  window.CandyLeaderboard?.submit?.({level:levelId,score:finalScore,stars:starsCount});
  window.CandyWorldScene?.setLevel(mapData.currentLevel);
}

function getLevelSettings(levelId) {
  const lv = mapData.levels.find(l => l.id === levelId);
  if (!lv) return null;
  return { targetScore:lv.targetScore, moves:lv.moves, timeSeconds:lv.timeSeconds, colors:lv.colors, objective:lv.objective, title:lv.title, levelId:levelId };
}

function getRegionForLevel(levelId) {
  return REGIONS.find(r => levelId >= r.levels[0] && levelId <= r.levels[1]);
}

function getTotalStars() {
  return mapData.levels.reduce((sum, l) => sum + (l.stars || 0), 0);
}
function getRegionMastery(region) {
  const earned=mapData.levels.filter(level=>level.id>=region.levels[0]&&level.id<=region.levels[1]).reduce((sum,level)=>sum+level.stars,0);
  return {earned,tier:earned>=15?'Gold':earned>=10?'Silver':earned>=5?'Bronze':'',next:earned<5?5:earned<10?10:earned<15?15:15};
}

function fmtTimeSt(s) { const m=Math.floor(s/60),sc=s%60; return m+':'+(sc<10?'0':'')+sc; }

// ═══ DIFFICULTY CONFIG ═══
// ═══ MAP SCREEN ═══
function journeyPath(positions,start=0,end=positions.length-1){
  if(end<start)return '';
  let d='M'+positions[start].x+' '+positions[start].y;
  for(let i=start+1;i<=end;i++){
    const previous=positions[i-1],point=positions[i],middle=(previous.y+point.y)/2;
    d+=' C'+previous.x+' '+middle+' '+point.x+' '+middle+' '+point.x+' '+point.y;
  }
  return d;
}
function renderMapScreen(){
  const host=document.getElementById('map-container');if(!host)return;host.innerHTML='';
  const prefersLessMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const currentRegion=getRegionForLevel(mapData.currentLevel)||REGIONS[0];
  const header=document.createElement('header');header.className='app-screen-header journey-header';
  header.innerHTML='<button class="app-icon-button" aria-label="Back home" onclick="goScreen(&quot;start&quot;)">←</button><div><strong>Sweet Journey</strong><small>'+currentRegion.name+'</small></div><span class="journey-star-total" aria-label="'+getTotalStars()+' of '+(RELEASE_LEVEL_COUNT*3)+' stars">★ <b>'+getTotalStars()+'</b><small>/ '+(RELEASE_LEVEL_COUNT*3)+'</small></span>';host.append(header);
  const scroll=document.createElement('div');scroll.className='journey-scroll';host.append(scroll);
  const trail=document.createElement('div');trail.className='journey-trail';scroll.append(trail);
  const positions=mapData.levels.map((lv,i)=>({x:50+29*Math.sin(i*1.02-.52),y:137+i*94}));
  const height=positions.at(-1).y+150;trail.style.height=height+'px';
  REGIONS.forEach((region,chapterIndex)=>{
    const first=region.levels[0]-1,last=region.levels[1]-1,chapterLevels=mapData.levels.slice(first,last+1),completed=chapterLevels.filter(level=>level.completed).length;
    const chapter=document.createElement('section');chapter.className='journey-chapter'+(completed===chapterLevels.length?' is-complete':'')+(chapterLevels.every(level=>level.locked)?' is-locked':'');chapter.dataset.world=region.id;
    chapter.style.top=(positions[first].y-137)+'px';chapter.style.height=(positions[last].y-positions[first].y+220)+'px';chapter.style.setProperty('--chapter-image',`url("../images/worlds/${region.image}")`);chapter.style.setProperty('--chapter-accent',region.color);
    chapter.setAttribute('aria-label',region.name+', '+completed+' of '+chapterLevels.length+' levels complete');trail.append(chapter);
    const mastery=getRegionMastery(region);
    const sign=document.createElement('div');sign.className='journey-region';sign.style.top=(positions[first].y-118)+'px';sign.innerHTML=`<span class="journey-region-mark" aria-hidden="true">${region.emoji}</span><span class="journey-region-copy"><small>WORLD ${chapterIndex+1} · LEVELS ${region.levels[0]}–${region.levels[1]}</small><strong>${region.name}</strong></span><b class="journey-mastery ${mastery.tier?'has-mastery':''}" aria-label="${mastery.earned} of 15 stars, ${mastery.tier||'no'} mastery">★ ${mastery.earned}/15</b>`;trail.append(sign);
  });
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 '+height);svg.setAttribute('preserveAspectRatio','none');svg.classList.add('journey-path');svg.setAttribute('aria-hidden','true');
  const addRoute=(className,d)=>{if(!d)return;const path=document.createElementNS(svg.namespaceURI,'path');path.classList.add(className);path.setAttribute('d',d);path.setAttribute('vector-effect','non-scaling-stroke');path.setAttribute('pathLength','100');svg.append(path);return path;};
  addRoute('journey-route-shadow',journeyPath(positions));
  addRoute('journey-route-base',journeyPath(positions));
  addRoute('journey-route-stripe',journeyPath(positions));
  const reveal=journeyReveal&&journeyReveal.to===mapData.currentLevel?journeyReveal:null;
  addRoute('journey-route-done',journeyPath(positions,0,Math.max(0,reveal&&!prefersLessMotion?reveal.from-1:mapData.currentLevel-1)));
  if(reveal&&!prefersLessMotion)addRoute('journey-route-reveal',journeyPath(positions,reveal.from-1,reveal.to-1));
  trail.append(svg);
  mapData.levels.forEach((lv,i)=>{
    const region=getRegionForLevel(lv.id),pos=positions[i];
    const gate=lv.id%5===0;
    const button=document.createElement('button');button.className='journey-level world-'+region.id+(lv.completed?' completed':'')+(lv.id===mapData.currentLevel?' current':'')+(gate?' chapter-gate':'')+(reveal?.to===lv.id?' newly-unlocked':'');button.disabled=lv.locked;button.dataset.level=String(lv.id);button.style.left=pos.x+'%';button.style.top=pos.y+'px';button.style.setProperty('--level-accent',region.color);button.setAttribute('aria-label','Level '+lv.id+', '+lv.title+(lv.locked?', locked':', '+lv.stars+' stars'));
    button.innerHTML=(gate?'<i class="journey-gate-mark" aria-hidden="true">♛</i>':'')+'<span class="journey-level-face"><b>'+(lv.locked?'🔒':lv.id)+'</b></span><small class="journey-level-stars" aria-hidden="true">'+(lv.completed?'★'.repeat(lv.stars)+'☆'.repeat(3-lv.stars):lv.id===mapData.currentLevel?'PLAY':'')+'</small>';
    button.onclick=()=>{mapData.selectedRegion=region;showLevelInfo(lv,region);};trail.append(button);
  });
  if(reveal){
    const marker=document.createElement('div');marker.className='journey-unlock-banner';marker.style.left=positions[reveal.to-1].x+'%';marker.style.top=(positions[reveal.to-1].y-86)+'px';marker.setAttribute('role','status');marker.textContent='Level '+reveal.to+' unlocked!';trail.append(marker);
    if(!prefersLessMotion){
      const traveler=document.createElement('img');traveler.className='journey-traveler';traveler.src='images/candies/berry.svg';traveler.alt='';traveler.setAttribute('aria-hidden','true');trail.append(traveler);
      const from=positions[reveal.from-1],to=positions[reveal.to-1];
      traveler.animate([{left:from.x+'%',top:from.y+'px',transform:'translate(-50%,-50%) scale(.65)',opacity:0},{left:from.x+'%',top:from.y+'px',transform:'translate(-50%,-50%) scale(1)',opacity:1,offset:.15},{left:to.x+'%',top:to.y+'px',transform:'translate(-50%,-50%) scale(1.12)',opacity:1,offset:.85},{left:to.x+'%',top:to.y+'px',transform:'translate(-50%,-50%) scale(.65)',opacity:0}],{duration:1050,easing:'ease-in-out'}).finished.finally(()=>traveler.remove());
    }
  }
  const currentButton=document.createElement('button');currentButton.type='button';currentButton.className='journey-find-current';currentButton.textContent='✦  Level '+mapData.currentLevel;currentButton.setAttribute('aria-label','Find current level '+mapData.currentLevel);currentButton.onclick=()=>scroll.scrollTo({top:Math.max(0,positions[mapData.currentLevel-1].y-scroll.clientHeight*.48),behavior:prefersLessMotion?'instant':'smooth'});host.append(currentButton);
  requestAnimationFrame(()=>{
    const target=positions[mapData.currentLevel-1].y-scroll.clientHeight*.48;
    if(reveal&&!prefersLessMotion){
      scroll.scrollTop=Math.max(0,positions[reveal.from-1].y-scroll.clientHeight*.48);
      requestAnimationFrame(()=>{trail.classList.add('journey-revealing');scroll.scrollTo({top:Math.max(0,target),behavior:'smooth'});});
    }else scroll.scrollTop=Math.max(0,target);
  });
  if(reveal)journeyReveal=null;
}

function renderLevelSelect(){renderMapScreen();}

function startMapLevel(levelId) {
  const base = getLevelSettings(levelId);
  if (!base) return;
  mapData.selectedLevel = levelId;
  window.CandyWorldScene?.setLevel(levelId);
  const region = getRegionForLevel(levelId);
  window._mapLevelSettings = {
    levelId: levelId,
    moves: base.moves,
    targetScore: base.targetScore,
    timeSeconds: base.timeSeconds,
    colors: base.colors,
    starMult: 1,
    objective: base.objective,
  };

  window._activeObjectiveSpec=base.objective;
  applyThemeColors(settings.theme||'');
  _goGameIntentional=true;
  goGame();
}

function toggleStartingBooster(type, button) {
  if (!['extraMoves','hammer','bomb'].includes(type)) return;
  if ((livesData.boosters[type] || 0) <= 0) {
    button?.classList.add('empty-pulse');
    setTimeout(() => button?.classList.remove('empty-pulse'), 420);
    return;
  }
  // The hammer and prism both need the first board tap, so only one can be armed.
  if (type === 'hammer' || type === 'bomb') {
    const other = type === 'hammer' ? 'bomb' : 'hammer';
    selectedStartingBoosters.delete(other);
    const otherButton = document.querySelector(`[data-start-booster="${other}"]`);
    otherButton?.classList.remove('selected');
    otherButton?.setAttribute('aria-pressed','false');
  }
  if (selectedStartingBoosters.has(type)) selectedStartingBoosters.delete(type);
  else selectedStartingBoosters.add(type);
  const selected = selectedStartingBoosters.has(type);
  button?.classList.toggle('selected', selected);
  button?.setAttribute('aria-pressed', String(selected));
}

function applyStartingBoosters(boosters) {
  const chosen = [...new Set(boosters)].filter(type => ['extraMoves','hammer','bomb'].includes(type));
  if (chosen.includes('extraMoves') && livesData.boosters.extraMoves > 0) {
    livesData.boosters.extraMoves--;
    moves += 5;
    playBoosterSound('extraMoves');
    window.CandyEconomy?.consume?.('extraMoves')?.catch(()=>{});
  }
  // Targeted tools are armed for the player's first chosen candy.
  if (chosen.includes('hammer') && livesData.boosters.hammer > 0) {
    livesData.boosters.hammer--;
    hammerMode = true;
    bombMode = false;
    showHammerHint(true);
    document.getElementById('ingame-btn-hammer')?.classList.add('active-hammer');
  } else if (chosen.includes('bomb') && livesData.boosters.bomb > 0) {
    hammerMode = false;
    bombMode = true;
    document.getElementById('ingame-btn-bomb')?.classList.add('active-hammer');
    document.getElementById('board-message').textContent = 'Choose a candy color for the prism blast.';
  }
  saveLives();
  updateLivesUI();
  updateIngameBoosterUI();
  updateStats();
  saveGameState();
}

function startMapLevelPrepared(levelId, boosters = []) {
  startMapLevel(levelId);
  if (mapData.selectedLevel !== levelId || gameEnded) return;
  hidePreGame();
  applyStartingBoosters(boosters);
}

function startSelectedMapLevel(levelId) {
  const boosters = [...selectedStartingBoosters];
  document.getElementById('level-info-popup')?.remove();
  selectedStartingBoosters.clear();
  startMapLevelPrepared(levelId, boosters);
}

// ═══ LEVEL INFO POPUP ═══
function showLevelInfo(lv, region) {
  document.getElementById('level-info-popup')?.remove();
  selectedStartingBoosters.clear();
  const adjMoves = lv.moves;
  const adjTarget = lv.targetScore;
  const adjTime = lv.timeSeconds;
  const adjStar3 = lv.star3 || Math.round(lv.targetScore * 1.6);

  const popup = document.createElement('div');
  popup.id = 'level-info-popup';
  popup.className='level-popup';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-labelledby','level-popup-title');
  popup.style.setProperty('--popup-world-image',`url("../images/worlds/${region.image}")`);
  popup.onclick=event=>{if(event.target===popup)popup.remove();};
  const booster = (type, icon, name, note) => {
    const count = livesData.boosters[type] || 0;
    return `<button type="button" class="level-booster-choice${count ? '' : ' empty'}" data-start-booster="${type}" aria-pressed="false" ${count ? '' : 'disabled'} onclick="toggleStartingBooster('${type}',this)">
      <span class="level-booster-icon" aria-hidden="true">${icon}</span><span><strong>${name}</strong><small>${note}</small></span><b>x${count}</b><i aria-hidden="true">✓</i>
    </button>`;
  };
  popup.innerHTML = `<div class="level-popup-card">
    <div class="level-popup-crown" aria-hidden="true">✦</div>
    <button type="button" class="level-popup-close" aria-label="Close" onclick="document.getElementById('level-info-popup').remove()">×</button>
    <div class="level-popup-heading"><span class="level-popup-number">LEVEL ${lv.id}</span><div class="level-popup-stars" aria-label="${lv.stars} of 3 stars">${'★'.repeat(lv.stars)}${'☆'.repeat(3-lv.stars)}</div></div>
    <div class="level-name" id="level-popup-title">${lv.title}</div>
    <div class="level-popup-goal"><small>YOUR GOAL</small><strong>${objectiveDescription(lv.objective)}</strong></div>
    <div class="level-popup-brief"><span>◈ ${adjMoves} moves</span><span>✦ ${adjTarget.toLocaleString()} points</span></div>
    <div class="level-booster-heading"><strong>Start with a boost</strong><small>Choose +5 moves and one tool</small></div>
    <div class="level-booster-picker">
      ${booster('extraMoves','⚡','+5 moves','Extra turns')}
      ${booster('hammer','🔨','Hammer','Tap a candy')}
      ${booster('bomb','💎','Prism','Pick a color')}
    </div>
    <button class="btn btn-play level-start-button" onclick="startSelectedMapLevel(${lv.id});">Play!</button>
  </div>`;
  document.body.appendChild(popup);
}

// ═══ INIT ═══
function initMap() { loadMapData(); }
