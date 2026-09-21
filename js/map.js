// ═══ REGIONS ═══
const REGIONS = [
  { id:'central-asia', name:'Markaziy Osiyo', emoji:'🏔️', levels:[1,20], theme:'', color:'#c471ed', bgColor:'rgba(196,113,237,0.15)', border:'rgba(196,113,237,0.4)', description:'Sweet mountains of candy!' },
  { id:'europe', name:'Yevropa', emoji:'🏰', levels:[21,40], theme:'theme-ocean', color:'#00c8ff', bgColor:'rgba(0,200,255,0.15)', border:'rgba(0,200,255,0.4)', description:'Candy castles await!' },
  { id:'americas', name:'Amerika', emoji:'🌋', levels:[41,60], theme:'theme-fire', color:'#ff4500', bgColor:'rgba(255,69,0,0.15)', border:'rgba(255,69,0,0.4)', description:'Hot and spicy candies!' },
  { id:'asia', name:'Sharqiy Osiyo', emoji:'🌸', levels:[61,80], theme:'theme-forest', color:'#43e97b', bgColor:'rgba(67,233,123,0.15)', border:'rgba(67,233,123,0.4)', description:'Magical forest sweets!' },
  { id:'africa', name:'Afrika', emoji:'🌅', levels:[81,100], theme:'theme-candy', color:'#ff5fa0', bgColor:'rgba(255,95,160,0.15)', border:'rgba(255,95,160,0.4)', description:'Rainbow candy paradise!' },
];

// Release one: authored goals; timers are reserved for a later challenge mode.
const RELEASE_LEVEL_COUNT=20;
const OPENING_LEVELS=[
 {title:'First sweets',kind:'score',moves:24,score:1200,colors:4},
 {title:'Berry basket',kind:'collect',moves:26,score:1600,colors:4,targets:[{type:0,count:18}]},
 {title:'A little frost',kind:'ice',moves:26,score:1800,colors:4,pattern:'corners'},
 {title:'Diamond rush',kind:'collect',moves:27,score:2000,colors:5,targets:[{type:1,count:24}]},
 {title:'Garden treats',kind:'collect',moves:28,score:2200,colors:5,targets:[{type:0,count:16},{type:2,count:16}]},
 {title:'Frozen ring',kind:'ice',moves:28,score:2400,colors:5,pattern:'ring'},
 {title:'Mint on ice',kind:'mixed',moves:30,score:2500,colors:5,targets:[{type:2,count:22}],pattern:'corners'},
 {title:'Golden meadow',kind:'score',moves:26,score:3200,colors:5},
 {title:'Snow diamonds',kind:'ice',moves:30,score:2800,colors:5,pattern:'diamond'},
 {title:'Honey harvest',kind:'collect',moves:28,score:3000,colors:5,targets:[{type:3,count:30}]},
 {title:'Berry frost',kind:'mixed',moves:30,score:3200,colors:5,targets:[{type:0,count:24}],pattern:'ring'},
 {title:'Winter trail',kind:'mixed',moves:32,score:3400,colors:5,targets:[{type:1,count:24}],pattern:'diagonal'},
 {title:'Grape grove',kind:'collect',moves:30,score:3400,colors:6,targets:[{type:4,count:22}]},
 {title:'Orchard duet',kind:'collect',moves:32,score:3600,colors:6,targets:[{type:0,count:22},{type:4,count:22}]},
 {title:'Crystal crossing',kind:'ice',moves:32,score:3800,colors:6,pattern:'cross'},
 {title:'Sweet summit',kind:'score',moves:28,score:4800,colors:6},
 {title:'Frosted grapes',kind:'mixed',moves:34,score:4000,colors:6,targets:[{type:4,count:26}],pattern:'ring'},
 {title:'Three baskets',kind:'collect',moves:34,score:4400,colors:6,targets:[{type:0,count:20},{type:1,count:20},{type:2,count:20}]},
 {title:'Diamond garden',kind:'mixed',moves:34,score:4600,colors:6,targets:[{type:1,count:28}],pattern:'diamond'},
 {title:'Sweet celebration',kind:'mixed',moves:36,score:5000,colors:6,targets:[{type:3,count:28},{type:4,count:24}],pattern:'cross'},
];
function generateLevels(){return OPENING_LEVELS.map((spec,i)=>({id:i+1,moves:spec.moves,timeSeconds:0,targetScore:spec.score,star2:Math.round(spec.score*1.25),star3:Math.round(spec.score*1.6),colors:spec.colors,title:spec.title,objective:{kind:spec.kind,targets:(spec.targets||[]).map(t=>({...t})),pattern:spec.pattern||null},stars:0,completed:false,locked:i>0}));}

// ═══ STATE ═══
let mapData = { currentLevel:1, levels:[], selectedRegion:null, selectedLevel:null };
let selectedStartingBoosters = new Set();

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
  if (starsCount > lv.stars) lv.stars = starsCount;
  lv.completed = true;
  mapData.currentLevel=Math.max(mapData.currentLevel,Math.min(RELEASE_LEVEL_COUNT,levelId+1));
  const next = mapData.levels.find(l => l.id === levelId + 1);
  if (next) { next.locked = false; mapData.currentLevel = Math.max(mapData.currentLevel, levelId + 1); }
  saveMapData();
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

function fmtTimeSt(s) { const m=Math.floor(s/60),sc=s%60; return m+':'+(sc<10?'0':'')+sc; }

// ═══ DIFFICULTY CONFIG ═══
// ═══ MAP SCREEN ═══
function renderMapScreen(){
  const host=document.getElementById('map-container');if(!host)return;host.innerHTML='';
  const header=document.createElement('header');header.className='app-screen-header journey-header';
  header.innerHTML='<button class="app-icon-button" aria-label="Home" onclick="goScreen(&quot;start&quot;)">←</button><div><strong>Sweet Journey</strong><small>Level '+mapData.currentLevel+' / '+RELEASE_LEVEL_COUNT+'</small></div><span>⭐ '+getTotalStars()+'</span>';host.append(header);
  const scroll=document.createElement('div');scroll.className='journey-scroll';host.append(scroll);
  const trail=document.createElement('div');trail.className='journey-trail';scroll.append(trail);
  const positions=mapData.levels.map((lv,i)=>({x:50+28*Math.sin(i*.85),y:130+i*112}));
  const height=positions.at(-1).y+150;trail.style.height=height+'px';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 '+height);svg.setAttribute('preserveAspectRatio','none');svg.classList.add('journey-path');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',positions.map((p,i)=>{if(!i)return 'M'+p.x+' '+p.y;const prev=positions[i-1],mid=(prev.y+p.y)/2;return 'C'+prev.x+' '+mid+' '+p.x+' '+mid+' '+p.x+' '+p.y;}).join(' '));svg.append(path);trail.append(svg);
  mapData.levels.forEach((lv,i)=>{
    const region=getRegionForLevel(lv.id),pos=positions[i];
    if(i%20===0){const sign=document.createElement('div');sign.className='journey-region';sign.style.top=(pos.y-100)+'px';sign.textContent=region.emoji+' '+region.name;trail.append(sign);}
    const button=document.createElement('button');button.className='journey-level'+(lv.completed?' completed':'')+(lv.id===mapData.currentLevel?' current':'');button.disabled=lv.locked;button.style.left=pos.x+'%';button.style.top=pos.y+'px';button.setAttribute('aria-label','Level '+lv.id+(lv.locked?', locked':', '+lv.stars+' stars'));
    button.innerHTML='<span>'+(lv.locked?'🔒':lv.id)+'</span><small>'+(lv.completed?'⭐'.repeat(lv.stars):lv.id===mapData.currentLevel?'PLAY':'')+'</small>';
    button.onclick=()=>{mapData.selectedRegion=region;showLevelInfo(lv,region);};trail.append(button);
  });
  requestAnimationFrame(()=>{scroll.scrollTop=Math.max(0,positions[Math.max(0,Math.min(positions.length-1,mapData.currentLevel-1))].y-scroll.clientHeight*.45);});
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
  const booster = (type, icon, name, note) => {
    const count = livesData.boosters[type] || 0;
    return `<button type="button" class="level-booster-choice${count ? '' : ' empty'}" data-start-booster="${type}" aria-pressed="false" ${count ? '' : 'disabled'} onclick="toggleStartingBooster('${type}',this)">
      <span class="level-booster-icon" aria-hidden="true">${icon}</span><span><strong>${name}</strong><small>${note}</small></span><b>x${count}</b><i aria-hidden="true">✓</i>
    </button>`;
  };
  popup.innerHTML = `<div class="level-popup-card">
    <div class="level-popup-handle" aria-hidden="true"></div>
    <button type="button" class="level-popup-close" aria-label="Close" onclick="document.getElementById('level-info-popup').remove()">×</button>
    <div class="level-popup-candy" aria-hidden="true"><img src="images/candies/${['berry','diamond','mint','star','grape'][Math.min(4,lv.colors-4)]}.svg" alt=""></div>
    <div class="ov-kicker">Level ${lv.id} · ${lv.colors} candy colors</div>
    <div class="level-name" id="level-popup-title">${lv.title}</div>
    <div class="pregame-objective">${objectiveDescription(lv.objective)}</div>
    <div class="level-popup-stars" aria-label="${lv.stars} of 3 stars">${'⭐'.repeat(lv.stars)}${'☆'.repeat(3-lv.stars)}</div>
    <div class="level-facts">
      <div><span>🎯</span><strong>${adjTarget.toLocaleString()}</strong><small>${lv.objective.kind==='score'?'Target':'Star score'}</small></div>
      <div><span>👣</span><strong>${adjMoves}</strong><small>Moves</small></div>
      <div><span>⭐</span><strong>${adjStar3.toLocaleString()}</strong><small>Three stars</small></div>
    </div>
    <div class="level-booster-heading"><strong>Starting boosters</strong><small>Pick +5 moves and one targeted tool</small></div>
    <div class="level-booster-picker">
      ${booster('extraMoves','⚡','+5 moves','Added before play')}
      ${booster('hammer','🔨','Hammer','Choose one candy')}
      ${booster('bomb','💣','Prism blast','Choose one color')}
    </div>
    <button class="btn btn-play level-start-button" onclick="startSelectedMapLevel(${lv.id});">▶ Play level</button>
  </div>`;
  document.body.appendChild(popup);
}

// ═══ INIT ═══
function initMap() { loadMapData(); }
