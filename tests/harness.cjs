const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function game() {
  const storage = new Map(), intervals = new Map(), pending = [];
  let nextId = 0;
  function element() {
    const classes = new Set(['hidden']);
    return {
      style: { setProperty() {} }, dataset: {}, offsetWidth: 420,
      classList: { add: k => classes.add(k), remove: k => classes.delete(k),
        contains: k => classes.has(k), toggle() {} },
      appendChild() {}, insertAdjacentElement() {}, insertBefore() {}, remove() {},
      addEventListener() {}, querySelector: element,
    };
  }
  const elements = new Map();
  const context = vm.createContext({
    console, Date, Math, Set, Map, Promise,
    window: {}, navigator: {},
    document: {
      getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
      querySelector: () => null, querySelectorAll: () => [], createElement: element,
      body: element(), documentElement: element(),
    },
    localStorage: { getItem: k => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, String(v)), removeItem: k => storage.delete(k) },
    setTimeout: fn => { pending.push(fn); return ++nextId; }, clearTimeout() {},
    setInterval: fn => { intervals.set(++nextId, fn); return nextId; },
    clearInterval: id => intervals.delete(id),
  });
  for (const file of ['lives', 'daily', 'spin', 'specials', 'map', 'adventure', 'game', 'render-bridge']) {
    let code = fs.readFileSync(path.join(root, 'js', file + '.js'), 'utf8');
    if (file === 'game') code = code.split('// ═══════ INIT ═══════')[0];
    vm.runInContext(code, context, { filename: file + '.js' });
  }
  const run = code => vm.runInContext(code, context);
  run(`renderBoard=()=>{};updateStats=()=>{};renderMapScreen=()=>{};
    playWin=()=>{};playOver=()=>{};showBoosterEarned=()=>{};updateLivesUI=()=>{};
    showRewardToast=()=>{};showLaserH=()=>{};showLaserV=()=>{};showWrappedEffect=()=>{};
    showBombEffect=()=>{};initBackground=()=>{};checkFirstTime=()=>{};
    dropCandies=async()=>{applyGravity();};
    mapData.levels=generateLevels();
    // Explicit timed fixture: shipping chapter is untimed, timer support remains tested.
    mapData.levels[0].timeSeconds=120;`);
  return { run, storage, pending, tick() { for (const fn of [...intervals.values()]) fn(); } };
}


module.exports={game};
