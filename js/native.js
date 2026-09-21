// Browser-safe access to native feedback and OAuth deep links in Capacitor.
(()=>{
  const plugins=window.Capacitor?.Plugins||{},haptics=plugins.Haptics,app=plugins.App;
  const impact=style=>haptics?.impact?.({style}).catch(()=>{});
  const notify=type=>haptics?.notification?.({type}).catch(()=>{});
  if(app?.addListener)app.addListener('appUrlOpen',event=>{const url=String(event?.url||'');if(url.startsWith('candyblast://auth'))location.assign('/'+(url.split('#')[1]?'#'+url.split('#')[1]:''));});
  window.CandyNative={tap:()=>impact('LIGHT'),booster:()=>impact('MEDIUM'),success:()=>notify('SUCCESS'),error:()=>notify('ERROR'),get active(){return !!window.Capacitor?.isNativePlatform?.();}};
  document.addEventListener('pointerup',event=>{if(event.target.closest('button'))impact('LIGHT');},{passive:true});
})();
