// Shared candy avatar catalogue. Only these IDs are stored or sent to Supabase.
(()=>{
  const items=[
    ['berry','Berry Pop','images/candies/berry.svg'],
    ['mint','Mint Drop','images/candies/mint.svg'],
    ['star','Sugar Star','images/candies/star.svg'],
    ['diamond','Blue Gem','images/candies/diamond.svg'],
    ['grape','Grape Glow','images/candies/grape.svg'],
    ['orange','Orange Twist','images/candies/orange.svg'],
    ['prism','Rainbow Prism','images/candies/prism.svg'],
    ['emblem','Sweet Heart','images/ui/candyblast-emblem.webp']
  ].map(([id,name,src])=>({id,name,src}));
  const byId=new Map(items.map(item=>[item.id,item]));
  function get(id){return byId.get(String(id||''))||items[0];}
  function read(){try{return get(JSON.parse(localStorage.getItem('cb_profile')||'{}').avatar);}catch{return items[0];}}
  function mount(target,id,{label=true}={}){
    if(!target)return;const avatar=get(id);target.textContent='';target.dataset.avatar=avatar.id;
    const image=document.createElement('img');image.src=avatar.src;image.alt=label?avatar.name:'';image.decoding='async';target.append(image);
  }
  window.CandyProfiles={items,get,read,mount};
})();
