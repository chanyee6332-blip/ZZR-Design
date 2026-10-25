(()=>{
 const root=document.querySelector('#intro'),plane=document.querySelector('.camera-plane'),box=document.querySelector('#camera-faces');
 const card=document.createElement('div');card.id='delivery-receipt';card.hidden=true;
 // Keep all printed artwork from the supplied transparent receipt. Only its
 // existing checkbox/label patch moves independently for the gentle prompt.
 const patch='M1050 763 L1226 838 L1200 900 L1024 825 Z';
 card.innerHTML=`<svg viewBox="0 0 2048 1152" aria-hidden="true"><defs><clipPath id="receipt-patch"><path d="${patch}"/></clipPath></defs><image href="assets/delivery-receipt.webp" width="2048" height="1152"/><path d="${patch}" fill="#f5f2ec"/><g id="receipt-prompt"><image href="assets/delivery-receipt.webp" width="2048" height="1152" clip-path="url(#receipt-patch)"/><g transform="translate(1068 808) rotate(23)"><g id="receipt-check"><path d="M-19 -1 L-5 13 L21 -17" fill="none" stroke="#f36c65" stroke-width="7.5" stroke-linecap="square" stroke-linejoin="miter"/></g></g></g></svg><button id="receipt-sign" type="button" role="checkbox" aria-label="确认已签收" aria-checked="false" disabled></button>`;
 plane.append(card);
 const button=card.querySelector('button'),tick=card.querySelector('#receipt-check');
 const status=document.createElement('p');status.className='receipt-status';status.setAttribute('role','status');root.append(status);
 const image=new Image();image.src='assets/delivery-receipt.webp';const ready=image.decode();ready.catch(()=>{});
 let epoch=0,state='hidden';const animations=new Set();
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const setState=value=>{state=value;card.dataset.state=value;root.dataset.receipt=value};
 async function animate(element,frames,options){const animation=element.animate(frames,{fill:'forwards',...options});animations.add(animation);try{await animation.finished;return true}catch{return false}finally{animations.delete(animation)}}
 function offscreen(){const scale=new DOMMatrix(getComputedStyle(plane).transform).a;return {x:root.clientWidth/scale+2048,y:root.clientHeight/scale+1152}}
 async function enter(){
  if(state!=='hidden')return;const id=++epoch;setState('loading');
  try{await ready}catch{setState('hidden');return}
  if(id!==epoch)return;
  setState('entering');card.hidden=false;const outside=offscreen();
  const complete=await animate(card,[
   {transform:`translate(${outside.x}px,${-outside.y}px)`,offset:0,easing:'cubic-bezier(.18,.85,.25,1)'},
   {transform:'translate(0,0)',offset:.72,easing:'ease-out'},
   {transform:'translate(0,20px)',offset:.85,easing:'ease-in-out'},
   {transform:'translate(0,-3px)',offset:.95,easing:'ease-out'},
   {transform:'translate(0,0)',offset:1}
  ],{duration:reduced()?1:1400});
  if(!complete||id!==epoch)return;
  setState('ready');button.disabled=false;status.textContent='请点击签单上的小框确认已签收';
 }
 async function sign(){
  if(state!=='ready')return;const id=epoch;setState('signing');button.disabled=true;button.setAttribute('aria-checked','true');status.textContent='已签收';
  const complete=await animate(tick,[
   {opacity:0,transform:'scale(0)',offset:0},
   {opacity:1,transform:'scale(1.3,.78)',offset:.35},
   {opacity:1,transform:'scale(.87,1.16)',offset:.58},
   {opacity:1,transform:'scale(1.07,.96)',offset:.78},
   {opacity:1,transform:'scale(1)',offset:.9},
   {opacity:1,transform:'scale(1)',offset:1}
  ],{duration:reduced()?1:850,easing:'ease-in-out'});
  if(!complete||id!==epoch)return;
  setState('leaving');const outside=offscreen();
  const result=await Promise.all([
   animate(card,[{transform:'translate(0,0)'},{transform:`translate(${outside.x}px,${-outside.y}px)`}],{duration:reduced()?1:1150,easing:'cubic-bezier(.55,0,.78,.35)'}),
   animate(box,[{transform:'translateY(0)'},{transform:`translateY(${outside.y}px)`}],{duration:reduced()?1:1350,easing:'cubic-bezier(.55,0,.78,.35)'})
  ]);
  if(id!==epoch||result.some(value=>!value))return;
  setState('done');card.hidden=true;box.hidden=true;root.setAttribute('aria-label','快递已签收');
  root.dispatchEvent(new CustomEvent('portfolio:delivery-complete'));
 }
 function reset(){++epoch;for(const animation of animations)animation.cancel();animations.clear();
  // Finished fill animations also need cancellation before another playthrough.
  for(const element of [card,tick,box])for(const animation of element.getAnimations())animation.cancel();
  card.hidden=true;button.disabled=true;button.setAttribute('aria-checked','false');status.textContent='';setState('hidden');root.setAttribute('aria-label','Jerry 的作品集首页');
 }
 button.addEventListener('click',sign);
 root.addEventListener('portfolio:camera-finished',enter);
 root.addEventListener('portfolio:camera-reset',reset);
})();
