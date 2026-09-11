// CPU-only baseline of the actual production rules. No DOM, storage, or GPU.
// Run: node scripts/benchmark-rules.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {makeBoard,seededRandom} from '../prototype/board.mjs';
const context=vm.createContext({console,Set,Math});
vm.runInContext('const GRID=8; let grid=[];',context);
for(const file of ['specials','adventure'])vm.runInContext(fs.readFileSync(new URL(`../js/${file}.js`,import.meta.url),'utf8'),context);
const find=vm.runInContext('findAvailableMove',context),match=vm.runInContext('findMatchesNew',context);
const boards=Array.from({length:250},(_,seed)=>makeBoard(seededRandom(seed)));
function setBoard(board){context.sample=Array.from({length:8},(_,r)=>board.slice(r*8,r*8+8));vm.runInContext('grid=sample',context);}
for(const b of boards.slice(0,30)){setBoard(b);find();match();}
function measure(fn){const values=[];for(const b of boards){setBoard(b);const start=performance.now();fn();values.push(performance.now()-start);}values.sort((a,b)=>a-b);return {p50Ms:+values[124].toFixed(3),p95Ms:+values[237].toFixed(3),maxMs:+values[249].toFixed(3)};}
const output={node:process.version,samples:boards.length,seedRange:'0..249',colors:6,match:measure(match),availableMove:measure(find)};
setBoard(Array.from({length:64},(_,i)=>(Math.floor(i/8)+i%8)%4));
const start=performance.now(),move=find();output.noMoveScan={returned:move,ms:+(performance.now()-start).toFixed(3)};
console.log(JSON.stringify(output,null,2));
