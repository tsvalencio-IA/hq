/* Objetivos no mundo: o mesmo personagem executa cada etapa, com câmera livre. */
(()=>{
'use strict';
const regionNames={family:'Casa e jardim',garage:'Oficina',code:'Tecnologia'};
const tasks=[
 {id:'roda',region:'garage',icon:'🛞',name:'Recuperar a roda',desc:'Retire a roda do suporte, repare e monte novamente.',at:[33.5,-15.2],steps:[['Soltar e retirar a roda','O personagem afrouxa a fixação e leva a roda para o suporte de serviço.','wrench'],['Reparar o pneu','A roda gira enquanto o personagem trabalha com a ferramenta.','wrench'],['Montar e conferir','A roda volta ao eixo e recebe a conferência final.','wrench']]},
 {id:'motor',region:'garage',icon:'⚙️',name:'Revisar o motor',desc:'Abra o conjunto, troque o filtro e monte a tampa.',at:[26,-13.8],steps:[['Abrir o conjunto','Solte a tampa para alcançar o filtro no motor da bancada.','operate'],['Substituir o filtro','Retire o filtro antigo e encaixe o novo.','carry'],['Fechar e testar','Aperte a tampa e acompanhe o funcionamento do conjunto.','wrench']]},
 {id:'lavagem',region:'garage',icon:'🧽',name:'Deixar o carro brilhando',desc:'Ensaboe, esfregue e enxágue o carro do pátio.',at:[39,-11.5],steps:[['Ensaboar a carroceria','O personagem passa a esponja e espalha espuma na lateral.','clean'],['Esfregar a sujeira','A esponja se move na carroceria e remove as manchas.','clean'],['Enxaguar e secar','A água leva a espuma e o carro recebe o acabamento.','water']]},
 {id:'jardim',region:'family',icon:'🌱',name:'Dar vida ao jardim',desc:'Prepare a terra, plante e regue o novo canteiro.',at:[-6.8,-4.4],steps:[['Preparar a terra','O personagem se abaixa e trabalha a terra com uma pá.','garden'],['Plantar as mudas','As mudas são colocadas uma a uma no canteiro.','garden'],['Regar o canteiro','Use o regador e veja as flores surgirem.','water']]},
 {id:'refeicao',region:'family',icon:'🐾',name:'Cuidar de Luna e Liz',desc:'Prepare comida e água e acompanhe as cachorrinhas.',at:[-.5,-4.5],steps:[['Preparar os potinhos','O personagem coloca os potinhos lado a lado.','garden'],['Servir a refeição','O alimento sai do pacote e enche os dois potinhos.','pour'],['Colocar água e chamar','O personagem serve água; Luna e Liz se aproximam para comer.','water']]},
 {id:'organizar',region:'family',icon:'🧺',name:'Organizar o cantinho',desc:'Guarde os brinquedos e arrume o espaço da família.',at:[3.8,-5.6],steps:[['Recolher os brinquedos','Pegue os brinquedos espalhados no jardim.','garden'],['Guardar na caixa','Leve e coloque os brinquedos dentro da caixa.','carry'],['Arrumar o banco','Limpe o banco e acomode a almofada no lugar.','clean']]},
 {id:'computador',region:'code',icon:'🖥️',name:'Montar o computador',desc:'Monte os componentes, feche o gabinete e ligue a máquina.',at:[-44,-18.4],steps:[['Instalar os componentes','O personagem encaixa memória e componentes no gabinete aberto.','operate'],['Fechar e conectar','Encaixe a tampa e conecte os cabos do computador.','wrench'],['Ligar e testar','O personagem usa o teclado e acompanha a inicialização na tela.','type']]},
 {id:'rede',region:'code',icon:'📡',name:'Restabelecer a rede',desc:'Conecte o cabo, ajuste o roteador e teste o sinal.',at:[-49.1,-17.7],steps:[['Conectar o cabo','O personagem leva o conector até a porta do roteador.','operate'],['Ajustar o roteador','Ajuste as antenas e reinicie o equipamento.','wrench'],['Testar a conexão','Use o computador para verificar o sinal; as luzes ficam verdes.','type']]},
 {id:'aplicativo',region:'code',icon:'📱',name:'Entregar o aplicativo',desc:'Programe, teste no celular e publique a versão do jogo.',at:[-39,-18.3],steps:[['Programar a solução','O personagem digita e as linhas de código aparecem na tela.','type'],['Testar no celular','Segure o aparelho e confira a interface em tamanho móvel.','phone'],['Publicar a versão','Execute os testes e acompanhe a publicação na tela.','type']]}
];
let work=null;
const smooth=n=>{n=clamp(n,0,1);return n*n*(3-2*n)},mix=(a,b,p)=>a+(b-a)*p;
const record=()=>state.quest.workOrders||(state.quest.workOrders={});
const progress=id=>clamp(Number(record()[id])||0,0,3);
const count=()=>tasks.filter(t=>progress(t.id)===3).length;
const panel=document.createElement('aside');panel.id='workPanel';panel.setAttribute('aria-label','Tarefa em andamento');
panel.innerHTML='<div class="workEyebrow" id="workRegion"></div><h2 id="workTitle"></h2><div class="workStepRow"><b id="workStep"></b><span id="workCount"></span></div><p id="workDescription" aria-live="polite"></p><div class="workMeter"><i id="workProgress"></i></div><div class="workButtons"><button id="workDo" class="workPrimary"></button><button id="workReplay">↻ Rever etapa</button><button id="workLeave">Sair e salvar</button></div><small id="workHint">Arraste a cena para girar · pinça ou +/− para aproximar.</small>';
$('game').appendChild(panel);
const cameraPad=document.createElement('aside');cameraPad.id='workCamera';cameraPad.setAttribute('aria-label','Câmera livre durante a atividade');
cameraPad.innerHTML='<span>CÂMERA LIVRE</span><div><button data-camera="left" aria-label="Girar câmera para a esquerda">↶</button><button data-camera="right" aria-label="Girar câmera para a direita">↷</button><button data-camera="up" aria-label="Elevar câmera">↑</button><button data-camera="down" aria-label="Baixar câmera">↓</button><button data-camera="near" aria-label="Aproximar câmera">+</button><button data-camera="far" aria-label="Afastar câmera">−</button></div><button data-camera="reset" class="cameraReset">Reenquadrar</button>';
$('game').appendChild(cameraPad);
cameraPad.addEventListener('click',e=>{const b=e.target.closest('[data-camera]');if(!b)return;const type=b.dataset.camera;if(type==='left')camera.yaw-=.38;if(type==='right')camera.yaw+=.38;if(type==='up')camera.pitch=clamp(camera.pitch+.15,.08,1.3);if(type==='down')camera.pitch=clamp(camera.pitch-.15,.08,1.3);if(type==='near')camera.dist=clamp(camera.dist-1,5,30);if(type==='far')camera.dist=clamp(camera.dist+1,5,30);if(type==='reset'){camera.yaw=.56;camera.pitch=.35;camera.dist=innerWidth<550?9.5:8.4}});
const boardButton=document.createElement('button');boardButton.id='objectivesBtn';boardButton.textContent='📋 Objetivos';boardButton.onclick=()=>openBoard('all');$('artShelf').prepend(boardButton);
function openBoard(region='all'){
 if(work)return;
 const list=tasks.filter(t=>region==='all'||t.region===region);
 const filters=Object.entries({all:'Todos',...regionNames}).map(([key,name])=>`<button data-region="${key}" class="${key===region?'selected':''}">${name}</button>`).join('');
 const cards=list.map(t=>{const n=progress(t.id);return `<button class="workCard" data-task="${t.id}"><span class="workIcon">${t.icon}</span><span><strong>${t.name}</strong><small>${t.desc}</small><em>${n===3?'✓ Concluído · repetir':n?`Retomar etapa ${n+1}/3`:'3 etapas · +90 estrelas'}</em></span><b>${n}/3</b></button>`}).join('');
 dialog(region==='all'?'Objetivos da cidade':regionNames[region],'📋 '+count()+' / 9 TAREFAS CONCLUÍDAS',`<p>Escolha uma tarefa. Você controla as etapas e pode observar o personagem de qualquer ângulo.</p><nav class="workFilters" aria-label="Filtrar objetivos">${filters}</nav><div class="workCards">${cards}</div>`,[{label:'Voltar à exploração',action:closeDialog,main:true}]);
 for(const b of $('dialogBody').querySelectorAll('[data-region]'))b.onclick=()=>openBoard(b.dataset.region);
 for(const b of $('dialogBody').querySelectorAll('[data-task]'))b.onclick=()=>begin(b.dataset.task);
 const extras=[];
 if(region==='garage')extras.push(['🔧 Diagnóstico elétrico com decisões',garageDialog],['🔋 Troca de bateria em 11 etapas',()=>window.__THIA_BATTERY_TEST.begin()]);
 if(region==='code')extras.push(['💻 Desafios de lógica do estúdio',codeDialog]);
 if(region==='family')extras.push(['🏐 Brincar livremente com Luna e Liz',familyDialog]);
 for(const [title,action] of extras){const b=document.createElement('button');b.className='choice';b.textContent=title;b.onclick=action;$('dialogActions').prepend(b)}
}
function begin(id){
 if(work||window.__THIA_ACTIONS?.isActive()||window.__THIA_BATTERY_TEST?.isActive())return;
 if(ball||runQuest){closeDialog();notify('Conclua a brincadeira ou a corrida antes de iniciar a tarefa.',3);return}
 const task=tasks.find(t=>t.id===id);if(!task)return;
 const savedStep=progress(id),[x,z]=task.at;
 work={task,step:savedStep,elapsed:0,duration:6.6,phase:savedStep===3?'complete':'ready',replay:null,wasComplete:savedStep===3,
 backup:{player:{...player},partner:{...partner},pets:pets.map(p=>({...p})),camera:{yaw:camera.yaw,pitch:camera.pitch,dist:camera.dist}}};
 closeDialog();keys.clear();input.x=input.y=0;input.run=false;input.pointers.clear();input.pinch=null;stickStop();aimMode=false;$('aimToggle').classList.remove('active');
 Object.assign(player,{x:x-1.4,z:z+2.5,heading:Math.PI,speed:0,jump:0,vJump:0,throwing:0,wave:0});
 Object.assign(partner,{x:x+2.1,z:z+1.5,heading:Math.PI,moving:0});
 pets.forEach((p,i)=>Object.assign(p,{x:x-2+i*1.1,z:z+3.4,heading:Math.PI,moving:0}));
 camera.yaw=.56;camera.pitch=.35;camera.dist=innerWidth<550?9.5:8.4;
 document.body.classList.add('work-mode');refresh();
}
function leave(){
 if(!work)return;
 const old=work;work=null;Object.assign(player,old.backup.player);Object.assign(partner,old.backup.partner);
 pets.forEach((p,i)=>Object.assign(p,old.backup.pets[i]));Object.assign(camera,old.backup.camera);
 keys.clear();input.x=input.y=0;input.run=false;input.pointers.clear();input.pinch=null;stickStop();
 document.body.classList.remove('work-mode');store();updateObjective();
}
function refresh(){
 if(!work)return;const w=work,t=w.task,done=w.phase==='complete',step=t.steps[Math.min(w.step,2)];
 $('workRegion').textContent=t.icon+' '+regionNames[t.region]+' · '+(state.avatar==='thiago'?'Thiago':'Thamis');
 $('workTitle').textContent=t.name;$('workStep').textContent=done?'✓ Objetivo concluído':step[0];$('workCount').textContent=done?'3/3':`${w.step+1}/3`;
 $('workDescription').textContent=done?(w.wasComplete?'Você já concluiu esta tarefa. Pode repetir para observar de novo.':'Tarefa salva! +90 estrelas. Escolha outro objetivo ou repita para observar.'):(w.phase==='paused'?'Animação pausada. Mude a câmera à vontade e toque em Continuar.':step[1]);
 $('workDo').textContent=done?'↻ Repetir tarefa':w.phase==='running'?'Ⅱ Pausar ação':w.phase==='paused'?'▶ Continuar ação':'▶ Executar etapa';
 $('workReplay').disabled=w.phase==='running'||w.phase==='paused'||w.step===0;
 $('workProgress').style.width=(done?100:100*(w.step+w.elapsed/w.duration)/3)+'%';
}
function execute(){
 if(!work)return;const w=work;
 if(w.phase==='running'){w.phase='paused';refresh();return}
 if(w.phase==='paused'){w.phase='running';refresh();return}
 if(w.phase==='complete'){w.step=0;w.elapsed=0;w.wasComplete=true;w.phase='ready';refresh();return}
 w.from={x:player.x,z:player.z};w.elapsed=0;w.phase='running';refresh();
}
function finishStage(){
 const w=work;if(!w)return;
 if(w.replay!==null){w.step=w.replay;w.replay=null;w.phase=w.step===3?'complete':'ready';w.elapsed=0;refresh();return}
 w.step++;w.elapsed=0;
 if(!w.wasComplete){record()[w.task.id]=w.step;store()}
 if(w.step===3){w.phase='complete';if(!w.wasComplete){gain(90);notify('✓ '+w.task.name+'! +90 estrelas',3);const region=w.task.region;if(tasks.filter(t=>t.region===region).every(t=>progress(t.id)===3))medal('work_'+region,'Todas as tarefas: '+regionNames[region],150)}}else{w.phase='ready';notify('✓ Etapa concluída. A próxima começa quando você quiser.',2)}
 refresh();
}
$('workDo').onclick=execute;$('workLeave').onclick=leave;
$('workReplay').onclick=()=>{if(!work||!work.step||['running','paused'].includes(work.phase))return;const target=work.step;work.step--;work.replay=target;work.phase='ready';execute()};
window.addEventListener('keydown',e=>{if(!work)return;if(e.code==='Escape'){leave();e.preventDefault();e.stopImmediatePropagation();return}if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyF','KeyE','Space','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation()}},true);
const normalStep=gameStep;
gameStep=function(dt){
 if(!work)return normalStep(dt);
 const was=started;started=false;try{normalStep(dt)}finally{started=was}
 const w=work,[x,z]=w.task.at;
 if(w.phase==='running'){
  w.elapsed=Math.min(w.duration,w.elapsed+dt);const p=smooth(w.elapsed/1.6);
  player.x=mix(w.from.x,x,p);player.z=mix(w.from.z,z+1.35,p);player.heading=Math.atan2(x-player.x,z-player.z);player.speed=w.elapsed<1.6?1:0;
  if(w.task.id==='refeicao'&&w.step===2&&w.elapsed>2){pets.forEach((d,i)=>{d.moving=moveToward(d,x+(i===0?-.56:.56),z+.47,1.8,dt)?0:1;d.heading=Math.PI})}
  if(w.elapsed>=w.duration){player.speed=0;finishStage()}else $('workProgress').style.width=100*(w.step+w.elapsed/w.duration)/3+'%';
 }
 if(w.phase==='paused')player.speed=0;
};
const normalView=renderSkyAndView;
renderSkyAndView=function(){
 if(!work)return normalView();const [x,z]=work.task.at,target=[x,1.15,z+.65],w=canvas.clientWidth,h=canvas.clientHeight;
 // The compact bottom task panel stays outside the subject's main composition.
 const eye=[target[0]+Math.sin(camera.yaw)*Math.cos(camera.pitch)*camera.dist,target[1]+Math.sin(camera.pitch)*camera.dist,target[2]+Math.cos(camera.yaw)*Math.cos(camera.pitch)*camera.dist];
 camera.eye=eye;camera.target=target;E.focus=target;
 const projection=M.perspective(PI/3.12,w/Math.max(1,h),.1,240),lift=w<650?panel.getBoundingClientRect().height/h*.7:0;camera.vp=M.mul(M.mul(M.t(0,lift,0),projection),M.lookAt(eye,target));E.begin(camera.vp,eye);
};
const normalPerson=person;
person=function(id,x,z,heading,move=0,run=false,jump=0,t=0,throwing=0){
 if(!work)return normalPerson(id,x,z,heading,move,run,jump,t,throwing);
 const active=id===state.avatar,w=work,performing=w.elapsed>1.6&&['running','paused'].includes(w.phase),pose=performing?w.task.steps[Math.min(w.step,2)][2]:null;
 const clock=w.phase==='paused'?w.frozenClock??(w.frozenClock=state.time):state.time;if(w.phase!=='paused')w.frozenClock=null;
 return mascotStudio.drawHuman(id,x,z,heading,active&&w.phase==='running'?player.speed:0,false,0,clock,0,0,active&&performing ? .85 : 0,active?pose:null);
};
const normalDog=dog;
dog=function(id,x,z,heading,move=0,phase=0,t=0,carrying=false){
 const eating=work?.task.id==='refeicao'&&(work.step===3||work.step===2&&work.elapsed>4.4);
 if(eating){mascotStudio.drawDog(id,x,z,heading,move,phase,t,carrying,true);return}
 return normalDog(id,x,z,heading,move,phase,t,carrying);
};
const shape=(kind,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0)=>E.draw(kind,M.mul(M.tr(x,y,z),M.mul(M.mul(M.ry(ry),M.mul(M.rx(rx),M.rz(rz))),M.s(sx,sy,sz))),color);
// Helpers below use full dimensions for boxes, and radii for round objects.
const box=(x,y,z,w,h,d,c)=>shape('box',x,y,z,w/2,h/2,d/2,c);
const orb=(x,y,z,r,c)=>shape('sphere',x,y,z,r,r,r,c);
const cyl=(x,y,z,r,h,c)=>shape('cyl',x,y,z,r,h/2,r,c);
const beam=(a,b,r,c)=>{const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz);shape('cyl',(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r,len/2,r,c,Math.acos(clamp(dy/len,-1,1)),Math.atan2(dx,dz))};
function bench(x,z){box(x,.87,z,2.7,.15,1.25,'#b28a62');for(const dx of[-1.1,1.1])for(const dz of[-.45,.45])box(x+dx,.42,z+dz,.1,.84,.1,'#3f5865')}
function monitor(x,z,stage,p,variant){
 box(x,1.58,z-.22,1.32,.95,.13,'#243c52');box(x,1.58,z-.144,1.17,.80,.025,stage===3?'#174e49':'#102c40');box(x,1.07,z-.22,.14,.32,.14,'#435b6c');box(x,.96,z-.10,.65,.06,.40,'#334d62');
 if(variant==='code')for(let row=0;row<6;row++){const len=.18+.09*((row*7)%8),shown=stage>0?1:clamp(p*7-row,0,1);if(shown)box(x-.47+len/2,1.87-row*.115,z-.122,len*shown,.032,.013,row%2?'#8ef0bb':'#60c6f0')}
 else for(let row=0;row<3;row++){const lit=stage>row||stage===row&&p>.5;box(x-.35+row*.35,1.57,z-.121,.16,.2+.13*row,.015,lit?'#6dedaa':'#73645b')}
 if(stage===3){beam([x-.35,1.58,z-.1],[x-.1,1.37,z-.1],.045,'#a4ffd1');beam([x-.1,1.37,z-.1],[x+.45,1.89,z-.1],.045,'#a4ffd1')}
 box(x,.99,z+.33,1.1,.055,.36,'#253e50');for(let i=0;i<5;i++)for(let j=0;j<2;j++)box(x-.4+i*.2,1.026,z+.23+j*.14,.12,.015,.08,'#93c5d3');
}
function water(x,y,z,t,p){for(let k=0;k<12;k++){const a=(t*1.6+k/12)%1;orb(x+.30*a+.06*Math.sin(k*4),y-.8*a,z-.30*a,.025,'#7ce1f3')}cyl(x-.12,y-.03,z+.04,.19,.25,'#469dbe');beam([x+.02,y+.05,z],[x+.27,y+.12,z-.18],.045,'#469dbe')}
function drawTask(t,display=work){
 if(!display)return;const w=display,[x,z]=w.task.at,stage=w.step,running=['running','paused'].includes(w.phase),p=running?clamp((w.elapsed-1.6)/5,0,1):0,clock=w.phase==='paused'?w.frozenClock??t:t;
 const completed=n=>stage>n?1:stage===n?p:0,act=running&&w.elapsed>1.6;
 const hand=[x-.05,1.43,z+.52];
 if(w.task.id==='roda'){
  // A visible service axle: the wheel actually leaves it, rotates, and returns.
  box(x,.30,z,1.6,.15,1.0,'#466071');cyl(x,.63,z,.11,.65,'#6b8290');beam([x,.83,z],[x,.83,z+.32],.11,'#b5bec2');
  const off=stage===0?completed(0):stage===1?1:1-completed(2),wy=.85+Math.sin(p*Math.PI)*.25,wx=x-1.0*off,wz=z+.45;
  shape('torus',wx,wy,wz,.52,.52,.25,'#272e37',0,0,stage===1?clock*2.7:0);shape('cyl',wx,wy,wz,.28,.10,.28,'#b4bfc7',Math.PI/2);orb(wx,wy,wz+.11,.09,'#526773');
  for(let k=0;k<5;k++){const a=k*TAU/5+(stage===1?clock*2.7:0);orb(wx+Math.cos(a)*.19,wy+Math.sin(a)*.19,wz+.11,.037,completed(1)>.7?'#b6efb3':'#886d5d')}
  if(act){beam(hand,[wx+.2,wy+.2,wz+.15],.045,'#b7c8d0');shape('torus',wx+.2,wy+.2,wz+.15,.1,.1,.025,'#c5d3d7')}
 }else if(w.task.id==='motor'){
  bench(x,z);box(x,1.2,z,1.35,.56,.75,'#586d77');for(let k=0;k<3;k++)cyl(x-.4+k*.4,1.55,z,.14,.20,'#b0bec2');
  const lid=stage===0?completed(0):stage===2?1-completed(2):1;box(x+.90*lid,1.54+Math.sin(lid*Math.PI)*.5,z,1.43,.09,.82,'#357d9c');
  const filter=stage===1?p:0;if(stage<2&&filter<.5)cyl(x-.35*filter,1.68+filter*.75,z+.05,.19,.30,'#a28155');if(stage>1||stage===1&&p>.5)cyl(x+.4*(1-p),1.68+Math.max(0,1-p)*.5,z+.05,.19,.30,'#eee1bd');
  if(act)beam(hand,[x,1.60+.06*Math.sin(clock*8),z+.30],.045,'#c5d3db');if(stage===3)for(let k=0;k<3;k++)orb(x-.45+k*.45,1.79+.04*Math.sin(clock*8+k),z,.055,'#83edb4');
 }else if(w.task.id==='lavagem'){
  // The existing orange car is centered at (39,-13), rotated sideways.
  for(let i=0;i<8;i++){const gone=completed(1),dirt=1-i/9;if(gone<dirt)shape('sphere',x-1.5+i*.43,1.05+(i%2)*.36,z-.28,.18,.12,.025,'#80604b')}
  const foam=Math.max(0,completed(0)-completed(2));for(let i=0;i<15*foam;i++)orb(x-1.4+(i%7)*.44,1.0+Math.floor(i/7)*.27,z-.21,.09,'#edfaff');
  if(act&&stage<2){const xx=x+.55*Math.sin(clock*3);box(xx,1.35+.2*Math.cos(clock*4),z-.12,.32,.17,.16,'#f4d36d');beam(hand,[xx,1.3,z-.12],.035,'#e9c1a2')}
  if(act&&stage===2)water(x+.2,1.65,z+.12,clock,p);
  if(stage===3)for(let k=0;k<4;k++)shape('star',x-1.2+k*.8,1.85+.1*Math.sin(clock*3+k),z-.28,.10,.10,.10,'#fff2b2',0,clock);
 }else if(w.task.id==='jardim'){
  box(x,.16,z,2.8,.28,1.3,'#936741');box(x,.32,z,2.52,.08,1.06,completed(0)>.7?'#604a32':'#7c6844');
  for(let k=0;k<5;k++){const px=x-1+k*.5,grow=clamp(completed(1)*5-k,0,1);if(grow){cyl(px,.39+.16*grow,z,.025,.30*grow,'#42934d');shape('sphere',px-.08,.49+.12*grow,z,.12,.04,.06,'#68b85e',0,0,.3);if(completed(2)>.4)for(let i=0;i<5;i++){const a=i*TAU/5;orb(px+.09*Math.cos(a),.81+.09*Math.sin(a),z,.075,k%2?'#ff9eb1':'#ffe283')}}}
  if(act&&stage<2){beam(hand,[x+.4*Math.sin(clock*4),.4,z+.25],.028,'#b8935c');box(x+.4*Math.sin(clock*4),.38,z+.25,.18,.07,.22,'#a6bdbe')}
  if(act&&stage===2)water(x+.2,1.45,z+.15,clock,p);
 }else if(w.task.id==='refeicao'){
  for(const side of[-1,1]){const xx=x+side*.56;if(stage>0||p>.45){cyl(xx,.23,z,.30,.15,'#718cab');cyl(xx,.31,z,.24,.025,'#344454');const food=completed(1);for(let k=0;k<16*food;k++)orb(xx+.16*Math.sin(k*2.4),.34,z+.15*Math.cos(k*2.4),.033,'#bb8450')}if(stage>1){cyl(xx,.23,z-.75,.27,.16,'#609db4');cyl(xx,.32,z-.75,.22,.018,completed(2)>.4?'#7cd6ed':'#2f505c')}}
  if(act&&stage===1){box(...hand,.35,.5,.18,'#e4b661');for(let k=0;k<6;k++)orb(x+.25*Math.sin(k),1.1-((clock*2+k/6)%1)*.7,z+.10,.03,'#bc8351')}
  if(act&&stage===2)water(x+.2,1.35,z-.25,clock,p);
 }else if(w.task.id==='organizar'){
  const tidy=completed(1);box(x+.8,.42,z,1.2,.70,.8,'#bb895a');box(x+.8,.8,z,.94,.04,.61,'#645044');
  for(let k=0;k<3;k++){const u=clamp(tidy*3-k,0,1),xx=mix(x-1.0+k*.45,x+.55+k*.19,u),zz=mix(z+.25+(k%2)*.2,z,u);orb(xx,.28+Math.sin(u*Math.PI)*.95+u*.57,zz,.11,['#ffbf53','#ed829e','#74bfe2'][k])}
  box(x-1,.54,z-.45,1.3,.12,.70,'#a77956');for(const dx of[-.5,.5])box(x-1+dx,.27,z-.45,.10,.54,.50,'#795a44');box(x-1,.71,z-.45,.85,.20,.5,completed(2)>.5?'#66b6c9':'#ad9f85');
  if(act&&stage===2)box(x-.9+.3*Math.sin(clock*5),.82,z-.1,.26,.04,.24,'#e3e6c5');
 }else{
  bench(x,z);monitor(x-.3,z-.12,stage,p,w.task.id==='aplicativo'?'code':'bars');
  if(w.task.id==='computador'){
   const lid=completed(1);box(x+.88,1.29,z+.05,.65,.72,.80,'#405c72');box(x+.88+.5*(1-lid),1.31+.35*(1-lid),z+.48,.66,.75,.05,'#69939f');
   for(let k=0;k<3;k++){const u=clamp(completed(0)*3-k,0,1);box(mix(x-.9+k*.25,x+.88,u),1.00+Math.sin(u*Math.PI)*.7+.12*u,z+.28,.18,.08,.25,['#59b887','#429ebf','#c4bc70'][k])}
   orb(x+.88,1.54,z+.46,.04,completed(2)>.4?'#76f6bb':'#cf8660');
  }else if(w.task.id==='rede'){
   box(x+.85,1.12,z+.07,.65,.24,.45,'#cfdae0');for(let k=0;k<3;k++)orb(x+.64+k*.2,1.15,z+.305,.035,completed(2)>.35?'#62e4a8':'#dd9965');
   for(const side of[-1,1])beam([x+.85+side*.22,1.22,z],[x+.85+side*(.22+.1*completed(1)),1.75,z],.025,'#334d64');
   const u=completed(0);beam([x+1.8,1,z+.7],[mix(x+1.8,x+.86,u),1.06,z+.31],.027,'#e8c765');
   if(stage===3)for(let k=0;k<3;k++)shape('torus',x+.85,1.75+k*.25,z,.13+k*.12,.10+k*.08,.018,'#6fe8c1');
  }else{
   const u=stage===1?p:stage>1?1:0;box(x+.83,1.20+Math.sin(u*Math.PI)*.45,z+.31,.29,.52,.065,'#203d50');box(x+.83,1.20+Math.sin(u*Math.PI)*.45,z+.35,.23,.43,.015,completed(1)>.7?'#6ed8b3':'#65b3d4');
   if(stage===2&&act){for(let k=0;k<6;k++)box(x-.8+k*.2,1.24,z-.24,.14,.07,.028,k/6<p?'#75ebbb':'#50616f')}
  }
 }
 // A subtle work marker keeps the station readable while changing camera angle.
 E.draw('torus',M.mul(M.tr(x,.20,z+1.35),M.mul(M.rx(Math.PI/2),M.s(.46,.46,.018))),'#e6c771');
}
const normalDraw=drawWorld;drawWorld=function(t){
 normalDraw(t);
 if(!window.__THIA_ACTIONS?.isActive()&&!window.__THIA_BATTERY_TEST?.isActive())for(const task of tasks){
  const step=progress(task.id);if(step&&work?.task.id!==task.id&&Math.hypot(player.x-task.at[0],player.z-task.at[1])<25)drawTask(t,{task,step,elapsed:0,phase:'preview'});
 }
 drawTask(t);
};
const normalObjective=updateObjective;
updateObjective=function(){normalObjective();boardButton.textContent=`📋 Objetivos ${count()}/9`;if(!work&&!ball&&!runQuest){const region=nearest().spot.id,next=tasks.find(t=>t.region===region&&progress(t.id)<3);$('missionTitle').textContent=`📋 ${count()}/9 tarefas concluídas`;$('missionText').textContent=next?`${next.icon} ${next.name} · AÇÃO para escolher uma tarefa.`:'Explore, brinque ou abra Objetivos para escolher sua próxima tarefa.'}};
const normalMenu=menuDialog;menuDialog=function(){normalMenu();const b=document.createElement('button');b.textContent='📋 Ver os nove objetivos';b.onclick=()=>openBoard('all');$('menuChoices').prepend(b)};$('menuBtn').onclick=menuDialog;
window.__THIA_WORK={open:openBoard,begin,leave,tasks,isActive:()=>!!work,current:()=>work?{id:work.task.id,step:work.step,phase:work.phase,elapsed:work.elapsed}:null,progress,count};
updateObjective();
})();
