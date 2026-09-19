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
const DIFF_CONFIG = {
  easy:   { movMult:1.40, tarMult:0.70, timeMult:1.40, starMult:0.85, label:'Easy' },
  normal: { movMult:1.00, tarMult:1.00, timeMult:1.00, starMult:1.00, label:'Normal' },
  hard:   { movMult:0.65, tarMult:1.40, timeMult:0.65, starMult:1.20, label:'Hard' },
};

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
  const region = getRegionForLevel(levelId);
  const diff = (typeof settings !== 'undefined' && settings.diff) || 'normal';
  const dc = DIFF_CONFIG[diff] || DIFF_CONFIG.normal;

  window._mapLevelSettings = {
    levelId: levelId,
    moves: Math.max(10, Math.round(base.moves * dc.movMult)),
    targetScore: Math.round(base.targetScore * dc.tarMult),
    timeSeconds: Math.round(base.timeSeconds * dc.timeMult),
    colors: base.colors,
    starMult: dc.starMult,
    objective: base.objective,
  };

  window._activeObjectiveSpec=base.objective;
  applyThemeColors(settings.theme||''); document.body.className=settings.theme||'';
  _goGameIntentional=true;
  goGame();
}

// ═══ LEVEL INFO POPUP ═══
function showLevelInfo(lv, region) {
  document.getElementById('level-info-popup')?.remove();
  const diff = (typeof settings !== 'undefined' && settings.diff) || 'normal';
  const dc = DIFF_CONFIG[diff] || DIFF_CONFIG.normal;
  const adjMoves = Math.max(10, Math.round(lv.moves * dc.movMult));
  const adjTarget = Math.round(lv.targetScore * dc.tarMult);
  const adjTime = Math.round(lv.timeSeconds * dc.timeMult);
  const adjStar3 = Math.round((lv.star3 || lv.targetScore * 1.6) * dc.tarMult * dc.starMult);

  const popup = document.createElement('div');
  popup.id = 'level-info-popup';
  popup.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.55);';
  popup.innerHTML = `<div style="background:linear-gradient(135deg,rgba(30,10,60,0.97),rgba(15,5,30,0.98));border:2px solid ${region.border};border-radius:24px;padding:28px 24px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
    <div style="font-family:'Fredoka One',cursive;font-size:1rem;color:${region.color};margin-bottom:4px;letter-spacing:1px;">LEVEL ${lv.id}</div>
    <div class="level-name">${lv.title}</div>
    <div class="pregame-objective">${objectiveDescription(lv.objective)}</div>
    <div style="font-size:1.6rem;margin-bottom:4px;">${'⭐'.repeat(lv.stars)}${'☆'.repeat(3-lv.stars)}</div>
    <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:rgba(255,255,255,0.6);margin-bottom:16px;">${dc.label}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">🎯</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#fff;">${adjTarget.toLocaleString()}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">${lv.objective.kind==='score'?'TARGET':'SCORE FOR STARS'}</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">👣</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#fff;">${adjMoves}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">MOVES</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">⏱️</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#43e97b;">${adjTime?fmtTimeSt(adjTime):'No timer'}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">TIME</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">⭐</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#ffe259;">${adjStar3.toLocaleString()}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">3 STARS</div></div>
    </div>
    <button onclick="document.getElementById('level-info-popup').remove();startMapLevel(${lv.id});" style="width:100%;padding:14px;background:linear-gradient(135deg,${region.color},${region.border});border:none;border-radius:50px;font-family:'Fredoka One',cursive;font-size:1.1rem;color:#fff;cursor:pointer;">▶ Play</button>
    <button onclick="document.getElementById('level-info-popup').remove();" style="margin-top:10px;width:100%;background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:0.8rem;cursor:pointer;padding:6px;">Close</button>
  </div>`;
  document.body.appendChild(popup);
}

// ═══ INIT ═══
function initMap() { loadMapData(); }
