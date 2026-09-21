// Keep the large WebGL runtime out of the launch path. It warms while the
// player browses the journey and is ready by the time a level starts.
(()=>{
  let loading=null;
  function load(){
    if(window.Candy3D)return Promise.resolve(window.Candy3D);
    if(!loading)loading=import('./renderer3d.mjs').then(()=>window.Candy3D).catch(error=>{console.warn('3D renderer could not load',error);return null;});
    return loading;
  }
  const journey=document.getElementById('screen-map'),game=document.getElementById('screen-game');
  const observer=new MutationObserver(()=>{if(!journey?.classList.contains('hidden')||!game?.classList.contains('hidden'))load();});
  if(journey)observer.observe(journey,{attributes:true,attributeFilter:['class']});
  if(game)observer.observe(game,{attributes:true,attributeFilter:['class']});
  window.CandyRenderer={load,get loading(){return !!loading;}};
})();
