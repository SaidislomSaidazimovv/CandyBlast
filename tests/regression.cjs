// Run with: node --test tests/regression.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

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
    mapData.levels=generateLevels();`);
  return { run, storage, pending, tick() { for (const fn of [...intervals.values()]) fn(); } };
}

test('all shipped JavaScript parses', () => {
  for (const file of fs.readdirSync(path.join(root, 'js'))) {
    if (file.endsWith('.js')) new vm.Script(fs.readFileSync(path.join(root, 'js', file), 'utf8'));
  }
  new vm.Script(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'));
});

test('hard retry preserves adjusted settings and starts a fresh timer after Play', () => {
  const g = game();
  g.run("settings.diff='hard';startMapLevel(1);hidePreGame();");
  const initial = g.run('JSON.stringify([moves,targetScore,timeLeft])');
  g.run('showTimeUp();retryLevel();');
  assert.equal(g.run('timerActive'), false);
  g.run('hidePreGame();');
  assert.equal(g.run('JSON.stringify([moves,targetScore,timeLeft])'), initial);
  assert.equal(g.run('timerActive'), true);
});

test('pregame cancel never starts the clock or spends a life', () => {
  const g = game();g.run('startMapLevel(1);cancelPreGame();');g.tick();
  assert.equal(g.run('timerActive'), false);
  assert.equal(g.run('livesData.lives'), 5);
  assert.equal(g.storage.has('cb_gamestate'), false);
});

test('quit spends one life and cannot leave a running clock', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();confirmQuit();confirmQuit();');
  for (let n = 0; n < 130; n++) g.tick();
  assert.equal(g.run('livesData.lives'), 4);
  assert.equal(g.run('timerActive'), false);
});

test('pause and settings preserve remaining time', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();pauseGame();goScreen("settings");');
  g.tick();assert.equal(g.run('timeLeft'), 120);
  g.run('goBack();');g.tick();assert.equal(g.run('timeLeft'), 119);
});

test('timeout waits for a cascade, and a last cascade can win exactly once', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();timeLeft=1;busy=true;');
  g.tick();assert.equal(g.run('gameEnded'), false);
  g.run('score=targetScore;levelScore=score;finishMove();showOver();showTimeUp();');
  assert.equal(g.run('mapData.levels[0].completed'), true);
  assert.equal(g.run('livesData.lives'), 5);
  assert.equal(JSON.parse(g.storage.get('cb_personal')).length, 1);
});

test('loss is finalized only once', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();moves=0;finishMove();showOver();showTimeUp();');
  assert.equal(g.run('livesData.lives'), 4);
  assert.equal(JSON.parse(g.storage.get('cb_personal')).length, 1);
});

test('restore survives two consecutive reloads without another move', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();');g.tick();
  assert.equal(g.run('restoreGameState()'), true);
  assert.equal(g.run('restoreGameState()'), true);
  assert.equal(g.run('timeLeft'), 119);
});

test('pregame restore retains the pending timer', () => {
  const g = game();g.run('startMapLevel(1);restoreGameState();');
  assert.equal(g.run('pregame'), true);assert.equal(g.run('timerActive'), false);
  g.run('hidePreGame();');assert.equal(g.run('timerActive'), true);
});

test('transient board is not saved and malformed saves are rejected', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();');const original = g.storage.get('cb_gamestate');
  g.run('busy=true;grid[0][0]=-1;saveGameState();');
  assert.equal(g.storage.get('cb_gamestate'), original);
  g.storage.set('cb_gamestate', '{"grid":[],"savedAt":0}');
  assert.equal(g.run('restoreGameState()'), false);
});

test('extra moves are persisted immediately', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();useIngameBooster("extraMoves");');
  assert.equal(JSON.parse(g.storage.get('cb_gamestate')).moves, 39);
});

test('the last hammer can be cancelled and refunded', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();livesData.boosters.hammer=1;useIngameBooster("hammer");useIngameBooster("hammer");');
  assert.equal(g.run('hammerMode'), false);assert.equal(g.run('livesData.boosters.hammer'), 1);
});

test('weekly bonus is granted once across repeated claims', () => {
  const g = game();g.run(`dailyData.weekNumber=getWeekNumber();dailyData.claimedWeeklyDays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];claimWeeklyBonus({});claimWeeklyBonus({});loadDailyData();claimWeeklyBonus({});`);
  assert.equal(g.run('livesData.boosters.hammer'), 4);
});

test('weekly bonus requires seven days in the current week', () => {
  const g = game();g.run('claimWeeklyBonus({});');
  assert.equal(g.run('livesData.boosters.hammer'), 1);
});

test('Thursday grants a hammer and Saturday grants a spin', () => {
  const g = game();g.run('giveWeeklyReward(WEEKLY_REWARDS[3]);giveWeeklyReward(WEEKLY_REWARDS[5]);');
  assert.equal(g.run('livesData.boosters.hammer'), 2);
  assert.equal(g.run('dailyData.spinCount'), 1);
});

test('monthly day 30 rolls over to day 1', () => {
  const g = game();g.run('dailyData.currentDay=30;checkMonthlyLogin();');
  assert.equal(g.run('dailyData.currentDay'), 1);
});

test('wrapped and striped activate before their cells are removed', () => {
  const g = game();g.run('initGrid();setCell(3,3,1,SPECIAL.WRAPPED);setCell(3,4,2,SPECIAL.STRIPED_H);');
  assert.ok(g.run('handleSpecialCombo(3,3,3,4).size') > 2);
  assert.equal(g.run('getType(3,3)'), -1);assert.equal(g.run('getType(3,4)'), -1);
});

test('reset restores in-memory inventory and removes the saved game', () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();livesData.lives=1;livesData.boosters.hammer=9;dailyData.currentDay=20;confirmReset();');
  assert.equal(g.run('livesData.lives'), 5);
  assert.equal(g.run('livesData.boosters.hammer'), 1);
  assert.equal(g.run('mapData.currentLevel'), 1);
  assert.equal(g.storage.has('cb_gamestate'), false);
});

test('a bomb cascade that reaches the target ends the level', async () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();processMatches=async()=>{score=targetScore;levelScore=score;};activateIngameBomb();');
  await g.pending.at(-1)();
  assert.equal(g.run('gameEnded'), true);
  assert.equal(g.run('mapData.levels[0].completed'), true);
});

test('an old booster callback cannot modify a new level', async () => {
  const g = game();g.run('startMapLevel(1);hidePreGame();activateIngameBomb();');
  const oldCallback = g.pending.at(-1);
  g.run('startMapLevel(1);');const board = g.run('JSON.stringify(grid)');
  await oldCallback();
  assert.equal(g.run('JSON.stringify(grid)'), board);
  assert.equal(g.run('pregame'), true);
});

test('corrupt personal scores do not prevent a result', () => {
  const g = game();g.storage.set('cb_personal', 'broken');
  g.run('startMapLevel(1);hidePreGame();moves=0;finishMove();');
  assert.equal(g.run('livesData.lives'), 4);
  assert.equal(JSON.parse(g.storage.get('cb_personal')).length, 1);
});

test('collection levels require candies rather than merely a high score', () => {
  const g=game();g.run('startMapLevel(2);hidePreGame();score=999999;');
  assert.equal(g.run('objectiveComplete()'),false);
  g.run('objective.collected[0]=18;finishMove();');
  assert.equal(g.run('mapData.levels[1].completed'),true);
});

test('an untimed level does not start a countdown', () => {
  const g=game();g.run('startMapLevel(2);hidePreGame();');g.tick();
  assert.equal(g.run('timerActive'),false);assert.equal(g.run('gameEnded'),false);
});

test('removing a candy collects it and clears its ice exactly once', () => {
  const g=game();g.run('startMapLevel(3);grid[1][1]=0;removeCandy(1,1);removeCandy(1,1);');
  assert.equal(g.run('objective.ice.length'),3);
  assert.equal(g.run('objective.collected[0]'),1);
});

test('gravity moves candies but does not move or clear ice', () => {
  const g=game();g.run('startMapLevel(3);grid[7][1]=-1;applyGravity();');
  assert.equal(g.run('objective.ice.includes(9)'),true);
  assert.equal(g.run('objective.ice.length'),4);
});

test('mixed goals require both collection and clearing every ice tile', () => {
  const g=game();g.run('startMapLevel(7);objective.collected[2]=22;');
  assert.equal(g.run('objectiveComplete()'),false);
  g.run('objective.ice=[];');assert.equal(g.run('objectiveComplete()'),true);
});

test('objective progress and ice survive a reload', () => {
  const g=game();g.run('startMapLevel(7);hidePreGame();grid[1][1]=2;removeCandy(1,1);applyGravity();saveGameState();restoreGameState();');
  assert.equal(g.run('objective.ice.length'),3);
  assert.equal(g.run('objective.collected[2]'),1);
});

test('old saves keep their original score objective', () => {
  const g=game();g.run('startMapLevel(2);hidePreGame();');
  const saved=JSON.parse(g.storage.get('cb_gamestate'));delete saved.objective;
  g.storage.set('cb_gamestate',JSON.stringify(saved));g.run('restoreGameState();');
  assert.equal(g.run('objective.kind'),'score');
});

test('version 4 map migration preserves stars and unlocked levels', () => {
  const g=game();g.storage.set('cb_map',JSON.stringify({version:4,currentLevel:3,levels:[{id:1,stars:3,completed:true,locked:false},{id:2,stars:2,completed:true,locked:false},{id:3,stars:0,completed:false,locked:false}]}));
  g.run('loadMapData();');assert.equal(g.run('mapData.currentLevel'),3);
  assert.equal(g.run('mapData.levels[0].stars'),3);
  assert.equal(g.run('mapData.levels[2].locked'),false);
});

test('all generated stages have valid goals and available colors', () => {
  const g=game();assert.equal(g.run('generateLevels().length'),100);
  assert.equal(g.run(`generateLevels().every(l=>l.objective.targets.every(t=>t.type<l.colors&&t.count>0)&&(!l.objective.pattern||icePattern(l.objective.pattern).length>0))`),true);
  assert.equal(g.run('new Set(generateLevels().map(l=>l.objective.kind)).size'),4);
});

test('legal move search restores the board and returns an actual match', () => {
  const g=game();g.run('initGrid();');const before=g.run('JSON.stringify(grid)');
  g.run('var move=findAvailableMove();');assert.equal(g.run('JSON.stringify(grid)'),before);
  g.run('var a=move[0],b=move[1];[grid[a.r][a.c],grid[b.r][b.c]]=[grid[b.r][b.c],grid[a.r][a.c]];');
  assert.ok(g.run('findMatchesNew().matched.length')>=3);
});

test('new boards have no existing matches and at least one legal move', () => {
  const g=game();
  for(const colors of [3,4,5,6])for(let i=0;i<20;i++){
    g.run(`activeCandyTypes=${colors};initGrid();`);
    assert.equal(g.run('findMatchesNew().matched.length'),0);
    assert.equal(g.run('findAvailableMove()!==null'),true);
  }
});

test('dead-board recovery preserves inventory, score, moves and objective', () => {
  const g=game();g.run('startMapLevel(3);grid=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r+c)%6));');
  assert.equal(g.run('findAvailableMove()'),null);
  const counts=g.run('JSON.stringify(grid.flat().sort())');
  g.run('ensurePlayableBoard();');
  assert.equal(g.run('JSON.stringify(grid.flat().sort())'),counts);
  assert.equal(g.run('findMatchesNew().matched.length'),0);
  assert.equal(g.run('findAvailableMove()!==null'),true);
  assert.equal(g.run('objective.ice.length'),4);assert.equal(g.run('moves'),34);assert.equal(g.run('score'),0);
});

test('special explosions contribute to ice and collection objectives', () => {
  const g=game();g.run('startMapLevel(3);setCell(1,1,0,SPECIAL.STRIPED_H);activateSpecial(1,1,new Set());');
  assert.equal(g.run('objective.ice.includes(9)'),false);
  assert.equal(g.run('objective.ice.includes(14)'),false);
  assert.equal(g.run('objective.collected.reduce((a,b)=>a+b,0)'),8);
});

test('a complete swap resolves cascades, collects candies and saves a stable board', async () => {
  const g=game();g.run('startMapLevel(2);hidePreGame();settings.anim=false;delay=async()=>{};var pair=findAvailableMove();');
  await g.run('trySwap(pair[0].r,pair[0].c,pair[1].r,pair[1].c)');
  assert.equal(g.run('moves'),33);
  assert.ok(g.run('objective.collected.reduce((a,b)=>a+b,0)')>=3);
  assert.equal(g.run('findMatchesNew().matched.length'),0);
  assert.equal(g.run('grid.flat().includes(-1)'),false);
  assert.equal(g.run('gameEnded||!busy'),true);
});

test('gravity reports each actual drop distance', () => {
  const g=game();g.run('initGrid();grid[7][0]=-1;grid[6][0]=-1;var falls=applyGravity();');
  assert.equal(g.run('falls.find(f=>f.r===7&&f.c===0).distance'),2);
  assert.equal(g.run('falls.filter(f=>f.c===0).length'),8);
});

test('3D bridge reads production specials, ice and session without changing saved state',()=>{
  const g=game();g.run("startMapLevel(3);hidePreGame();setCell(1,1,2,SPECIAL.WRAPPED);");
  const before=g.run('JSON.stringify([grid,objective,score,moves,gameSession])');
  const snapshot=JSON.parse(g.run('JSON.stringify(window.Candy3DBridge.snapshot())'));
  assert.equal(snapshot.cells.length,64);assert.equal(snapshot.cells[9].special,'wrapped');
  assert.equal(snapshot.cells[9].ice,true);assert.equal(snapshot.cells[9].type,2);
  assert.equal(snapshot.active,true);assert.equal(snapshot.paused,false);
  assert.equal(g.run('JSON.stringify([grid,objective,score,moves,gameSession])'),before);
  g.run('pauseGame()');assert.equal(g.run('window.Candy3DBridge.snapshot().paused'),true);
});

test('3D swipe cannot bypass pause, pregame or hammer input guards',()=>{
  const g=game();g.run('startMapLevel(3);var swaps=0;trySwap=()=>swaps++;');
  g.run('window.Candy3DBridge.swipe(0,1)');assert.equal(g.run('swaps'),0);
  g.run('hidePreGame();paused=true;window.Candy3DBridge.swipe(0,1)');assert.equal(g.run('swaps'),0);
  g.run('paused=false;hammerMode=true;window.Candy3DBridge.swipe(0,1)');assert.equal(g.run('swaps'),0);
  g.run('hammerMode=false;window.Candy3DBridge.swipe(0,1)');assert.equal(g.run('swaps'),1);
});
