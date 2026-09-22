(()=>{
  const goldProducts=[
    {id:'candyblast.gold.50',title:'Sugar Pouch',gold:50,art:'🪙'},
    {id:'candyblast.gold.120',title:'Sweet Jar',gold:120,art:'🏺'},
    {id:'candyblast.gold.300',title:'Candy Chest',gold:300,art:'🎁'}
  ];
  const offers=[
    {id:'extra_moves',title:'+5 Moves',cost:7,art:'⚡',copy:'One pre-game boost'},
    {id:'hammer',title:'Lollipop Hammer',cost:9,art:'🔨',copy:'Clear your chosen candy'},
    {id:'bomb',title:'Rainbow Prism',cost:12,art:'🌈',copy:'Clear one chosen color'},
    {id:'full_lives',title:'Full Hearts',cost:15,art:'❤️',copy:'Restore all 5 lives'}
  ];
  const balance=()=>Math.max(0,+localStorage.getItem('cb_gold_bars')||0);
  function updateBalance(){document.querySelectorAll('#home-gold-count,#shop-gold-count').forEach(node=>node.textContent=balance());}
  function status(text,error=false){const node=document.getElementById('shop-status');if(node){node.textContent=text||'';node.style.color=error?'#ffc1cc':'';}}
  async function buyProduct(id,button){
    if(!window.CandyCloud?.session){status('Sign in from your profile before purchasing.',true);return;}
    const store=window.Capacitor?.Plugins?.CandyPurchases;if(!store?.purchase){status('Store products become available after Play Console and App Store Connect setup.',true);return;}
    button.disabled=true;try{const result=await store.purchase({productId:id});if(!result?.transactionId||!result?.proof||!result?.platform)throw new Error('Store did not return a verifiable receipt.');const config=window.CANDY_SUPABASE,session=window.CandyCloud.session,response=await fetch(`${config.url}/functions/v1/verify-purchase`,{method:'POST',headers:{apikey:config.publishableKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({platform:result.platform,productId:id,transactionId:result.transactionId,proof:result.proof})});const verified=await response.json().catch(()=>({}));if(!response.ok)throw new Error(verified.error||'Purchase verification is pending.');await window.CandyEconomy.sync();updateBalance();status('Purchase verified and added to your account.');}catch(error){status(error.message||'Purchase was not completed.',true);}finally{button.disabled=false;}
  }
  async function spend(id,button){
    if(!window.CandyCloud?.session){status('Sign in to use your cloud wallet.',true);return;}
    button.disabled=true;try{await window.CandyEconomy.spendGold(id);updateBalance();render();status('Item added to your inventory.');}catch(error){status(String(error.message||'Could not complete purchase.').replaceAll('_',' '),true);}finally{button.disabled=false;}
  }
  function card(item,kind){return `<article class="shop-card"><span class="shop-art">${item.art}</span><strong>${item.title}</strong><small>${kind==='product'?`${item.gold} Gold Bars`:item.copy}</small><button type="button" data-${kind}="${item.id}">${kind==='product'?'Store price':`${item.cost} 🪙`}</button></article>`;}
  function render(){
    const host=document.getElementById('shop-container');if(!host)return;host.innerHTML=`<header class="shop-head"><button onclick="goScreen('start')" aria-label="Back">←</button><h1>Sweet Shop</h1><span class="shop-balance">🪙 <b id="shop-gold-count">${balance()}</b></span></header><div class="shop-scroll"><section class="shop-banner"><h2>A little help, when you want it</h2><p>Every level can be played without paying. Purchases only add optional boosts and never expire.</p></section><h2 class="shop-section-title">Gold bars</h2><div class="shop-products">${goldProducts.map(item=>card(item,'product')).join('')}</div><h2 class="shop-section-title">Boosters</h2><div class="shop-products">${offers.map(item=>card(item,'offer')).join('')}</div><p id="shop-status" class="shop-status" role="status" aria-live="polite"></p><p class="shop-note">Real prices come directly from Google Play or the App Store. Purchases are credited only after server verification.</p></div>`;host.querySelectorAll('[data-product]').forEach(button=>button.onclick=()=>buyProduct(button.dataset.product,button));host.querySelectorAll('[data-offer]').forEach(button=>button.onclick=()=>spend(button.dataset.offer,button));
  }
  function open(){goScreen('shop');render();window.CandyEconomy?.sync?.().then(updateBalance).catch(()=>{});}
  window.openShop=open;window.CandyShop={open,render,updateBalance};updateBalance();window.addEventListener('storage',event=>{if(event.key==='cb_gold_bars')updateBalance();});
})();
