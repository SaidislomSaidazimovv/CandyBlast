// Level objectives and board assistance. Ice belongs to a tile, not a candy.
const CANDY_NAMES = ['Berry heart','Blue diamond','Mint leaf','Honey star','Grape drop','Orange bean'];
let objective = {kind:'score',targets:[],collected:[0,0,0,0,0,0],ice:[]};

function icePattern(name) {
  const cells=[];
  for(let r=0;r<8;r++)for(let c=0;c<8;c++){
    const yes=name==='corners' ? [1,6].includes(r)&&[1,6].includes(c)
      :name==='diamond' ? Math.abs(r-3.5)+Math.abs(c-3.5)===3
      :name==='ring' ? r>=2&&r<=5&&c>=2&&c<=5&&(r===2||r===5||c===2||c===5)
      :name==='cross' ? (r===3||r===4||c===3||c===4)&&r>0&&r<7&&c>0&&c<7
      :name==='diagonal' ? (r===c||r+c===7)&&r>0&&r<7 : false;
    if(yes)cells.push(r*8+c);
  }
  return cells;
}
function startObjective(spec){
  objective={kind:spec?.kind||'score',pattern:spec?.pattern||null,targets:(spec?.targets||[]).map(t=>({...t})),
    collected:[0,0,0,0,0,0],ice:icePattern(spec?.pattern)};
}
function restoreObjective(saved){
  if(!saved){startObjective();return;}// Old games retain their original score goal.
  if(!['score','collect','ice','mixed'].includes(saved.kind)||!Array.isArray(saved.targets)||
    !saved.targets.every(t=>Number.isInteger(t.type)&&t.type>=0&&t.type<6&&Number.isInteger(t.count)&&t.count>0)||
    !Array.isArray(saved.collected)||saved.collected.length!==6||!saved.collected.every(n=>Number.isInteger(n)&&n>=0)||
    !Array.isArray(saved.ice)||!saved.ice.every(n=>Number.isInteger(n)&&n>=0&&n<64))throw new Error('Invalid objective');
  objective=JSON.parse(JSON.stringify(saved));
}
function removeCandy(r,c){
  const type=getType(r,c);
  if(type<0)return false;
  objective.collected[type]++;
  const index=objective.ice.indexOf(r*GRID+c);
  if(index>=0)objective.ice.splice(index,1);
  grid[r][c]=-1;
  return true;
}
function objectiveComplete(){
  if(objective.kind==='score')return score>=targetScore;
  return objective.targets.every(t=>objective.collected[t.type]>=t.count)&&objective.ice.length===0;
}
function objectiveLabel(spec){
  if(!spec||spec.kind==='score')return 'Score challenge';
  if(spec.kind==='ice')return 'Clear the ice';
  if(spec.kind==='mixed')return 'Collect & clear';
  return 'Candy collection';
}
function objectiveDescription(spec){
  if(!spec||spec.kind==='score')return 'Match candies to reach the target score.';
  const parts=(spec.targets||[]).map(t=>`${t.count} ${CANDY_NAMES[t.type].toLowerCase()}s`);
  if(spec.pattern)parts.push(`clear ${icePattern(spec.pattern).length} ice tiles`);
  return parts.join(' · ');
}
function boardInstruction(){
  if(objective.kind==='ice'||objective.kind==='mixed')return 'Match on icy tiles to clear them';
  if(objective.kind==='collect')return 'Collect the target candies shown above';
  return 'Swap adjacent candies to match 3';
}
function updateObjectiveUI(){
  const el=document.getElementById('objective-goals');if(!el)return;
  const goals=[];
  if(objective.kind==='score')goals.push(`<span class="goal-score">✦</span><span><small>Target score</small><b>${Math.min(score,targetScore).toLocaleString()} / ${targetScore.toLocaleString()}</b></span>`);
  for(const t of objective.targets){
    const left=Math.max(0,t.count-objective.collected[t.type]);
    goals.push(`<span class="goal-icon candy-art c${t.type}" aria-hidden="true"></span><span><small>${CANDY_NAMES[t.type]}</small><b>${left===0?'✓ Done':left+' left'}</b></span>`);
  }
  if(objective.kind==='ice'||objective.kind==='mixed')goals.push(`<span class="ice-symbol" aria-hidden="true">❄</span><span><small>Ice tiles</small><b>${objective.ice.length===0?'✓ Clear':objective.ice.length+' left'}</b></span>`);
  el.innerHTML=goals.join('');
  document.getElementById('objective-title').textContent=objectiveLabel(objective);
}

function hasMatchAt(r,c){
  const type=getType(r,c);if(type<0)return false;
  for(const [dr,dc] of [[0,1],[1,0]]){let count=1;for(const sign of [-1,1])for(let n=1;n<GRID;n++){const rr=r+dr*n*sign,cc=c+dc*n*sign;if(rr<0||cc<0||rr>=GRID||cc>=GRID||getType(rr,cc)!==type)break;count++;}if(count>=3)return true;}return false;
}
function findAvailableMove(){
  for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){
    for(const [dr,dc] of [[0,1],[1,0]]){
      const rr=r+dr,cc=c+dc;if(rr>=GRID||cc>=GRID)continue;
      const a=getSpecial(r,c),b=getSpecial(rr,cc);
      if((a&&b)||a===SPECIAL.BOMB||b===SPECIAL.BOMB)return [{r,c},{r:rr,c:cc}];
      [grid[r][c],grid[rr][cc]]=[grid[rr][cc],grid[r][c]];
      const works=hasMatchAt(r,c)||hasMatchAt(rr,cc);
      [grid[r][c],grid[rr][cc]]=[grid[rr][cc],grid[r][c]];
      if(works)return [{r,c},{r:rr,c:cc}];
    }
  }
  return null;
}
function ensurePlayableBoard(){
  if(findAvailableMove())return false;
  const candies=grid.flat();
  for(let attempt=0;attempt<200;attempt++){
    for(let i=candies.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[candies[i],candies[j]]=[candies[j],candies[i]];}
    grid=Array.from({length:GRID},(_,r)=>candies.slice(r*GRID,(r+1)*GRID));
    if(!findMatchesNew().matched.length&&findAvailableMove())return true;
  }
  // A pathological board can lack enough variation for any valid permutation.
  // Preserve earned specials while regenerating the ordinary candies.
  const specials=candies.filter(v=>v&&typeof v==='object');
  initGrid();specials.forEach((v,i)=>{const r=Math.floor(i/GRID),c=i%GRID;grid[r][c]={...v,type:grid[r][c]};});
  return true;
}
function findBestHint(){
  let best=null,bestValue=-1;
  for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)for(const [dr,dc] of [[0,1],[1,0]]){
    const rr=r+dr,cc=c+dc;if(rr>=GRID||cc>=GRID)continue;
    const a=getSpecial(r,c),b=getSpecial(rr,cc);let value=0;
    if((a&&b)||a===SPECIAL.BOMB||b===SPECIAL.BOMB)value=100;
    else{
      [grid[r][c],grid[rr][cc]]=[grid[rr][cc],grid[r][c]];
      try{if(hasMatchAt(r,c)||hasMatchAt(rr,cc)){const result=findMatchesNew();value=result.matched.length*10+result.specialCreations.length*35;
        for(const cell of result.matched){if(objective.ice.includes(cell.r*GRID+cell.c))value+=35;const type=getType(cell.r,cell.c);if(objective.targets.some(t=>t.type===type&&(objective.collected[type]||0)<t.count))value+=25;}
      }}finally{[grid[r][c],grid[rr][cc]]=[grid[rr][cc],grid[r][c]];}
    }
    if(value>0&&value>bestValue){bestValue=value;best=[{r,c},{r:rr,c:cc}];}
  }return best;
}
function showHint(){
  if(busy||paused||pregame||gameEnded||hammerMode||bombMode)return;
  const move=findBestHint();
  if(!move){ensurePlayableBoard();renderBoard();saveGameState();return;}
  document.querySelectorAll('.cell.hint').forEach(el=>el.classList.remove('hint'));
  move.forEach(({r,c})=>{const el=getCell(r,c);if(el){el.classList.add('hint');setTimeout(()=>el.classList.remove('hint'),1800);}});
  const message=document.getElementById('board-message');message.textContent='Try swapping the glowing candies';
  setTimeout(()=>{if(message.textContent==='Try swapping the glowing candies')message.textContent=boardInstruction();},1800);
}

async function animateSwap(r1,c1,r2,c2){
  if(!settings.anim)return;
  if(window.Candy3D){await window.Candy3D.swap(r1*GRID+c1,r2*GRID+c2);return;}
  const a=getCell(r1,c1),b=getCell(r2,c2);if(!a||!b)return;
  const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
  a.querySelector('.candy-art').style.transform=`translate(${br.x-ar.x}px,${br.y-ar.y}px)`;
  b.querySelector('.candy-art').style.transform=`translate(${ar.x-br.x}px,${ar.y-br.y}px)`;
  a.classList.add('swapping');b.classList.add('swapping');
  await delay(170);
}
async function dropCandies(){
  const session=gameSession;
  const drops=applyGravity();renderBoard(drops);
  if(settings.anim)await delay(300);
  if(session!==gameSession)return;
  document.querySelectorAll('.cell.falling').forEach(el=>el.classList.remove('falling'));
  updateStats();
}
