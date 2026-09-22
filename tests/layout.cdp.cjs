// Run against a local Chrome debugging port: node tests/layout.cdp.cjs 9223
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const port=process.argv[2]||'9223';
const outputDir=process.argv[3]||'';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function connect(){
  let pages=[];
  for(let attempt=0;attempt<40;attempt++){
    try{pages=await fetch(`http://127.0.0.1:${port}/json/list`).then(r=>r.json());if(pages.length)break;}catch{}
    await delay(100);
  }
  const page=pages.find(p=>p.type==='page');assert.ok(page,'Chrome debugging page was not found');
  const socket=new WebSocket(page.webSocketDebuggerUrl),pending=new Map();let nextId=0;
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=event=>{const message=JSON.parse(event.data);if(!message.id)return;const job=pending.get(message.id);if(!job)return;pending.delete(message.id);message.error?job.reject(new Error(message.error.message)):job.resolve(message.result);};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  return {socket,send};
}

(async()=>{
  const {socket,send}=await connect();
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.navigate',{url:'http://127.0.0.1:4174/'});await delay(350);
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.text);return result.result.value;};
  await evaluate(`localStorage.setItem('cb_guest_mode','1');localStorage.setItem('cb_tutorial_done','1');location.reload()`);await delay(700);
  await evaluate(`(async()=>{for(let i=0;i<80&&!window.goScreen;i++)await new Promise(r=>setTimeout(r,50));document.getElementById('entry-overlay')?.remove();settings.anim=false;return true;})()`);
  const sizes=[[320,568],[360,800],[390,844],[430,932],[844,390],[768,1024]];
  const screens=[
    ['home',`goScreen('start')`],
    ['journey',`goScreen('map');renderMapScreen()`],
    ['settings',`goScreen('settings')`],
    ['rewards',`goScreen('rewards');renderRewardsScreen()`],
    ['spin',`openSpinScreen()`],
    ['shop',`openShop()`],
    ['tutorial',`tutSlide=1;goScreen('tutorial');renderTutSlide(1)`],
    ['game',`startMapLevelPrepared(1,[])`]
  ];
  const failures=[];
  for(const [width,height] of sizes){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height});
    for(const [name,open] of screens){
      await evaluate(open);await delay(name==='tutorial'?420:380);
      const result=await evaluate(`(()=>{const vw=innerWidth,vh=innerHeight,root=document.querySelector('.screen:not(.hidden)');const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1};const overflow=[...root.querySelectorAll('*')].filter(visible).filter(el=>{if(el.closest('.journey-trail')&&!el.classList.contains('journey-level'))return false;const r=el.getBoundingClientRect();return r.left < -2 || r.right > vw+2;}).slice(0,8).map(el=>({tag:el.tagName,id:el.id,cls:el.className?.toString().slice(0,80),rect:[Math.round(el.getBoundingClientRect().left),Math.round(el.getBoundingClientRect().right)]}));return {viewport:[vw,vh],screen:root.id,root:[Math.round(root.getBoundingClientRect().width),Math.round(root.getBoundingClientRect().height)],scrollWidth:document.documentElement.scrollWidth,overflow};})()`);
      if(result.scrollWidth>width+2||result.root[0]>width+2||result.root[1]>height+2||result.overflow.length)failures.push({size:`${width}x${height}`,name,...result});
      if(outputDir&&width===320&&(name==='home'||name==='rewards'||name==='shop'||name==='game'||name==='tutorial')){const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});fs.mkdirSync(outputDir,{recursive:true});fs.writeFileSync(path.join(outputDir,`${width}x${height}-${name}.png`),Buffer.from(shot.data,'base64'));}
    }
  }
  const authScreens=[
    ['signin',`window.CandyCloud?.openAccount?.()`],
    ['signup',`document.getElementById('auth-switch')?.click()`]
  ];
  for(const [width,height] of sizes){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:true,screenWidth:width,screenHeight:height});
    for(const [name,open] of authScreens){
      await evaluate(open);await delay(80);
      const result=await evaluate(`(()=>{const host=document.getElementById('entry-overlay'),card=host?.querySelector('.entry-card');if(!host||!card)return {missing:true};const h=host.getBoundingClientRect(),c=card.getBoundingClientRect();return {missing:false,hostScroll:host.scrollHeight>host.clientHeight+2,cardScroll:card.scrollHeight>card.clientHeight+2,card:[Math.round(c.left),Math.round(c.top),Math.round(c.right),Math.round(c.bottom)],viewport:[innerWidth,innerHeight]};})()`);
      if(result.missing||result.hostScroll||result.cardScroll||result.card[0]<-2||result.card[1]<-2||result.card[2]>width+2||result.card[3]>height+2)failures.push({size:`${width}x${height}`,name,...result});
      if(outputDir&&(width===320||width===390)){const shot=await send('Page.captureScreenshot',{format:'png',fromSurface:true});fs.mkdirSync(outputDir,{recursive:true});fs.writeFileSync(path.join(outputDir,`${width}x${height}-${name}.png`),Buffer.from(shot.data,'base64'));}
    }
    await evaluate(`document.getElementById('entry-overlay')?.remove()`);
  }
  socket.close();
  if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1;}else console.log(`Responsive layout passed ${sizes.length} viewports × ${screens.length} screens.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
