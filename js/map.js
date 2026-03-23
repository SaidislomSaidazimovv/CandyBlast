// ═══ REGIONS ═══
const REGIONS = [
  { id:'central-asia', name:'Markaziy Osiyo', emoji:'🏔️', levels:[1,20], theme:'', color:'#c471ed', bgColor:'rgba(196,113,237,0.15)', border:'rgba(196,113,237,0.4)', description:'Sweet mountains of candy!' },
  { id:'europe', name:'Yevropa', emoji:'🏰', levels:[21,40], theme:'theme-ocean', color:'#00c8ff', bgColor:'rgba(0,200,255,0.15)', border:'rgba(0,200,255,0.4)', description:'Candy castles await!' },
  { id:'americas', name:'Amerika', emoji:'🌋', levels:[41,60], theme:'theme-fire', color:'#ff4500', bgColor:'rgba(255,69,0,0.15)', border:'rgba(255,69,0,0.4)', description:'Hot and spicy candies!' },
  { id:'asia', name:'Sharqiy Osiyo', emoji:'🌸', levels:[61,80], theme:'theme-forest', color:'#43e97b', bgColor:'rgba(67,233,123,0.15)', border:'rgba(67,233,123,0.4)', description:'Magical forest sweets!' },
  { id:'africa', name:'Afrika', emoji:'🌅', levels:[81,100], theme:'theme-candy', color:'#ff5fa0', bgColor:'rgba(255,95,160,0.15)', border:'rgba(255,95,160,0.4)', description:'Rainbow candy paradise!' },
];

// ═══ LEVEL GENERATION ═══
function generateLevels() {
  const levels = [];
  for (let i = 1; i <= 100; i++) {
    levels.push({
      id: i,
      targetScore: 300 + (i * 50) + (Math.floor((i-1)/10) * 100),
      moves: Math.max(15, 35 - Math.floor(i / 5)),
      colors: Math.min(6, 4 + Math.floor(i / 25)),
      stars: 0,
      completed: false,
      locked: i > 1,
    });
  }
  return levels;
}

// ═══ STATE ═══
let mapData = { currentLevel:1, levels:[], selectedRegion:null, selectedLevel:null };

// ═══ SAVE / LOAD ═══
function saveMapData() {
  localStorage.setItem('cb_map', JSON.stringify({
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
  return { targetScore:lv.targetScore, moves:lv.moves, colors:lv.colors, levelId:levelId };
}

function getRegionForLevel(levelId) {
  return REGIONS.find(r => levelId >= r.levels[0] && levelId <= r.levels[1]);
}

// ═══ MAP SCREEN ═══
function renderMapScreen() {
  const c = document.getElementById('map-container');
  if (!c) return;
  c.innerHTML = '';

  // Header
  const h = document.createElement('div');
  h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px;flex-shrink:0;position:sticky;top:0;z-index:10;background:rgba(0,0,0,0.7);';
  h.innerHTML = `<button onclick="goScreen('start')" style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:1.1rem;cursor:pointer;">←</button><div style="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#fff;">🗺️ World Map</div><div style="font-family:'Fredoka One',cursive;font-size:0.9rem;color:rgba(255,255,255,0.5);">Lvl ${mapData.currentLevel}</div>`;
  c.appendChild(h);

  const scroll = document.createElement('div');
  scroll.style.cssText = 'flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:16px;background:rgba(0,0,0,0.45);';

  REGIONS.forEach(region => {
    const isUnlocked = !mapData.levels.find(l => l.id === region.levels[0])?.locked;
    const done = mapData.levels.filter(l => l.id >= region.levels[0] && l.id <= region.levels[1] && l.completed).length;
    const pct = (done / 20) * 100;

    const card = document.createElement('div');
    card.style.cssText = `border-radius:20px;background:${isUnlocked?region.bgColor:'rgba(255,255,255,0.04)'};border:2px solid ${isUnlocked?region.border:'rgba(255,255,255,0.08)'};padding:20px;opacity:${isUnlocked?'1':'0.5'};cursor:${isUnlocked?'pointer':'not-allowed'};transition:transform 0.15s,box-shadow 0.15s;position:relative;overflow:hidden;`;
    card.innerHTML = `<div style="position:absolute;right:-10px;top:-10px;font-size:5rem;opacity:0.12;pointer-events:none;line-height:1;">${region.emoji}</div><div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;"><div style="font-size:2.2rem;">${region.emoji}</div><div><div style="font-family:'Fredoka One',cursive;font-size:1.2rem;color:#fff;">${region.name}</div><div style="font-size:0.75rem;color:${isUnlocked?region.color:'rgba(255,255,255,0.3)'};">${region.description}</div></div>${!isUnlocked?'<div style="font-size:1.5rem;margin-left:auto;">🔒</div>':''}</div><div style="background:rgba(255,255,255,0.1);border-radius:6px;height:6px;margin-bottom:8px;overflow:hidden;"><div style="height:100%;border-radius:6px;background:${region.color};width:${pct}%;transition:width 0.5s;box-shadow:0 0 8px ${region.color}60;"></div></div><div style="display:flex;justify-content:space-between;font-size:0.75rem;"><span style="color:rgba(255,255,255,0.4);">Levels ${region.levels[0]}–${region.levels[1]}</span><span style="color:${region.color};">${done}/20 completed</span></div>`;

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

  const h = document.createElement('div');
  h.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px;flex-shrink:0;background:linear-gradient(180deg,rgba(0,0,0,0.7),transparent);';
  h.innerHTML = `<button onclick="goScreen('map');renderMapScreen();" style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:1.1rem;cursor:pointer;">←</button><div style="text-align:center;"><div style="font-size:1.5rem;">${region.emoji}</div><div style="font-family:'Fredoka One',cursive;font-size:1.1rem;color:#fff;">${region.name}</div></div><div style="width:40px;"></div>`;
  c.appendChild(h);

  const scroll = document.createElement('div');
  scroll.style.cssText = 'flex:1;overflow-y:auto;padding:20px 24px;display:flex;flex-direction:column;align-items:center;gap:8px;';

  const levels = mapData.levels.filter(l => l.id >= region.levels[0] && l.id <= region.levels[1]);

  levels.forEach((lv, idx) => {
    const row = document.createElement('div');
    const isLeft = idx % 2 === 0;
    row.style.cssText = `display:flex;width:100%;justify-content:${isLeft?'flex-start':'flex-end'};position:relative;`;

    const isCurrent = lv.id === mapData.currentLevel;
    const isCompleted = lv.completed;
    const isLocked = lv.locked;

    const btn = document.createElement('div');
    btn.style.cssText = `width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:${isLocked?'not-allowed':'pointer'};border:3px solid ${isCurrent?'#fff':isCompleted?region.color:isLocked?'rgba(255,255,255,0.1)':region.border};background:${isCompleted||isCurrent?region.bgColor:isLocked?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.06)'};box-shadow:${isCurrent?`0 0 0 4px ${region.color}60,0 0 20px ${region.color}40`:isCompleted?`0 4px 12px ${region.color}30`:'none'};transition:transform 0.15s;position:relative;opacity:${isLocked?'0.4':'1'};`;

    const starsHtml = isCompleted ? `<div style="font-size:0.55rem;letter-spacing:1px;margin-bottom:2px;">${'⭐'.repeat(lv.stars)}${'☆'.repeat(3-lv.stars)}</div>` : '';
    btn.innerHTML = `${starsHtml}<div style="font-family:'Fredoka One',cursive;font-size:${isCurrent?'1.2rem':'1rem'};color:${isLocked?'rgba(255,255,255,0.3)':'#fff'};line-height:1;">${isLocked?'🔒':lv.id}</div>${isCurrent?`<div style="font-size:0.5rem;color:${region.color};font-family:'Fredoka One',cursive;margin-top:2px;">NOW</div>`:''}`;

    if (!isLocked) {
      btn.onclick = () => startMapLevel(lv.id);
      btn.onmouseenter = () => btn.style.transform='scale(1.1)';
      btn.onmouseleave = () => btn.style.transform='';
    }

    // Connector
    if (idx < levels.length - 1) {
      const conn = document.createElement('div');
      conn.style.cssText = `position:absolute;width:3px;height:40px;background:${levels[idx+1].locked?'rgba(255,255,255,0.1)':region.color+'60'};bottom:-40px;${isLeft?'left:36px':'right:36px'};border-radius:2px;`;
      btn.appendChild(conn);
    }

    row.appendChild(btn);
    scroll.appendChild(row);
  });
  c.appendChild(scroll);

  // Auto-scroll
  setTimeout(() => {
    const ci = levels.findIndex(l => l.id === mapData.currentLevel);
    if (ci > 0) scroll.scrollTop = Math.max(0, (ci - 2) * 80);
  }, 100);
}

// ═══ START MAP LEVEL ═══
function startMapLevel(levelId) {
  mapData.selectedLevel = levelId;
  window._mapLevelSettings = getLevelSettings(levelId);
  const region = getRegionForLevel(levelId);
  if (region) { applyThemeColors(region.theme); document.body.className = region.theme; }
  _goGameIntentional=true;
  goGame();
}

// ═══ INIT ═══
function initMap() { loadMapData(); }
