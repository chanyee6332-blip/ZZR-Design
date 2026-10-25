(()=>{
 const root=document.querySelector('#intro');
 const view=document.createElement('section');view.id='showcase';view.hidden=true;view.setAttribute('aria-label','Jerry 的作品集开箱主页面');
 const items=[['about','个人简介 / About Me'],['brand','品牌设计 / Brand Design'],['practice','个人练习 / Personal Practice'],['poster','海报设计 / Poster Design'],['ip','IP 设计 / IP Design']];
 view.innerHTML=`<header class="showcase-title showcase-text" aria-label="Jerry’s Portfolio — 2026 / 20??"><div class="showcase-track"></div></header>
 <div class="showcase-stage"><div class="showcase-box"><img class="showcase-shell" src="assets/openbox-shell-v2.webp" alt="展开的快递箱" draggable="false">${items.map(([id,label])=>`<div class="showcase-item item-${id}" data-item="${id}" tabindex="0" role="img" aria-label="${label}"><div class="item-lift"><img class="item-float" src="assets/openbox-${id}-v2.webp" alt="" draggable="false"></div></div>`).join('')}</div></div>
 <div class="showcase-icons showcase-icons-left showcase-text" aria-hidden="true"><img src="assets/openbox-standing.webp" alt=""></div>
 <div class="showcase-icons showcase-icons-right showcase-text" aria-hidden="true"><img src="assets/openbox-running.webp" alt=""><img src="assets/openbox-walking.webp" alt=""></div>
 <div class="showcase-index showcase-text">Index / 001</div>
 <div class="travel-copy showcase-text"><div class="travel-heading"><span>I’m going</span><span>to</span><div class="city-window" aria-label="Beijing、Shenzhen、Hangzhou、Chengdu、？？？"><div class="city-strip" aria-hidden="true">${['Beijing','Shenzhen','Hangzhou','Chengdu','？？？','Beijing'].map(city=>`<span>${city}</span>`).join('')}</div></div></div><p class="travel-caption">I graduated from Sichuan University and completed my Master’s degree at Lanzhou University; I cherish this experience very much.</p></div>
 <p class="showcase-note showcase-text">I taught myself design; if I didn’t enjoy the subject, I doubt I’d be doing this. If you’ve read through all my ramblings, thank you</p>
 <div class="beijing-clock showcase-text"><time class="beijing-time" aria-label="中国北京时间"></time><span class="clock-caption">Time / China</span></div>
 <footer class="showcase-services showcase-text" aria-label="Brand Design, IP Design, Poster Design, ??? Design"><div class="showcase-track"></div></footer>`;
 root.append(view);
 const arrow='<svg class="showcase-arrow" viewBox="0 0 72 72" fill="none" aria-hidden="true"><circle cx="36" cy="36" r="33" stroke="currentColor" stroke-width="1.8"/><path d="M12 36h49M35 11l26 25-26 25" stroke="currentColor" stroke-width="1.8"/></svg>';
 const title='<span>JERRY’S PORTFOLIO</span>'+arrow+'<span>2026 / 20??</span>'+arrow;
 const services=['BRAND DESIGN','IP DESIGN','POSTER DESIGN','??? DESIGN'].map(s=>'<span>'+s+'</span><i class="showcase-dot"></i>').join('');
 for(const [selector,content]of [['.showcase-title',title],['.showcase-services',services]])view.querySelector(selector+' .showcase-track').innerHTML=[0,1].map(()=>'<div class="showcase-group" aria-hidden="true">'+content+content+'</div>').join('');
 const plane=view.querySelector('.showcase-stage'),box=view.querySelector('.showcase-box');
 const text=[...view.querySelectorAll('.showcase-text')];
 const ready=Promise.all([...view.querySelectorAll('img')].map(image=>image.decode()));ready.catch(()=>{});
 let epoch=0,state='hidden';const entryAnimations=new Set();const floatStates=new Map();
 const clock=view.querySelector('.beijing-time');
 const beijingTime=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
 let clockTimer;
 function updateClock(){
  clearTimeout(clockTimer);
  const now=new Date();clock.textContent=beijingTime.format(now);clock.dateTime=now.toISOString();
  // Re-read wall time every second so hidden tabs and clock corrections do not drift.
  if(!view.hidden)clockTimer=setTimeout(updateClock,1000-Date.now()%1000);
 }
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!view.hidden)updateClock()});
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function resize(){const width=innerWidth<=700?1600:2048;const scale=Math.min(root.clientWidth/width,root.clientHeight/1152);plane.style.transform=`translate(-50%,-50%) scale(${scale})`}
 resize();window.addEventListener('resize',resize);
 async function enter(){
  if(state!=='hidden')return;const id=++epoch;state='loading';
  try{await ready}catch{state='hidden';return}
  if(id!==epoch)return;
  state='entering';view.dataset.state=state;root.dataset.showcase=state;view.hidden=false;resize();
  updateClock();
  const scale=new DOMMatrix(getComputedStyle(plane).transform).a;
  const duration=reduced()?1:1550;
  const animations=[box.animate([{transform:`translateY(${-root.clientHeight/scale-1152}px)`},{transform:'translateY(0)'}],{duration,easing:'cubic-bezier(.18,.85,.2,1)',fill:'forwards'}),
   ...text.map(element=>element.animate([{opacity:0,filter:'blur(7px)'},{opacity:.35,filter:'blur(2px)',offset:.38},{opacity:1,filter:'blur(0)'}],{duration,easing:'ease-out',fill:'forwards'}))];
  animations.forEach(animation=>entryAnimations.add(animation));
  try{await Promise.all(animations.map(animation=>animation.finished))}catch{return}
  if(id!==epoch)return;
  // Commit clean resting styles rather than retaining entry transforms.
  animations.forEach(animation=>{animation.cancel();entryAnimations.delete(animation)});
  state='ready';view.dataset.state=state;root.dataset.showcase=state;root.setAttribute('aria-label','Jerry 的作品集开箱主页面');
 }
 function updateItem(item){
  const record=floatStates.get(item),active=record.hovered||record.focused;
  if(active===record.active)return;record.active=active;item.dataset.raised=String(active);
  const image=item.querySelector('.item-float'),current=getComputedStyle(image).transform;
  record.animation?.cancel();record.returnAnimation?.cancel();clearTimeout(record.timer);
  if(active){
   if(reduced())return;
   // First lift the object, then bob its artwork without moving the hit area.
   record.returnAnimation=image.animate([{transform:current},{transform:'translateY(0)'}],{duration:300,fill:'forwards'});
   record.timer=setTimeout(()=>{
    if(!record.active||view.hidden||reduced())return;
    record.returnAnimation?.cancel();
    record.animation=image.animate([{transform:'translateY(0)'},{transform:'translateY(-7px)'},{transform:'translateY(2px)'},{transform:'translateY(0)'}],{duration:2400,easing:'ease-in-out',iterations:Infinity});
   },420);
  }else{
   const animation=image.animate([{transform:current},{transform:'translateY(0)'}],{duration:reduced()?1:350,easing:'ease-out',fill:'forwards'});
   record.returnAnimation=animation;
   animation.finished.then(()=>{if(record.returnAnimation===animation&&!record.active){animation.cancel();record.returnAnimation=null}}).catch(()=>{});
  }
 }
 for(const item of view.querySelectorAll('.showcase-item')){
  const record={hovered:false,focused:false,active:false,timer:null,animation:null,returnAnimation:null};floatStates.set(item,record);
  item.addEventListener('pointerenter',event=>{if(event.pointerType!=='mouse'||state!=='ready')return;record.hovered=true;updateItem(item)});
  item.addEventListener('pointerleave',()=>{record.hovered=false;updateItem(item)});
  item.addEventListener('focus',()=>{if(state!=='ready')return;record.focused=item.matches(':focus-visible');updateItem(item)});
  item.addEventListener('blur',()=>{record.focused=false;updateItem(item)});
 }
 function reset(){
  ++epoch;state='hidden';view.hidden=true;delete root.dataset.showcase;view.dataset.state='hidden';
  clearTimeout(clockTimer);
  for(const animation of entryAnimations)animation.cancel();entryAnimations.clear();
  for(const[item,record]of floatStates){clearTimeout(record.timer);record.animation?.cancel();record.returnAnimation?.cancel();record.hovered=record.focused=record.active=false;item.dataset.raised='false'}
 }
 async function openPractice(category='practice'){
  if(state!=='ready')return;const id=++epoch;state='leaving';view.dataset.state=state;root.dataset.showcase=state;
  const scale=new DOMMatrix(getComputedStyle(plane).transform).a,duration=reduced()?1:1050;
  const moves=[box.animate([{transform:'translateY(0)'},{transform:'translateY('+ (root.clientHeight/scale+1152)+'px)'}],{duration,easing:'cubic-bezier(.55,0,.8,.35)',fill:'forwards'}),...text.map(el=>el.animate([{opacity:1},{opacity:0}],{duration:reduced()?1:800,easing:'ease-in-out',fill:'forwards'}))];moves.forEach(a=>entryAnimations.add(a));
  try{await Promise.all(moves.map(a=>a.finished))}catch{return}if(id!==epoch)return;view.hidden=true;clearTimeout(clockTimer);state='practice';view.dataset.state=state;root.dataset.showcase=state;root.dispatchEvent(new CustomEvent(category==='about'?'portfolio:about-enter':'portfolio:practice-enter',{detail:{category}}));
 }
 const about=view.querySelector('.item-about');about.setAttribute('role','button');about.setAttribute('aria-label','打开个人简介');about.addEventListener('click',()=>openPractice('about'));about.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPractice('about')}});
 const practice=view.querySelector('.item-practice');practice.setAttribute('role','button');practice.setAttribute('aria-label','打开个人练习作品');practice.addEventListener('click',()=>openPractice('practice'));practice.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPractice()}});
 const brand=view.querySelector('.item-brand');brand.setAttribute('role','button');brand.setAttribute('aria-label','打开品牌设计作品');brand.addEventListener('click',()=>openPractice('brand'));brand.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPractice('brand')}});
 const poster=view.querySelector('.item-poster');poster.setAttribute('role','button');poster.setAttribute('aria-label','打开海报设计作品');poster.addEventListener('click',()=>openPractice('poster'));poster.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPractice('poster')}});
 const ip=view.querySelector('.item-ip');ip.setAttribute('role','button');ip.setAttribute('aria-label','打开IP设计作品');ip.addEventListener('click',()=>openPractice('ip'));ip.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPractice('ip')}});
 root.addEventListener('portfolio:practice-back',()=>{reset();enter()});
 root.addEventListener('portfolio:delivery-complete',enter);
 root.addEventListener('portfolio:camera-reset',reset);
})();
