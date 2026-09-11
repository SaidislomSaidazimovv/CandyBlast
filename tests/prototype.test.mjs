import test from 'node:test';
import assert from 'node:assert/strict';
import {seededRandom,makeBoard,matches,availableMove,adjacent,swap,collapse} from '../prototype/board.mjs';

test('3D sample boards are reproducible, match-free and playable across 500 seeds',()=>{
  for(let seed=0;seed<500;seed++){
    const board=makeBoard(seededRandom(seed));
    assert.deepEqual(board,makeBoard(seededRandom(seed)));
    assert.equal(board.length,64);assert.ok(board.every(t=>t>=0&&t<6));
    assert.deepEqual(matches(board),[]);
    const before=[...board],move=availableMove(board);
    assert.ok(move);assert.deepEqual(board,before);assert.ok(adjacent(...move));
    swap(board,...move);assert.ok(matches(board).length>=3);
  }
});
test('3D gravity preserves survivor order in every column and fills all holes',()=>{
  const random=seededRandom(94),board=makeBoard(random);
  for(const i of [0,2,7,8,11,24,31,32,56,60,63])board[i]=-1;
  const survivors=Array.from({length:8},(_,c)=>board.filter((v,i)=>i%8===c&&v>=0));
  const drops=collapse(board,random);
  assert.equal(drops.length,64);assert.equal(new Set(drops.map(d=>d.to)).size,64);
  assert.ok(board.every(t=>t>=0&&t<6));
  for(let c=0;c<8;c++)assert.deepEqual(board.filter((v,i)=>i%8===c).slice(8-survivors[c].length),survivors[c]);
  for(const d of drops)if(d.from!==null)assert.equal(d.distance,(d.to-d.from)/8);
});
test('3D matches include intersecting runs once; row edges are not neighbours',()=>{
  const board=Array(64).fill(-1);
  for(const i of [17,18,19,10,26])board[i]=2;
  assert.deepEqual(matches(board).sort((a,b)=>a-b),[10,17,18,19,26]);
  assert.equal(adjacent(7,8),false);assert.equal(adjacent(-1,0),false);assert.equal(adjacent(63,64),false);
});
test('3D board creation terminates with a constant random source',()=>{
  for(const n of [0,.5,.999999]){const board=makeBoard(()=>n);assert.equal(matches(board).length,0);assert.ok(availableMove(board));}
});
