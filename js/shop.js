(()=>{
  const products=[
    {id:'candyblast.gold.50',name:'Sugar Pouch',amount:50,art:'star'},
    {id:'candyblast.gold.120',name:'Sweet Jar',amount:120,art:'diamond'},
    {id:'candyblast.gold.300',name:'Candy Chest',amount:300,art:'prism'}
  ];
  const offers=[
    {id:'extra_moves',name:'+5 Moves',cost:7,art:'bolt',detail:'Five extra moves before a level'},
    {id:'hammer',name:'Lollipop Hammer',cost:9,art:'hammer',detail:'Clear one candy you choose'},
    {id:'bomb',name:'Rainbow Prism',cost:12,art:'prism',detail:'Clear one color you choose'},
    {id:'full_lives',name:'Full Hearts',cost:15,art:'heart',detail:'Refill all five hearts'}
  ];
  const balance=()=>Math.max(0,+localStorage.getItem('cb_gold_bars')||0);
  const store=()=>window.Capacitor?.Plugins?.CandyPurchases;
  // Explicit launch flag is set only after native billing and receipt verification are live.
  const storeReady=()=>!!(window.CANDY_STORE_READY===true&&window.CandyCloud?.session&&store()?.purchase);
  const art=name=>name==='heart'?'images/ui/candyblast-emblem.webp':`images/candies/${name}.svg`;
  function updateBalance(){
    const amount=balance(),trigger=document.querySelector('.home-gold');
    document.querySelectorAll('#home-gold-count,#shop-gold-count').forEach(node=>node.textContent=amount.toLocaleString());
    if(trigger)trigger.setAttribute('aria-label',`Open Sweet Shop, ${amount} gold bars`);
  }
  function status(message,error=false){
    const node=document.getElementById('shop-status');
    if(node){node.textContent=message||'';node.classList.toggle('is-error',error);}
  }
  async function buyProduct(id,button){
    if(!storeReady()){status('Mobile store purchases are not available yet.',true);return;}
    button.disabled=true;
    try{
      const result=await store().purchase({productId:id});
      if(!result?.transactionId||!result?.proof||!result?.platform)throw new Error('Store did not return a verifiable receipt.');
      const config=window.CANDY_SUPABASE,session=window.CandyCloud.session;
      const response=await fetch(`${config.url}/functions/v1/verify-purchase`,{method:'POST',headers:{apikey:config.publishableKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({platform:result.platform,productId:id,transactionId:result.transactionId,proof:result.proof})});
      const verified=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(verified.error||'Purchase verification is pending.');
      await window.CandyEconomy.sync();render();status('Gold bars added to your wallet.');
    }catch(error){status(error.message||'Purchase was not completed.',true);}
    finally{button.disabled=false;}
  }
  async function spend(id,button){
    if(!window.CandyCloud?.session){status('Sign in to use your cloud wallet.',true);return;}
    button.disabled=true;
    try{await window.CandyEconomy.spendGold(id);render();status('Booster added to your inventory.');}
    catch(error){status(String(error.message||'Could not complete purchase.').replaceAll('_',' '),true);}
    finally{button.disabled=false;}
  }
  function productCard(item){
    const ready=storeReady();
    return `<article class="shop-product"><span class="shop-product-art"><img src="${art(item.art)}" alt=""></span><div class="shop-product-copy"><strong>${item.name}</strong><small><span class="gold-bar-icon" aria-hidden="true"></span>${item.amount} gold bars</small></div><button type="button" data-product="${item.id}" ${ready?'':'disabled'}>${ready?'View price':'Coming soon'}</button></article>`;
  }
  function offerCard(item){
    const available=!!window.CandyCloud?.session&&balance()>=item.cost;
    const picture=item.art==='prism'?'<img src="images/candies/prism.svg" alt="">':`<svg viewBox="0 0 24 24" aria-hidden="true"><use href="images/ui/icons.svg#${item.art}"></use></svg>`;
    return `<article class="shop-offer"><span class="shop-offer-art">${picture}</span><div class="shop-offer-copy"><strong>${item.name}</strong><small>${item.detail}</small></div><button type="button" data-offer="${item.id}" ${available?'':'disabled'} aria-label="Get ${item.name} for ${item.cost} gold bars"><span class="gold-bar-icon" aria-hidden="true"></span>${item.cost}</button></article>`;
  }
  function render(){
    const host=document.getElementById('shop-container');if(!host)return;
    const stars=typeof getTotalStars==='function'?getTotalStars():0,ready=storeReady();
    host.innerHTML=`<header class="shop-head"><button class="shop-back" type="button" onclick="goScreen('start')" aria-label="Back to home">←</button><div><small>YOUR ADVENTURE</small><h1>Sweet Shop</h1></div><span class="shop-balance"><span class="gold-bar-icon" aria-hidden="true"></span><b id="shop-gold-count">${balance().toLocaleString()}</b></span></header><div class="shop-scroll"><section class="shop-hero"><div><span class="shop-kicker">A LITTLE HELP FOR THE JOURNEY</span><h2>Pick your next sweet move.</h2><p>Boosters are optional. Your level progress and stars are earned by playing.</p></div><img src="images/candies/prism.svg" alt=""></section><section class="shop-section"><div class="shop-section-head"><div><span>01 / READY TO USE</span><h2>Boosters</h2></div><small>Spend gold bars</small></div><div class="shop-offers">${offers.map(offerCard).join('')}</div></section><section class="shop-section"><div class="shop-section-head"><div><span>02 / YOUR COLLECTION</span><h2>Journey stars</h2></div><strong class="shop-star-count">★ ${stars} / 60</strong></div><div class="shop-stars"><div class="shop-stars-track"><span style="width:${Math.min(100,stars/60*100)}%"></span></div><p>Earn up to three stars per level. Collect 5, 10 or 15 in each world to light up its bronze, silver and gold mastery badges on the map. Stars are never spent.</p><button type="button" onclick="goScreen('map');renderMapScreen();">See my journey <span aria-hidden="true">→</span></button></div></section><section class="shop-section"><div class="shop-section-head"><div><span>03 / MOBILE STORE</span><h2>Gold bars</h2></div><small>${ready?'Store connected':'Not available yet'}</small></div><div class="shop-products">${products.map(productCard).join('')}</div><p class="shop-store-note">${ready?'Final prices are shown by your device’s store. Gold is added only after receipt verification.':'Gold purchases open after the Android and iPhone store setup and payment verification are complete.'}</p></section><p id="shop-status" class="shop-status" role="status" aria-live="polite"></p></div>`;
    host.querySelectorAll('[data-product]').forEach(button=>button.onclick=()=>buyProduct(button.dataset.product,button));
    host.querySelectorAll('[data-offer]').forEach(button=>button.onclick=()=>spend(button.dataset.offer,button));
    updateBalance();
  }
  function open(){goScreen('shop');render();window.CandyEconomy?.sync?.().then(render).catch(()=>{});}
  window.openShop=open;window.CandyShop={open,render,updateBalance};updateBalance();
  window.addEventListener('storage',event=>{if(event.key==='cb_gold_bars')updateBalance();});
})();
