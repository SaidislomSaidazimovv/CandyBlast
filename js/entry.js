// Device-local identity only; no password or server authentication is simulated.
(()=>{
 function readProfile(){try{return JSON.parse(localStorage.getItem('cb_profile')||'null');}catch{return null;}}
 function leave(){document.querySelectorAll('.screen').forEach(el=>el.inert=false);document.getElementById('entry-overlay')?.remove();if(typeof checkFirstTime==='function')checkFirstTime();}
 function openProfile(){document.querySelectorAll('.screen').forEach(el=>el.inert=true);
  let overlay=document.getElementById('entry-overlay');if(!overlay){overlay=document.createElement('div');overlay.id='entry-overlay';overlay.className='entry-overlay';document.body.append(overlay);}
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Player profile');
  overlay.innerHTML='<form class="entry-card"><img src="images/ui/app.svg" alt=""><h1>Your sweet journey</h1><p>Choose a player name. Your profile and progress stay on this device.</p><label for="player-name">Player name</label><input id="player-name" name="player" autocomplete="nickname" maxlength="24" required placeholder="Your name"><button class="btn btn-play" type="submit">Save profile &amp; play</button><button class="btn btn-secondary" type="button" id="entry-guest">Continue as guest</button><p id="entry-error" role="status"></p></form>';
  const form=overlay.querySelector('form'),input=form.querySelector('input');input.value=readProfile()?.name||'';
  form.onsubmit=e=>{e.preventDefault();const name=input.value.trim();if(!name){input.setCustomValidity('Enter your player name.');input.reportValidity();return;}try{localStorage.setItem('cb_profile',JSON.stringify({name}));leave();}catch{document.getElementById('entry-error').textContent='Profile could not be saved. You can continue as guest.';}};input.oninput=()=>input.setCustomValidity('');document.getElementById('entry-guest').onclick=leave;
 }
 const profile=document.createElement('button');profile.className='profile-menu';profile.textContent='Player profile';profile.onclick=openProfile;document.querySelector('#screen-settings .panel')?.append(profile);
 function ready(){if(readProfile())leave();else openProfile();}
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready,{once:true});
})();
