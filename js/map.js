// ═══ REGIONS ═══
const REGIONS = [
  { id:'central-asia', name:'Markaziy Osiyo', emoji:'🏔️', levels:[1,20], theme:'', color:'#c471ed', bgColor:'rgba(196,113,237,0.15)', border:'rgba(196,113,237,0.4)', description:'Sweet mountains of candy!' },
  { id:'europe', name:'Yevropa', emoji:'🏰', levels:[21,40], theme:'theme-ocean', color:'#00c8ff', bgColor:'rgba(0,200,255,0.15)', border:'rgba(0,200,255,0.4)', description:'Candy castles await!' },
  { id:'americas', name:'Amerika', emoji:'🌋', levels:[41,60], theme:'theme-fire', color:'#ff4500', bgColor:'rgba(255,69,0,0.15)', border:'rgba(255,69,0,0.4)', description:'Hot and spicy candies!' },
  { id:'asia', name:'Sharqiy Osiyo', emoji:'🌸', levels:[61,80], theme:'theme-forest', color:'#43e97b', bgColor:'rgba(67,233,123,0.15)', border:'rgba(67,233,123,0.4)', description:'Magical forest sweets!' },
  { id:'africa', name:'Afrika', emoji:'🌅', levels:[81,100], theme:'theme-candy', color:'#ff5fa0', bgColor:'rgba(255,95,160,0.15)', border:'rgba(255,95,160,0.4)', description:'Rainbow candy paradise!' },
];

// ═══ LEVEL GENERATION (balanced + timer) ═══
function generateLevels() {
  const levels = [];
  for (let i = 1; i <= 100; i++) {
    const moves = Math.max(18, Math.round(34 - (i - 1) * 0.16));
    const baseTime = Math.round(120 - (i-1) * 0.75);
    const timeSeconds = Math.max(45, baseTime);
    const achievable = moves * 100;
    const targetScore = Math.round(achievable * (0.38 + (i / 100) * 0.18));
    const star2 = Math.round(targetScore * 1.25);
    const star3 = Math.round(targetScore * 1.60);
    let colors;
    if (i <= 10) colors = 3;
    else if (i <= 30) colors = 4;
    else if (i <= 60) colors = 5;
    else colors = 6;
    levels.push({ id:i, moves, timeSeconds, targetScore, star2, star3, colors, stars:0, completed:false, locked:i>1 });
  }
  return levels;
}

// ═══ STATE ═══
let mapData = { currentLevel:1, levels:[], selectedRegion:null, selectedLevel:null };

// ═══ SAVE / LOAD ═══
const MAP_VERSION = 3; // bump when level formula changes
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
      if (p.version !== MAP_VERSION) { localStorage.removeItem('cb_map'); mapData.levels[0].locked=false; return; }
      mapData.currentLevel = p.currentLevel || 1;
      p.levels.forEach(s => {
        const lv = mapData.levels.find(l => l.id === s.id);
        if (lv) { lv.stars = s.stars||0; lv.completed = s.completed||false; lv.locked = s.locked!==undefined ? s.locked : lv.locked; }
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
  return { targetScore:lv.targetScore, moves:lv.moves, timeSeconds:lv.timeSeconds, colors:lv.colors, levelId:levelId };
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
function renderMapScreen() {
  const c = document.getElementById('map-container');
  if (!c) return;
  c.innerHTML = '';

  // Header
  const h = document.createElement('div');
  h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;flex-shrink:0;background:linear-gradient(180deg,rgba(0,0,0,0.7) 0%,transparent 100%);position:relative;z-index:10;';
  h.innerHTML = `<button onclick="goScreen('start')" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.2);color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">←</button><div style="text-align:center;"><div style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.5);">🗺️ World Map</div><div style="font-size:0.7rem;color:rgba(255,255,255,0.5);">Level ${mapData.currentLevel} of 100</div></div><div style="background:rgba(255,220,0,0.15);border:1.5px solid rgba(255,220,0,0.3);border-radius:20px;padding:6px 14px;font-family:'Fredoka One',cursive;font-size:0.85rem;color:#ffe259;">⭐ ${getTotalStars()}</div>`;
  c.appendChild(h);

  const scroll = document.createElement('div');
  scroll.style.cssText = 'flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 16px 24px;scrollbar-width:none;';

  REGIONS.forEach(region => {
    const isUnlocked = !mapData.levels.find(l => l.id === region.levels[0])?.locked;
    const done = mapData.levels.filter(l => l.id >= region.levels[0] && l.id <= region.levels[1] && l.completed).length;
    const regionStars = mapData.levels.filter(l => l.id >= region.levels[0] && l.id <= region.levels[1]).reduce((s,l) => s+(l.stars||0), 0);
    const pct = (done / 20) * 100;

    const card = document.createElement('div');
    card.style.cssText = `border-radius:24px;background:${isUnlocked?`linear-gradient(135deg,${region.bgColor.replace('0.15','0.25')},rgba(0,0,0,0.4))`:'rgba(255,255,255,0.04)'};border:2px solid ${isUnlocked?region.border:'rgba(255,255,255,0.08)'};padding:0;margin-bottom:14px;opacity:${isUnlocked?'1':'0.55'};cursor:${isUnlocked?'pointer':'not-allowed'};overflow:hidden;transition:transform 0.15s,box-shadow 0.15s;position:relative;`;

    // Banner
    const banner = document.createElement('div');
    banner.style.cssText = `height:90px;background:linear-gradient(135deg,${region.bgColor.replace('0.15','0.35')},${region.bgColor.replace('0.15','0.15')});display:flex;align-items:center;justify-content:space-between;padding:0 20px;position:relative;overflow:hidden;`;
    banner.innerHTML = `<div style="position:absolute;right:-10px;top:-15px;font-size:7rem;opacity:0.12;line-height:1;pointer-events:none;">${region.emoji}</div><div style="display:flex;align-items:center;gap:14px;"><div style="width:54px;height:54px;background:rgba(0,0,0,0.3);border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:2rem;border:2px solid ${region.border};">${region.emoji}</div><div><div style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.5);">${region.name}</div><div style="font-size:0.7rem;color:${isUnlocked?region.color:'rgba(255,255,255,0.3)'};">${region.description}</div></div></div>${!isUnlocked?'<div style="font-size:2rem;opacity:0.7;">🔒</div>':`<div style="text-align:right;"><div style="font-family:'Fredoka One',cursive;font-size:1.4rem;color:#ffe259;">${regionStars}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);letter-spacing:0.5px;">/ 60 ⭐</div></div>`}`;

    // Progress row
    const prog = document.createElement('div');
    prog.style.cssText = 'padding:12px 20px 14px;background:rgba(0,0,0,0.25);';
    prog.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;"><div style="font-size:0.7rem;color:rgba(255,255,255,0.4);">Levels ${region.levels[0]}–${region.levels[1]}</div><div style="font-family:'Fredoka One',cursive;font-size:0.8rem;color:${region.color};">${done}/20</div></div><div style="height:6px;border-radius:6px;background:rgba(255,255,255,0.1);overflow:hidden;"><div style="height:100%;border-radius:6px;width:${pct}%;background:linear-gradient(90deg,${region.color},${region.border});box-shadow:0 0 8px ${region.color}80;transition:width 0.6s ease;"></div></div>`;

    card.appendChild(banner);
    card.appendChild(prog);
    if (isUnlocked) {
      card.onclick = () => { mapData.selectedRegion = region; renderLevelSelect(region); goScreen('levelselect'); };
      card.onmouseenter = () => { card.style.transform='scale(1.02)'; card.style.boxShadow=`0 8px 24px ${region.color}40`; };
      card.onmouseleave = () => { card.style.transform=''; card.style.boxShadow=''; };
    }
    scroll.appendChild(card);
  });
  c.appendChild(scroll);
}

// ═══ LEVEL SELECT ═══
function renderLevelSelect(region) {
  const c = document.getElementById('levelselect-container');
  if (!c) return;
  c.innerHTML = '';
  applyThemeColors(region.theme);

  // Header
  const h = document.createElement('div');
  h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px 12px;flex-shrink:0;background:linear-gradient(180deg,rgba(0,0,0,0.75) 0%,transparent 100%);position:relative;z-index:10;';
  const regDone = mapData.levels.filter(l=>l.id>=region.levels[0]&&l.id<=region.levels[1]&&l.completed).length;
  h.innerHTML = `<button onclick="goScreen('map');renderMapScreen();" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.12);border:1.5px solid rgba(255,255,255,0.2);color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;">←</button><div style="text-align:center;"><div style="font-size:1.6rem;">${region.emoji}</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,0.5);">${region.name}</div></div><div style="font-family:'Fredoka One',cursive;font-size:0.8rem;color:${region.color};text-align:right;">${regDone}/20<br><span style="font-size:0.65rem;color:rgba(255,255,255,0.35);font-family:sans-serif;">done</span></div>`;
  c.appendChild(h);

  const scroll = document.createElement('div');
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
    dot.style.cssText = `width:${dotSize}px;height:${dotSize}px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:${isLocked?'not-allowed':'pointer'};border:${isCurrent?'4px solid #ffffff':isCompleted?`3px solid ${region.color}`:isLocked?'2px solid rgba(255,255,255,0.12)':`2px solid ${region.border}`};background:${isCompleted?`radial-gradient(circle,${region.bgColor.replace('0.15','0.5')},rgba(0,0,0,0.6))`:isLocked?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.5)'};box-shadow:${isCurrent?`0 0 0 6px ${region.color}40,0 0 24px ${region.color}60,0 4px 16px rgba(0,0,0,0.5)`:isCompleted?`0 0 12px ${region.color}40,0 4px 12px rgba(0,0,0,0.4)`:'0 4px 12px rgba(0,0,0,0.3)'};position:relative;z-index:1;transition:transform 0.15s;opacity:${isLocked?'0.45':'1'};${isCurrent?'animation:levelPulse 2s ease-in-out infinite;':''}`;

    const starsHtml = isCompleted ? `<div style="font-size:0.7rem;letter-spacing:1px;margin-bottom:3px;line-height:1;">${'⭐'.repeat(lv.stars)}${'☆'.repeat(3-lv.stars)}</div>` : '';
    dot.innerHTML = `${starsHtml}<div style="font-family:'Fredoka One',cursive;font-size:${isCurrent?'1.3rem':'1.1rem'};color:${isLocked?'rgba(255,255,255,0.3)':'#fff'};line-height:1;text-shadow:0 2px 6px rgba(0,0,0,0.6);">${isLocked?'🔒':lv.id}</div>${isCurrent?`<div style="font-size:0.5rem;color:${region.color};font-family:'Fredoka One',cursive;margin-top:3px;letter-spacing:1px;">NOW</div>`:''}`;

    if (!isLocked) {
      dot.onclick = () => showLevelInfo(lv, region);
      dot.onmouseenter = () => dot.style.transform='scale(1.1)';
      dot.onmouseleave = () => dot.style.transform='';
    }
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
  };

  if (region) { applyThemeColors(region.theme); document.body.className = region.theme; }
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
    <div style="font-size:1.6rem;margin-bottom:4px;">${'⭐'.repeat(lv.stars)}${'☆'.repeat(3-lv.stars)}</div>
    <div style="display:inline-block;background:rgba(255,255,255,0.1);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:rgba(255,255,255,0.6);margin-bottom:16px;">${dc.label}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:20px;">
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">🎯</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#fff;">${adjTarget.toLocaleString()}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">TARGET</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">👣</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#fff;">${adjMoves}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">MOVES</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">⏱️</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#43e97b;">${fmtTimeSt(adjTime)}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">TIME</div></div>
      <div style="background:rgba(255,255,255,0.07);border-radius:14px;padding:10px 6px;"><div style="font-size:1.3rem;">⭐</div><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:#ffe259;">${adjStar3.toLocaleString()}</div><div style="font-size:0.6rem;color:rgba(255,255,255,0.4);">3 STARS</div></div>
    </div>
    <button onclick="document.getElementById('level-info-popup').remove();startMapLevel(${lv.id});" style="width:100%;padding:14px;background:linear-gradient(135deg,${region.color},${region.border});border:none;border-radius:50px;font-family:'Fredoka One',cursive;font-size:1.1rem;color:#fff;cursor:pointer;">▶ Play</button>
    <button onclick="document.getElementById('level-info-popup').remove();" style="margin-top:10px;width:100%;background:transparent;border:none;color:rgba(255,255,255,0.3);font-size:0.8rem;cursor:pointer;padding:6px;">Close</button>
  </div>`;
  document.body.appendChild(popup);
}

// ═══ INIT ═══
function initMap() { loadMapData(); }
