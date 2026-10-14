/* thIAguinho HQ V3: UI accessible, ambient speech, enhanced game animation */
'use strict';
(function(){
 const app=document.getElementById('app');const world=document.getElementById('world');const dock=document.getElementById('gameArea');const nav=document.querySelector('nav');
 if(!app||!world||!dock||!nav||typeof data==='undefined')return;
 app.insertBefore(dock,nav); // controls never overlap the playable canvas
 const brand=document.querySelector('.brand small');if(brand)brand.textContent='HQ INTERATIVA · V3';
 const headerRight=document.createElement('div');headerRight.id='headerRight';
 const reset=document.getElementById('reset');reset.parentNode.insertBefore(headerRight,reset);headerRight.append(reset);
 const voice=document.createElement('button');voice.id='voiceToggle';voice.type='button';voice.title='Ativar ou desativar falas';voice.setAttribute('aria-label','Ativar falas dos personagens');voice.textContent='🔇';headerRight.insertBefore(voice,reset);
 const coach=document.createElement('div');coach.id='coach';coach.setAttribute('role','status');coach.setAttribute('aria-live','polite');world.append(coach);
 const medal=document.createElement('div');medal.id='medal';world.append(medal);
 const rotateHint=document.createElement('div');rotateHint.id='rotateHint';rotateHint.textContent='Arraste para explorar • Toque para agir';world.append(rotateHint);
 let talking=false,talkTimeout=0,spokenAt=0,medals={};
 try{medals=JSON.parse(localStorage.getItem('hq_medals_v3')||'{}')||{}}catch{}
 function updateMedal(){let n=Object.values(medals).filter(Boolean).length;medal.textContent=n?`🏆 ${n} / 4 aventuras`:''}
 updateMedal();
 voice.onclick=()=>{talking=!talking;voice.textContent=talking?'🔊':'🔇';voice.title=talking?'Silenciar':'Ativar falas';talk(talking?'Vamos brincar! Escolha uma aventura.':'Falas desativadas.',false)};
 function talk(line,audio=true){coach.textContent=line;coach.classList.add('show');clearTimeout(talkTimeout);talkTimeout=setTimeout(()=>coach.classList.remove('show'),Math.max(2600,Math.min(4600,line.length*58)));if(audio&&talking&&'speechSynthesis'in window&&Date.now()-spokenAt>1200){spokenAt=Date.now();speechSynthesis.cancel();let ut=new SpeechSynthesisUtterance(line.replace(/[⭐💥✅❤️🏆🐶🎾🎯]/gu,''));ut.lang='pt-BR';ut.rate=1.06;ut.pitch=1.05;ut.volume=.8;speechSynthesis.speak(ut)}}
 const oldMessage=gameMessage;gameMessage=function(s){oldMessage(s); if(/capturad|Desvio perfeito|Cone!|Barreira!|Pegaram a bolinha|encaixada|Montagem|Inicie|Scanner ligado|Vai buscar/i.test(s)){talk(s.replace(/[✓💥]/g,''),true)}};
 const oldComplete=complete;complete=function(title,desc){oldComplete(title,desc);medals[data.scene]=true;try{localStorage.setItem('hq_medals_v3',JSON.stringify(medals))}catch{}updateMedal();talk(title+'. '+(data.scene==='familia'?'Missão em família concluída!':'Você conseguiu!'),true);makeConfetti()};
 const oldScene=setScene;setScene=function(k){oldScene(k);const tips={corrida:'Thiago: “Preparada, Thamis? Vamos juntos!”',oficina:'Thiago: “O scanner dá pistas; os testes confirmam.”',tecnologia:'Thiago: “Uma ideia por vez, vamos construir!”',familia:'Thamis: “Meninas, vamos brincar?”'};talk(tips[k],false);restyleActions();updateMedal();};
 const oldSetup=setupScene;setupScene=function(){oldSetup();restyleActions()};
 function restyleActions(){let buttons=[...document.querySelectorAll('#actions button')];const scene=data.scene;const short={start:data.run.active?'⏸ PAUSA':'▶ CORRER',jump:'⬆ PULAR',slide:'⬇ ABAIXAR',boost:'⚡ TURBO',scan:data.shop.power?'🎯 CAPTURAR':'🔌 SCANNER',retry:'↺ REFAZER','reset-steps':'↺ REFAZER',hint:'💡 DICA',throw:'🎾 LANÇAR',call:'🐾 CHAMAR'};for(const b of buttons){if(short[b.dataset.action]) b.textContent=short[b.dataset.action];b.setAttribute('aria-label',b.dataset.action==='boost'?'Segure para acelerar':b.textContent)}dock.dataset.scene=scene;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.scene===scene?'true':'false'));}
 // Build a tiny illustrated rig around the existing faithful character sprites.
 // Limb strokes stay behind the portrait and are visible during activities, without a photo mask.
 const originalImage=image;
 function swaylimb(ax,ay,bx,by,cx,cy,color,sleeve,amp,skin){g.save();g.lineCap='round';g.lineJoin='round';g.strokeStyle=sleeve;g.lineWidth=15;g.beginPath();g.moveTo(ax,ay);g.lineTo(bx,by);g.stroke();g.strokeStyle=skin;g.lineWidth=12;g.beginPath();g.moveTo(bx,by);g.lineTo(cx,cy);g.stroke();g.fillStyle=skin;g.beginPath();g.ellipse(cx,cy,7.5,9.5,amp,0,Math.PI*2);g.fill();g.restore();}
 image=function(name,x,fy,h,sway=0,alpha=1,flip=false){const active=data.scene==='corrida'&&data.run.active&&!data.run.finished;const celebrating=data.scene==='familia'&&data.home.ball;
  const runPhase=data.t*(data.run.boost?16:12)+(name==='thamis'?1.5:0);const doGesture=(name==='thiago'||name==='thamis')&&(active||celebrating||(data.scene==='oficina'&&data.shop.power));
  if(doGesture){const fac=h/560;const side=name==='thiago'?-1:1;const theta=active?Math.sin(runPhase)*.68:celebrating?Math.sin(data.t*7)*.6:.15;
   const shoulder=x+side*h*.16, sy=fy-h*.60;const elbow=shoulder+side*(20+theta*18)*fac,ey=sy+(25+Math.cos(theta)*15)*fac;
   swaylimb(shoulder,sy,elbow,ey,elbow+side*16*fac,ey-27*fac,'',name==='thiago'?'#173550':'#f97d36',theta,'#d79871');}
  g.save();g.translate(x,fy);let lean=active?Math.sin(runPhase)*.033:celebrating?Math.sin(data.t*5)*.02:Math.sin(data.t*1.5+sway)*.004;g.rotate(lean);if(active){const stride=Math.sin(runPhase)*4;g.translate(stride,Math.abs(Math.sin(runPhase))*-2)}
  originalImage(name,0,0,(data.scene==='corrida'||data.scene==='tecnologia')?h*1.13:h,sway,alpha,flip);g.restore();
  if(active&&(name==='thiago'||name==='thamis')){const phase=Math.sin(runPhase);g.save();g.strokeStyle='rgba(255,245,220,.7)';g.lineWidth=2.4;for(let i=0;i<2;i++){let px=x-18+(i*16),yy=fy-8+i*8;g.beginPath();g.moveTo(px-10,yy);g.lineTo(px-28-Math.abs(phase)*10,yy+2);g.stroke()}g.restore();}
 };
 // Suppress the legacy instructional labels drawn directly over the stage.
 const originalDrawText=drawText;drawText=function(t,...params){if(/APERTE.*INICIAR CORRIDA|▶ CORRENDO|TOQUE NO JARDIM PARA BRINCAR/i.test(t))return;return originalDrawText(t,...params)};
 // Narration/visual feedback on characters and interactions.
 const oldDraw=draw;draw=function(){oldDraw();if(data.scene==='corrida'&&data.run.active){const r=data.run;g.save();g.fillStyle='rgba(5,27,42,.55)';g.beginPath();g.roundRect(data.W*.28-64,230,128,25,13);g.fill();g.font='800 11px system-ui';g.textAlign='center';g.fillStyle='#fff3bf';g.fillText(r.boost?'TURBO ⚡':'EM MOVIMENTO',data.W*.28,246);g.restore();}};
 function makeConfetti(){if(!('animate'in HTMLElement.prototype))return;const layer=document.createElement('div');layer.style.cssText='position:absolute;inset:0;pointer-events:none;z-index:18;overflow:hidden';world.append(layer);for(let i=0;i<24;i++){const dot=document.createElement('i');const left=10+Math.random()*80;const col=['#ffcf78','#69d4ef','#fa7a9b','#a3f5ca'][i%4];dot.style.cssText=`position:absolute;left:${left}%;top:-12px;width:${5+Math.random()*5}px;height:12px;background:${col};border-radius:2px;transform:rotate(${Math.random()*120}deg)`;layer.append(dot);dot.animate([{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${(Math.random()-.5)*100}px,${world.clientHeight+40}px) rotate(540deg)`,opacity:0}],{duration:1500+Math.random()*1100,fill:'forwards'})}setTimeout(()=>layer.remove(),2800)}
 const originalRestart=restartCurrent;restartCurrent=function(){originalRestart();talk('Vamos tentar novamente! Você consegue.',false);restyleActions();};
 // Watch compact dock for action-label changes in the existing game engine.
 const dockObserver=new MutationObserver(()=>{if(dock.dataset.busy)return;dock.dataset.busy='1';queueMicrotask(()=>{restyleActions();dock.dataset.busy=''})});dockObserver.observe(document.getElementById('actions'),{childList:true});
 // Capture horizontal swipes in the mobile game - change episodes, but never steal vertical scroll.
 let touch=null;world.addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY,time:Date.now()}});world.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(Math.abs(dx)>95&&Math.abs(dx)>Math.abs(dy)*1.8&&Date.now()-touch.time<550){let idx=names.indexOf(data.scene);let n=names[Math.max(0,Math.min(names.length-1,idx+(dx<0?1:-1)))];if(n!==data.scene)setScene(n)}touch=null;});
 document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{talk({corrida:'Pule os cones e abaixe sob as barreiras!',oficina:'Capture os sinais na faixa verde!',tecnologia:'Monte as quatro etapas, uma de cada vez!',familia:'Jogue a bolinha para as nossas meninas!'}[b.dataset.scene],false)}));
 restyleActions();layout();talk('Vamos correr juntos! Pule os cones, abaixe nas barreiras.',false);
})();