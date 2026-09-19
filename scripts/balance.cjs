const fs=require('node:fs');
const {game}=require('../tests/harness.cjs');
const runs=Number(process.argv[2]||20);
(async()=>{const report=[];
for(let levelId=1;levelId<=20;levelId++){
 let wins=0,movesUsed=[],scores=[];
 for(let seed=1;seed<=runs;seed++){
  const g=game();g.run('Math=Object.create(Math);var rngState='+ (seed*1009+levelId*9176)+';Math.random=()=>{rngState=(Math.imul(rngState,1664525)+1013904223)>>>0;return rngState/4294967296;};settings.anim=false;delay=async()=>{};mapData.levels=generateLevels();startMapLevel('+levelId+');hidePreGame();');
  const allowance=g.run('moves');let steps=0;
  while(!g.run('gameEnded')&&steps<allowance+2){
   g.run('var balanceMove=findBestHint();if(!balanceMove){ensurePlayableBoard();balanceMove=findBestHint();}');
   if(!g.run('balanceMove'))throw Error('No move at level '+levelId);
   await g.run('trySwap(balanceMove[0].r,balanceMove[0].c,balanceMove[1].r,balanceMove[1].c)');steps++;g.pending.length=0;
   if(g.run('busy&&!gameEnded'))throw Error('Unsettled move at level '+levelId);
  }
  if(g.run('objectiveComplete()'))wins++;movesUsed.push(steps);scores.push(g.run('levelScore'));
 }
 report.push({level:levelId,runs,wins,winRate:wins/runs,averageMoves:+(movesUsed.reduce((a,b)=>a+b,0)/runs).toFixed(1),averageScore:Math.round(scores.reduce((a,b)=>a+b,0)/runs)});
 console.log(JSON.stringify(report.at(-1)));
}
fs.writeFileSync('BALANCE_REPORT.json',JSON.stringify({policy:'Greedy objective-aware hint bot; no boosters, normal difficulty, seeded boards. Not a human difficulty rating.',runsPerLevel:runs,levels:report},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});

