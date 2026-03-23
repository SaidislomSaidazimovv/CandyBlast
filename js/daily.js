// ═══════ DAILY REWARDS — 3-TIER SYSTEM ═══════

function getTodayKey(){return new Date().toISOString().split('T')[0];}
function getCurrentWeekDay(){return['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];}
function getWeekNumber(){return Math.floor(Date.now()/(7*24*60*60*1000));}

// ═══ STATE ═══
let dailyData={currentDay:0,lastLoginDate:null,monthStart:null,claimedDays:[],weeklyDays:[],weekNumber:0,claimedWeeklyDays:[],playMinutesToday:0,lastPlayDate:null,hourlyRewardsClaimed:0,sessionStartTime:null,totalDaysLoggedIn:0,spinCount:0};

// ═══ SAVE / LOAD ═══
function saveDailyData(){localStorage.setItem('cb_daily',JSON.stringify(dailyData));}
function loadDailyData(){try{const s=localStorage.getItem('cb_daily');if(s)dailyData={...dailyData,...JSON.parse(s)};}catch(e){localStorage.removeItem('cb_daily');}}

// ═══ REWARD DEFINITIONS ═══
const MONTHLY_REWARDS=[
  {day:1,icon:'🍬',label:'+1 Booster',type:'booster',val:1},{day:2,icon:'❤️',label:'+1 Life',type:'life',val:1},{day:3,icon:'⚡',label:'+5 Moves',type:'moves',val:1},{day:4,icon:'🍬',label:'+2 Boosters',type:'booster',val:2},{day:5,icon:'❤️',label:'+2 Lives',type:'life',val:2},{day:6,icon:'🔨',label:'Hammer x2',type:'hammer',val:2},{day:7,icon:'🎁',label:'Booster Pack',type:'pack',val:1},
  {day:8,icon:'⚡',label:'+5 Moves x2',type:'moves',val:2},{day:9,icon:'❤️',label:'+2 Lives',type:'life',val:2},{day:10,icon:'💣',label:'Bomb x2',type:'bomb',val:2},{day:11,icon:'🍬',label:'+3 Boosters',type:'booster',val:3},{day:12,icon:'❤️',label:'+3 Lives',type:'life',val:3},{day:13,icon:'🎡',label:'Lucky Spin',type:'spin',val:1},{day:14,icon:'🎁',label:'Big Pack',type:'bigpack',val:1},
  {day:15,icon:'💎',label:'+3 Boosters',type:'booster',val:3},{day:16,icon:'❤️',label:'+3 Lives',type:'life',val:3},{day:17,icon:'⚡',label:'+5 Moves x3',type:'moves',val:3},{day:18,icon:'🔨',label:'Hammer x3',type:'hammer',val:3},{day:19,icon:'💣',label:'Bomb x3',type:'bomb',val:3},{day:20,icon:'🎡',label:'Lucky Spin',type:'spin',val:1},{day:21,icon:'🎁',label:'Mega Pack',type:'megapack',val:1},
  {day:22,icon:'❤️',label:'+4 Lives',type:'life',val:4},{day:23,icon:'💎',label:'+5 Boosters',type:'booster',val:5},{day:24,icon:'🔥',label:'All Boosters x2',type:'allx2',val:1},{day:25,icon:'❤️',label:'+5 Lives',type:'life',val:5},{day:26,icon:'🎡',label:'Lucky Spin',type:'spin',val:1},{day:27,icon:'💎',label:'Mega Pack',type:'megapack',val:2},
  {day:28,icon:'🏆',label:'+5 Lives+Pack',type:'jackpot1',val:1},{day:29,icon:'👑',label:'All Max x3',type:'jackpot2',val:1},{day:30,icon:'🎰',label:'GRAND JACKPOT',type:'grand',val:1}
];
const WEEKLY_REWARDS=[
  {day:'Mon',icon:'🍬',label:'+1 Booster'},{day:'Tue',icon:'❤️',label:'+1 Life'},{day:'Wed',icon:'⚡',label:'+5 Moves'},{day:'Thu',icon:'🔨',label:'Hammer'},{day:'Fri',icon:'💣',label:'Bomb'},{day:'Sat',icon:'🎡',label:'Lucky Spin'},{day:'Sun',icon:'🎁',label:'Big Pack'}
];
const HOURLY_REWARDS=[
  {hour:1,icon:'⚡',label:'+1 Booster',type:'booster'},{hour:2,icon:'❤️',label:'+1 Life',type:'life'},{hour:3,icon:'🎁',label:'Booster Pack',type:'pack'}
];

// ═══ MONTHLY LOGIN ═══
function checkMonthlyLogin(){
  const today=getTodayKey();
  if(dailyData.lastLoginDate===today)return;
  dailyData.lastLoginDate=today;dailyData.totalDaysLoggedIn++;
  if(!dailyData.currentDay||dailyData.currentDay>=30){dailyData.currentDay=1;dailyData.claimedDays=[];dailyData.monthStart=today;}
  else{dailyData.currentDay++;}
  saveDailyData();
  setTimeout(()=>{goScreen('rewards');renderRewardsScreen();},800);
}

// ═══ WEEKLY ═══
function claimWeeklyDay(){
  const today=getCurrentWeekDay();const weekNum=getWeekNumber();
  if(dailyData.weekNumber!==weekNum){dailyData.weeklyDays=[];dailyData.claimedWeeklyDays=[];dailyData.weekNumber=weekNum;}
  if(!dailyData.weeklyDays.includes(today))dailyData.weeklyDays.push(today);
  if(!dailyData.claimedWeeklyDays.includes(today)){
    dailyData.claimedWeeklyDays.push(today);
    const reward=WEEKLY_REWARDS.find(r=>r.day===today);
    if(reward)giveWeeklyReward(reward);
  }
  saveDailyData();
}
function giveWeeklyReward(reward){
  const dayIdx=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(reward.day);
  if(dayIdx<=1)addLife(1);
  else if(dayIdx<=3)earnBooster('extraMoves',1);
  else if(dayIdx===4)earnBooster('bomb',1);
  else if(dayIdx===5)showLuckySpinPopup();
  else{earnBooster('extraMoves',1);earnBooster('hammer',1);earnBooster('bomb',1);}
}

// ═══ HOURLY PLAY TIMER ═══
function startPlayTimer(){if(!dailyData.sessionStartTime)dailyData.sessionStartTime=Date.now();}
function stopPlayTimer(){
  if(!dailyData.sessionStartTime)return;
  const today=getTodayKey();
  if(dailyData.lastPlayDate!==today){dailyData.playMinutesToday=0;dailyData.hourlyRewardsClaimed=0;dailyData.lastPlayDate=today;}
  const elapsed=Math.floor((Date.now()-dailyData.sessionStartTime)/60000);
  dailyData.playMinutesToday+=elapsed;dailyData.sessionStartTime=null;
  const hoursPlayed=Math.floor(dailyData.playMinutesToday/60);
  while(dailyData.hourlyRewardsClaimed<hoursPlayed&&dailyData.hourlyRewardsClaimed<3){
    const reward=HOURLY_REWARDS[dailyData.hourlyRewardsClaimed];
    showHourlyRewardPopup(reward);dailyData.hourlyRewardsClaimed++;
  }
  saveDailyData();
}
function showHourlyRewardPopup(reward){
  setTimeout(()=>{
    const popup=document.createElement('div');popup.className='overlay';popup.style.zIndex='500';
    popup.innerHTML=`<div class="overlay-card" style="text-align:center;max-width:280px;"><div style="font-size:3rem;margin-bottom:8px;">${reward.icon}</div><div class="ov-title" style="font-size:1.5rem;">1 Hour Played! ⏱️</div><div style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin:10px 0 20px;">${reward.label} earned!</div><button class="btn btn-play" style="width:100%;padding:12px;" onclick="claimHourlyReward('${reward.type}',this)">Claim! 🎁</button></div>`;
    document.body.appendChild(popup);
  },500);
}
function claimHourlyReward(type,btn){
  btn.closest('.overlay').remove();
  if(type==='booster')earnBooster('extraMoves',1);
  else if(type==='life')addLife(1);
  else if(type==='pack'){earnBooster('extraMoves',1);earnBooster('hammer',1);earnBooster('bomb',1);}
}



// ═══ GIVE MONTHLY REWARD ═══
function giveMonthlyReward(reward){
  switch(reward.type){
    case'life':addLife(reward.val);break;case'booster':earnBooster('extraMoves',reward.val);break;
    case'hammer':earnBooster('hammer',reward.val);break;case'bomb':earnBooster('bomb',reward.val);break;
    case'moves':earnBooster('extraMoves',reward.val);break;case'spin':addSpin(1);break;
    case'pack':earnBooster('extraMoves',1);earnBooster('hammer',1);earnBooster('bomb',1);break;
    case'bigpack':earnBooster('extraMoves',2);earnBooster('hammer',2);earnBooster('bomb',2);break;
    case'megapack':earnBooster('extraMoves',3);earnBooster('hammer',3);earnBooster('bomb',3);break;
    case'allx2':earnBooster('extraMoves',2);earnBooster('hammer',2);earnBooster('bomb',2);addLife(2);break;
    case'jackpot1':addLife(5);earnBooster('extraMoves',2);earnBooster('hammer',2);earnBooster('bomb',2);break;
    case'jackpot2':addLife(5);earnBooster('extraMoves',3);earnBooster('hammer',3);earnBooster('bomb',3);break;
    case'grand':addLife(5);earnBooster('extraMoves',5);earnBooster('hammer',5);earnBooster('bomb',5);setTimeout(showLuckySpinPopup,500);break;
  }
}

// ═══ REWARDS SCREEN ═══
let activeRewardsTab='monthly';

function renderRewardsScreen(){
  const container=document.getElementById('rewards-container');if(!container)return;
  container.innerHTML='';container.style.position='relative';
  activeRewardsTab='monthly';

  // Close
  const closeBtn=document.createElement('button');
  closeBtn.style.cssText="position:absolute;top:12px;right:16px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);font-size:1rem;cursor:pointer;z-index:10;display:flex;align-items:center;justify-content:center;";
  closeBtn.textContent='✕';closeBtn.onclick=(e)=>closeToStart(e);closeBtn.ontouchend=(e)=>closeToStart(e);
  container.appendChild(closeBtn);

  // Tabs
  const tabs=document.createElement('div');
  tabs.id='rewards-tabs';
  tabs.style.cssText='display:flex;gap:0;padding:12px 16px 0;flex-shrink:0;';
  const tabDefs=[{id:'monthly',label:'📅 Monthly'},{id:'weekly',label:'📆 Weekly'},{id:'hourly',label:'⏱️ Hourly'}];
  tabDefs.forEach(t=>{
    const btn=document.createElement('button');
    btn.dataset.tab=t.id;
    btn.style.cssText=`flex:1;padding:10px 4px;border:none;border-radius:12px 12px 0 0;font-family:'Fredoka One',cursive;font-size:0.85rem;cursor:pointer;transition:all 0.2s;background:${t.id==='monthly'?'rgba(255,255,255,0.1)':'transparent'};color:${t.id==='monthly'?'#fff':'rgba(255,255,255,0.4)'};border-bottom:${t.id==='monthly'?'2px solid var(--t-primary,#ff5fa0)':'2px solid transparent'};`;
    btn.textContent=t.label;
    btn.onclick=()=>{
      activeRewardsTab=t.id;
      tabs.querySelectorAll('button').forEach(b=>{
        const isActive=b.dataset.tab===t.id;
        b.style.background=isActive?'rgba(255,255,255,0.1)':'transparent';
        b.style.color=isActive?'#fff':'rgba(255,255,255,0.4)';
        b.style.borderBottom=isActive?'2px solid var(--t-primary,#ff5fa0)':'2px solid transparent';
      });
      renderTabContent(content,t.id);
    };
    tabs.appendChild(btn);
  });

  const content=document.createElement('div');
  content.id='rewards-tab-content';
  content.style.cssText='flex:1;overflow-y:auto;padding:16px;';

  container.appendChild(tabs);container.appendChild(content);
  renderTabContent(content,'monthly');
}

function renderTabContent(container,tab){
  container.innerHTML='';
  if(tab==='monthly')renderMonthlyTab(container);
  else if(tab==='weekly')renderWeeklyTab(container);
  else if(tab==='hourly')renderHourlyTab(container);
}

// ── MONTHLY TAB ──
function renderMonthlyTab(container){
  const currentDay=dailyData.currentDay||1;const claimed=dailyData.claimedDays||[];
  const title=document.createElement('div');title.style.cssText="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#fff;margin-bottom:4px;";
  title.textContent='Day '+currentDay+' of 30 🗓️';
  const sub=document.createElement('div');sub.style.cssText='font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:16px;';
  sub.textContent='Log in daily to earn bigger rewards!';
  container.appendChild(title);container.appendChild(sub);

  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(5,1fr);gap:8px;';
  MONTHLY_REWARDS.forEach(reward=>{
    const isClaimed=claimed.includes(reward.day);const isCurrent=reward.day===currentDay;const isFuture=reward.day>currentDay;
    const tier=reward.day<=7?'normal':reward.day<=14?'silver':reward.day<=21?'gold':reward.day<=27?'platinum':'diamond';
    const tierBg={normal:'rgba(255,255,255,0.08)',silver:'rgba(192,192,192,0.12)',gold:'rgba(255,215,0,0.12)',platinum:'rgba(100,200,255,0.12)',diamond:'rgba(255,100,200,0.2)'};
    const tierBd={normal:'rgba(255,255,255,0.1)',silver:'rgba(192,192,192,0.3)',gold:'rgba(255,215,0,0.35)',platinum:'rgba(100,200,255,0.4)',diamond:'rgba(255,100,200,0.5)'};
    const cell=document.createElement('div');
    cell.style.cssText=`border-radius:12px;padding:10px 6px;text-align:center;position:relative;background:${isClaimed?'rgba(67,233,123,0.1)':tierBg[tier]};border:1.5px solid ${isClaimed?'rgba(67,233,123,0.4)':isCurrent?tierBd[tier]:'rgba(255,255,255,0.06)'};opacity:${isFuture?'0.55':'1'};transition:transform 0.15s;${isCurrent&&!isClaimed?'box-shadow:0 0 12px rgba(255,220,0,0.3);':''}`;
    cell.innerHTML=`<div style="font-size:${isCurrent?'1.6rem':'1.3rem'};line-height:1;margin-bottom:4px;">${isClaimed?'✅':reward.icon}</div><div style="font-family:'Fredoka One',cursive;font-size:0.6rem;color:${isCurrent?'#ffe259':isClaimed?'#43e97b':'rgba(255,255,255,0.5)'};line-height:1.2;">Day ${reward.day}</div><div style="font-size:0.55rem;color:rgba(255,255,255,0.35);margin-top:2px;line-height:1.1;">${reward.label}</div>${isCurrent&&!isClaimed?'<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#ffe259,#ff8c42);color:#000;font-size:0.5rem;font-family:\'Fredoka One\',cursive;padding:2px 6px;border-radius:6px;white-space:nowrap;">TODAY</div>':''}`;
    if(isCurrent&&!isClaimed){cell.style.cursor='pointer';cell.onclick=()=>{
      if(dailyData.claimedDays.includes(reward.day))return;
      dailyData.claimedDays.push(reward.day);saveDailyData();giveMonthlyReward(reward);
      cell.style.background='rgba(67,233,123,0.1)';cell.style.borderColor='rgba(67,233,123,0.4)';
      cell.querySelector('div').textContent='✅';cell.style.cursor='default';cell.onclick=null;
      showRewardToast(reward.icon,reward.label);updateDailyNotifDot();
    };}
    grid.appendChild(cell);
  });
  container.appendChild(grid);
}

// ── WEEKLY TAB ──
function renderWeeklyTab(container){
  const weekDays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const today=getCurrentWeekDay();const claimed=dailyData.claimedWeeklyDays||[];
  const title=document.createElement('div');title.style.cssText="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#fff;margin-bottom:4px;";
  title.textContent='This Week 📆';
  const sub=document.createElement('div');sub.style.cssText='font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:20px;';
  sub.textContent='Play each day to collect all 7 rewards!';
  container.appendChild(title);container.appendChild(sub);

  const row=document.createElement('div');row.style.cssText='display:flex;gap:8px;';
  WEEKLY_REWARDS.forEach(reward=>{
    const isToday=reward.day===today;const isClaimed=claimed.includes(reward.day);
    const dayIdx=weekDays.indexOf(reward.day);const todayIdx=weekDays.indexOf(today);const isPast=dayIdx<todayIdx;
    const cell=document.createElement('div');
    cell.style.cssText=`flex:1;border-radius:14px;padding:10px 4px;text-align:center;position:relative;background:${isClaimed?'rgba(67,233,123,0.12)':isToday?'rgba(255,220,0,0.1)':'rgba(255,255,255,0.05)'};border:1.5px solid ${isClaimed?'rgba(67,233,123,0.35)':isToday?'rgba(255,220,0,0.4)':'rgba(255,255,255,0.08)'};opacity:${!isPast&&!isToday&&!isClaimed?'0.4':'1'};cursor:${isToday&&!isClaimed?'pointer':'default'};transition:transform 0.15s;`;
    cell.innerHTML=`<div style="font-size:1.4rem;line-height:1;margin-bottom:6px;">${isClaimed?'✅':reward.icon}</div><div style="font-family:'Fredoka One',cursive;font-size:0.65rem;color:${isToday?'#ffe259':isClaimed?'#43e97b':'rgba(255,255,255,0.5)'};margin-bottom:3px;">${reward.day}</div><div style="font-size:0.55rem;color:rgba(255,255,255,0.35);line-height:1.2;">${reward.label}</div>`;
    if(isToday&&!isClaimed){cell.onclick=()=>{claimWeeklyDay();renderTabContent(document.getElementById('rewards-tab-content'),'weekly');};}
    row.appendChild(cell);
  });
  container.appendChild(row);

  // Weekly bonus
  const allClaimed=claimed.length===7;
  const bonusDiv=document.createElement('div');
  bonusDiv.style.cssText=`margin-top:20px;text-align:center;background:${allClaimed?'rgba(255,215,0,0.15)':'rgba(255,255,255,0.04)'};border:1.5px solid ${allClaimed?'rgba(255,215,0,0.4)':'rgba(255,255,255,0.08)'};border-radius:16px;padding:16px;`;
  bonusDiv.innerHTML=`<div style="font-size:2rem;margin-bottom:6px;">${allClaimed?'🏆':'🔒'}</div><div style="font-family:'Fredoka One',cursive;color:${allClaimed?'#ffd700':'rgba(255,255,255,0.4)'};font-size:1rem;">Full Week Bonus</div><div style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-top:4px;">${allClaimed?'5 Lives + All Boosters!':'Play '+(7-claimed.length)+' more days'}</div>${allClaimed?'<button class="btn btn-play" style="margin-top:12px;padding:10px 24px;" onclick="claimWeeklyBonus(this)">Claim Bonus! 🎁</button>':''}`;
  container.appendChild(bonusDiv);
}
function claimWeeklyBonus(btn){btn.disabled=true;btn.textContent='Claimed! ✅';addLife(5);earnBooster('extraMoves',3);earnBooster('hammer',3);earnBooster('bomb',3);showRewardToast('🏆','5 Lives + All Boosters!');}

// ── HOURLY TAB ──
function renderHourlyTab(container){
  const today=getTodayKey();
  if(dailyData.lastPlayDate!==today){dailyData.playMinutesToday=0;dailyData.hourlyRewardsClaimed=0;}
  const minsPlayed=dailyData.playMinutesToday||0;const claimed=dailyData.hourlyRewardsClaimed||0;
  const title=document.createElement('div');title.style.cssText="font-family:'Fredoka One',cursive;font-size:1.3rem;color:#fff;margin-bottom:4px;";
  title.textContent='Play Time Rewards ⏱️';
  const sub=document.createElement('div');sub.style.cssText='font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:20px;';
  sub.textContent='Earn rewards for every hour you play!';
  container.appendChild(title);container.appendChild(sub);

  const progressPct=Math.min(100,(minsPlayed%60)/60*100);const nextHour=60-(minsPlayed%60);
  const pw=document.createElement('div');pw.style.cssText='margin-bottom:24px;';
  pw.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:8px;"><span>Today: ${minsPlayed} min played</span><span>Next reward: ${nextHour} min</span></div><div style="background:rgba(255,255,255,0.1);border-radius:8px;height:10px;overflow:hidden;"><div style="height:100%;border-radius:8px;background:linear-gradient(90deg,#4facfe,#00f2fe);width:${progressPct}%;transition:width 0.5s;box-shadow:0 0 8px rgba(79,172,254,0.5);"></div></div>`;
  container.appendChild(pw);

  HOURLY_REWARDS.forEach((reward,i)=>{
    const isClaimed=i<claimed;const isNext=i===claimed;
    const slot=document.createElement('div');
    slot.style.cssText=`display:flex;align-items:center;gap:16px;background:${isClaimed?'rgba(67,233,123,0.08)':isNext?'rgba(79,172,254,0.08)':'rgba(255,255,255,0.04)'};border:1.5px solid ${isClaimed?'rgba(67,233,123,0.3)':isNext?'rgba(79,172,254,0.3)':'rgba(255,255,255,0.06)'};border-radius:16px;padding:16px;margin-bottom:10px;opacity:${!isClaimed&&!isNext?'0.4':'1'};`;
    slot.innerHTML=`<div style="font-size:2.2rem;line-height:1;">${isClaimed?'✅':reward.icon}</div><div style="flex:1;"><div style="font-family:'Fredoka One',cursive;font-size:1rem;color:${isClaimed?'#43e97b':isNext?'#4facfe':'rgba(255,255,255,0.4)'};margin-bottom:2px;">Hour ${reward.hour}</div><div style="font-size:0.8rem;color:rgba(255,255,255,0.45);">${reward.label}</div></div><div style="font-family:'Fredoka One',cursive;font-size:0.8rem;color:rgba(255,255,255,0.3);">${isClaimed?'Done!':isNext?nextHour+'m left':'Locked'}</div>`;
    container.appendChild(slot);
  });
}

// ═══ TOAST ═══
function showRewardToast(icon,label){
  const toast=document.createElement('div');
  toast.style.cssText="position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.88);color:#ffe259;font-family:'Fredoka One',cursive;padding:10px 24px;border-radius:20px;font-size:1rem;z-index:600;white-space:nowrap;animation:score-float 2.5s ease forwards;";
  toast.textContent=icon+' '+label+' claimed!';document.body.appendChild(toast);setTimeout(()=>toast.remove(),2500);
}

// ═══ UI UPDATE ═══
function updateDailyUI(){updateDailyNotifDot();updateSpinUI();}

function updateDailyNotifDot(){
  const dot=document.getElementById('daily-notif-dot');if(!dot)return;
  const today=getTodayKey();
  const currentDay=dailyData.currentDay||0;const claimed=dailyData.claimedDays||[];
  const hasUnclaimed=currentDay>0&&!claimed.includes(currentDay);
  dot.style.display=hasUnclaimed?'block':'none';
}

// ═══ INIT ═══
function initDaily(){
  loadDailyData();
  if(!localStorage.getItem('cb_spin_given')){dailyData.spinCount=3;localStorage.setItem('cb_spin_given','1');saveDailyData();}
  const weekNum=getWeekNumber();
  if(dailyData.weekNumber!==weekNum){dailyData.weeklyDays=[];dailyData.claimedWeeklyDays=[];dailyData.weekNumber=weekNum;saveDailyData();}
  checkMonthlyLogin();
  setTimeout(()=>claimWeeklyDay(),2000);
  updateDailyUI();
}
