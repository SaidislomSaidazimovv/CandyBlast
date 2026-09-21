import * as THREE from '../vendor/three/three.module.min.js';
const host=document.getElementById('game-scene');
const bridge=window.Candy3DBridge;
const colors=[0xed4778,0x42b8e9,0x76c89a,0xffc351,0xa17add,0xf38c49];
let renderer;
try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}); start(); }
catch(error) { console.warn('3D unavailable; using accessible 2D board',error); renderer?.dispose(); host.replaceChildren(); document.documentElement.classList.remove('game-3d'); }
function start(){
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.9;
  host.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','64 konfetli 3D maydon');
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#d9c9df');
  scene.fog=new THREE.Fog('#d9c9df',25,60);
  const camera=new THREE.OrthographicCamera(-7,7,8,-8,.1,90);
  camera.position.set(0,15,18); camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xfff4df,0x847ba6,1.4));
  const key=new THREE.DirectionalLight(0xfff3d6,2); key.position.set(-5,10,6); scene.add(key);
  const rim=new THREE.DirectionalLight(0xc2e6ff,1.5); rim.position.set(6,4,-4); scene.add(rim);

  // A small generated studio light map gives rounded sweets broad reflections.
  const envCanvas=document.createElement('canvas'); envCanvas.width=256; envCanvas.height=128;
  const ctx=envCanvas.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,128);
  gradient.addColorStop(0,'#faf2eb'); gradient.addColorStop(.5,'#b8a6c6'); gradient.addColorStop(1,'#595275');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
  ctx.fillStyle='#ffffff';ctx.fillRect(25,15,50,35);ctx.fillRect(160,25,25,50);
  const envTexture=new THREE.CanvasTexture(envCanvas); envTexture.mapping=THREE.EquirectangularReflectionMapping;envTexture.colorSpace=THREE.SRGBColorSpace;
  const pmrem=new THREE.PMREMGenerator(renderer), environment=pmrem.fromEquirectangular(envTexture);
  scene.environment=environment.texture;envTexture.dispose();pmrem.dispose();

  const geometries=new Set(),materials=new Set();
  const geo=g=>(geometries.add(g),g),mat=m=>(materials.add(m),m);
  const standard=(color,roughness=.65)=>mat(new THREE.MeshStandardMaterial({color,roughness}));
  const dummy=new THREE.Object3D();
  function mesh(g,m,x,y,z,sx=1,sy=sx,sz=sx) {
    const object=new THREE.Mesh(g,m);object.position.set(x,y,z);object.scale.set(sx,sy,sz);scene.add(object);return object;
  }
  function roundedShape(w,h,r) {
    const s=new THREE.Shape(),x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
  }
  function extrude(shape,depth,bevel=.1) {
    const g=geo(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:12}));g.center();return g;
  }
  const sphere=geo(new THREE.SphereGeometry(1,24,16));
  const land=mesh(geo(new THREE.PlaneGeometry(180,180)),standard('#d4c4db'),0,-.9,0);land.rotation.x=-Math.PI/2;
  const platform=mesh(extrude(roundedShape(9.2,9.2,.65),.52,.12),standard('#b08bba',.35),0,-.37,0);platform.rotation.x=-Math.PI/2;
  const icing=mesh(extrude(roundedShape(9.05,9.05,.6),.12,.09),standard('#f2e4ee',.35),0,-.02,0);icing.rotation.x=-Math.PI/2;
  const tileGeometry=extrude(roundedShape(.92,.92,.14),.025,.025);
  tileGeometry.rotateX(-Math.PI/2);
  const tiles=new THREE.InstancedMesh(tileGeometry,standard('#d3bbd9',.38),64);scene.add(tiles);
  const pos=i=>({x:(i%8-3.5)*1.04,z:(Math.floor(i/8)-3.5)*1.04});
  for(let i=0;i<64;i++){const p=pos(i);dummy.position.set(p.x,.12,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();tiles.setMatrixAt(i,dummy.matrix);}

  function syncTheme(){
    const css=getComputedStyle(document.body),base=new THREE.Color(css.getPropertyValue('--app-plum').trim()||'#493254'),top=new THREE.Color(css.getPropertyValue('--app-top').trim()||'#79536f');
    scene.background.copy(top).lerp(new THREE.Color('#ffffff'),.55);scene.fog.color.copy(scene.background);
    land.material.color.copy(scene.background);platform.material.color.copy(base).lerp(top,.5);tiles.material.color.copy(top).lerp(new THREE.Color('#ffffff'),.45);icing.material.color.copy(scene.background).lerp(new THREE.Color('#ffffff'),.65);wake();
  }
  const themeObserver=new MutationObserver(syncTheme);themeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  window.addEventListener('candyworldchange',syncTheme);
  // Low-detail, shared landscape geometry. All scenery stays still while idle.
  const hillColors=['#b2c5b1','#97b9a6','#c0cba9','#bfa9c7'];
  const hills=[[-7,-5,3,2.9],[-4,-8,3.4,2.7],[1,-9,4.5,3.2],[6,-7,3.4,3.6],[9,-3,4,2.6],[-9,1,3,2.2]];
  hills.forEach(([x,z,s,y],i)=>mesh(sphere,standard(hillColors[i%4]),x,-.9,z,s,y,s*.85));
  const stem=geo(new THREE.CylinderGeometry(.065,.09,2.4,8)),stemMat=standard('#fff0df');
  const sweetMats=['#e5a9bd','#c6afe5','#a8d8bf','#efce8b'].map(c=>standard(c,.3));
  [[-5.7,-3,1],[-6.2,1.2,.8],[5.7,-3.8,1.1],[6,1.5,.85],[-4.2,-6,1],[3.5,-6,.85]].forEach(([x,z,s],i)=>{
    mesh(stem,stemMat,x,.45,z,s,s,s);
    const crown=mesh(sphere,sweetMats[i%4],x,1.8*s,z,.7*s,.9*s,.65*s);
    crown.rotation.z=.15*(i%2?1:-1);
    const ring=mesh(geo(new THREE.TorusGeometry(.46*s,.11*s,8,28)),sweetMats[(i+1)%4],x,1.8*s,z+.51*s);ring.rotation.z=.5;
  });
  const pebbleMat=standard('#f4e4da');
  [[-5,3.8],[5,3.9],[-5.2,-1.7],[5.4,-.7],[-3,5.3],[3.5,5.2]].forEach(([x,z],i)=>mesh(sphere,pebbleMat,x,-.45,z,.35+(i%2)*.1,.25,.25));
  const cloudMat=standard('#f2e8ee');
  for(const [x,z,s] of [[-6,-12,1.2],[5,-14,1.5]])for(let i=0;i<3;i++)mesh(sphere,cloudMat,x+i*.8,4+(i===1?.3:0),z,s,s*.5,s*.6);

  function candyGeometry(type) {
    let shape=new THREE.Shape();
    if(type===0){shape.moveTo(0,-.4);shape.bezierCurveTo(-.13,-.22,-.51,.05,-.38,.3);shape.bezierCurveTo(-.25,.51,-.02,.4,0,.25);shape.bezierCurveTo(.1,.5,.4,.49,.43,.22);shape.bezierCurveTo(.45,.02,.13,-.23,0,-.4);}
    if(type===1){shape.moveTo(0,.43);shape.lineTo(.38,.08);shape.lineTo(.27,-.3);shape.lineTo(-.27,-.3);shape.lineTo(-.38,.08);shape.closePath();}
    if(type===2){shape.moveTo(-.33,-.35);shape.bezierCurveTo(-.49,.2,-.05,.48,.36,.34);shape.bezierCurveTo(.47,-.18,.01,-.47,-.33,-.35);}
    if(type===3){for(let i=0;i<10;i++){const angle=Math.PI/2+i*Math.PI/5,r=i%2?.22:.43;const x=Math.cos(angle)*r,y=Math.sin(angle)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}shape.closePath();}
    if(type===4){shape.moveTo(0,.46);shape.bezierCurveTo(.1,.2,.42,.05,.32,-.22);shape.bezierCurveTo(.18,-.46,-.22,-.42,-.32,-.21);shape.bezierCurveTo(-.44,.08,-.1,.21,0,.46);}
    if(type===5){const g=geo(new THREE.SphereGeometry(.43,24,16));g.scale(1,.65,.82);return g;}
    const g=extrude(shape,type===1?.24:.19,type===3?.055:.085);g.rotateX(-Math.PI/2);return g;
  }
  const sweets=colors.map((color,type)=>{
    const material=mat(new THREE.MeshPhysicalMaterial({color,roughness:.23,metalness:.02,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.75}));
    const group=new THREE.InstancedMesh(candyGeometry(type),material,64);
    group.instanceMatrix.setUsage(THREE.DynamicDrawUsage);group.frustumCulled=false;group.userData.indices=[];scene.add(group);return group;
  });
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=32;
  const shadowCtx=shadowCanvas.getContext('2d'),gradientShadow=shadowCtx.createRadialGradient(16,16,2,16,16,16);
  gradientShadow.addColorStop(0,'rgba(70,30,90,.28)');gradientShadow.addColorStop(1,'rgba(70,30,90,0)');
  shadowCtx.fillStyle=gradientShadow;shadowCtx.fillRect(0,0,32,32);
  const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo=geo(new THREE.PlaneGeometry(1,1));shadowGeo.rotateX(-Math.PI/2);
  const shadows=new THREE.InstancedMesh(shadowGeo,mat(new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false})),64);scene.add(shadows);
  for(let i=0;i<64;i++){const p=pos(i);dummy.position.set(p.x,.17,p.z+.04);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);}
  const halo=mesh(geo(new THREE.TorusGeometry(.55,.045,8,40)),mat(new THREE.MeshBasicMaterial({color:'#fff4aa',depthTest:false})),0,.25,0);halo.rotation.x=-Math.PI/2;halo.visible=false;halo.renderOrder=10;
  const particleMesh=new THREE.InstancedMesh(geo(new THREE.IcosahedronGeometry(.055,0)),mat(new THREE.MeshBasicMaterial({color:'#fff6df'})),96);particleMesh.frustumCulled=false;particleMesh.count=0;scene.add(particleMesh);
  particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const boardEl=document.getElementById('board'),screen=document.getElementById('screen-game');
  const iceGeo=geo(new THREE.BoxGeometry(.92,.3,.92));
  const iceMesh=new THREE.InstancedMesh(iceGeo,mat(new THREE.MeshPhysicalMaterial({color:0xb9efff,transparent:true,opacity:.35,roughness:.1,depthWrite:false})),64);iceMesh.frustumCulled=false;scene.add(iceMesh);
  const hardIceMesh=new THREE.InstancedMesh(iceGeo,mat(new THREE.MeshPhysicalMaterial({color:0x8edfff,transparent:true,opacity:.52,roughness:.06,metalness:.08,depthWrite:false})),64);hardIceMesh.frustumCulled=false;scene.add(hardIceMesh);
  const stripeMat=mat(new THREE.MeshBasicMaterial({color:0xfff4df}));
  const stripes=new THREE.InstancedMesh(geo(new THREE.BoxGeometry(.72,.035,.09)),stripeMat,128);stripes.frustumCulled=false;scene.add(stripes);
  const bombMaterial=standard('#64384b',.22),bombs=new THREE.InstancedMesh(sphere,bombMaterial,64);bombs.frustumCulled=false;scene.add(bombs);
  let records=[],raf=0,last=0,elapsed=0,swapAnim=null,session=-1,lost=false,disposed=false,particles=[],cameraKick=null;
  const snapshot=()=>bridge.snapshot();
  function sync(drops=[]){
    const data=snapshot();if(session!==data.session){swapAnim?.resolve();swapAnim=null;particles=[];cameraKick=null;session=data.session;}
    const distances=new Map(drops.map(d=>[d.r*8+d.c,d.distance]));
    records=data.cells.map((cell,i)=>{const p=pos(i);return {...cell,i,x:p.x,z:p.z,y:.4,fall:data.anim?(distances.get(i)||0)*.7:0,fallStart:elapsed,matchedAt:null};});
    resize();wake();
  }
  function projectCells(){
    const width=host.clientWidth,height=host.clientHeight,v=new THREE.Vector3();
    for(let i=0;i<boardEl.children.length;i++){
      const cell=boardEl.children[i],p=pos(i);v.set(p.x,.4,p.z).project(camera);
      cell.style.left=`${(v.x+1)*width/2}px`;cell.style.top=`${(1-v.y)*height/2}px`;
      const size=Math.min(52,width/(camera.right-camera.left)*.94);cell.style.width=`${size}px`;cell.style.height=`${size*.8}px`;
    }
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(w,h,false);
    const aspect=w/h,span=Math.max(8.8,10.1/aspect);camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;
    camera.position.set(0,18,16);camera.lookAt(0,0,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();projectCells();wake();
  }
  function addEffect(type,payload={}){
    const data=snapshot();if(!data.anim||data.paused)return;
    const cells=(payload.cells||[]).filter(i=>Number.isInteger(i)&&i>=0&&i<64);
    const strength=Math.max(1,Math.min(5,Number(payload.strength)||Number(payload.combo)||1));
    if(type==='invalid'){cameraKick={born:elapsed,life:.24,power:.08};wake();return;}
    if(type==='shuffle')cameraKick={born:elapsed,life:.34,power:.055};
    else if(type==='special')cameraKick={born:elapsed,life:.3,power:.035*strength};
    else if(type==='match'&&strength>=3)cameraKick={born:elapsed,life:.2,power:.014*strength};
    const amount=type==='shuffle'?1:type==='special'?Math.min(5,2+strength):strength>=3?2:1;
    for(const i of cells){
      const p=pos(i);
      for(let n=0;n<amount&&particles.length<96;n++){
        const angle=(i*.91+n*2.399+strength*.47)%(Math.PI*2),speed=.45+.13*((i+n)%4)+strength*.035;
        particles.push({x:p.x,y:.62,z:p.z,vx:Math.cos(angle)*speed,vy:1.15+.13*((i+n)%3),vz:Math.sin(angle)*speed,born:elapsed,life:.42+strength*.055,scale:.7+strength*.08});
      }
    }
    wake();
  }
  function draw(){
    const counts=[0,0,0,0,0,0];let iceCount=0,hardIceCount=0,stripeCount=0,bombCount=0,moving=false;
    const data=snapshot();halo.visible=false;
    for(const rec of records){
      const cell=boardEl.children[rec.i];if(!cell)continue;
      const selected=cell.classList.contains('selected'),hint=cell.classList.contains('hint'),matched=cell.classList.contains('matched');
      cell.setAttribute('aria-pressed',String(selected));
      if(matched&&rec.matchedAt===null)rec.matchedAt=elapsed;
      if(!matched)rec.matchedAt=null;
      const scale=rec.matchedAt!==null&&data.anim?Math.max(.001,1-(elapsed-rec.matchedAt)/.34):1;
      const fallT=Math.min(1,(elapsed-rec.fallStart)/.3),fall=rec.fall*(1-fallT)**3;
      if(rec.fall&&fallT<1||matched&&scale>.001&&data.anim)moving=true;
      let x=rec.x,z=rec.z,y=.4+fall+(selected?.28:0);
      if(swapAnim&&(rec.i===swapAnim.a||rec.i===swapAnim.b)){
        const from=pos(rec.i),to=pos(rec.i===swapAnim.a?swapAnim.b:swapAnim.a),t=Math.min(1,swapAnim.time/.17),k=t*t*(3-2*t);x=from.x+(to.x-from.x)*k;z=from.z+(to.z-from.z)*k;y+=Math.sin(t*Math.PI)*.15;
      }
      dummy.position.set(x,y,z);dummy.rotation.set(0,(rec.i%3-1)*.09,0);dummy.scale.setScalar(scale*(selected?1.14:1));dummy.updateMatrix();
      if(rec.type>=0){if(rec.special==='bomb'){dummy.scale.setScalar(.4*scale);dummy.updateMatrix();bombs.setMatrixAt(bombCount++,dummy.matrix);}else sweets[rec.type].setMatrixAt(counts[rec.type]++,dummy.matrix);}
      if(rec.ice){dummy.position.set(rec.x,.34,rec.z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();iceMesh.setMatrixAt(iceCount++,dummy.matrix);}
      if(rec.iceHits>1){dummy.position.set(rec.x,.48,rec.z);dummy.rotation.set(0,.08*(rec.i%3-1),0);dummy.scale.set(.82,.72,.82);dummy.updateMatrix();hardIceMesh.setMatrixAt(hardIceCount++,dummy.matrix);}
      if(rec.special&&rec.special!=='bomb'){
        for(let n=0;n<2;n++){const vertical=rec.special==='striped-v'||rec.special==='wrapped'&&n===1;const offset=rec.special==='wrapped'?0:(n-.5)*.22;dummy.position.set(x+(vertical?offset:0),y+.23,z+(vertical?0:offset));dummy.rotation.set(0,vertical?Math.PI/2:0,0);dummy.scale.setScalar(scale);dummy.updateMatrix();stripes.setMatrixAt(stripeCount++,dummy.matrix);}
      }
      if(selected||hint){halo.visible=true;halo.position.set(x,.26,z);}
    }
    sweets.forEach((m,i)=>{m.count=counts[i];m.instanceMatrix.needsUpdate=true;});
    for(const [m,n] of [[iceMesh,iceCount],[hardIceMesh,hardIceCount],[stripes,stripeCount],[bombs,bombCount]]){m.count=n;m.instanceMatrix.needsUpdate=true;}
    let particleCount=0;
    particles=particles.filter(p=>{
      const age=elapsed-p.born;if(age>=p.life)return false;
      const t=age/p.life,fade=1-t;
      dummy.position.set(p.x+p.vx*age,p.y+p.vy*age-2.1*age*age,p.z+p.vz*age);
      dummy.rotation.set(age*8,age*11,age*6);dummy.scale.setScalar(Math.max(.01,p.scale*fade));dummy.updateMatrix();
      particleMesh.setMatrixAt(particleCount++,dummy.matrix);return true;
    });
    particleMesh.count=particleCount;particleMesh.instanceMatrix.needsUpdate=true;if(particleCount)moving=true;
    if(cameraKick){const age=elapsed-cameraKick.born;if(age>=cameraKick.life)cameraKick=null;else{const fade=1-age/cameraKick.life,offset=Math.sin(age*95)*cameraKick.power*fade;camera.position.set(offset,18,16);camera.lookAt(0,0,0);camera.updateMatrixWorld();moving=true;}}
    if(!cameraKick&&camera.position.x!==0){camera.position.set(0,18,16);camera.lookAt(0,0,0);camera.updateMatrixWorld();}
    renderer.render(scene,camera);return moving;
  }
  function wake(){if(!raf&&!disposed&&!lost&&!document.hidden&&snapshot().active)raf=requestAnimationFrame(tick);}
  function tick(now){raf=0;const data=snapshot();if(!data.active||document.hidden||lost)return;
    const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
    if(!data.paused){elapsed+=dt;if(swapAnim)swapAnim.time+=dt;}
    const moving=draw();if(swapAnim&&swapAnim.time>=.17){const done=swapAnim;swapAnim=null;done.resolve();}if(!data.paused&&(moving||swapAnim))wake();else last=0;
  }
  window.Candy3D={sync,effect:addEffect,swap(a,b){return new Promise(resolve=>{swapAnim?.resolve();swapAnim={a,b,time:0,resolve};wake();});}};
  // Classes still carry animation/selection events from the existing game.
  const observer=new MutationObserver(wake);observer.observe(boardEl,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
  const visibilityObserver=new MutationObserver(()=>{last=0;resize();wake();});visibilityObserver.observe(screen,{attributes:true,attributeFilter:['class']});
  for(const overlay of document.querySelectorAll('.overlay'))visibilityObserver.observe(overlay,{attributes:true,attributeFilter:['class']});
  const resizer=new ResizeObserver(resize);resizer.observe(host);
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-.4),point=new THREE.Vector3();let down=null;
  const adjacent=(a,b)=>a>=0&&b>=0&&a<64&&b<64&&Math.abs(a%8-b%8)+Math.abs(Math.floor(a/8)-Math.floor(b/8))===1;
  function hit(e){const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);if(!raycaster.ray.intersectPlane(plane,point))return -1;const c=Math.round(point.x/1.04+3.5),row=Math.round(point.z/1.04+3.5);return row>=0&&row<8&&c>=0&&c<8?row*8+c:-1;}
  renderer.domElement.addEventListener('pointerdown',e=>{if(!e.isPrimary||snapshot().paused)return;down={i:hit(e),x:e.clientX,y:e.clientY,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId);});
  renderer.domElement.addEventListener('pointerup',e=>{if(!down||down.id!==e.pointerId)return;const a=down;down=null;const b=hit(e),dx=e.clientX-a.x,dy=e.clientY-a.y;renderer.domElement.releasePointerCapture(e.pointerId);if(adjacent(a.i,b)&&a.i!==b){bridge.swipe(a.i,b);return;}if(Math.hypot(dx,dy)>=15){const to=a.i+(Math.abs(dx)>Math.abs(dy)?(dx>0?1:-1):(dy>0?8:-8));if(adjacent(a.i,to))bridge.swipe(a.i,to);}else if(b>=0)bridge.select(b);});
  renderer.domElement.addEventListener('pointercancel',()=>down=null);renderer.domElement.addEventListener('lostpointercapture',()=>down=null);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;last=0;wake();});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;last=0;resize();wake();});
  window.addEventListener('pagehide',e=>{cancelAnimationFrame(raf);raf=0;if(e.persisted)return;disposed=true;observer.disconnect();themeObserver.disconnect();visibilityObserver.disconnect();resizer.disconnect();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());scene.traverse(o=>{if(o.isInstancedMesh)o.dispose();});environment.dispose();shadowTexture.dispose();renderer.dispose();});
  window.addEventListener('pageshow',()=>{last=0;wake();});
  document.documentElement.classList.add('game-3d');syncTheme();sync();
}
