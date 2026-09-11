// ═══ REGIONS ═══
const REGIONS = [
  { id:'central-asia', name:'Markaziy Osiyo', emoji:'🏔️', levels:[1,20], theme:'', color:'#c471ed', bgColor:'rgba(196,113,237,0.15)', border:'rgba(196,113,237,0.4)', description:'Sweet mountains of candy!' },
  { id:'europe', name:'Yevropa', emoji:'🏰', levels:[21,40], theme:'theme-ocean', color:'#00c8ff', bgColor:'rgba(0,200,255,0.15)', border:'rgba(0,200,255,0.4)', description:'Candy castles await!' },
  { id:'americas', name:'Amerika', emoji:'🌋', levels:[41,60], theme:'theme-fire', color:'#ff4500', bgColor:'rgba(255,69,0,0.15)', border:'rgba(255,69,0,0.4)', description:'Hot and spicy candies!' },
  { id:'asia', name:'Sharqiy Osiyo', emoji:'🌸', levels:[61,80], theme:'theme-forest', color:'#43e97b', bgColor:'rgba(67,233,123,0.15)', border:'rgba(67,233,123,0.4)', description:'Magical forest sweets!' },
  { id:'africa', name:'Afrika', emoji:'🌅', levels:[81,100], theme:'theme-candy', color:'#ff5fa0', bgColor:'rgba(255,95,160,0.15)', border:'rgba(255,95,160,0.4)', description:'Rainbow candy paradise!' },
];

// The opening chapter teaches one mechanic at a time.
const OPENING_LEVELS=[
  {title:'First sweets',kind:'score',time:120},
  {title:'Berry basket',kind:'collect',targets:[{type:0,count:18}],time:0},
  {title:'A little frost',kind:'ice',pattern:'corners',time:0},
  {title:'Diamond rush',kind:'collect',targets:[{type:1,count:24}],time:100},
  {title:'Garden treats',kind:'collect',targets:[{type:0,count:16},{type:2,count:16}],time:0},
  {title:'Frozen ring',kind:'ice',pattern:'ring',time:0},
  {title:'Mint on ice',kind:'mixed',targets:[{type:2,count:22}],pattern:'corners',time:0},
  {title:'Golden minute',kind:'score',time:90},
  {title:'Snow diamonds',kind:'ice',pattern:'diamond',time:0},
  {title:'Honey harvest',kind:'collect',targets:[{type:3,count:26}],time:0},
  {title:'Berry frost',kind:'mixed',targets:[{type:0,count:24}],pattern:'ring',time:0},
  {title:'Winter sprint',kind:'mixed',targets:[{type:1,count:24}],pattern:'diagonal',time:120},
];
function generateLevels(){
  const levels=[];
  for(let i=1;i<=100;i++){
    const colors=i<=12?4:i<=40?5:6;
    const cycle=(i-1)%4;
    const spec=OPENING_LEVELS[i-1]||{
      title:['Sweet summit','Candy orchard','Frost trail','Frozen harvest'][cycle],
      kind:['score','collect','ice','mixed'][cycle],time:cycle===0?120:0,
      ...(cycle===1||cycle===3?{targets:[{type:(i-1)%colors,count:24+Math.floor(i/8)}]}:{}),
      ...(cycle>=2?{pattern:['ring','diamond','cross','diagonal'][Math.floor(i/4)%4]}:{}),
    };
    const moves=Math.max(22,34-Math.floor((i-1)/8));
    const targetScore=i===1?1298:1400+i*90;
    levels.push({id:i,moves,timeSeconds:spec.time,targetScore,star2:Math.round(targetScore*1.25),star3:Math.round(targetScore*1.6),
      colors,title:spec.title,objective:{kind:spec.kind,targets:spec.targets||[],pattern:spec.pattern||null},
      stars:0,completed:false,locked:i>1});
  }
  return levels;
}

// ═══ STATE ═══
let mapData = { currentLevel:1, levels:[], selectedRegion:null, selectedLevel:null };

// ═══ SAVE / LOAD ═══
const MAP_VERSION = 5; // Progress is migrated by stable level id.
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
      mapData.currentLevel = p.currentLevel || 1;
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
  header.innerHTML='<button class="app-icon-button" aria-label="Home" onclick="goScreen(&quot;start&quot;)">←</button><div><strong>Sweet Journey</strong><small>Level '+mapData.currentLevel+' / 100</small></div><span>⭐ '+getTotalStars()+'</span>';host.append(header);
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
  requestAnimationFrame(()=>{scroll.scrollTop=Math.max(0,positions[Math.min(99,mapData.currentLevel-1)].y-scroll.clientHeight*.45);});
}

function renderLevelSelect(region) {
  const c = document.getElementById('levelselect-container');
  if (!c) return;
  c.innerHTML = '';
  applyThemeColors(region.theme);

  // Header
  const h = document.createElement('div');h.className='app-screen-header';
  h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;flex-shrink:0;background:linear-gradient(180deg,rgba(0,0,0,0.75) 0%,transparent 100%);position:relative;z-index:10;';
  const regDone = mapData.levels.filter(l=>l.id>=region.levels[0]&&l.id<=region.levels[1]&&l.completed).length;
  h.innerHTML = `<button onclick="goScreen('map');renderMapScreen();" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.2);color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">←</button><div style="text-align:center;"><div style="font-size:1.6rem;">${region.emoji}</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.5);">${region.name}</div></div><div style="font-family:'Fredoka One',cursive;font-size:0.8rem;color:${region.color};text-align:right;">${regDone}/20<br><span style="font-size:0.65rem;color:rgba(255,255,255,0.35);font-family:sans-serif;">done</span></div>`;
  c.appendChild(h);

  const scroll = document.createElement('div');scroll.className='app-scroll';
  scroll.style.cssText = 'flex:1;overflow-y:auto;overflow-x:hidden;padding:10px 20px 40px;scrollbar-width:none;';
  const levels = mapData.levels.filter(l => l.id >= region.levels[0] && l.id <= region.levels[1]);
  const positions = ['left','center','right','center'];

  // Inject pulse animation
  if (!document.getElementById('map-animations')) {
    const st = document.createElement('style');
    st.id = 'map-animations';
    st.textContent = '@keyframes levelPulse{0%,100%{box-shadow:0 0 0 6px rgba(255,255,255,0.2),0 0 24px rgba(255,255,255,0.3),0 4px 16px rgba(0,0,0,0.5);}50%{box-shadow:0 0 0 10px rgba(255,255,255,0.08),0 0 40px rgba(255,255,255,0.15),0 4px 16px rgba(0,0,0,0.5);}}';
    document.head.appendChild(st);
  }

  levels.forEach((lv, idx) => {
    const pos = positions[idx % 4];
    const isCurrent = lv.id === mapData.currentLevel;
    const isCompleted = lv.completed;
    const isLocked = lv.locked;
    const dotSize = isCurrent ? 88 : 76;

    const row = document.createElement('div');
    row.style.cssText = `display:flex;justify-content:${pos==='left'?'flex-start':pos==='right'?'flex-end':'center'};padding:0 10px;margin-bottom:4px;position:relative;`;

    // Connector
    if (idx < levels.length - 1) {
      const line = document.createElement('div');
      line.style.cssText = `position:absolute;width:3px;height:52px;background:${levels[idx+1].locked?'rgba(255,255,255,0.08)':`linear-gradient(180deg,${region.color}80,${region.color}30)`};border-radius:2px;bottom:-52px;z-index:0;${pos==='left'?'left:52px':pos==='right'?'right:52px':'left:50%;transform:translateX(-50%)'};`;
      row.appendChild(line);
    }

    const dot = document.createElement('div');
    dot.className='app-level'+(isCurrent?' is-current':'')+(isCompleted?' is-complete':'')+(isLocked?' is-locked':'');
    dot.style.cssText = `width:${dotSize}px;height:${dotSize}px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:${isLocked?'not-allowed':'pointer'};border:${isCurrent?'4px solid #ffffff':isCompleted?`3px solid ${region.color}`:isLocked?'2px solid rgba(255,255,255,0.12)':`2px solid ${region.border}`};background:${isCompleted?`radial-gradient(circle,${region.bgColor.replace('0.15','0.5')},rgba(0,0,0,0.6))`:isLocked?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.5)'};box-shadow:${isCurrent?`0 0 0 6px ${region.color}40,0 0 24px ${region.color}60,0 4px 16px rgba(0,0,0,0.5)`:isCompleted?`0 0 12px ${region.color}40,0 4px 12px rgba(0,0,0,0.4)`:'0 4px 12px rgba(0,0,0,0.3)'};position:relative;z-index:1;transition:transform 0.15s;opacity:${isLocked?'0.45':'1'};${isCurrent?'animation:levelPulse 2s ease-in-out infinite;':''}`;

    const starsHtml = isCompleted ? `<div style="font-size:0.7rem;letter-spacing:1px;margin-bottom:3px;line-height:1;">${'⭐'.repeat(lv.stars)}${'☆'.repeat(3-lv.stars)}</div>` : '';
    dot.innerHTML = `${starsHtml}<div style="font-family:'Fredoka One',cursive;font-size:${isCurrent?'1.3rem':'1.1rem'};color:${isLocked?'rgba(255,255,255,0.3)':'#fff'};line-height:1;text-shadow:0 2px 6px rgba(0,0,0,0.6);">${isLocked?'🔒':lv.id}</div>${isCurrent?`<div style="font-size:0.5rem;color:${region.color};font-family:'Fredoka One',cursive;margin-top:3px;letter-spacing:1px;">NOW</div>`:''}`;

    if (!isLocked) {
      dot.onclick = () => showLevelInfo(lv, region);
      dot.onmouseenter = () => dot.style.transform='scale(1.1)';
      dot.onmouseleave = () => dot.style.transform='';
    }
    if(!isLocked){dot.title=lv.title+' — '+objectiveDescription(lv.objective);dot.setAttribute('role','button');dot.tabIndex=0;dot.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showLevelInfo(lv,region);}};}
    row.appendChild(dot);
    scroll.appendChild(row);
  });

  c.appendChild(scroll);

  // Auto-scroll to current level
  setTimeout(() => {
    const ci = levels.findIndex(l => l.id === mapData.currentLevel);
    if (ci > 2) scroll.scrollTop = Math.max(0, (ci-2)*92);
  }, 150);
}

// ═══ START MAP LEVEL ═══
function startMapLevel(levelId) {
  mapData.selectedLevel = levelId;
  const base = getLevelSettings(levelId);
  if (!base) return;
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
