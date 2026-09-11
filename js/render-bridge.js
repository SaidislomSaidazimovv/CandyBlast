// The existing game owns rules, progression and storage. Rendering only reads it.
window.Candy3DBridge={
  snapshot(){return {cells:Array.from({length:64},(_,i)=>({type:grid?.[Math.floor(i/8)]?getType(Math.floor(i/8),i%8):-1,special:grid?.[Math.floor(i/8)]?getSpecial(Math.floor(i/8),i%8):null,ice:objective.ice.includes(i)})),session:gameSession,active:currentScreen==='game',paused:paused||pregame||gameEnded,anim:settings.anim};},
  select(i){const cell=getCell(Math.floor(i/8),i%8);if(cell)onCellClick({currentTarget:cell});},
  swipe(a,b){if(hammerMode||bombMode||busy||paused||pregame||gameEnded)return;if(selected){getCell(selected.r,selected.c)?.classList.remove('selected');selected=null;}trySwap(Math.floor(a/8),a%8,Math.floor(b/8),b%8);}
};
