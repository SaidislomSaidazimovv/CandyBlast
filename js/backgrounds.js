// CandyBlast world director. Each launch level receives a deterministic scene
// variant, while groups of five levels share one authored chapter identity.
(() => {
  const WORLDS = [
    { id:'berry-meadow', name:'Berry Meadow', sky:'#8fd9ed', glow:'#fff2bd', far:'#8dbd9f', mid:'#73a985', near:'#4f815f', accent:'#e66f9b', panel:'#5b4668' },
    { id:'sundae-harbour', name:'Sundae Harbour', sky:'#83cce5', glow:'#ffe8ad', far:'#b8b2d8', mid:'#8f91bd', near:'#66739d', accent:'#f1a45f', panel:'#485675' },
    { id:'mintwood', name:'Mintwood Grove', sky:'#9bd8c2', glow:'#fff0b0', far:'#8bbb8b', mid:'#579472', near:'#376d59', accent:'#e88eaa', panel:'#385c55' },
    { id:'caramel-peaks', name:'Caramel Peaks', sky:'#efb08e', glow:'#fff0bd', far:'#c98778', mid:'#9e696f', near:'#704b62', accent:'#f2c46d', panel:'#59435f' }
  ];
  const clampLevel = value => Math.max(1, Math.min(20, Math.floor(Number(value) || 1)));
  const worldFor = level => WORLDS[Math.min(WORLDS.length - 1, Math.floor((clampLevel(level) - 1) / 5))];
  const variantFor = level => (clampLevel(level) - 1) % 5;
  let activeLevel = 1;
  let root;

  function markup() {
    return `<div class="world-sky"></div><div class="world-sun" aria-hidden="true"></div>
      <div class="world-cloud world-cloud-a" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="world-cloud world-cloud-b" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="world-layer world-far" aria-hidden="true"></div><div class="world-layer world-mid" aria-hidden="true"></div>
      <div class="world-landmark" aria-hidden="true"><i></i><i></i><i></i></div><div class="world-layer world-near" aria-hidden="true"></div>
      <div class="world-props" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="world-motes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="world-vignette" aria-hidden="true"></div>`;
  }
  function ensureRoot() {
    root = document.getElementById('candy-world');
    if (root) return root;
    root = document.createElement('div');root.id = 'candy-world';root.setAttribute('aria-hidden','true');root.innerHTML = markup();document.body.prepend(root);return root;
  }
  function setLevel(level, options = {}) {
    activeLevel = clampLevel(level);
    const world = worldFor(activeLevel), variant = variantFor(activeLevel), host = ensureRoot();
    host.className = `world-${world.id} world-variant-${variant}`;host.dataset.level = String(activeLevel);host.dataset.world = world.name;
    for (const [name,value] of Object.entries({sky:world.sky,glow:world.glow,far:world.far,mid:world.mid,near:world.near,accent:world.accent})) host.style.setProperty(`--world-${name}`,value);
    host.style.setProperty('--world-shift', `${variant * 7 - 14}%`);
    document.documentElement.style.setProperty('--world-panel',world.panel);document.documentElement.style.setProperty('--world-accent',world.accent);
    document.body.style.setProperty('--app-plum',world.panel);document.body.style.setProperty('--app-top',world.mid);document.body.style.setProperty('--app-card',world.panel);document.body.style.setProperty('--app-edge',world.far);
    document.body.dataset.world=world.id;document.body.dataset.worldLevel=String(activeLevel);
    if(!options.silent)window.dispatchEvent(new CustomEvent('candyworldchange',{detail:{level:activeLevel,variant,world}}));
    return {level:activeLevel,variant,world};
  }
  function progressLevel(){try{const saved=JSON.parse(localStorage.getItem('cb_map')||'{}');return clampLevel(saved.currentLevel||window.mapData?.currentLevel||1);}catch{return 1;}}
  function syncForScreen(screen){const chosen=screen==='game'?(window.mapData?.selectedLevel||window.level||activeLevel):progressLevel();setLevel(chosen);ensureRoot().classList.toggle('is-game',screen==='game');}
  function applyBackground(){return setLevel(progressLevel());}
  function initBackground(){return setLevel(progressLevel(),{silent:true});}
  window.CandyWorldScene={WORLDS,setLevel,syncForScreen,current:()=>({level:activeLevel,world:worldFor(activeLevel),variant:variantFor(activeLevel)})};
  window.applyBackground=applyBackground;window.initBackground=initBackground;
})();
