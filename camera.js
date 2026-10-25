/* Connected, textured box. Continuous perspective geometry, never frame dissolves. */
(()=>{
const root=document.querySelector('#intro'),plane=document.querySelector('.camera-plane'),reference=document.querySelector('#camera-reference'),stage=document.querySelector('#camera-faces'),trigger=document.querySelector('#parcel-trigger');
const urls=['assets/camera-start-web.jpg','assets/camera-middle-web.jpg','assets/camera-end-web.jpg'];
// Shared vertices: top back-left, back-right, front-right, front-left,
// bottom front-left, front-right, back-right. Faces share their actual edges.
const keys=[[[785,346],[1457,462],[1310,674],[595,535],[600,741],[1307,889],[1449,675]],[[634,269],[1437,269],[1566,681],[503,681],[538,919],[1531,919],[1437,507]],[[344,224],[1745,224],[1745,1013],[344,1013],[344,1013],[1745,1013],[1745,224]]];
const surfaces=[{texture:0,vertices:[1,6,5,2],source:[keys[0][1],keys[0][6],keys[0][5],keys[0][2]]},{texture:1,vertices:[3,2,5,4],source:[keys[1][3],keys[1][2],keys[1][5],keys[1][4]]},{texture:2,vertices:[0,1,2,3],source:keys[2].slice(0,4)}];
let state='idle',runId=0,raf=0,initialScale=1;
const duration=4200,canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1152;canvas.style.cssText='position:absolute;inset:0;width:2048px;height:1152px;pointer-events:none';stage.replaceChildren(canvas);stage.hidden=true;
const gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:true});
function resize(){plane.style.transform=`translate(-50%,-50%) scale(${Math.min(root.clientWidth/2048,root.clientHeight/1152)})`}resize();window.addEventListener('resize',resize);
if(!gl){trigger.title='当前浏览器未启用 WebGL，请启用硬件加速后重试';return}
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 point; varying vec2 screen; void main(){screen=point;gl_Position=vec4(point.x/1024.0-1.0,1.0-point.y/576.0,0.0,1.0);}'));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision highp float; varying vec2 screen; uniform mat3 mapping; uniform mat3 initialMapping; uniform sampler2D photo; uniform sampler2D initialPhoto; uniform float textureBlend; uniform float opacity; void main(){vec3 p=mapping*vec3(screen,1.0);vec3 q=initialMapping*vec3(screen,1.0);vec2 uv=p.xy/p.z/vec2(2048.0,1152.0);vec2 initialUV=q.xy/q.z/vec2(2048.0,1152.0);gl_FragColor=vec4(mix(texture2D(initialPhoto,initialUV).rgb,texture2D(photo,uv).rgb,textureBlend),opacity);}'));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);const point=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(point);gl.vertexAttribPointer(point,2,gl.FLOAT,false,0,0);const mapping=gl.getUniformLocation(program,'mapping'),initialMapping=gl.getUniformLocation(program,'initialMapping'),textureBlend=gl.getUniformLocation(program,'textureBlend'),opacity=gl.getUniformLocation(program,'opacity');gl.uniform1i(gl.getUniformLocation(program,'photo'),0);gl.uniform1i(gl.getUniformLocation(program,'initialPhoto'),1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(1,1,1,1);
const textures=[];
const ready=Promise.all(window.PORTFOLIO_CAMERA_TEXTURES.map((src,i)=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{try{const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);textures[i]=texture;resolve()}catch(e){reject(e)}};image.onerror=reject;image.src=src})));ready.catch(()=>{trigger.title='贴图加载失败，请刷新页面'});
function homography(from,to){const a=[],b=[];from.forEach(([x,y],i)=>{const [u,v]=to[i];a.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);a.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)});for(let k=0;k<8;k++){let pivot=k;for(let j=k+1;j<8;j++)if(Math.abs(a[j][k])>Math.abs(a[pivot][k]))pivot=j;[a[k],a[pivot]]=[a[pivot],a[k]];[b[k],b[pivot]]=[b[pivot],b[k]];const d=a[k][k];if(Math.abs(d)<1e-9)return null;for(let n=k;n<8;n++)a[k][n]/=d;b[k]/=d;for(let j=0;j<8;j++){if(j===k)continue;const f=a[j][k];for(let n=k;n<8;n++)a[j][n]-=f*a[k][n];b[j]-=f*b[k]}}return b}
function face(texture,dest,source,alpha=1,initialSource=source,blend=1,initialTexture=0){const area=Math.abs(dest.reduce((s,p,i)=>{const q=dest[(i+1)%4];return s+p[0]*q[1]-q[0]*p[1]},0))/2;if(area<1)return;const h=homography(dest,source);if(!h)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[texture]);const startH=homography(dest,initialSource)||h;gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,textures[initialTexture]);gl.uniformMatrix3fv(initialMapping,false,new Float32Array([startH[0],startH[3],startH[6],startH[1],startH[4],startH[7],startH[2],startH[5],1]));gl.uniform1f(textureBlend,blend);gl.uniformMatrix3fv(mapping,false,new Float32Array([h[0],h[3],h[6],h[1],h[4],h[7],h[2],h[5],1]));gl.uniform1f(opacity,alpha);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([dest[0],dest[1],dest[2],dest[0],dest[2],dest[3]].flat()),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,6)}
const smooth=t=>t*t*(3-2*t);
function geometry(p){const segment=p<=.5?0:1,t=segment===0?p*2:(p-.5)*2;return keys[segment].map((v,i)=>v.map((a,j)=>{const b=keys[segment+1][i][j],m=(keys[2][i][j]-keys[0][i][j])/2;return (2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*(segment===0?0:m)+(-2*t*t*t+3*t*t)*b+(t*t*t-t*t)*(segment===0?m:0)}))}
function draw(p){gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT);const vertices=geometry(p);if(p<.5){const shadow=[[1454,622],[1558,648],[1454,860],[1303,889]];face(0,shadow,shadow,1-p*2)}// Reproject both adjacent photographs onto the same moving face.
// This preserves the artwork while blending only viewpoint-dependent lighting.
const segment=p<=.5?0:1, blend=smooth(segment===0?p*2:(p-.5)*2);
for(const s of surfaces){
 const dest=s.vertices.map(i=>vertices[i]);
 const from=s.vertices.map(i=>keys[segment][i]);
 const to=s.vertices.map(i=>keys[segment+1][i]);
 // The right side is fully occluded in the middle and final views.
 if(s.texture===0){face(0,dest,s.source);continue}
 // The front collapses at the final overhead view; retain its last visible texture.
 if(segment===1&&s.texture===1){face(1,dest,s.vertices.map(i=>keys[1][i]));continue}
 face(segment+1,dest,to,1,from,blend,segment);
}
reference.style.opacity=0;stage.style.transformOrigin='50% 54%';stage.style.transform=`scale(${1+(initialScale-1)*(1-smooth(Math.min(1,p/.3)))})`;root.style.setProperty('--camera-ui-opacity',1-smooth(Math.min(1,p/.82)))}
function finish(){
 // Keep the already-loaded final texture on the same canvas. Replacing the
 // hidden reference image and exposing it in this frame can paint its old
 // first-frame bitmap while the new source is still being decoded.
 const fullFrame=[[0,0],[2048,0],[2048,1152],[0,1152]];
 gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT);
 face(2,fullFrame,fullFrame);
 stage.style.transform='scale(1)';stage.hidden=false;reference.style.opacity=0;
 state='finished';root.dataset.camera='finished';trigger.hidden=true;
 root.style.setProperty('--camera-ui-opacity',0);root.setAttribute('aria-label','作品集箱子俯视图');
 root.dispatchEvent(new CustomEvent('portfolio:camera-finished'));
}
async function play(){if(state!=='idle')return;const id=++runId;state='loading';initialScale=new DOMMatrix(getComputedStyle(reference).transform).a;trigger.disabled=true;try{await ready}catch{state='idle';trigger.disabled=false;return}if(id!==runId)return;state='playing';root.dataset.camera='playing';trigger.hidden=true;stage.hidden=false;if(matchMedia('(prefers-reduced-motion: reduce)').matches){finish();return}let elapsed=0,last=performance.now();draw(0);function tick(now){if(id!==runId)return;const delta=now-last;last=now;if(!document.hidden)elapsed+=Math.min(delta,50);const t=Math.min(elapsed/duration,1);draw(smooth(t));if(t<1)raf=requestAnimationFrame(tick);else finish()}raf=requestAnimationFrame(tick)}
trigger.addEventListener('click',play);window.addEventListener('keydown',e=>{if(e.key!=='Escape'||state==='idle'||root.hidden)return;++runId;cancelAnimationFrame(raf);state='idle';delete root.dataset.camera;stage.hidden=true;reference.src=urls[0];reference.style.opacity=1;trigger.hidden=false;trigger.disabled=false;root.style.setProperty('--camera-ui-opacity',1);root.dispatchEvent(new CustomEvent('portfolio:camera-reset'));trigger.focus()});
})();

