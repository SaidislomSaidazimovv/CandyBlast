// ═══════ STATE ═══════
const GRID=8,TYPES=6;
const ICONS=['🍒','💎','🍀','⭐','🔮','🍊'];
const COLORS=['c0','c1','c2','c3','c4','c5'];
let grid=[],selected=null,score=0,moves=30,level=1,busy=false,combo=0,targetScore=500,levelScore=0;
let bestScore=+localStorage.getItem('cb_best')||0;
let settings={sfx:true,music:false,vibro:true,anim:true,volume:70,diff:'normal',theme:''};
let personalBest=[];
let paused=false;

// ═══════ THEME COLORS ═══════
const themeColors={
  '':{
    '--t-primary':'#ff5fa0','--t-secondary':'#c471ed','--t-accent':'#ffe259',
    '--t-panel-bg':'rgba(80,20,120,0.92)','--t-panel-border':'rgba(255,255,255,0.15)',
    '--t-btn-primary':'linear-gradient(135deg,#ff5fa0,#ff8c42)','--t-btn-shadow':'rgba(255,95,160,0.45)',
    '--t-stat-bg':'rgba(255,255,255,0.08)','--t-text':'#ffffff','--t-text-muted':'rgba(255,255,255,0.5)',
    '--t-progress':'linear-gradient(90deg,#ff5fa0,#ffe259,#a0f0ff)',
    '--t-overlay-bg':'rgba(10,0,20,0.85)','--t-header-btn':'rgba(255,255,255,0.1)',
  },
  'theme-ocean':{
    '--t-primary':'#00c8ff','--t-secondary':'#0066cc','--t-accent':'#00f2fe',
    '--t-panel-bg':'rgba(0,20,60,0.92)','--t-panel-border':'rgba(0,200,255,0.2)',
    '--t-btn-primary':'linear-gradient(135deg,#0066cc,#00c8ff)','--t-btn-shadow':'rgba(0,200,255,0.4)',
    '--t-stat-bg':'rgba(0,100,200,0.15)','--t-text':'#e0f8ff','--t-text-muted':'rgba(200,240,255,0.5)',
    '--t-progress':'linear-gradient(90deg,#0066cc,#00c8ff,#ffffff)',
    '--t-overlay-bg':'rgba(0,5,20,0.88)','--t-header-btn':'rgba(0,150,255,0.15)',
  },
  'theme-forest':{
    '--t-primary':'#43e97b','--t-secondary':'#1a6b35','--t-accent':'#ffe259',
    '--t-panel-bg':'rgba(5,20,5,0.93)','--t-panel-border':'rgba(67,233,123,0.2)',
    '--t-btn-primary':'linear-gradient(135deg,#1a6b35,#43e97b)','--t-btn-shadow':'rgba(67,233,123,0.35)',
    '--t-stat-bg':'rgba(67,233,123,0.08)','--t-text':'#d4ffe4','--t-text-muted':'rgba(200,255,220,0.5)',
    '--t-progress':'linear-gradient(90deg,#1a6b35,#43e97b,#ffe259)',
    '--t-overlay-bg':'rgba(0,8,0,0.88)','--t-header-btn':'rgba(67,233,123,0.12)',
  },
  'theme-fire':{
    '--t-primary':'#ff4500','--t-secondary':'#cc2200','--t-accent':'#ffcc00',
    '--t-panel-bg':'rgba(30,5,0,0.93)','--t-panel-border':'rgba(255,100,0,0.25)',
    '--t-btn-primary':'linear-gradient(135deg,#cc2200,#ff6600)','--t-btn-shadow':'rgba(255,69,0,0.45)',
    '--t-stat-bg':'rgba(255,80,0,0.1)','--t-text':'#ffe8d0','--t-text-muted':'rgba(255,220,180,0.5)',
    '--t-progress':'linear-gradient(90deg,#cc2200,#ff4500,#ffcc00)',
    '--t-overlay-bg':'rgba(10,2,0,0.9)','--t-header-btn':'rgba(255,80,0,0.15)',
  },
  'theme-candy':{
    '--t-primary':'#ff3399','--t-secondary':'#cc0066','--t-accent':'#ffff00',
    '--t-panel-bg':'rgba(40,0,50,0.92)','--t-panel-border':'rgba(255,50,150,0.25)',
    '--t-btn-primary':'linear-gradient(135deg,#ff3399,#ff88cc)','--t-btn-shadow':'rgba(255,50,150,0.45)',
    '--t-stat-bg':'rgba(255,50,150,0.1)','--t-text':'#ffe0f0','--t-text-muted':'rgba(255,200,230,0.5)',
    '--t-progress':'linear-gradient(90deg,#ff3399,#ffff00,#00ffcc)',
    '--t-overlay-bg':'rgba(15,0,20,0.88)','--t-header-btn':'rgba(255,50,150,0.15)',
  },
  'theme-white':{
    '--t-primary':'#e05599','--t-secondary':'#9933cc','--t-accent':'#cc6600',
    '--t-panel-bg':'rgba(255,255,255,0.88)','--t-panel-border':'rgba(0,0,0,0.1)',
    '--t-btn-primary':'linear-gradient(135deg,#e05599,#ff8c42)','--t-btn-shadow':'rgba(200,50,120,0.3)',
    '--t-stat-bg':'rgba(0,0,0,0.06)','--t-text':'#1a1a3e','--t-text-muted':'rgba(30,30,80,0.55)',
    '--t-progress':'linear-gradient(90deg,#e05599,#ff8c42,#9933cc)',
    '--t-overlay-bg':'rgba(200,210,240,0.85)','--t-header-btn':'rgba(0,0,0,0.08)',
  },
  'theme-black':{
    '--t-primary':'#ffd700','--t-secondary':'#b8860b','--t-accent':'#ffd700',
    '--t-panel-bg':'rgba(15,15,15,0.96)','--t-panel-border':'rgba(255,215,0,0.2)',
    '--t-btn-primary':'linear-gradient(135deg,#b8860b,#ffd700)','--t-btn-shadow':'rgba(255,215,0,0.3)',
    '--t-stat-bg':'rgba(255,215,0,0.06)','--t-text':'#f0e0a0','--t-text-muted':'rgba(240,220,140,0.5)',
    '--t-progress':'linear-gradient(90deg,#b8860b,#ffd700,#ffffff)',
    '--t-overlay-bg':'rgba(0,0,0,0.92)','--t-header-btn':'rgba(255,215,0,0.1)',
  },
};

function applyThemeColors(theme){
  const root=document.documentElement;
  const t=themeColors[theme]||themeColors[''];
  Object.entries(t).forEach(([k,v])=>root.style.setProperty(k,v));
}

// ═══════ BACKGROUND ANIMATION (legacy — replaced by SVG) ═══════
const bgCanvas=document.getElementById('bg-canvas');
if(bgCanvas)bgCanvas.style.display='none';

// Legacy canvas particle system removed — replaced by SVG backgrounds (js/backgrounds.js)
const TC_LEGACY={
  '':{// PURPLE — deep space candy
    count:50,
    init(p,w,h,i){
      if(i<15){// large orbs
        p.type='orb';p.x=rnd(0,w);p.y=rnd(0,h);p.r=rnd(8,20);
        p.color=['#ff5fa0','#c471ed','#7c3aed'][i%3];
        p.vx=rnd(-.3,.3);p.vy=rnd(-.2,.2);p.phase=rnd(0,6.28);
      }else{// sparkles
        p.type='sparkle';p.x=rnd(0,w);p.y=rnd(0,h);p.r=rnd(1,3);
        p.color=Math.random()>.5?'#ffffff':'#ffaacc';
        p.phase=rnd(0,6.28);p.speed=rnd(.02,.06);
      }
    },
    update(p,w,h,t){
      if(p.type==='orb'){
        p.phase+=.008;p.x+=p.vx;p.y+=p.vy;
        p.opacity=.2+Math.sin(p.phase)*.25;
        if(p.x<-30)p.x=w+30;if(p.x>w+30)p.x=-30;
        if(p.y<-30)p.y=h+30;if(p.y>h+30)p.y=-30;
      }else{
        p.phase+=p.speed;
        p.opacity=Math.max(0,.1+Math.sin(p.phase)*.6);
      }
    },
    draw(ctx,p){
      ctx.globalAlpha=p.opacity||.5;ctx.fillStyle=p.color;
      if(p.type==='orb'){
        ctx.shadowColor=p.color;ctx.shadowBlur=p.r*2;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();
        ctx.shadowBlur=0;
      }else{
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();
      }
    },
    drawBg(ctx,w,h,t){
      ctx.fillStyle='rgba(10,2,20,0.15)';ctx.fillRect(0,0,w,h);
      // shooting star every ~240 frames
      if(t%240<2){
        ctx.globalAlpha=.6;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;
        const sx=rnd(0,w*.5),sy=rnd(0,h*.3);
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+rnd(100,250),sy+rnd(60,150));ctx.stroke();
        ctx.globalAlpha=1;
      }
    },
    initBg(ctx,w,h){
      const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.7);
      g.addColorStop(0,'#1a0533');g.addColorStop(.5,'#2d0a4e');g.addColorStop(1,'#000005');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    }
  },
  'theme-ocean':{
    count:30,
    init(p,w,h){
      p.x=rnd(0,w);p.y=rnd(h*.3,h);p.r=rnd(2,8);
      p.color=['rgba(100,220,255,0.5)','rgba(0,200,255,0.4)','rgba(255,255,255,0.3)'][Math.floor(rnd(0,3))];
      p.speed=rnd(.4,1.2);p.wobble=rnd(0,6.28);p.wobbleS=rnd(.02,.05);
    },
    update(p,w,h){
      p.y-=p.speed;p.wobble+=p.wobbleS;p.x+=Math.sin(p.wobble)*.6;
      p.opacity=rnd(.3,.6);
      if(p.y<-10){p.y=h+rnd(5,30);p.x=rnd(0,w);}
    },
    draw(ctx,p){ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();},
    drawBg(ctx,w,h,t){
      ctx.fillStyle='rgba(0,10,26,0.08)';ctx.fillRect(0,0,w,h);
      // caustic rays
      ctx.globalAlpha=.04;ctx.strokeStyle='#00aaff';ctx.lineWidth=40;
      for(let i=0;i<5;i++){
        const rx=w*(.1+i*.2)+Math.sin(t*.003+i)*30;
        ctx.beginPath();ctx.moveTo(rx,-10);ctx.lineTo(rx+60,h*.6);ctx.stroke();
      }
      ctx.globalAlpha=1;
      // waves
      const waves=[{y:.6,amp:30,sp:.8,c:'rgba(0,150,200,0.3)'},{y:.72,amp:20,sp:1.2,c:'rgba(0,100,180,0.2)'},{y:.85,amp:15,sp:.5,c:'rgba(0,200,255,0.15)'}];
      waves.forEach(wv=>{
        ctx.fillStyle=wv.c;ctx.beginPath();ctx.moveTo(0,h);
        for(let x=0;x<=w;x+=3)ctx.lineTo(x,h*wv.y+Math.sin(x*.008+t*.002*wv.sp)*wv.amp);
        ctx.lineTo(w,h);ctx.closePath();ctx.fill();
      });
    },
    initBg(ctx,w,h){
      const g=ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#000d1a');g.addColorStop(1,'#001a33');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    }
  },
  'theme-forest':{
    count:40,
    init(p,w,h){
      p.x=rnd(0,w);p.y=rnd(0,h*.8);p.r=rnd(2,4);
      p.color=['#7fff00','#adff2f','#ffe259','#00ff88'][Math.floor(rnd(0,4))];
      p.baseX=p.x;p.baseY=p.y;p.angle=rnd(0,6.28);p.orbitR=rnd(15,40);
      p.orbitS=rnd(.01,.03);p.phase=rnd(0,6.28);
    },
    update(p,w,h){
      p.angle+=p.orbitS;p.phase+=.02;
      p.x=p.baseX+Math.sin(p.angle)*p.orbitR*.5;
      p.y=p.baseY+Math.cos(p.angle)*p.orbitR*.3;
      p.opacity=.3+Math.sin(p.phase)*.4;
    },
    draw(ctx,p){
      const o=Math.max(0,p.opacity);
      ctx.globalAlpha=o*.05;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r*3,0,6.28);ctx.fill();
      ctx.globalAlpha=o*.15;ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.5,0,6.28);ctx.fill();
      ctx.globalAlpha=o*.9;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();
    },
    drawBg(ctx,w,h,t){
      ctx.fillStyle='rgba(2,13,2,0.12)';ctx.fillRect(0,0,w,h);
      // mist
      ctx.globalAlpha=.03;ctx.fillStyle='#aaffaa';
      for(let i=0;i<4;i++){
        const mx=(w*(.1+i*.25)+Math.sin(t*.001+i)*40)%(w+200)-100;
        ctx.beginPath();ctx.ellipse(mx,h*.85+i*15,rnd(150,300),30,0,0,6.28);ctx.fill();
      }
      ctx.globalAlpha=1;
    },
    initBg(ctx,w,h){
      const g=ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#020d02');g.addColorStop(.6,'#0a1f0a');g.addColorStop(1,'#040e04');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
      // trees
      const trees=[{x:.08,h:140},{x:.18,h:100},{x:.3,h:180},{x:.42,h:90},{x:.55,h:160},{x:.68,h:120},{x:.78,h:190},{x:.9,h:110}];
      trees.forEach(tr=>{
        const tx=w*tr.x,th=tr.h,by=h;
        ctx.fillStyle='#0a1f0a';
        ctx.beginPath();ctx.moveTo(tx-th*.35,by);ctx.lineTo(tx,by-th);ctx.lineTo(tx+th*.35,by);ctx.closePath();ctx.fill();
        ctx.beginPath();ctx.moveTo(tx-th*.28,by-th*.3);ctx.lineTo(tx,by-th*1.2);ctx.lineTo(tx+th*.28,by-th*.3);ctx.closePath();ctx.fill();
        ctx.fillStyle='#071507';ctx.fillRect(tx-4,by-10,8,10);
      });
    }
  },
  'theme-fire':{
    count:80,
    init(p,w,h){
      p.x=rnd(0,w);p.y=rnd(h*.4,h+20);p.r=rnd(1,4);
      p.color=['#ff2200','#ff4400','#ff6600','#ff8800','#ffaa00','#ffcc00'][Math.floor(rnd(0,6))];
      p.speed=rnd(1,4);p.drift=rnd(-.5,.5);p.idx=Math.floor(rnd(0,1000));
    },
    update(p,w,h,t){
      p.y-=p.speed;p.x+=p.drift+Math.sin((t+p.idx)*.05)*.5;
      p.opacity=Math.max(0,(p.y/h)*1.3);
      if(p.y<-10){p.y=h+rnd(0,30);p.x=rnd(0,w);p.opacity=1;}
    },
    draw(ctx,p,t){
      // trail
      for(let i=1;i<=3;i++){
        ctx.globalAlpha=p.opacity*(.15/i);ctx.fillStyle=p.color;
        ctx.beginPath();ctx.arc(p.x,p.y+i*p.speed*2,p.r*.8,0,6.28);ctx.fill();
      }
      ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.28);ctx.fill();
    },
    drawBg(ctx,w,h,t){
      ctx.fillStyle='rgba(10,0,0,0.1)';ctx.fillRect(0,0,w,h);
      // lava glow
      const glowA=.1+Math.sin(t*.01)*.05;
      const g=ctx.createLinearGradient(0,h*.85,0,h);
      g.addColorStop(0,'rgba(255,50,0,0)');g.addColorStop(1,`rgba(255,50,0,${glowA})`);
      ctx.fillStyle=g;ctx.fillRect(0,h*.85,w,h*.15);
      // heat shimmer
      ctx.globalAlpha=.04;ctx.strokeStyle='#660000';ctx.lineWidth=2;
      for(let i=0;i<3;i++){
        ctx.beginPath();
        for(let y=0;y<h;y+=5)ctx.lineTo(w*(.25+i*.25)+Math.sin(y*.02+t*.01)*8,y);
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    },
    initBg(ctx,w,h){
      const g=ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0,'#0a0000');g.addColorStop(1,'#1a0500');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    }
  },
  'theme-candy':{
    count:60,
    init(p,w,h){
      p.x=rnd(0,w);p.y=rnd(-h*.2,h);p.r=rnd(4,12);
      p.color=['#ff5fa0','#ffe259','#43e97b','#4facfe','#c471ed','#ff8c42','#ff3399','#00ffcc'][Math.floor(rnd(0,8))];
      p.vy=rnd(.5,2);p.vx=0;p.rot=rnd(0,6.28);p.rotS=rnd(-.04,.04);
      p.shape=Math.floor(rnd(0,3));// 0=circle,1=square,2=diamond
      p.flash=0;
    },
    update(p,w,h,t){
      p.y+=p.vy;p.vx+=Math.sin(t*.01)*.02;p.x+=p.vx;p.rot+=p.rotS;
      p.opacity=.6;
      if(p.flash>0){p.flash--;p.opacity=1;p.color='#ffffff';}
      if(p.y>h+15){p.y=-15;p.x=rnd(0,w);p.vx=0;p.color=['#ff5fa0','#ffe259','#43e97b','#4facfe','#c471ed','#ff8c42'][Math.floor(rnd(0,6))];}
      // random sparkle
      if(Math.random()<.001)p.flash=4;
    },
    draw(ctx,p){
      ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;ctx.save();ctx.translate(p.x,p.y);
      if(p.shape===2)ctx.rotate(p.rot+.785);else ctx.rotate(p.rot);
      if(p.shape===0){ctx.beginPath();ctx.arc(0,0,p.r,0,6.28);ctx.fill();}
      else{ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r);}
      ctx.restore();
    },
    drawBg(ctx,w,h){ctx.fillStyle='rgba(26,0,34,0.1)';ctx.fillRect(0,0,w,h);},
    initBg(ctx,w,h){
      const g=ctx.createLinearGradient(0,0,w,h);
      g.addColorStop(0,'#1a0022');g.addColorStop(.5,'#2a0040');g.addColorStop(1,'#1a0022');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    }
  },
  'theme-white':{
    count:60,
    init(p,w,h){
      p.x=rnd(0,w);p.y=rnd(-h*.2,h);p.r=rnd(2,8);
      p.speed=rnd(.3,1.2);p.wobble=rnd(0,6.28);p.wobbleS=rnd(.01,.03);
      p.opacity=rnd(.4,.9);p.rotS=rnd(-.005,.005);p.rot=rnd(0,6.28);
    },
    update(p,w,h,t){
      p.y+=p.speed;p.wobble+=p.wobbleS;p.x+=Math.sin(p.wobble)*.3;p.rot+=p.rotS;
      if(p.y>h+10){p.y=-10;p.x=rnd(0,w);}
    },
    draw(ctx,p){
      ctx.globalAlpha=p.opacity*.5;ctx.strokeStyle='rgba(160,180,220,0.6)';ctx.lineWidth=1;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      for(let i=0;i<6;i++){
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-p.r);ctx.stroke();
        ctx.rotate(Math.PI/3);
      }
      ctx.restore();
      ctx.globalAlpha=p.opacity*.3;ctx.fillStyle='rgba(200,220,255,0.4)';
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*.4,0,6.28);ctx.fill();
    },
    drawBg(ctx,w,h){ctx.fillStyle='rgba(240,244,255,0.15)';ctx.fillRect(0,0,w,h);},
    initBg(ctx,w,h){
      const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.max(w,h)*.7);
      g.addColorStop(0,'#f0f4ff');g.addColorStop(1,'#dde4f0');
      ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    }
  },
  'theme-black':{
    count:25,
    init(p,w,h,i){
      p.colX=Math.floor(i*(w/25));p.y=rnd(-h,0);p.speed=rnd(2,5);
      p.squares=[];
      for(let j=0;j<12;j++){
        const isGold=Math.random()<.03;
        p.squares.push({off:j*8,color:isGold?'#ffd700':['#111111','#1a1a1a','#222222'][Math.floor(rnd(0,3))],a:isGold?0.8:rnd(.15,.4)});
      }
      p.goldPulse=0;
    },
    update(p,w,h,t){
      p.y+=p.speed;
      if(p.y>h+100){p.y=-rnd(50,200);if(Math.random()<.01)p.goldPulse=20;}
      if(p.goldPulse>0)p.goldPulse--;
    },
    draw(ctx,p){
      p.squares.forEach(sq=>{
        const sy=p.y-sq.off;if(sy<-5||sy>bgCanvas.height+5)return;
        ctx.globalAlpha=p.goldPulse>0?.7:sq.a;
        ctx.fillStyle=p.goldPulse>0?'#ffd700':sq.color;
        ctx.fillRect(p.colX,sy,4,4);
      });
    },
    drawBg(ctx,w,h){ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(0,0,w,h);},
    initBg(ctx,w,h){
      ctx.fillStyle='#000000';ctx.fillRect(0,0,w,h);
      // circuit lines
      ctx.globalAlpha=.06;ctx.strokeStyle='#222';ctx.lineWidth=1;
      for(let i=0;i<12;i++){
        const horizontal=Math.random()>.5;
        ctx.beginPath();
        if(horizontal){ctx.moveTo(rnd(0,w*.3),rnd(0,h));ctx.lineTo(rnd(w*.5,w),rnd(0,h));}
        else{ctx.moveTo(rnd(0,w),rnd(0,h*.3));ctx.lineTo(rnd(0,w),rnd(h*.5,h));}
        ctx.stroke();
      }
      ctx.globalAlpha=1;
    }
  }
};

function initBgAnim(){} // legacy stub

// ═══════ LEADERBOARD DATA ═══════
const globalLB=[
  {name:'SweetQueen',score:48250,level:24,avatar:'👸',me:false},
  {name:'CandyKing',score:43100,level:21,avatar:'👑',me:false},
  {name:'PurpleStar',score:38900,level:19,avatar:'🌟',me:false},
  {name:'You',score:0,level:1,avatar:'🎮',me:true},
  {name:'CrystalBoy',score:29500,level:15,avatar:'💎',me:false},
  {name:'RainbowGirl',score:24800,level:13,avatar:'🌈',me:false},
  {name:'NeonWolf',score:19200,level:10,avatar:'🐺',me:false},
  {name:'MintDragon',score:14600,level:8,avatar:'🐲',me:false},
];
const weeklyLB=[
  {name:'FastFinger',score:12400,level:8,avatar:'⚡',me:false},
  {name:'ComboMaster',score:9800,level:6,avatar:'🔥',me:false},
  {name:'You',score:0,level:1,avatar:'🎮',me:true},
  {name:'BlastKing',score:7200,level:5,avatar:'💥',me:false},
  {name:'CandyRush',score:5100,level:4,avatar:'🍬',me:false},
];

// ═══════ SCREENS ═══════
let currentScreen='start',prevScreen='start';
function hideAllOverlays(){
  ['overlay-pregame','overlay-pause','overlay-win','overlay-over','overlay-quit','overlay-reset'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.classList.add('hidden');
  });
}
function closeToStart(e){
  if(e){e.preventDefault();e.stopPropagation();}
  setTimeout(()=>goScreen('start'),50);
}
function goScreen(name){
  if(currentScreen==='game'&&name!=='game')stopPlayTimer();
  if(name!=='game')hideAllOverlays();
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  document.getElementById('screen-'+name).classList.remove('hidden');
  prevScreen=currentScreen;currentScreen=name;
  if(name==='leaderboard')renderLB('global');
  if(name==='start'){
    document.getElementById('best-score-start').textContent=bestScore;
    const ss=document.getElementById('screen-start');
    if(ss){ss.style.pointerEvents='none';setTimeout(()=>{ss.style.pointerEvents='all';},200);}
  }
  if(name==='tutorial'){tutSlide=0;renderTutSlide(0);}
  if(name==='game')setTimeout(startPlayTimer,100);
}
function goGame(){
  paused=false;busy=false;
  if(!hasLives()){showNoLivesPopup();return;}
  score=0;levelScore=0;combo=0;
  // Use map level settings if available
  if(window._mapLevelSettings){
    const ms=window._mapLevelSettings;
    targetScore=ms.targetScore;moves=ms.moves;level=ms.levelId||1;
    window._mapLevelSettings=null;
  }else{
    moves=getDiffMoves();level=1;targetScore=getDiffTarget();
  }
  document.getElementById('overlay-pause').classList.add('hidden');
  initGrid();renderBoard();updateStats();
  document.getElementById('progress-fill').style.width='0%';
  document.getElementById('combo-display').textContent='';
  document.getElementById('best-val').textContent=bestScore;
  goScreen('game');
  updateIngameBoosterUI();
  showPreGame();
}

// ═══════ SETTINGS ═══════
function setTheme(el,theme){
  document.querySelectorAll('.theme-dot').forEach(d=>d.classList.remove('active'));
  el.classList.add('active');
  document.body.className=theme;
  settings.theme=theme;saveSettings();
  applyThemeColors(theme);applyBackground(theme);
}
function setDiff(el){
  document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');settings.diff=el.dataset.diff;saveSettings();
}
function updateVolume(el){
  const v=el.value;document.getElementById('vol-val').textContent=v;
  el.style.setProperty('--pct',v+'%');settings.volume=+v;saveSettings();
  if(bgMusicPlaying){stopBgMusic();startBgMusic();}
}
function getDiffMoves(){return settings.diff==='easy'?40:settings.diff==='hard'?20:30;}
function getDiffTarget(){return settings.diff==='hard'?800:settings.diff==='easy'?350:500;}
function saveSettings(){localStorage.setItem('cb_settings',JSON.stringify(settings));}
function loadSettings(){
  try{const s=localStorage.getItem('cb_settings');if(s)settings={...settings,...JSON.parse(s)};}catch(e){localStorage.removeItem('cb_settings');}
  document.getElementById('set-sfx').checked=settings.sfx;
  document.getElementById('set-music').checked=settings.music;
  document.getElementById('set-vibro').checked=settings.vibro;
  document.getElementById('set-anim').checked=settings.anim;
  document.getElementById('set-volume').value=settings.volume;
  document.getElementById('vol-val').textContent=settings.volume;
  document.getElementById('set-volume').style.setProperty('--pct',settings.volume+'%');
  document.body.className=settings.theme||'';
  document.querySelectorAll('.theme-dot').forEach(d=>d.classList.toggle('active',d.dataset.theme===settings.theme));
  document.querySelectorAll('.diff-btn').forEach(b=>b.classList.toggle('active',b.dataset.diff===settings.diff));
  applyThemeColors(settings.theme||'');
  initBackground();
  if(settings.music)startBgMusic();
  initLives();
  initDaily();
  initMap();
  checkFirstTime();
}
document.getElementById('set-sfx').onchange=e=>{settings.sfx=e.target.checked;saveSettings();};
document.getElementById('set-music').onchange=e=>{settings.music=e.target.checked;saveSettings();if(settings.music)startBgMusic();else stopBgMusic();};
document.getElementById('set-vibro').onchange=e=>{settings.vibro=e.target.checked;saveSettings();};
document.getElementById('set-anim').onchange=e=>{settings.anim=e.target.checked;saveSettings();};
function resetProgress(){document.getElementById('overlay-reset').classList.remove('hidden');}
function confirmReset(){
  document.getElementById('overlay-reset').classList.add('hidden');
  localStorage.removeItem('cb_best');localStorage.removeItem('cb_settings');localStorage.removeItem('cb_personal');localStorage.removeItem('cb_tutorial_done');localStorage.removeItem('cb_lives');localStorage.removeItem('cb_daily');localStorage.removeItem('cb_daily_done');localStorage.removeItem('cb_map');
  bestScore=0;score=0;level=1;
  settings={sfx:true,music:false,vibro:true,anim:true,volume:70,diff:'normal',theme:''};
  stopBgMusic();loadSettings();goScreen('start');
}

// ═══════ LEADERBOARD ═══════
function showTab(el,type){document.querySelectorAll('.lb-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');renderLB(type);}
function renderLB(type){
  const list=document.getElementById('lb-list');
  let data=type==='weekly'?weeklyLB:type==='personal'?getPersonalLB():globalLB;
  data=data.map(r=>r.me?{...r,score:bestScore,level:level}:r);
  data.sort((a,b)=>b.score-a.score);list.innerHTML='';
  data.forEach((r,i)=>{
    const div=document.createElement('div');div.className='lb-row'+(r.me?' lb-me':'');
    const rc=i===0?'gold':i===1?'silver':i===2?'bronze':'other';
    const m=i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1);
    div.innerHTML=`<div class="lb-rank ${rc}">${m}</div><div class="lb-avatar">${r.avatar}</div><div class="lb-info"><div class="lb-name">${r.name}${r.me?' (You)':''}</div><div class="lb-level">Level ${r.level}</div></div><div class="lb-score">${r.score.toLocaleString()}</div>`;
    list.appendChild(div);
  });
}
function getPersonalLB(){const pb=JSON.parse(localStorage.getItem('cb_personal')||'[]');pb.push({name:'You (Current)',score:bestScore,level:level,avatar:'🎮',me:true});return pb;}
function savePersonalScore(){const pb=JSON.parse(localStorage.getItem('cb_personal')||'[]');pb.push({name:'You',score,level,avatar:'🎮',me:false,date:new Date().toLocaleDateString()});pb.sort((a,b)=>b.score-a.score);localStorage.setItem('cb_personal',JSON.stringify(pb.slice(0,10)));}

// ═══════ AUDIO ═══════
let audioCtx=null;
function getAC(){if(!audioCtx)try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}return audioCtx;}
function playTone(freq,dur,type='sine',vol=0.15){
  if(!settings.sfx)return;const vol2=(settings.volume/100)*vol;if(vol2<=0)return;
  const ac=getAC();if(!ac)return;
  try{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol2,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+dur);o.start();o.stop(ac.currentTime+dur);}catch(e){}
}
function vibrate(ms=50){if(settings.vibro&&navigator.vibrate)navigator.vibrate(ms);}
function playMatch(n){[523,659,784,1047,1319].slice(0,Math.min(n,5)).forEach((f,i)=>setTimeout(()=>playTone(f,.15,'triangle',.2),i*60));}
function playSwap(){playTone(440,.08,'sine',.08);}
function playInvalid(){playTone(200,.15,'sawtooth',.08);vibrate([30,30,30]);}
function playWin(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,.3,'triangle',.2),i*120));vibrate(200);}
function playOver(){[400,350,300,250].forEach((f,i)=>setTimeout(()=>playTone(f,.3,'sawtooth',.15),i*120));vibrate([100,50,100]);}

// ═══════ BACKGROUND MUSIC ═══════
let bgMusicNodes=[],bgMusicPlaying=false,bgMusicTimer=null;
function startBgMusic(){if(bgMusicPlaying)return;const ac=getAC();if(!ac)return;bgMusicPlaying=true;scheduleMusicLoop();}
function stopBgMusic(){bgMusicPlaying=false;if(bgMusicTimer){clearTimeout(bgMusicTimer);bgMusicTimer=null;}bgMusicNodes.forEach(n=>{try{n.stop();}catch(e){}});bgMusicNodes=[];}
function scheduleMusicLoop(){
  if(!bgMusicPlaying)return;const ac=getAC();if(!ac)return;
  const notes=[523,659,784,880,784,659,523,587,659,523],noteDur=0.35,vol=(settings.volume/100)*0.06;
  if(vol<=0){bgMusicTimer=setTimeout(scheduleMusicLoop,notes.length*noteDur*1000);return;}
  notes.forEach((freq,i)=>{try{const osc=ac.createOscillator(),gain=ac.createGain();osc.connect(gain);gain.connect(ac.destination);osc.type='triangle';osc.frequency.value=freq;const st=ac.currentTime+i*noteDur,et=st+noteDur*.8;gain.gain.setValueAtTime(0,st);gain.gain.linearRampToValueAtTime(vol,st+.02);gain.gain.setValueAtTime(vol,et-.05);gain.gain.linearRampToValueAtTime(0,et);osc.start(st);osc.stop(et);bgMusicNodes.push(osc);}catch(e){}});
  bgMusicTimer=setTimeout(()=>{bgMusicNodes=[];scheduleMusicLoop();},notes.length*noteDur*1000-200);
}

// ═══════ GAME LOGIC ═══════
function randType(){return Math.floor(Math.random()*TYPES);}
function initGrid(){grid=[];for(let r=0;r<GRID;r++){grid[r]=[];for(let c=0;c<GRID;c++){let t;do{t=randType();}while((c>=2&&getType(r,c-1)===t&&getType(r,c-2)===t)||(r>=2&&getType(r-1,c)===t&&getType(r-2,c)===t));grid[r][c]=t;}}}
function renderBoard(){const board=document.getElementById('board');board.innerHTML='';for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){const type=getType(r,c);const special=getSpecial(r,c);const cell=document.createElement('div');cell.className='cell '+(type>=0&&type<COLORS.length?COLORS[type]:'');cell.dataset.r=r;cell.dataset.c=c;if(special){cell.classList.add('special-'+special);if(special===SPECIAL.BOMB){cell.dataset.icon='🌈';}else if(special===SPECIAL.WRAPPED){cell.dataset.icon=type>=0?ICONS[type]:'';const badge=document.createElement('span');badge.className='special-badge';badge.textContent='✨';cell.appendChild(badge);}else{cell.dataset.icon=type>=0?ICONS[type]:'';}}else{cell.dataset.icon=type>=0?ICONS[type]:'';}cell.addEventListener('click',onCellClick);cell.addEventListener('touchstart',onTouchStart,{passive:true});cell.addEventListener('touchend',onTouchEnd,{passive:true});board.appendChild(cell);}}
function getCell(r,c){return document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);}
function updateStats(){
  document.getElementById('score-val').textContent=score.toLocaleString();
  document.getElementById('level-val').textContent=level;
  document.getElementById('moves-val').textContent=moves;
  document.getElementById('best-val').textContent=bestScore;
  document.getElementById('progress-fill').style.width=Math.min(100,Math.round(score/targetScore*100))+'%';
  if(score>bestScore){bestScore=score;localStorage.setItem('cb_best',bestScore);document.getElementById('best-val').textContent=bestScore;}
}
function onCellClick(e){
  if(busy||paused)return;
  if(hammerMode){
    const hr=+e.currentTarget.dataset.r,hc=+e.currentTarget.dataset.c;
    grid[hr][hc]=-1;showHammerHint(false);busy=true;
    const hb=document.getElementById('ingame-btn-hammer');if(hb)hb.classList.remove('active-hammer');
    const hcell=getCell(hr,hc);
    if(hcell){hcell.classList.add('matched');
      setTimeout(async()=>{
        for(let col=0;col<GRID;col++){let empty=0;for(let row=GRID-1;row>=0;row--){if(grid[row][col]===-1)empty++;else if(empty>0){grid[row+empty][col]=grid[row][col];grid[row][col]=-1;}}for(let row=0;row<empty;row++)grid[row][col]=randType();}
        renderBoard();await processMatches();if(score>=targetScore||moves<=0){checkEnd();}else{busy=false;}
      },350);
    }
    return;
  }
  const r=+e.currentTarget.dataset.r,c=+e.currentTarget.dataset.c;
  if(selected===null){selected={r,c};getCell(r,c).classList.add('selected');playSwap();}
  else{const pr=selected.r,pc=selected.c;getCell(pr,pc).classList.remove('selected');if(pr===r&&pc===c){selected=null;return;}if(Math.abs(pr-r)+Math.abs(pc-c)!==1){selected={r,c};getCell(r,c).classList.add('selected');playSwap();return;}selected=null;trySwap(pr,pc,r,c);}
}
let touchStartPos=null;
function onTouchStart(e){const t=e.touches[0];touchStartPos={x:t.clientX,y:t.clientY,r:+e.currentTarget.dataset.r,c:+e.currentTarget.dataset.c};}
function onTouchEnd(e){if(!touchStartPos||busy||paused)return;const t=e.changedTouches[0];const dx=t.clientX-touchStartPos.x,dy=t.clientY-touchStartPos.y;const absDx=Math.abs(dx),absDy=Math.abs(dy);const{r,c}=touchStartPos;touchStartPos=null;if(absDx<15&&absDy<15)return;e.preventDefault();let tr=r,tc=c;if(absDx>absDy){tc+=dx>0?1:-1;}else{tr+=dy>0?1:-1;}if(tr<0||tr>=GRID||tc<0||tc>=GRID)return;if(selected){const el=getCell(selected.r,selected.c);if(el)el.classList.remove('selected');selected=null;}trySwap(r,c,tr,tc);}
async function trySwap(r1,c1,r2,c2){
  busy=true;
  const sp1=getSpecial(r1,c1),sp2=getSpecial(r2,c2);
  const mult=settings.diff==='hard'?1.5:settings.diff==='easy'?.8:1;

  // Color Bomb swapped with normal candy → always activates
  const onlyOneBomb=(sp1===SPECIAL.BOMB&&!sp2)||(sp2===SPECIAL.BOMB&&!sp1);
  if(onlyOneBomb){
    const bombR=sp1===SPECIAL.BOMB?r1:r2,bombC=sp1===SPECIAL.BOMB?c1:c2;
    const targetR=sp1===SPECIAL.BOMB?r2:r1,targetC=sp1===SPECIAL.BOMB?c2:c1;
    const targetType=getType(targetR,targetC);
    moves--;combo++;updateStats();
    let removed=0;
    for(let row=0;row<GRID;row++)for(let col=0;col<GRID;col++){
      if(getType(row,col)===targetType){
        const el=getCell(row,col);if(el&&settings.anim)el.classList.add('matched');
        grid[row][col]=-1;removed++;
      }
    }
    grid[bombR][bombC]=-1;removed++;
    const bEl=getCell(bombR,bombC);if(bEl&&settings.anim)bEl.classList.add('matched');
    showBombEffect(bombR,bombC);playMatch(removed);vibrate(60);
    await delay(settings.anim?380:0);
    const bombPts=Math.round(removed*45*combo*mult);
    score+=bombPts;levelScore+=bombPts;updateStats();
    showBonusPopup(bombR,bombC,bombPts,'🌈');
    applyGravity();renderBoard();await processMatches();
    if(score>=targetScore||moves<=0){checkEnd();}else{busy=false;}
    return;
  }

  // Special combo: both cells are special
  if(sp1&&sp2){
    moves--;combo++;updateStats();
    [grid[r1][c1],grid[r2][c2]]=[grid[r2][c2],grid[r1][c1]];
    renderBoard();
    const triggered=handleSpecialCombo(r1,c1,r2,c2);
    const comboPts=Math.round(triggered.size*COMBO_PTS*combo*mult);
    if(comboPts>0){score+=comboPts;levelScore+=comboPts;updateStats();showBonusPopup(r1,c1,comboPts,'💥');}
    await delay(settings.anim?400:0);
    applyGravity();renderBoard();await processMatches();
    if(score>=targetScore||moves<=0){checkEnd();}else{busy=false;}
    return;
  }
  [grid[r1][c1],grid[r2][c2]]=[grid[r2][c2],grid[r1][c1]];renderBoard();
  const matches=findMatches();
  if(!matches.length){
    [grid[r1][c1],grid[r2][c2]]=[grid[r2][c2],grid[r1][c1]];renderBoard();playInvalid();
    const cell1=getCell(r1,c1),cell2=getCell(r2,c2);
    if(cell1){cell1.classList.add('invalid');setTimeout(()=>cell1.classList.remove('invalid'),420);}
    if(cell2){cell2.classList.add('invalid');setTimeout(()=>cell2.classList.remove('invalid'),420);}
    const flash=document.createElement('div');flash.className='board-flash';document.getElementById('board-wrap').appendChild(flash);setTimeout(()=>flash.remove(),380);
    if(settings.diff==='normal'||settings.diff==='hard'){moves--;updateStats();const bw=document.getElementById('board-wrap');if(bw){const pop=document.createElement('div');pop.className='score-popup';pop.textContent='-1 move';pop.style.cssText+='color:#ff4444;left:50%;top:50%;transform:translateX(-50%);font-size:1rem;';bw.appendChild(pop);setTimeout(()=>pop.remove(),900);}if(moves<=0){setTimeout(()=>checkEnd(),300);return;}}
    busy=false;return;
  }
  moves--;combo=0;updateStats();await processMatches();
  if(score>=targetScore||moves<=0){checkEnd();}else{busy=false;}
}
function findMatches(){
  return findMatchesNew().matched;
}
function applyGravity(){
  for(let c=0;c<GRID;c++){let empty=0;for(let r=GRID-1;r>=0;r--){if(isEmpty(r,c))empty++;else if(empty>0){grid[r+empty][c]=grid[r][c];grid[r][c]=-1;}}for(let r=0;r<empty;r++)grid[r][c]=randType();}
}
async function processMatches(){
  let result=findMatchesNew();
  let matches=result.matched;
  while(matches.length){
    combo++;const mult=settings.diff==='hard'?1.5:settings.diff==='easy'?.8:1;
    const pts=Math.round(matches.length*30*combo*mult);
    score+=pts;levelScore+=pts;updateStats();
    showCombo(combo,pts);playMatch(matches.length);vibrate(40);
    if(matches.length>=3){
      const bw=document.getElementById('board-wrap'),pop=document.createElement('div');pop.className='score-popup';
      pop.textContent=(combo>1?`x${combo} COMBO! `:'')+(pts?`+${pts}`:'');
      const mr=Math.round(matches.reduce((s,m)=>s+m.r,0)/matches.length),mc=Math.round(matches.reduce((s,m)=>s+m.c,0)/matches.length),cs=bw.offsetWidth/GRID;
      pop.style.cssText=`left:${Math.max(0,Math.min(mc*cs+cs/2-30,bw.offsetWidth-70))}px;top:${Math.max(0,mr*cs)}px;`;
      bw.appendChild(pop);setTimeout(()=>pop.remove(),1000);
    }
    // Activate specials that are in the matched set
    const triggered=new Set();
    matches.forEach(({r,c})=>triggered.add(r*GRID+c));
    const specialsInMatch=matches.filter(({r,c})=>getSpecial(r,c));
    if(settings.anim){matches.forEach(({r,c})=>{const el=getCell(r,c);if(el)el.classList.add('matched');});await delay(340);}else{await delay(0);}
    // Remove normal matched cells
    matches.forEach(({r,c})=>{
      if(!specialsInMatch.some(s=>s.r===r&&s.c===c)){grid[r][c]=-1;}
    });
    // Activate specials and score their extra cells
    for(const {r,c} of specialsInMatch){
      const extraCells=activateSpecial(r,c,triggered);
      grid[r][c]=-1;
      if(extraCells>0){
        const bonusPts=Math.round(extraCells*SPECIAL_PTS*combo*mult);
        score+=bonusPts;levelScore+=bonusPts;updateStats();
        showBonusPopup(r,c,bonusPts,'⚡');
      }
    }
    // Create new special candies from match patterns
    if(result.specialCreations.length){
      result.specialCreations.forEach(sc=>{
        // Only place if cell is now empty (was matched)
        if(grid[sc.r][sc.c]===-1){
          setCell(sc.r,sc.c,sc.type,sc.special);
        }
      });
    }
    if(specialsInMatch.length&&settings.anim) await delay(300);
    // Gravity
    const fc=[];for(let c=0;c<GRID;c++){let empty=0;for(let r=GRID-1;r>=0;r--){if(isEmpty(r,c))empty++;else if(empty>0){grid[r+empty][c]=grid[r][c];grid[r][c]=-1;fc.push({r:r+empty,c});}}for(let r=0;r<empty;r++){grid[r][c]=randType();fc.push({r,c});}}
    renderBoard();
    if(settings.anim){fc.forEach(({r,c})=>{const el=getCell(r,c);if(el)el.classList.add('falling');});await delay(250);fc.forEach(({r,c})=>{const el=getCell(r,c);if(el)el.classList.remove('falling');});}
    result=findMatchesNew();
    matches=result.matched;
  }
  setTimeout(()=>document.getElementById('combo-display').textContent='',800);
}
function showCombo(c,pts){const el=document.getElementById('combo-display');if(c>=2){el.textContent=`🔥 x${c} COMBO! +${pts}`;el.style.color=c>=4?'var(--t-primary)':c>=3?'var(--t-accent)':'var(--t-secondary)';}else{el.textContent=pts>0?`+${pts}`:'';el.style.color='var(--t-text-muted)';}}
function showBonusPopup(r,c,pts,icon){const bw=document.getElementById('board-wrap');if(!bw||!pts)return;const pop=document.createElement('div');pop.className='score-popup';pop.textContent=`${icon} +${pts}`;const cs=bw.offsetWidth/GRID;pop.style.cssText=`left:${Math.max(0,Math.min(c*cs+cs/2-30,bw.offsetWidth-70))}px;top:${Math.max(0,r*cs)}px;color:#ffe259;font-size:1.3rem;`;bw.appendChild(pop);setTimeout(()=>pop.remove(),1000);}
function checkEnd(){if(score>=targetScore)setTimeout(()=>{savePersonalScore();showWin();},300);else if(moves<=0)setTimeout(()=>{savePersonalScore();showOver();},300);}
function showWin(){playWin();document.getElementById('win-score').textContent=levelScore.toLocaleString();const stars=levelScore>=targetScore*1.5?'⭐⭐⭐':levelScore>=targetScore*1.1?'⭐⭐':'⭐';document.getElementById('win-stars').textContent=stars;document.getElementById('win-level-score').textContent='This level: +'+levelScore.toLocaleString()+' pts';document.getElementById('overlay-win').classList.remove('hidden');if(stars==='⭐⭐⭐'){const bt=['extraMoves','hammer','bomb'];setTimeout(()=>earnBooster(bt[Math.floor(Math.random()*3)]),800);}
  // Complete map level
  if(mapData&&mapData.selectedLevel){const sc=stars==='⭐⭐⭐'?3:stars==='⭐⭐'?2:1;completeLevel(mapData.selectedLevel,sc,score);mapData.selectedLevel=null;}}
function showOver(){loseLife();playOver();document.getElementById('over-score').textContent=score.toLocaleString();document.getElementById('overlay-over').classList.remove('hidden');}
function nextLevel(){document.getElementById('overlay-win').classList.add('hidden');
  // Go to next map level
  const nextId=level+1;
  const nextLv=mapData.levels.find(l=>l.id===nextId);
  if(nextLv&&!nextLv.locked){startMapLevel(nextId);}
  else{goScreen('map');renderMapScreen();}
}
function retryLevel(){document.getElementById('overlay-over').classList.add('hidden');score=0;levelScore=0;moves=getDiffMoves();combo=0;targetScore=getDiffTarget()*level;busy=false;initGrid();renderBoard();updateStats();document.getElementById('progress-fill').style.width='0%';document.getElementById('combo-display').textContent='';}
function pauseGame(){paused=true;document.getElementById('overlay-pause').classList.remove('hidden');}
function resumeGame(){paused=false;document.getElementById('overlay-pause').classList.add('hidden');}
function goBack(){if(prevScreen==='game'){paused=false;goScreen('game');}else{goScreen('start');}}
function showQuitDialog(){
  // If win/loss overlay already showing, just go home
  const winUp=!document.getElementById('overlay-win').classList.contains('hidden');
  const overUp=!document.getElementById('overlay-over').classList.contains('hidden');
  if(winUp||overUp){mapData.selectedLevel=null;window._mapLevelSettings=null;goScreen('map');renderMapScreen();return;}
  if(busy)return;
  pauseGame();document.getElementById('overlay-pause').classList.add('hidden');document.getElementById('overlay-quit').classList.remove('hidden');
}
function confirmQuit(){
  document.getElementById('overlay-quit').classList.add('hidden');
  savePersonalScore();loseLife();paused=false;busy=false;
  mapData.selectedLevel=null;window._mapLevelSettings=null;
  // Toast
  const toast=document.createElement('div');toast.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.88);color:#ff5fa0;font-family:\"Fredoka One\",cursive;padding:10px 24px;border-radius:20px;font-size:0.95rem;z-index:1000;white-space:nowrap;animation:scoreFloat 2s ease forwards;border:1px solid rgba(255,95,160,0.3);';
  toast.textContent='💔 -1 Life';document.body.appendChild(toast);setTimeout(()=>toast.remove(),1500);
  goScreen('map');renderMapScreen();
}
function cancelQuit(){document.getElementById('overlay-quit').classList.add('hidden');resumeGame();}
function delay(ms){return new Promise(r=>setTimeout(r,ms)).then(()=>waitIfPaused());}
function waitIfPaused(){return new Promise(resolve=>{(function check(){if(!paused)return resolve();setTimeout(check,100);})();});}

// ═══════ INIT ═══════
loadSettings();
goScreen('start');
