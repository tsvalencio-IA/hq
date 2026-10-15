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
const panel=document.createElement('aside');
panel.id='batteryWorkPanel';
panel.setAttribute('aria-label','Etapas visíveis da simulação de troca de bateria');
panel.innerHTML='<span class="batteryTitle">🔋 OFICINA · TROCA ANIMADA</span><h3 id="batteryStepTitle">Preparando serviço</h3><small id="batteryCounter"></small><div class="batteryMeter"><i id="batteryProgress"></i></div><p class="batteryStatus" id="batteryStatus"></p><div class="batteryActions"><button id="batteryAgain" class="primary" type="button">↻ Repetir</button><button id="batteryLeave" type="button">✕ Sair</button></div>';
document.getElementById('game').appendChild(panel);
const findPhase=elapsed=>{let remaining=elapsed;for(let i=0;i<steps.length;i++){if(remaining<steps[i][2])return {i,p:Math.max(0,remaining/steps[i][2])};remaining-=steps[i][2]}return{i:steps.length,p:1}};
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
 player.x=29.1;player.z=-17.55;player.heading=Math.PI;player.speed=0;player.jump=0;
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
  const phase=findPhase(work.elapsed),active=phase.i>=1&&phase.i<10;
  const intensity=active?(.70+.25*Math.sin(work.elapsed*8)):0;
  return mascotStudio.drawHuman(id,x,z,heading,0,false,0,t,0,0,intensity);
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
 const inBay=[29.40,1.52,-19.46],held=[28.72,1.30,-18.33],oldShelf=[26.65,.78,-17.63];
 const newShelf=[26.65,.78,-18.72];
 let oldAt=inBay,newAt=newShelf;
 if(i>=5)oldAt=i===5?position(p,inBay,held):i===6?oldShelf:oldShelf;
 if(i===5&&p>.65)oldAt=position((p-.65)/.35,held,oldShelf);
 if(i===6)newAt=position(p,newShelf,held);
 if(i===7)newAt=position(p,held,inBay);
 if(i>=8)newAt=inBay;
 if(i<7)battery(...oldAt,'#3b4149');
 if(i>=6)battery(...newAt,'#1d65a2');
 if(i<6)battery(...newShelf,'#1d65a2'); // nova aguarda sobre bancada
 drawBox(26.55,.43,-18.2,1.30,.09,1.35,'#a47750');
 for(const dx of[-.45,.45])for(const dz of[-.48,.48])drawBox(26.55+dx,.22,-18.2+dz,.07,.24,.07,'#4c5659');
 // bornes e terminais têm estado visual de desconectado durante o procedimento
 if(i<2||i>=9){drawOrb(29.18,1.92,-19.63,.10,'#d64a45')}
 else {drawOrb(29.01,1.75,-19.23,.10,'#d64a45')}
 if(i<3||i>=10){drawOrb(29.70,1.92,-19.63,.10,'#313d4e')}
 else {drawOrb(29.92,1.77,-19.19,.10,'#313d4e')}
 // ferramenta acompanhando o serviço
 if(i>=2&&i<=4||i>=7&&i<=9){
  const y=1.52+.07*Math.sin(work.elapsed*9);
  E.draw('cyl',M.mul(M.tr(28.75,y,-18.68),M.mul(M.rz(.34),M.s(.045,.26,.045))),'#aeb6bd');
 }
 // indicador de ponto de trabalho, legível sem bloquear personagem
 E.draw('torus',M.mul(M.tr(29.65,.23,-18.35),M.s(.49,.49,.49)),'#f5cd66');
}
const originalDraw=drawWorld;
drawWorld=function(t){originalDraw(t);drawWorkshop()};
window.__THIA_BATTERY_TEST={begin,leave,phase:()=>work?findPhase(work.elapsed):null,steps,total,isActive:()=>!!work,advance:dt=>{if(work){work.elapsed=Math.min(total,work.elapsed+dt);refreshPanel()}},panel};
})();
