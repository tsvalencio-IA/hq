/* Universo thIAguinho — ações visíveis no mundo 3D.
 * Acrescenta atuação corporal aos desafios existentes sem alterar respostas,
 * placar, localStorage, conquistas, busca de brinquedos ou oficina da bateria.
 */
(()=>{
'use strict';
const actionNames={
 garage:['Medir bateria e alternador','Comparar tensões no veículo','Testar cabos e aterramentos','Limpar conexão e retestar'],
 code:['Conferir registros e exclusões','Calcular valores no computador','Corrigir a tela para celular','Executar os testes do sistema']
};
const correct={garage:[1,0,1,0],code:[1,2,0,1]};
const actionPrograms={
 garage:['garage:meter','garage:compare','garage:ground','garage:clean'],
 code:['code:review','code:calculate','code:responsive','code:tests']
};
const centers={garage:{x:29.05,z:-18.55,face:Math.PI,focus:[29.55,1.65,-19.4]},
 code:{x:-45.35,z:-19.15,face:Math.PI,focus:[-45.35,1.7,-19.72]}};
const duration=4.5;
let scene=null,pickup=null,checkpoint=null,greeting=0,shots=0;
const label=document.createElement('div');
label.id='action3dLabel';
label.setAttribute('aria-live','polite');
document.getElementById('game').appendChild(label);
const clamp01=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp01(n);return n*n*(3-2*n)};
const interpolate=(a,b,p)=>a+(b-a)*p;
const batteryOn=()=>!!(window.__THIA_BATTERY_TEST&&window.__THIA_BATTERY_TEST.isActive());
const cameraControls=document.createElement('div');
cameraControls.id='actionCameraControls';
cameraControls.setAttribute('aria-label','Câmera livre durante ações 3D');
cameraControls.innerHTML=`<strong>CÂMERA 360°</strong><small>Arraste a cena ou use os botões</small><div class="actionCameraGrid">
<button type="button" data-camera="left" aria-label="Girar câmera à esquerda">↶</button>
<button type="button" data-camera="right" aria-label="Girar câmera à direita">↷</button>
<button type="button" data-camera="up" aria-label="Levantar câmera">↑</button>
<button type="button" data-camera="down" aria-label="Abaixar câmera">↓</button>
<button type="button" data-camera="in" aria-label="Aproximar câmera">＋</button>
<button type="button" data-camera="out" aria-label="Afastar câmera">－</button>
</div><button type="button" class="cameraHome" data-camera="reset">Enquadrar</button>`;
document.getElementById('game').appendChild(cameraControls);
const cameraDefault={yaw:1.50,pitch:.34,dist:6.9};
cameraControls.addEventListener('click',event=>{
 const control=event.target.closest('button[data-camera]');if(!control||!(scene||batteryOn()))return;
 switch(control.dataset.camera){
  case 'left':camera.yaw-=.32;break;
  case 'right':camera.yaw+=.32;break;
  case 'up':camera.pitch=Math.min(1.30,camera.pitch+.14);break;
  case 'down':camera.pitch=Math.max(.08,camera.pitch-.14);break;
  case 'in':camera.dist=Math.max(4.3,camera.dist-1.25);break;
  case 'out':camera.dist=Math.min(25,camera.dist+1.25);break;
  case 'reset':Object.assign(camera,batteryOn()?{yaw:1.48,pitch:.35,dist:7.2}:cameraDefault);break;
 }
});
const playback=document.createElement('div');
playback.id='actionPlaybackControls';
playback.innerHTML=`<span id="actionPlaybackHint">Acompanhe a ação por todos os ângulos</span><div>
<button type="button" id="actionReplay" aria-label="Repetir animação">↻ Repetir</button>
<button type="button" id="actionPause" aria-label="Pausar animação">Ⅱ Pausar</button>
<button type="button" id="actionContinue" aria-label="Concluir observação e continuar tarefa" disabled>Continuar ›</button>
</div>`;
document.getElementById('game').appendChild(playback);
function updatePlayback(){
 if(!scene)return;
 const running=scene.phase==='running',done=scene.phase==='done';
 document.getElementById('actionPause').textContent=running?'Ⅱ Pausar':done?'✓ Concluída':'▶ Assistir';
 document.getElementById('actionPause').disabled=done;
 document.getElementById('actionContinue').disabled=!done;
 document.getElementById('actionPlaybackHint').textContent=done?'Gire ou aproxime a câmera; avance quando quiser.':running?'Gire a câmera enquanto o personagem trabalha.':'Animação pausada: observe de qualquer ângulo.';
}
document.getElementById('actionPause').onclick=()=>{
 if(!scene||scene.phase==='done')return;
 scene.phase=scene.phase==='running'?'paused':'running';
 if(scene.phase==='running')scene.startedWall=performance.now()-scene.elapsed*1000;
 updatePlayback();
};
document.getElementById('actionReplay').onclick=()=>{
 if(!scene)return;
 scene.elapsed=0;scene.phase='running';scene.startedWall=performance.now();updatePlayback();
};
document.getElementById('actionContinue').onclick=()=>{
 if(scene?.phase==='done')finish(true);
};
function actionContext(){
 const title=document.getElementById('dialogTitle').textContent;
 const kicker=document.getElementById('dialogKicker').textContent;
 const mode=title.includes('Oficina — Diagnóstico')?'garage':title.includes('Laboratório thIAguinho')?'code':null;
 if(!mode)return null;
 const m=kicker.match(/(\d+)\s*(?:DE|\/)\s*4/);
 if(!m)return null;
 const step=Number(m[1])-1;
 return step>=0&&step<4?{mode,step}:null;
}
function begin(context,choice,callback){
 if(scene||batteryOn())return false;
 const area=centers[context.mode],from={x:player.x,z:player.z,heading:player.heading},
 companion={x:partner.x,z:partner.z,heading:partner.heading,moving:partner.moving},
 cameraBefore={yaw:camera.yaw,pitch:camera.pitch,dist:camera.dist};
 // Walk into the actual world work area, and preserve the user's position
 // when each stage finishes. No game-progress state is changed here.
 player.x=area.x-1.6;player.z=area.z+1.5;player.heading=area.face;
 partner.x=area.x+1.2;partner.z=area.z+1.1;partner.heading=area.face;
 scene={...context,choice,poseKey:actionPrograms[context.mode][context.step],correct:choice===correct[context.mode][context.step],
 elapsed:0,phase:'running',from,companion,cameraBefore,area,callback,startedAt:state.time,startedWall:performance.now()};
 Object.assign(camera,cameraDefault);
 label.textContent=actionNames[context.mode][context.step];
 document.body.classList.add('visual-action-mode');
 updatePlayback();
 shots++;
 return true;
}
function finish(execute){
 const completed=scene;
 if(!completed)return;
 scene=null;label.style.display='none';
 document.body.classList.remove('visual-action-mode');
 Object.assign(player,completed.from);
 Object.assign(partner,completed.companion);
 Object.assign(camera,completed.cameraBefore);
 if(execute&&typeof completed.callback==='function')completed.callback();
}
document.getElementById('dialogActions').addEventListener('click',ev=>{
 const button=ev.target.closest('button.choice');
 if(!button)return;
 if(scene){ev.preventDefault();ev.stopImmediatePropagation();return}
 if(batteryOn())return;
 const context=actionContext();
 if(!context)return;
 const choices=[...document.getElementById('dialogActions').querySelectorAll('button.choice')];
 const choice=choices.indexOf(button);
 if(choice<0)return;
 const original=button.onclick;
 if(typeof original!=='function')return;
 ev.preventDefault();ev.stopImmediatePropagation();
 button.disabled=true;
 begin(context,choice,()=>{
  button.disabled=false;
  original.call(button);
 });
},true);
document.getElementById('closeDialog').addEventListener('click',()=>finish(false),true);
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&scene)finish(false)},true);
const normalStep=gameStep;
gameStep=function(dt){
 normalStep(dt);
 if(scene){
  if(scene.phase==='running'){
   scene.elapsed=Math.min(duration,Math.max(scene.elapsed+dt,(performance.now()-scene.startedWall)/1000));
   if(scene.elapsed>=duration){scene.phase='done';updatePlayback()}
  }
  const progress=clamp01(scene.elapsed/duration),approach=smooth(progress/.33);
  player.x=interpolate(scene.area.x-1.6,scene.area.x,approach);
  player.z=interpolate(scene.area.z+1.5,scene.area.z,approach);
  player.heading=scene.area.face;
  partner.x=scene.area.x+1.2;partner.z=scene.area.z+1.1;
  const near=progress>.3;
  if(near){partner.heading=scene.area.face;partner.moving=0}
 }
 if(pickup){pickup.life=Math.max(0,pickup.life-dt);if(!pickup.life)pickup=null}
 if(checkpoint){checkpoint.life=Math.max(0,checkpoint.life-dt);if(!checkpoint.life)checkpoint=null}
 greeting=Math.max(0,greeting-dt);
};
const normalView=renderSkyAndView;
renderSkyAndView=function(){
 if(!scene)return normalView();
 const target=scene.area.focus,w=canvas.clientWidth,h=canvas.clientHeight;
 // Orbit around the acting character and its workbench at any horizontal angle,
 // with independent vertical elevation and zoom (touch gestures or buttons).
 const dist=Math.max(4.3,Math.min(25,camera.dist)),pitch=Math.max(.08,Math.min(1.30,camera.pitch));
 const eye=[target[0]+Math.sin(camera.yaw)*Math.cos(pitch)*dist,
            target[1]+Math.sin(pitch)*dist,
            target[2]+Math.cos(camera.yaw)*Math.cos(pitch)*dist];
 camera.eye=eye;camera.target=target;E.focus=target;
 camera.vp=M.mul(M.perspective(PI/3.0,w/Math.max(h,1),.1,240),M.lookAt(eye,target));
 E.begin(camera.vp,eye);
};
// Physical wrist targets for the exact part or input being operated.
// Index 0 = rig left, index 1 = rig right (not generic arm waving).
function contactTargets(s){
 const p=clamp01((s.elapsed/duration-.17)/.83),v=smooth(p),
       pulse=Math.sin(s.elapsed*11),work=s.mode==='garage';
 if(work){
  switch(s.step){
   case 0:return [[29.43,1.57,-19.14],[28.85,1.48,-19.03]];
   case 1:return [[29.44,1.56,-19.12],[28.91,1.52,-19.00]];
   case 2:return [[29.48,1.56,-19.14],[28.88,1.55,-19.10]];
   case 3:return [[29.43,1.55,-19.13],[29.00+.065*pulse*v,1.55,-19.12]];
  }
 }
 switch(s.step){
  case 0:return [[-45.13,1.55,-19.74],[-45.55,1.43,-19.69]];
  case 1:return [[-45.14,1.31+.020*pulse,-19.66],[-45.54,1.31-.018*pulse,-19.65]];
  case 2:return [[-44.99,1.53,-19.65],[-45.26,1.47+.05*pulse,-19.66]];
  default:return [[-45.19,1.31,-19.66],[-45.53,1.52,-19.78]];
 }
}
const normalPerson=person;
person=function(id,x,z,heading,move=0,run=false,jump=0,t=0,throwing=0){
 if(batteryOn())return normalPerson(id,x,z,heading,move,run,jump,t,throwing);
 if(scene){
  if(id!==state.avatar)return normalPerson(id,x,z,heading,0,false,0,t,0);
  const walking=scene.elapsed<duration*.17;
  const acting=scene.elapsed>duration*.17;
  const phase=clamp01((scene.elapsed/duration-.17)/.83);
  const hands=acting?contactTargets(scene):null;
   scene.targets=hands;
   const pose=acting?{kind:scene.poseKey,progress:phase,hands}:null;
  return mascotStudio.drawHuman(id,x,z,heading,walking?1:0,false,0,
    acting?scene.elapsed*2:t,0,0,0,pose);
 }
 if(id===state.avatar&&pickup){
  return mascotStudio.drawHuman(id,x,z,heading,move,run,jump,t,throwing,0,0,'pickup');
 }
 if(id===state.avatar&&greeting>0){
  return mascotStudio.drawHuman(id,x,z,heading,move,run,jump,t,throwing,greeting,0,'greet');
 }
 return normalPerson(id,x,z,heading,move,run,jump,t,throwing);
};
const box=(x,y,z,sx,sy,sz,col)=>E.draw('box',M.tr(x,y,z,sx,sy,sz),col);
const sphere=(x,y,z,s,col)=>E.draw('sphere',M.tr(x,y,z,s,s,s),col);
const rod=(x,y,z,sx,sy,sz,col)=>E.draw('cyl',M.tr(x,y,z,sx,sy,sz),col);
function toyMesh(kind,x,y,z,k=1){
 const m=M.tr(x,y,z);
 if(kind==='ball'){
  E.draw('sphere',M.mul(m,M.s(.18*k,.18*k,.18*k)),'#ffc355');
  E.draw('torus',M.mul(m,M.s(.17*k,.17*k,.044*k)),'#2f90da');
 }else if(kind==='disk'){
  E.draw('cyl',M.mul(m,M.s(.25*k,.045*k,.25*k)),'#f66a91');
 }else{
  E.draw('box',M.mul(m,M.s(.20*k,.068*k,.075*k)),'#f9e4c4');
  for(const side of [-1,1])E.draw('sphere',M.mul(m,M.mul(M.t(side*.20*k,0,0),M.s(.088*k,.09*k,.09*k))),'#f9e4c4');
 }
}
// Stage props are drawn at the same world positions used by wrist IK.
function stageProps(s,t){
 const p=clamp01((s.elapsed/duration-.17)/.83),done=smooth(p),
       success=s.correct?'#65eab6':'#f2b56b';
 const hands=mascotStudio.snapshot[state.avatar]?.hands||s.targets||contactTargets(s);
 const [left,right]=hands;
 const cube=(x,y,z,sx,sy,sz,color)=>E.draw('box',M.tr(x,y,z,sx,sy,sz),color);
 const orb=(x,y,z,r,color)=>E.draw('sphere',M.tr(x,y,z,r,r,r),color);
 const join=(a,b,r,color)=>{
   const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
   const d=Math.hypot(dx,dy,dz)||.001;
   const yaw=Math.atan2(dx,dz),pitch=Math.atan2(Math.hypot(dx,dz),dy);
   E.draw('cyl',M.mul(M.tr((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),
     M.mul(M.ry(yaw),M.mul(M.rx(pitch),M.s(r,d/2,r)))),color);
 };
 if(s.mode==='garage'){
   // Contactable engine tray with stable poles close enough for the rig.
   cube(29.30,1.31,-19.09,.67,.08,.35,'#536574');
   cube(29.40,1.42,-19.18,.26,.12,.18,'#39434f');
   orb(29.46,1.56,-19.15,.063,'#ee635d');
   orb(29.16,1.56,-19.15,.063,'#293649');
   if(s.step===0){
     // Multimeter stays attached to right palm; left wrist presses a red probe.
     cube(right[0],right[1],right[2],.20,.14,.07,'#255b86');
     cube(right[0],right[1]+.025,right[2]+.075,.16,.035,.014,done>.56?success:'#a5cee0');
     join(right,left,.014,'#e86356');
     join(left,[left[0],left[1]-.065,left[2]-.07],.018,'#d63d41');
     for(let i=0;i<4;i++)cube(right[0]-.07+i*.048,right[1]+.04,right[2]+.086,.019,.009,.006,i/4<done?success:'#40546c');
   }else if(s.step===1){
     // Mechanic operates a selector on the first instrument and
     // points at two distinct measurement screens; both readings respond.
     for(let k=0;k<2;k++){
       const x=29.40-k*.50;
       cube(x,1.53,-19.10,.18,.13,.10,k?'#345875':'#255270');
       cube(x,1.57,-18.982,.145,.06,.008,k===0?'#9de4ee':done>.5?success:'#e7c279');
       for(let j=0;j<3;j++)cube(x-.06+j*.05,1.58,-18.968,.017,.009,.005,j<Math.floor(done*4)?'#6fefbd':'#35556e');
     }
     E.draw('cyl',M.mul(M.t(left[0],left[1]-.02,left[2]),M.s(.078,.024,.078)),'#f0c472');
     orb(right[0],right[1],right[2],.045,'#8fd1e9');
   }else if(s.step===2){
     // Two probes genuinely terminate at positive and chassis-ground points.
     cube(28.91,1.38,-19.00,.16,.12,.08,'#285577');
     join([28.90,1.46,-19.00],left,.014,'#ec6d67');
     join([28.99,1.46,-19.00],right,.014,'#273645');
     join(left,[left[0],left[1]-.06,left[2]-.06],.019,'#ef5853');
     join(right,[right[0],right[1]-.06,right[2]-.07],.019,'#273342');
     orb(28.99,1.50,-19.12,.068,'#b4c5cb');
     for(let i=0;i<5;i++)if(i/5<done)orb(29.05+i*.10,1.78,-19.08,.025,success);
   }else{
     // Wire-brush handle is gripped by the actual right palm. Rust clears
     // under its moving bristles while the left hand steadies the terminal.
     const tip=[right[0]+.09,right[1]-.025,right[2]-.02];
     join(right,tip,.030,'#b8884a');
     cube(tip[0],tip[1],tip[2],.085,.04,.045,'#bfc9cb');
     for(let i=0;i<5;i++)join([tip[0]-.03+i*.016,tip[1]-.028,tip[2]],
       [tip[0]-.03+i*.016,tip[1]-.06,tip[2]],.007,'#e4cfa4');
     cube(29.21,1.55,-19.15,.105,.035,.10,done>.65?'#75edb0':'#af753f');
     for(let i=0;i<8;i++)if(done<i/8)orb(29.14+(i%4)*.033,1.63+Math.floor(i/4)*.05,-19.15,.016,'#9c6634');
   }
 }else{
   // Desktop is at reachable hand height, not waist-high below the wrists.
   cube(-45.35,1.20,-19.77,.68,.045,.39,'#8e775d');
   cube(-45.35,1.62,-19.98,.72,.43,.055,'#263e51');
   cube(-45.35,1.62,-19.913,.65,.37,.008,'#163b4e');
   if(s.step===0){
     // Index finger selects files on monitor; right hand takes a document.
     for(let i=0;i<4;i++){
       const x=-45.57+(i%2)*.28,y=1.71-Math.floor(i/2)*.16;
       cube(x,y,-19.901,.091,.047,.006,i<Math.round(done*4)?success:'#80a9cc');
       cube(x-.03,y,-19.890,.032,.010,.003,'#e4f4f1');
     }
     cube(right[0],right[1]-.035,right[2],.14,.012,.11,'#f3e8d4');
     cube(right[0],right[1]-.020,right[2]+.005,.12,.006,.10,'#d5e3e2');
     orb(left[0],left[1],left[2],.024,'#bcecf5');
   }else if(s.step===1){
     // The keys actually being touched follow both fingertips.
     cube(-45.35,1.29,-19.64,.54,.032,.20,'#243c50');
     for(let i=0;i<6;i++)for(let j=0;j<3;j++){
       const x=-45.58+i*.09,z=-19.70+j*.06;
       cube(x,1.315,z,.035,.008,.023,Math.sin(t*9+i+j)> .68?'#fae59a':'#a9d7db');
     }
     orb(left[0],left[1]-.018,left[2],.022,'#f5d98b');
     orb(right[0],right[1]-.018,right[2],.022,'#f5d98b');
     for(let i=0;i<4;i++)cube(-45.58+i*.17,1.72,-19.90,.065,.014,.006,i/4<done?success:'#82c2e2');
   }else if(s.step===2){
     // Phone is held in the left palm and rotates around that contact.
     const angle=-done*Math.PI*.48,pos=M.t(left[0],left[1],left[2]);
     E.draw('box',M.mul(pos,M.mul(M.rz(angle),M.s(.12,.22,.032))),'#25364e');
     E.draw('box',M.mul(M.t(left[0],left[1],left[2]+.039),
       M.mul(M.rz(angle),M.s(.102,.19,.008))),success);
     orb(right[0],right[1],right[2],.022,'#fff1b4');
     for(let i=0;i<4;i++)cube(-45.58+(done>.55?i*.14:(i%2)*.29),
       1.67-(done>.55?0:Math.floor(i/2)*.115),-19.900,.065,.033,.006,'#b4deee');
   }else{
     // Right finger initiates the test on the monitor, left finger taps Run.
     cube(-45.22,1.30,-19.64,.085,.017,.057,done>.28?success:'#e0b774');
     for(let i=0;i<5;i++){
       cube(-45.53,1.72-i*.07,-19.899,.17,.013,.006,'#9ad8e8');
       orb(-45.26,1.72-i*.07,-19.88,.020,done>(i+1)/5?success:'#f1b669');
     }
     orb(right[0],right[1],right[2],.023,'#f5d78e');
   }
 }
}
function missionObjects(s,t){
 // No fixed imitation hands/tools; dynamic props are drawn by stageProps
 // from the same measured wrist positions as the articulated mascot.
 const at=s.area.focus;
 const point=M.project(camera.vp,[at[0],2.45,at[2]],E.width,E.height);
 if(point){
   label.style.display='block';
   label.style.left=Math.max(10,Math.min(E.width-155,point[0]-80))+'px';
   label.style.top=Math.max(75,point[1]-25)+'px';
 }
}
const normalDraw=drawWorld;
drawWorld=function(t){
 normalDraw(t);
 if(scene){missionObjects(scene,t);stageProps(scene,scene.elapsed*2)}
 if(!scene&&!ball&&!batteryOn()&&started&&!dialogOpen){
  const heading=player.heading;
  const x=player.x+Math.cos(heading)*.50+Math.sin(heading)*.07;
  const z=player.z-Math.sin(heading)*.50+Math.cos(heading)*.07;
  toyMesh(state.toy,x,1.13+player.jump,z,.67);
 }
 if(pickup){
  const k=1-pickup.life/1.05;
  const x=interpolate(pickup.x,player.x+.15,smooth(k));
  const z=interpolate(pickup.z,player.z+.28,smooth(k));
  const y=.85+.70*smooth(k)+.24*Math.sin(k*Math.PI);
  E.draw('star',M.mul(M.mul(M.tr(x,y,z),M.ry(t*6)),M.s(.20*(1-k*.65),.20*(1-k*.65),.20*(1-k*.65))),'#ffe269');
 }
 if(checkpoint){
  const phase=1-checkpoint.life/.9;
  E.draw('torus',M.mul(M.tr(checkpoint.x,1.6,checkpoint.z),M.s(1+phase*1.1,1+phase*1.1,.07)),'#ffdb67');
 }
};
window.__THIA_ACTIONS={
 isActive:()=>!!scene,
 current:()=>scene?{mode:scene.mode,step:scene.step,choice:scene.choice,poseKey:scene.poseKey,elapsed:scene.elapsed,phase:scene.phase}:null,
 stagedActions:actionNames,
 programs:actionPrograms,
 count:()=>shots,
 pickupStar:(x,z)=>{if(!scene)pickup={x,z,life:1.05}},
 raceCheckpoint:(x,z)=>{checkpoint={x,z,life:.9}},
 greet:()=>{greeting=1.6},
 stop:()=>finish(false)
};
})();