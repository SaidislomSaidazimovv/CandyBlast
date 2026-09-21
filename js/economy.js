// Signed-in economy is mirrored locally for fast UI, while Supabase owns truth.
(()=>{
  let lastSync=0,syncing=null;
  const signed=()=>!!window.CandyCloud?.session;
  function applyState(state){
    if(!state||typeof state!=='object')return null;
    livesData=normalizeLivesData({lives:+state.lives,lastLostAt:state.last_life_at?Date.parse(state.last_life_at):null,boosters:{extraMoves:+state.extra_moves,hammer:+state.hammers,bomb:+state.bombs}});
    dailyData.spinCount=Math.max(0,Math.floor(+state.spins||0));
    if(Number.isInteger(+state.streak_day)&&+state.streak_day>0)dailyData.currentDay=Math.min(30,+state.streak_day);
    if(state.daily_claimed_today&&dailyData.currentDay&&!dailyData.claimedDays.includes(dailyData.currentDay))dailyData.claimedDays.push(dailyData.currentDay);
    localStorage.setItem('cb_lives',JSON.stringify(livesData));localStorage.setItem('cb_daily',JSON.stringify(dailyData));
    localStorage.setItem('cb_gold_bars',String(Math.max(0,Math.floor(+state.gold_bars||0))));
    lastSync=Date.now();updateLivesUI();updateTimerDisplay();updateDailyUI();return state;
  }
  async function rpc(name,body){if(!signed())throw new Error('Sign in to use cloud rewards.');return window.CandyCloud.rpc(name,body);}
  async function sync(){if(!signed())return null;if(syncing)return syncing;syncing=rpc('economy_get_state').then(applyState).finally(()=>{syncing=null});return syncing;}
  async function consume(item){if(!signed())return null;try{return applyState(await rpc('economy_consume',{p_item:item}));}catch(error){await sync().catch(()=>{});throw error;}}
  async function claimDaily(){if(!signed())return null;try{const result=await rpc('economy_claim_daily');applyState(result.state);return result;}catch(error){if(String(error.message).includes('daily_already_claimed'))await sync().catch(()=>{});throw error;}}
  async function spin(){const result=await rpc('economy_spin');applyState(result.state);return result;}
  async function claimWeeklyBonus(){const result=await rpc('economy_claim_weekly_bonus');applyState(result.state);return result;}
  async function claimLevelReward(level,stars){if(!signed())return null;const result=await rpc('economy_claim_level_reward',{p_level:level,p_stars:stars});applyState(result.state);return result;}
  function refreshIfDue(){if(signed()&&Date.now()-lastSync>60000)sync().catch(()=>{});}
  window.CandyEconomy={sync,consume,claimDaily,claimWeeklyBonus,spin,claimLevelReward,refreshIfDue,isAuthoritative:signed,applyState,get state(){return {lives:livesData.lives,extra_moves:livesData.boosters.extraMoves,hammer:livesData.boosters.hammer,bomb:livesData.boosters.bomb,spins:dailyData.spinCount,gold_bars:+localStorage.getItem('cb_gold_bars')||0};}};
})();
