// Presentation only: normalize legacy labels to one local vector icon family.
(() => {
  const icons={'⚙':'settings','❤️':'heart','❤':'heart','🖤':'heart','💔':'heart','🎁':'gift','⭐':'star','☆':'star','🌟':'star','🏆':'trophy','🥇':'trophy','🥈':'trophy','🥉':'trophy','🎡':'spin','🏠':'home','🏡':'home','▶':'play','⏸':'pause','←':'back','→':'next','✕':'close','✖':'close','🔊':'sound','🔇':'sound','🎵':'music','🎶':'music','📳':'phone','✨':'spark','✧':'spark','✦':'spark','⚡':'bolt','🔨':'hammer','💣':'bomb','🗺':'map','🌍':'map','🔒':'lock','🔓':'lock','✅':'check','✔':'check','⏱':'clock','⏰':'clock','🎓':'book','📖':'book','🎨':'palette','🗑':'trash','👤':'user','📅':'calendar','📆':'calendar','🗓':'calendar','🏔':'mountain','🌋':'mountain','🏰':'castle','🌸':'leaf','🌅':'sun','❄':'ice','🔄':'retry','↻':'retry','🍭':'candy','🍬':'candy','🎯':'star','👣':'next','🔥':'bolt','🎉':'spark','🧠':'spark','👆':'hand','💎':'diamond','👑':'crown','🍒':'heart','🍀':'leaf','🔮':'spark','🍊':'sun','😊':'user','😢':'heart','💥':'spark','🌈':'palette'};
  const pattern=/[\p{Extended_Pictographic}](?:\uFE0F)?|[←→▶✕✖✧✦↻✔☆]/gu;
  const excluded='script,style,svg,canvas,.ui-icon,#board,#game-scene,.candy-art';
  function replace(node){
    const parent=node.parentElement;if(!parent||parent.closest(excluded))return;
    const text=node.nodeValue;pattern.lastIndex=0;if(!pattern.test(text))return;pattern.lastIndex=0;
    const fragment=document.createDocumentFragment();let cursor=0;
    for(const match of text.matchAll(pattern)){
      fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      const name=icons[match[0]]||icons[match[0].replace(/\uFE0F/g,'')]||'spark';
      const span=document.createElement('span');span.className='ui-icon icon-'+name;
      const labelHost=parent.closest('button,a,.setting-label,.panel-title,h1')||parent;
      if(/[\p{L}]/u.test(labelHost.textContent.replace(pattern,'')))span.setAttribute('aria-hidden','true');
      else{span.setAttribute('role','img');span.setAttribute('aria-label',name);}
      if(match[0]==='🖤'||match[0]==='☆'){span.classList.add('icon-empty');if(span.hasAttribute('aria-label'))span.setAttribute('aria-label','empty '+name);}
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),use=document.createElementNS(svg.namespaceURI,'use');
      svg.setAttribute('aria-hidden','true');svg.setAttribute('viewBox','0 0 24 24');use.setAttribute('href','images/ui/icons.svg#'+name+(span.classList.contains('icon-empty')?'-empty':''));svg.append(use);span.append(svg);fragment.append(span);cursor=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(text.slice(cursor)));node.replaceWith(fragment);
  }
  function decorate(root){
    if(root.nodeType===Node.TEXT_NODE){replace(root);return;}
    if(root.nodeType!==Node.ELEMENT_NODE||root.closest(excluded))return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);nodes.forEach(replace);
  }
  decorate(document.body);
  new MutationObserver(records=>{
    for(const record of records)if(record.type==='characterData')decorate(record.target);else record.addedNodes.forEach(decorate);
  }).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
