const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(let winner=0;winner<9;winner++)test('spin ends on exactly winner '+winner+' and claims once',()=>{
 const timers=[],slots=Array.from({length:9},()=>({style:{},classes:new Set(),classList:{remove(n){this.owner.classes.delete(n)},toggle(n,on){on?this.owner.classes.add(n):this.owner.classes.delete(n)}}}));slots.forEach(s=>s.classList.owner=s);
 const button={style:{}},nodes={'spin-grid':{},'spin-action-btn':button,'spin-remaining':{}};slots.forEach((s,i)=>nodes['spin-slot-'+i]=s);let rewards=0,ticks=0;
 const ctx=vm.createContext({document:{getElementById:id=>nodes[id]||null,querySelectorAll:()=>slots},dailyData:{spinCount:1},saveDailyData(){},setTimeout:fn=>timers.push(fn),getAC:()=>null,playTone:()=>ticks++,playWin(){},addLife:()=>rewards++,earnBooster:()=>rewards++,showRewardToast(){},goScreen(){}});
 vm.runInContext(fs.readFileSync('js/spin.js','utf8'),ctx);vm.runInContext('doSpin('+winner+');doSpin('+winner+');',ctx);assert.equal(ctx.dailyData.spinCount,0);
 while(timers.length)timers.shift()();assert.equal(ticks,28+winner);assert.equal(slots.filter(s=>s.classes.has('is-active')).length,0);assert.deepEqual(slots.map((s,i)=>s.classes.has('is-winner')?i:-1).filter(i=>i>=0),[winner]);
 button.onclick();const once=rewards;button.onclick();assert.ok(once>0);assert.equal(rewards,once);
});
