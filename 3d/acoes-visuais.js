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
const centers={garage:{x:28.7,z:-18.0,face:Math.PI,focus:[29.55,1.65,-19.4]},
 code:{x:-44.5,z:-19.1,face:Math.PI,focus:[-45.35,1.7,-20.0]}};
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
const cameraDefault={yaw:.72,pitch:.29,dist:8.4};
cameraControls.addEventListener('click',event=>{
 const control=event.target.closest('button[data-camera]');if(!control||!(scene||batteryOn()))return;
 switch(control.dataset.camera){
  case 'left':camera.yaw-=.32;break;
  case 'right':camera.yaw+=.32;break;
  case 'up':camera.pitch=Math.min(1.30,camera.pitch+.14);break;
  case 'down':camera.pitch=Math.max(.08,camera.pitch-.14);break;
  case 'in':camera.dist=Math.max(4.3,camera.dist-1.25);break;
  case 'out':camera.dist=Math.min(25,camera.dist+1.25);break;
  case 'reset':Object.assign(camera,batteryOn()?{yaw:.46,pitch:.30,dist:9.7}:cameraDefault);break;
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
const normalPerson=person;
person=function(id,x,z,heading,move=0,run=false,jump=0,t=0,throwing=0){
 if(batteryOn())return normalPerson(id,x,z,heading,move,run,jump,t,throwing);
 if(scene){
  if(id!==state.avatar)return normalPerson(id,x,z,heading,0,false,0,t,0);
  const walking=scene.elapsed<duration*.17;
  const acting=scene.elapsed>duration*.17;
  const phase=clamp01((scene.elapsed/duration-.17)/.83);
  const pose=acting?{kind:scene.poseKey,progress:phase}:null;
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
function missionObjects(s,t){
 const a=s.area,p=clamp01(s.elapsed/duration),work=smooth((p-.27)/.65);
 if(s.mode==='garage'){
  // Physical meter, probes, work lights and the oxidized/repaired connection.
  box(29.45,1.43,-19.38,.48,.20,.32,'#243c57');
  box(29.45,1.55,-19.04,.33,.045,.016,s.correct?'#5ff2ad':'#ffc15e');
  for(let i=0;i<3;i++)box(29.35+i*.085,1.58,-19.03,.028,.019,.01,'#163c45');
  const reach=work*Math.sin(p*Math.PI*3);
  rod(29.2,1.62+reach*.11,-18.8,.025,.22,.025,'#e75250');
  rod(29.8,1.62-reach*.11,-18.8,.025,.22,.025,'#273849');
  box(29.05,1.25,-19.55,.16,.11,.16,s.step===3&&work>.55?'#75c987':'#a46b45');
  if(s.step===3)for(let i=0;i<3;i++){
   const radius=.15+(.20*work)+i*.065;
   E.draw('torus',M.mul(M.tr(29.05,1.26,-19.55),M.s(radius,radius,.018)),
    work>.5?'#5ed6a1':'#e3ac73');
  }
  if(s.step===1||s.step===2)for(let i=0;i<5;i++){
   sphere(29.22+i*.14,1.83+.06*Math.sin(t*8+i),-19.2,.025,s.correct?'#55e9b1':'#edba6d');
  }
 }else{
  // The character types on a genuine three-dimensional workstation; the
  // visual state changes with the solution instead of remaining an HTML-only quiz.
  box(-45.35,.81,-20.06,1.12,.06,.62,'#98734f');
  for(let side of [-1,1])rod(-45.35+side*.88,.39,-20.06,.07,.40,.07,'#46555e');
  box(-45.35,1.58,-20.32,.78,.57,.075,'#253f52');
  box(-45.35,1.58,-20.22,.69,.48,.016,'#14394b');
  const colors=s.correct?['#56dce4','#7df0a7','#b4f5bf']:['#e7ad63','#f17265','#f8b56a'];
  for(let row=0;row<3;row++)for(let col=0;col<4;col++)
   box(-45.82+col*.27,1.74-row*.15,-20.194,.084+.07*work,.022,.007,
    colors[(row+col+s.step)%colors.length]);
  box(-45.34,.97,-19.65,.56,.034,.24,'#263b50');
  const pulse=Math.sin(t*11)*work;
  for(let k=0;k<3;k++)
   box(-45.62+k*.27,1.004+Math.max(0,pulse)*.018,-19.52,.15,.014,.09,'#a7d9df');
  // A physical phone represents the responsiveness exercise.
  if(s.step===2){
   const angle=smooth(work);
   box(-44.55,1.40,-19.84,.17+.13*angle,.30-.08*angle,.035,'#1b2d40');
   box(-44.55,1.40,-19.79,.14+.12*angle,.25-.07*angle,.007,s.correct?'#55c98d':'#bd6e50');
  }
  if(s.step===3&&work>.45)
   for(let i=0;i<3;i++)sphere(-45.72+i*.36,2.13,-20.24,.055,'#7cf6c4');
 }
 const point=M.project(camera.vp,[a.focus[0],2.55,a.focus[2]],E.width,E.height);
 if(point){
  label.style.display='block';
  label.style.left=Math.max(10,Math.min(E.width-155,point[0]-80))+'px';
  label.style.top=Math.max(75,point[1]-25)+'px';
 }
}

function stageProps(s,t){
 const u=clamp01((s.elapsed/duration-.20)/.80),v=smooth(u),glow=s.correct?'#61e9b2':'#f5b46f';
 const bar=(x,y,z,dx,dy,dz,col)=>E.draw('box',M.tr(x,y,z,dx,dy,dz),col);
 const rod=(x,y,z,h,col)=>E.draw('cyl',M.tr(x,y,z,.035,h,.035),col);
 const bulb=(x,y,z,r,col)=>E.draw('sphere',M.tr(x,y,z,r,r,r),col);
 const cord=(a,b,col)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz)||1;
  const angle=Math.atan2(Math.hypot(dx,dz),dy),heading=Math.atan2(dx,dz);
  E.draw('cyl',M.mul(M.tr((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2),
     M.mul(M.ry(heading),M.mul(M.rx(angle),M.s(.024,len/2,.024)))),col);
 };
 if(s.mode==='garage'){
  if(s.step===0){
   // 1. Multimeter reaches both real terminal objects as the readout climbs.
   bar(29.50,1.68,-19.60,.40,.24,.29,'#39434e');
   bulb(29.20,1.91,-19.59,.075,'#e65a56');
   bulb(29.83,1.91,-19.59,.075,'#25394d');
   bar(28.84,1.48,-18.65,.27,.22,.13,'#1d5280');
   bar(28.84,1.63,-18.50,.23,.07,.025,v>.68?glow:'#8cb8d1');
   cord([28.72,1.53,-18.62],[29.20,1.91+(1-v)*.22,-19.59],'#ef6964');
   cord([28.96,1.53,-18.62],[29.83,1.91+(1-v)*.18,-19.59],'#25364b');
   for(let k=0;k<4;k++)bar(28.70+k*.10,1.73,-18.49,.035,.02,.012,k<Math.round(v*4)?glow:'#34475a');
  }else if(s.step===1){
   // 2. Alternator/battery are distinct comparison instruments.
   for(let k=0;k<2;k++){
    const x=29.03+k*.74;
    bar(x,1.58,-19.20,.30,.28,.19,k?'#386582':'#23455f');
    bar(x,1.67,-18.998,.25,.11,.015,k===0?'#8ddffa':v>.55?glow:'#ffd581');
    for(let j=0;j<4;j++)bar(x-.20+j*.13,1.72,-18.979,.035,.024,.012,j<Math.round((k?v:.8)*4)?'#54e6bb':'#596671');
   }
   E.draw('cyl',M.mul(M.tr(29.42,1.55,-18.70),M.mul(M.ry(t*1.4*v),M.s(.17,.048,.17))),'#f1c26b');
   for(let j=0;j<3;j++)bulb(29.12+j*.29,1.94+Math.sin(t*2+j)*.04,-19.26,.04,glow);
  }else if(s.step===2){
   // 3. Ground cable and return circuit; sequential conduction pulses.
   bar(29.45,1.52,-19.55,.48,.22,.23,'#505864');
   bar(28.99,1.59,-18.77,.28,.20,.15,'#28577b');
   cord([28.88,1.69,-18.76],[29.14,1.77,-19.62],'#e96364');
   cord([29.08,1.67,-18.76],[29.84,1.79,-19.37],'#253444');
   bulb(29.14,1.77,-19.62,.074,'#d35d49');
   bulb(29.84,1.79,-19.37,.072,'#d0dfd7');
   for(let k=0;k<5;k++)if(v>k/5)bulb(29.20+k*.14,1.96,-19.4,.04,glow);
  }else{
   // 4. Oxidation visibly disappears under a moving wire brush.
   bar(29.25,1.62,-19.55,.28,.20,.22,'#4e5964');
   bar(29.25,1.77,-19.55,.13,.052,.12,v>.7?'#67dfad':'#b36e35');
   const shift=Math.sin(t*14)*v*.20;
   cord([28.82,1.93,-19.10],[29.25+shift,1.83,-19.55],'#d5a366');
   bar(29.25+shift,1.83,-19.55,.11,.07,.08,'#b9c6c5');
   for(let k=0;k<9;k++)if(v<k/9)bulb(29.08+(k%3)*.13,1.89+Math.floor(k/3)*.075,-19.50,.026,'#aa7843');
   if(v>.88)for(let k=0;k<3;k++)bulb(29.16+k*.10,1.93,-19.55,.032,'#77f2bb');
  }
 }else if(s.step===0){
  // 5. Review individual file cards then confirm an intact backup.
  for(let k=0;k<4;k++){
   const x=-45.75+(k%2)*.39,y=1.72-Math.floor(k/2)*.22;
   bar(x,y,-20.18,.16,.066,.022,k<Math.floor(v*5)?glow:'#789fc3');
   bar(x-.055,y,-20.145,.06,.018,.011,'#e5f0f2');
  }
  for(let k=0;k<3;k++)bar(-45.79+k*.33,.98+Math.min(k,v*3)*.1,-19.42,.20,.016,.16,'#e4eee9');
  bulb(-44.77,1.12,-19.51,.12,v>.83?'#7ef0bd':'#e0ae5d');
 }else if(s.step===1){
  // 6. A calculator: typed keys and numeric bars change independently.
  for(let k=0;k<12;k++){
    const x=-45.78+(k%4)*.27,y=1.79-Math.floor(k/4)*.15;
    bar(x,y,-20.185,.083,.022,.013,(k+Math.floor(t*8))%6===0?'#f4d680':'#91d9e6');
  }
  for(let k=0;k<6;k++)bar(-45.80+(k%3)*.24,.97,-19.53+Math.floor(k/3)*.14,.08,.017,.06,k===Math.floor(t*8)%6?'#f4ca71':'#a6dce1');
  for(let k=0;k<3;k++)bar(-44.72+k*.15,1.08+k*v*.13,-19.75,.060,.05+k*v*.09,.06,'#f4c778');
 }else if(s.step===2){
  // 7. A tangible telephone tilts portrait-to-landscape, rearranging blocks.
  const angle=-v*Math.PI/2,mid=M.tr(-44.57,1.48,-19.75);
  E.draw('box',M.mul(mid,M.mul(M.rz(angle),M.s(.16,.28,.04))),'#263b54');
  E.draw('box',M.mul(M.tr(-44.57,1.48,-19.70),M.mul(M.rz(angle),M.s(.135,.235,.010))),glow);
  for(let k=0;k<4;k++){
   const x=-45.73+(v>.5?k*.25:(k%2)*.40),y=1.72-(v>.5?0:Math.floor(k/2)*.19);
   bar(x,y,-20.190,.095,.045,.013,'#afdcef');
  }
 }else{
  // 8. Tests execute one at a time and remain green on success.
  for(let k=0;k<5;k++){
   bar(-45.75,1.79-k*.10,-20.19,.27,.027,.014,'#a1ddea');
   bulb(-45.31,1.79-k*.10,-20.165,.035,v>(k+1)/5?glow:'#efb96c');
  }
  rod(-44.61,1.08+v*.60,-19.72,.10,v>.93?glow:'#ddbb7e');
  if(v>.90)bulb(-44.61,1.76,-19.72,.13,glow);
 }
}
const normalDraw=drawWorld;
drawWorld=function(t){
 normalDraw(t);
 if(scene){missionObjects(scene,t);stageProps(scene,t)}
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