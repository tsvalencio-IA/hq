/* Universo thIAguinho • Oficina imersiva.
   Exercício fictício de substituição, separado do diagnóstico elétrico existente.
   Nenhuma alteração no progresso ou nas demais missões. */
(()=>{
'use strict';
const steps=[
 ['Estacionar e preparar','Mecânico se aproxima do veículo e prepara o serviço.',1.8],
 ['Abrir o capô','Capô se abre e o compartimento da bateria fica visível.',2.2],
 ['Desconectar negativo','Afastar primeiro o terminal negativo nesta simulação.',2.4],
 ['Desconectar positivo','Afastar o terminal positivo, mantendo os cabos separados.',2.4],
 ['Soltar a fixação','Soltar o suporte que prende a bateria.',2.0],
 ['Retirar a bateria','Elevar a bateria antiga e levá-la à bancada.',3.2],
 ['Colocar a nova','Pegar e posicionar a bateria nova no alojamento.',3.2],
 ['Fixar a bateria','Instalar o suporte e conferir se ficou firme.',2.0],
 ['Conectar positivo','Reconectar o terminal positivo e conferir o aperto.',2.4],
 ['Conectar negativo','Reconectar por último o terminal negativo.',2.4],
 ['Conferência final','Verificar a instalação e fechar o capô.',2.8]
];
const total=steps.reduce((a,s)=>a+s[2],0);
let work=null,backup=null;
const ease=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
const lerp=(a,b,p)=>a+(b-a)*p;
const inBay=[29.40,1.54,-19.43],carry=[29.20,1.53,-19.16];
const oldShelf=[28.07,1.12,-18.64],newShelf=[29.23,1.12,-18.64];
function between(a,b,t){return a.map((v,i)=>lerp(v,b[i],ease(t)))}
function batteryMotion(i,p){
 let oldAt=inBay,newAt=newShelf;
 if(i===5)oldAt=p<.35?between(inBay,carry,p/.35):between(carry,oldShelf,(p-.35)/.65);
 else if(i>5)oldAt=oldShelf;
 if(i===6)newAt=p<.45?between(newShelf,carry,p/.45):between(carry,inBay,(p-.45)/.55);
 else if(i>6)newAt=inBay;
 return {oldAt,newAt};
}
function actualTask(i,p){
 const {oldAt,newAt}=batteryMotion(i,p);
 const part=i===5?oldAt:i===6?newAt:null;
 const actor=part?{x:part[0],z:part[2]+.44}:{x:29.40,z:-18.91};
 let left,right;
 if(part){
   left=[part[0]+.37,part[1]+.15,part[2]+.19];
   right=[part[0]-.37,part[1]+.15,part[2]+.19];
 } else {
   switch(i){
     case 1:left=[29.69,1.82+.18*ease(p),-19.25];right=[29.16,1.82+.18*ease(p),-19.25];break;
     case 2:left=[29.70,1.74,-19.31];right=[29.15,1.61,-19.18];break;
     case 3:left=[29.19,1.76,-19.30];right=[29.67,1.62,-19.20];break;
     case 4:case 7:left=[29.54,1.79,-19.29];right=[29.21,1.80,-19.25];break;
     case 8:left=[29.18,1.75,-19.31];right=[29.62,1.61,-19.18];break;
     case 9:left=[29.64,1.75,-19.31];right=[29.15,1.61,-19.17];break;
     default:left=[29.60,1.83,-19.28];right=[29.16,1.73,-19.21];
   }
 }
 return {actor,hands:[left,right],oldAt,newAt};
}

const panel=document.createElement('aside');
panel.id='batteryWorkPanel';
panel.setAttribute('aria-label','Etapas visíveis da simulação de troca de bateria');
panel.innerHTML='<span class="batteryTitle">🔋 OFICINA · TROCA ANIMADA</span><h3 id="batteryStepTitle">Preparando serviço</h3><small id="batteryCounter"></small><div class="batteryMeter"><i id="batteryProgress"></i></div><p class="batteryStatus" id="batteryStatus"></p><div class="batteryActions"><button id="batteryAgain" class="primary" type="button">↻ Repetir</button><button id="batteryLeave" type="button">✕ Sair</button></div>';
document.getElementById('game').appendChild(panel);
const findPhase=elapsed=>{let remaining=elapsed;for(let i=0;i<steps.length;i++){if(remaining<steps[i][2])return {i,p:Math.max(0,remaining/steps[i][2])};remaining-=steps[i][2]}return{i:steps.length,p:1}};
const batteryPoses=[
 'battery:verify','battery:hood','battery:negative','battery:positive','battery:clamp',
 'battery:remove','battery:install','battery:fix','battery:positive-connect',
 'battery:negative-connect','battery:verify'
];
function refreshPanel(){
 if(!work)return;
 const {i}=findPhase(work.elapsed);
 const done=i===steps.length;
 document.getElementById('batteryStepTitle').textContent=done?'✓ Serviço concluído':steps[i][0];
 document.getElementById('batteryCounter').textContent=done?'11/11 etapas · simulação didática':(i+1)+' / '+steps.length+' etapas · simulação didática';
 document.getElementById('batteryStatus').textContent=done?'A bateria foi substituída e o capô fechado. Clique em Repetir para rever toda a animação.':steps[i][1];
 document.getElementById('batteryProgress').style.width=Math.round(100*work.elapsed/total)+'%';
}
function begin(){
 if(work)return;
 if(dialogOpen)closeDialog();
 backup={player:{x:player.x,z:player.z,heading:player.heading,speed:player.speed,jump:player.jump},partner:{x:partner.x,z:partner.z,heading:partner.heading},camera:{yaw:camera.yaw,pitch:camera.pitch,dist:camera.dist}};
 player.x=26.2;player.z=-15.4;player.heading=Math.atan2(2.9,-2.15);player.speed=0;player.jump=0;
 partner.x=26;partner.z=-17.5;partner.heading=Math.PI;
 camera.yaw=.46;camera.pitch=.30;camera.dist=9.7;
 work={elapsed:0,lastStep:-1};
 document.body.classList.add('battery-mode');
 refreshPanel();
}
function leave(){
 if(!work)return;
 work=null;document.body.classList.remove('battery-mode');
 if(backup){
  Object.assign(player,backup.player);
  Object.assign(partner,backup.partner);
  Object.assign(camera,backup.camera);
  backup=null;
 }
 updateObjective();
}
document.getElementById('batteryAgain').onclick=()=>{
 if(!work){begin();return}
 work.elapsed=0;work.lastStep=-1;refreshPanel();
};
document.getElementById('batteryLeave').onclick=leave;
// O menu de diagnóstico permanece original. Acrescentamos um modo de observação separado.
const originalGarage=garageDialog;
garageDialog=function(){
 originalGarage();
 const btn=document.createElement('button');
 btn.type='button';btn.textContent='🔋 Assistir à troca de bateria no cenário 3D';
 btn.className='main';btn.setAttribute('data-battery-training','');
 btn.onclick=begin;
 document.getElementById('dialogActions').prepend(btn);
};
const originalStep=gameStep;
gameStep=function(dt){
 if(!work)return originalStep(dt);
 const wasStarted=started;started=false;
 try{originalStep(dt)}finally{started=wasStarted}
 if(work.elapsed<total){
  work.elapsed=Math.min(total,work.elapsed+dt);
  const phase=findPhase(work.elapsed);
  if(phase.i===0){let u=ease(phase.p);player.x=lerp(26.2,29.40,u);player.z=lerp(-15.4,-18.91,u);player.heading=Math.atan2(2.9,-2.15);}else{const task=actualTask(phase.i,phase.p);player.x=task.actor.x;player.z=task.actor.z;player.heading=Math.PI;}
  if(phase.i!==work.lastStep){work.lastStep=phase.i;refreshPanel()}
  document.getElementById('batteryProgress').style.width=Math.round(100*work.elapsed/total)+'%';
 }
};
const originalView=renderSkyAndView;
renderSkyAndView=function(){
 if(!work)return originalView();
 const w=canvas.clientWidth,h=canvas.clientHeight;
 const target=[29.3,1.40,-19.15],dist=Math.max(5,Math.min(19,camera.dist));
 const eye=[target[0]+Math.sin(camera.yaw)*Math.cos(camera.pitch)*dist,target[1]+Math.sin(camera.pitch)*dist+1.0,target[2]+Math.cos(camera.yaw)*Math.cos(camera.pitch)*dist];
 camera.eye=eye;camera.target=target;E.focus=target;
 camera.vp=M.mul(M.perspective(PI/3.12,w/Math.max(1,h),.1,240),M.lookAt(eye,target));
 E.begin(camera.vp,eye);
};
const originalPerson=person;
person=function(id,x,z,heading,move=0,run=false,jump=0,t=0,throwing=0){
 if(work&&id===state.avatar){
  const phase=findPhase(work.elapsed),walking=phase.i===0;
  const key=batteryPoses[Math.min(phase.i,10)];
  const pose=walking?null:{kind:key,progress:phase.p,hands:actualTask(phase.i,phase.p).hands};
  return mascotStudio.drawHuman(id,x,z,heading,walking?1:0,false,0,
     walking?t:work.elapsed*2,0,0,0,pose);
 }
 return originalPerson(id,x,z,heading,move,run,jump,t,throwing);
};
const drawBox=(x,y,z,sx,sy,sz,col)=>E.draw('box',M.tr(x,y,z,sx,sy,sz),col);
const drawOrb=(x,y,z,s,col)=>E.draw('sphere',M.tr(x,y,z,s,s,s),col);
function battery(x,y,z,color){
 drawBox(x,y,z,.48,.32,.36,color);
 drawBox(x,y+.32,z,.48,.045,.36,'#d4d9df');
 drawOrb(x-.27,y+.37,z-.17,.09,'#d45048');
 drawOrb(x+.27,y+.37,z-.17,.09,'#364958');
}
function position(t,from,to){return from.map((v,i)=>lerp(v,to[i],ease(t)))}
function drawWorkshop(){
 if(!work)return;
 const {i,p}=findPhase(work.elapsed);
 // Oficina: veículo já existente no pátio. Peças móveis, capô e alojamento são 3D.
 const open=i===0?0:i===1?ease(p):i>=10?1-ease(p):1;
 const angle=open*1.06;
 drawBox(30,1.15,-19.62,1.08,.06,1.08,'#202e38'); // compartimento
 drawBox(30.45,1.22,-19.78,.36,.22,.36,'#6f7781');
 drawBox(30.52,1.24,-19.22,.27,.22,.28,'#71818a');
 const hinge=M.mul(M.t(30,1.20,-20.72),M.rx(-angle));
 const hood=M.mul(hinge,M.mul(M.t(0,0,1.07),M.s(1.13,.05,1.11)));
 E.draw('box',hood,'#386b9b');
 // Bateria de origem do compartimento para as mãos e para a bancada
 const {oldAt,newAt}=batteryMotion(i,p);
 battery(...oldAt,'#3b4149');
 battery(...newAt,'#1d65a2');
 drawBox(28.65,.71,-18.64,1.44,.09,.57,'#a47750');
 for(const dx of[-1.20,1.20])for(const dz of[-.40,.40])
   drawBox(28.65+dx,.37,-18.64+dz,.07,.35,.07,'#4c5659');
 // bornes e terminais têm estado visual de desconectado durante o procedimento
 // Positive and negative terminals disconnect and reconnect at their own step.
 const redFree=i===3?p>=.5:i>=4&&i<8||i===8&&p<.5;
 const blackFree=i===2?p>=.5:i>=3&&i<9||i===9&&p<.5;
 drawOrb(redFree?29.02:29.18,redFree?1.75:1.79,redFree?-19.18:-19.31,.075,'#d64a45');
 drawOrb(blackFree?29.86:29.70,blackFree?1.75:1.79,blackFree?-19.18:-19.31,.075,'#313d4e');
 // ferramenta acompanhando o serviço
 // Bracket lifts off at step 5 and is secured again at step 8.
 if(i<=4||i>=7){
  const lift=i===4?ease(p)*.39:i===7?(1-ease(p))*.39:0;
  drawBox(29.45,1.94+lift,-19.45,.62,.045,.075,'#b7bfc4');
 }
 // The wrench follows the articulated wrist instead of floating in space.
 if([2,3,4,7,8,9].includes(i)){
  const wrist=mascotStudio.snapshot[state.avatar]?.hands?.[0]||actualTask(i,p).hands[0];
  E.draw('cyl',M.mul(M.tr(wrist[0],wrist[1]-.04,wrist[2]-.06),
    M.mul(M.rz(.30*Math.sin(work.elapsed*7)),M.s(.027,.12,.027))),'#b1bbc7');
  drawOrb(wrist[0],wrist[1]-.14,wrist[2]-.07,.044,'#c8d3db');
 }
 // Each phase highlights only its active physical target.
 if(i===0){drawBox(28.45,.85,-17.75,.45,.10,.32,'#ffd36f')}
 if(i===1)drawOrb(30.02,1.65+open*.4,-19.9,.095,'#f8d985');
 if(i===5||i===6){
   const b=i===5?oldAt:newAt;
   for(const side of [-1,1])drawOrb(b[0]+side*.29,b[1]+.22,b[2],.045,'#ffe59a');
 }
 if(i===10){
   drawOrb(29.45,1.95,-19.45,.085,p>.70?'#77eaba':'#f3ce7b');
 }
 // indicador de ponto de trabalho, legível sem bloquear personagem
 E.draw('torus',M.mul(M.tr(29.65,.23,-18.35),M.s(.49,.49,.49)),'#f5cd66');
}
const originalDraw=drawWorld;
drawWorld=function(t){originalDraw(t);drawWorkshop()};
window.__THIA_BATTERY_TEST={begin,leave,phase:()=>work?findPhase(work.elapsed):null,contact:()=>work?actualTask(findPhase(work.elapsed).i,findPhase(work.elapsed).p):null,pose:()=>work?batteryPoses[Math.min(findPhase(work.elapsed).i,10)]:null,poses:batteryPoses.slice(),steps,total,isActive:()=>!!work,advance:dt=>{if(work){work.elapsed=Math.min(total,work.elapsed+dt);refreshPanel()}},panel};
})();
