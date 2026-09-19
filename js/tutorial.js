// ═══════ TUTORIAL (slide-based) ═══════
let tutSlide=0,tutEpoch=0;
function tutLater(fn,ms){const epoch=tutEpoch;return setTimeout(()=>{if(epoch===tutEpoch&&currentScreen==='tutorial'&&!document.hidden&&settings.anim&&!matchMedia('(prefers-reduced-motion: reduce)').matches)fn();},ms);}
const TUT_COLORS=['c0','c1','c2','c3','c4','c5'];
const TUT_ICONS=['🍒','💎','🍀','⭐','🔮','🍊'];

function skipTutorial(){localStorage.setItem('cb_tutorial_done','1');startMapLevel(mapData.currentLevel);}
function nextTutSlide(){tutSlide++;if(tutSlide>=6){localStorage.setItem('cb_tutorial_done','1');startMapLevel(mapData.currentLevel);}else{renderTutSlide(tutSlide);}}
function checkFirstTime(){if(!localStorage.getItem('cb_tutorial_done')){setTimeout(()=>{if(currentScreen!=='start'||document.getElementById('entry-overlay'))return;tutSlide=0;goScreen('tutorial');renderTutSlide(0);},800);}}

function renderTutSlide(n){
  tutEpoch++;
  const container=document.getElementById('tut-container');
  container.innerHTML='';container.style.animation='none';void container.offsetHeight;container.style.animation='slideInTut 0.35s ease';
  const skipBtn=document.getElementById('tut-skip-btn');
  if(skipBtn)skipBtn.style.display=n===5?'none':'block';
  const visual=document.createElement('div');
  visual.style.cssText='flex:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:60px 20px 20px;';
  const panel=document.createElement('div');
  panel.style.cssText='background:linear-gradient(135deg,rgba(60,15,100,0.97),rgba(20,5,40,0.98));border:1.5px solid rgba(255,255,255,0.12);border-radius:28px 28px 0 0;padding:28px 24px 36px;text-align:center;flex-shrink:0;';
  const slides=[
    {title:'Welcome to Candy Blast! 🍭',body:'A sweet puzzle game where you match colorful candies to score points and beat each level!',btn:"Let's Go! →"},
    {title:'Tap to Swap! 👆',body:'Tap any candy, then tap an adjacent candy next to it. Swap to line up three matching candies. You can also swipe toward a neighbor.',btn:'Got it! →'},
    {title:'Match 3 or More! 🎯',body:'Line up 3 or more same candies in a row or column — they explode and you earn points!',btn:'Nice! →'},
    {title:'Chain Combos! 🔥',body:'When new candies fall and match automatically, it creates a COMBO! Each combo multiplies your score!',btn:'Awesome! →'},
    {title:'Score Big, Move Smart! 🧠',body:'Reach the target score before your moves run out. Earn more points to reach the next star milestone!',btn:'Understood! →'},
    {title:"You're Ready! 🎉",body:'Match candies, chain combos, and reach the target score. Good luck, champion!',btn:'▶ Start Playing!'}
  ];
  const s=slides[n];
  const title=document.createElement('div');
  title.style.cssText="font-family:'Fredoka One',cursive;font-size:1.65rem;background:linear-gradient(135deg,#ffe259,#ff5fa0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:10px;";
  title.textContent=s.title;
  const body=document.createElement('p');
  body.style.cssText='color:rgba(255,255,255,0.75);font-size:0.95rem;line-height:1.65;margin-bottom:22px;max-width:300px;margin-left:auto;margin-right:auto;';
  body.textContent=s.body;
  const dots=document.createElement('div');
  dots.style.cssText='display:flex;gap:8px;justify-content:center;margin-bottom:18px;';
  for(let i=0;i<6;i++){
    const dot=document.createElement('div');
    dot.style.cssText=`height:8px;border-radius:4px;transition:all 0.3s;width:${i===n?'28px':'8px'};background:${i===n?'var(--t-primary,#ff5fa0)':'rgba(255,255,255,0.2)'};`;
    dots.appendChild(dot);
  }
  const btn=document.createElement('button');btn.className='btn btn-play';
  btn.style.cssText='width:100%;padding:14px;font-size:1.1rem;';
  btn.textContent=s.btn;btn.onclick=nextTutSlide;
  panel.appendChild(title);panel.appendChild(body);panel.appendChild(dots);panel.appendChild(btn);
  buildTutVisual(n,visual);
  container.appendChild(visual);container.appendChild(panel);
}

function buildTutVisual(n,wrap){
  if(n===0)buildVis0(wrap);else if(n===1)buildVis1(wrap);else if(n===2)buildVis2(wrap);
  else if(n===3)buildVis3(wrap);else if(n===4)buildVis4(wrap);else if(n===5)buildVis5(wrap);
}
function buildVis0(wrap){
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(3,1fr);gap:12px;';
  [0,1,2,3,4,5].forEach((t,i)=>{
    const cell=document.createElement('div');cell.className='tut-candy-cell '+TUT_COLORS[t];
    cell.textContent=TUT_ICONS[t];cell.style.animation=`floatUD ${1.5+i*.2}s ease-in-out ${i*.15}s infinite`;
    grid.appendChild(cell);
  });
  wrap.appendChild(grid);
}
function buildVis1(wrap){
  wrap.style.flexDirection='column';wrap.style.gap='20px';
  const types=[2,1,4,0,2,5,2,4,1],names=['Berry heart','Blue diamond','Mint leaf','Honey star','Grape drop','Orange bean'];
  const grid=document.createElement('div');grid.className='tutorial-practice';
  const message=document.createElement('p');message.className='tutorial-instruction';message.setAttribute('role','status');message.textContent='Tap the heart. Then tap the mint beside it.';
  let first=null,done=false,moving=false;
  types.forEach((type,i)=>{
    const cell=document.createElement('button');cell.type='button';cell.className='tut-candy-cell '+TUT_COLORS[type];cell.setAttribute('aria-label',names[type]);cell.disabled=i!==3&&i!==4;
    if(i===3||i===4)cell.classList.add('practice-target');
    cell.onclick=async()=>{
      if(done||moving)return;
      if(first===null||first===i){first=first===i?null:i;grid.querySelectorAll('button').forEach((el,n)=>{el.classList.toggle('practice-selected',n===first);el.setAttribute('aria-pressed',String(n===first));});message.textContent=first===null?'Tap either highlighted candy.':'Now tap the candy beside it.';return;}
      moving=true;const left=grid.children[3],right=grid.children[4],distance=right.offsetLeft-left.offsetLeft;
      const animate=settings.anim&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
      left.style.transition=right.style.transition=animate?'transform .28s ease':'none';left.style.transform='translateX('+distance+'px)';right.style.transform='translateX(-'+distance+'px)';
      if(animate)await new Promise(resolve=>setTimeout(resolve,290));
      if(!grid.isConnected)return;
      left.style.transition=right.style.transition='none';left.style.transform=right.style.transform='';left.className='tut-candy-cell c2';right.className='tut-candy-cell c0';left.setAttribute('aria-label',names[2]);right.setAttribute('aria-label',names[0]);
      grid.querySelectorAll('button').forEach(el=>{el.disabled=true;el.classList.remove('practice-selected','practice-target');el.removeAttribute('aria-pressed');});
      [0,3,6].forEach(n=>grid.children[n].classList.add('practice-match'));message.textContent='Perfect! Three mints in a column. That is a match.';done=true;moving=false;
    };grid.append(cell);
  });wrap.append(grid,message);
}
function buildVis2(wrap){
  wrap.style.flexDirection='column';wrap.style.gap='16px';
  const initTypes=[0,1,0,0,1],swappedTypes=[1,0,0,0,1],CS=0;
  const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;align-items:center;position:relative;';
  const cellEls=[];
  initTypes.forEach(t=>{
    const cell=document.createElement('div');cell.className='tut-candy-cell '+TUT_COLORS[t];
    cell.textContent=TUT_ICONS[t];cell.style.cssText+='transition:transform 0.4s ease,opacity 0.3s ease,box-shadow 0.3s ease;flex-shrink:0;';
    row.appendChild(cell);cellEls.push(cell);
  });
  const scoreEl=document.createElement('div');
  scoreEl.style.cssText="font-family:'Fredoka One',cursive;font-size:2rem;color:#ffe259;opacity:0;transition:opacity 0.3s ease,transform 0.5s ease;text-align:center;text-shadow:0 0 20px rgba(255,226,89,0.8);transform:translateY(0);";
  scoreEl.textContent='+90 🎉';wrap.appendChild(row);wrap.appendChild(scoreEl);
  function resetRow(){
    initTypes.forEach((t,i)=>{cellEls[i].className='tut-candy-cell '+TUT_COLORS[t];cellEls[i].textContent=TUT_ICONS[t];
      cellEls[i].style.transform='';cellEls[i].style.opacity='1';cellEls[i].style.boxShadow='';
      cellEls[i].style.transition='transform 0.4s ease,opacity 0.3s ease,box-shadow 0.3s ease';});
    scoreEl.style.opacity='0';scoreEl.style.transform='translateY(0)';
  }
  function runAnim(){
    if(!document.body.contains(row))return;
    tutLater(()=>{if(!document.body.contains(row))return;
      cellEls[0].style.boxShadow='0 0 0 3px #fff,0 0 16px rgba(255,255,255,0.7)';
      cellEls[1].style.boxShadow='0 0 0 3px #fff,0 0 16px rgba(255,255,255,0.7)';},300);
    tutLater(()=>{if(!document.body.contains(row))return;
      const distance=cellEls[1].offsetLeft-cellEls[0].offsetLeft;cellEls[0].style.transform='translateX('+distance+'px)';cellEls[1].style.transform='translateX(-'+distance+'px)';
      cellEls[0].style.boxShadow='';cellEls[1].style.boxShadow='';},800);
    tutLater(()=>{if(!document.body.contains(row))return;
      swappedTypes.forEach((t,i)=>{cellEls[i].className='tut-candy-cell '+TUT_COLORS[t];cellEls[i].textContent=TUT_ICONS[t];
        cellEls[i].style.transform='';cellEls[i].style.transition='transform 0s,opacity 0.3s,box-shadow 0.3s';});},1250);
    tutLater(()=>{if(!document.body.contains(row))return;
      cellEls.forEach(c=>{c.style.transition='transform 0.3s ease,opacity 0.3s ease,box-shadow 0.3s ease';});
      [1,2,3].forEach(i=>{cellEls[i].style.boxShadow='0 0 0 3px #fff,0 0 24px rgba(255,100,150,0.9)';cellEls[i].style.transform='scale(1.15)';});},1600);
    tutLater(()=>{if(!document.body.contains(row))return;
      [1,2,3].forEach(i=>{cellEls[i].style.transform='scale(0)';cellEls[i].style.opacity='0';cellEls[i].style.boxShadow='';});},2100);
    tutLater(()=>{if(!document.body.contains(row))return;
      scoreEl.style.opacity='1';scoreEl.style.transform='translateY(-24px)';},2400);
    tutLater(()=>{if(!document.body.contains(row))return;resetRow();tutLater(runAnim,400);},3600);
  }
  tutLater(runAnim,500);
}
function buildVis3(wrap){
  const comboEl=document.createElement('div');
  comboEl.style.cssText="font-family:'Fredoka One',cursive;font-size:2.5rem;text-align:center;transition:all 0.3s;color:#fff;";
  comboEl.textContent='x1';
  const ptsEl=document.createElement('div');
  ptsEl.style.cssText="font-family:'Fredoka One',cursive;font-size:1.3rem;color:rgba(255,255,255,0.6);text-align:center;margin-top:8px;transition:all 0.3s;";
  ptsEl.textContent='30 pts';wrap.appendChild(comboEl);wrap.appendChild(ptsEl);
  const combos=[{txt:'x1',color:'#ffffff',pts:'30 pts'},{txt:'x2 COMBO! 🔥',color:'#ffe259',pts:'60 pts  ×2'},{txt:'x3 COMBO! 💥',color:'#ff8c42',pts:'90 pts  ×3'},{txt:'x4 COMBO! 🌟',color:'#ff5fa0',pts:'120 pts ×4'}];
  let ci=0;
  function next(){if(!document.body.contains(comboEl))return;ci=(ci+1)%combos.length;const c=combos[ci];
    comboEl.style.transform='scale(1.3)';comboEl.style.color=c.color;comboEl.textContent=c.txt;ptsEl.textContent=c.pts;ptsEl.style.color=c.color;
    tutLater(()=>{comboEl.style.transform='scale(1)';},300);tutLater(next,1200);
  }
  tutLater(next,1000);
}
function buildVis4(wrap){
  wrap.style.gap='16px';wrap.style.flexDirection='row';wrap.style.alignItems='center';wrap.style.justifyContent='center';
  const scoreBox=document.createElement('div');scoreBox.style.cssText='background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:16px 20px;text-align:center;min-width:130px;';
  const sLabel=document.createElement('div');sLabel.style.cssText='font-size:.65rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1px;';sLabel.textContent='SCORE';
  const sVal=document.createElement('div');sVal.style.cssText="font-family:'Fredoka One',cursive;font-size:1.8rem;color:#ffe259;";sVal.textContent='0';
  const sBar=document.createElement('div');sBar.style.cssText='background:rgba(255,255,255,.1);border-radius:6px;height:6px;margin-top:8px;overflow:hidden;';
  const sBarFill=document.createElement('div');sBarFill.style.cssText='height:100%;border-radius:6px;background:linear-gradient(90deg,#ff5fa0,#ffe259);width:0%;transition:width 0.4s;';
  sBar.appendChild(sBarFill);scoreBox.appendChild(sLabel);scoreBox.appendChild(sVal);scoreBox.appendChild(sBar);
  const movesBox=document.createElement('div');movesBox.style.cssText='background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:16px 20px;text-align:center;min-width:130px;transition:all 0.3s;';
  const mLabel=document.createElement('div');mLabel.style.cssText='font-size:.65rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1px;';mLabel.textContent='MOVES';
  const mVal=document.createElement('div');mVal.style.cssText="font-family:'Fredoka One',cursive;font-size:1.8rem;color:#ff88cc;transition:color 0.3s;";mVal.textContent='30';
  movesBox.appendChild(mLabel);movesBox.appendChild(mVal);wrap.appendChild(scoreBox);wrap.appendChild(movesBox);
  const scoreSteps=[0,150,320,580,1000],moveSteps=[30,25,20,10,5];let si=0;
  function anim(){if(!document.body.contains(scoreBox))return;si=(si+1)%scoreSteps.length;
    const sc=scoreSteps[si],mv=moveSteps[si];sVal.textContent=sc.toLocaleString();sBarFill.style.width=(sc/1000*100)+'%';
    mVal.textContent=mv;mVal.style.color=mv<=5?'#ff4444':mv<=10?'#ff8c42':'#ff88cc';
    movesBox.style.animation=mv<=5?'pulse-red 0.5s infinite':'none';sVal.style.color=sc>=1000?'#43e97b':'#ffe259';
    tutLater(anim,900);
  }
  tutLater(anim,800);
}
function buildVis5(wrap){
  wrap.style.position='relative';wrap.style.overflow='hidden';
  const candy=document.createElement('div');candy.style.cssText='font-size:5rem;animation:floatUD 2s ease-in-out infinite;position:relative;z-index:2;filter:drop-shadow(0 0 20px rgba(255,200,100,0.5));';
  candy.textContent='🍭';
  const stars=document.createElement('div');stars.style.cssText='display:flex;gap:8px;margin-top:12px;position:relative;z-index:2;';
  ['⭐','⭐','⭐'].forEach((s,i)=>{const star=document.createElement('div');star.style.cssText=`font-size:2.2rem;opacity:0;animation:starPop 0.4s ease forwards;animation-delay:${0.3+i*0.2}s;`;star.textContent=s;stars.appendChild(star);});
  const inner=document.createElement('div');inner.style.cssText='display:flex;flex-direction:column;align-items:center;z-index:2;position:relative;';
  inner.appendChild(candy);inner.appendChild(stars);wrap.appendChild(inner);
  const colors=['#ff5fa0','#ffe259','#43e97b','#4facfe','#c471ed','#ff8c42'];
  function spawnConfetti(){if(!document.body.contains(wrap))return;
    for(let i=0;i<18;i++){const p=document.createElement('div');const angle=Math.random()*360;const dist=80+Math.random()*120;
      const tx=Math.cos(angle*Math.PI/180)*dist,ty=Math.sin(angle*Math.PI/180)*dist-60;
      p.style.cssText=`position:absolute;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>.5?'50%':'3px'};left:50%;top:50%;--tx:${tx}px;--ty:${ty}px;--rot:${Math.random()*720}deg;animation:confettiBurst ${.8+Math.random()*.6}s ease forwards;pointer-events:none;z-index:1;`;
      wrap.appendChild(p);tutLater(()=>p.remove(),1500);
    }
    tutLater(spawnConfetti,2000);
  }
  tutLater(spawnConfetti,300);
}
