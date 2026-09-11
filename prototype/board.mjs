// Small, deterministic rules model for the renderer experiment, not a replacement
// for the production game's specials, objectives, progression, or persistence.
export const SIZE = 8;
export function seededRandom(seed = 1979) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function matches(board) {
  const found = new Set();
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) {
    const i=r*SIZE+c, type=board[i]; if (type<0) continue;
    if (c<6 && type===board[i+1] && type===board[i+2]) {
      let k=c; while(k<SIZE && board[r*SIZE+k]===type) found.add(r*SIZE+k++);
    }
    if (r<6 && type===board[i+SIZE] && type===board[i+SIZE*2]) {
      let k=r; while(k<SIZE && board[k*SIZE+c]===type) found.add(k++*SIZE+c);
    }
  }
  return [...found];
}
export function adjacent(a,b) {
  return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<64&&b<64&&
    Math.abs(a%SIZE-b%SIZE)+Math.abs(Math.floor(a/SIZE)-Math.floor(b/SIZE))===1;
}
export function swap(board,a,b) { [board[a],board[b]]=[board[b],board[a]]; }
export function availableMove(board) {
  for(let i=0;i<64;i++) for(const j of [i+1,i+SIZE]) {
    if(!adjacent(i,j)) continue;
    swap(board,i,j); const found=matches(board).length>0; swap(board,i,j);
    if(found) return [i,j];
  }
  return null;
}
export function makeBoard(random) {
  for(let attempt=0;attempt<100;attempt++) {
    const board=[];
    for(let i=0;i<64;i++) {
      const allowed=[];
      for(let t=0;t<6;t++) {
        if(i%8>=2&&board[i-1]===t&&board[i-2]===t) continue;
        if(i>=16&&board[i-8]===t&&board[i-16]===t) continue;
        allowed.push(t);
      }
      board.push(allowed[Math.min(allowed.length-1,Math.floor(random()*allowed.length))]);
    }
    if(availableMove(board)) return board;
  }
  const board=Array.from({length:64},(_,i)=>(Math.floor(i/8)+i%8)%6);
  board[0]=1; board[1]=0; board[2]=1; board[9]=1;
  return board;
}
export function collapse(board,random) {
  const movement=[];
  for(let c=0;c<8;c++) {
    let dest=7;
    for(let r=7;r>=0;r--) if(board[r*8+c]>=0) {
      board[dest*8+c]=board[r*8+c];
      movement.push({to:dest*8+c,from:r*8+c,distance:dest-r}); dest--;
    }
    const missing=dest+1;
    for(let r=dest;r>=0;r--) {
      board[r*8+c]=Math.min(5,Math.floor(random()*6));
      movement.push({to:r*8+c,from:null,distance:missing});
    }
  }
  return movement;
}
