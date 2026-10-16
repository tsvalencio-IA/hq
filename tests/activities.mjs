import {chromium,devices} from 'playwright';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const output=new URL('../test-results/',import.meta.url);fs.mkdirSync(output,{recursive:true});
const server=spawn('python3',['-u','-m','http.server','8032','--bind','127.0.0.1'],{cwd:new URL('../',import.meta.url),stdio:['ignore','pipe','pipe']});await once(server.stdout,'data');
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const checks=[],errors=[];const check=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS',name)};
const listen=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())})};
const frame=p=>p.evaluate(()=>new Promise(requestAnimationFrame));
const shot=(p,name)=>p.screenshot({path:new URL(name+'.png',output).pathname});
async function load(p){await p.goto('http://127.0.0.1:8032/3d/',{waitUntil:'networkidle'});await p.waitForFunction(()=>window.__THIA_WORK);await p.locator('#start').click()}
async function finishStep(p){await p.locator('#workDo').click();await p.evaluate(()=>gameStep(7));await frame(p)}
async function cameraTest(p,label,viewport){
 const before=await p.evaluate(()=>({yaw:camera.yaw,pitch:camera.pitch,dist:camera.dist,eye:camera.eye.slice(),elapsed:__THIA_WORK.current().elapsed}));
 await p.mouse.move(viewport.width*.42,viewport.height*.38);await p.mouse.down();await p.mouse.move(viewport.width*.68,viewport.height*.48,{steps:6});await p.mouse.up();
 await p.getByRole('button',{name:'Aproximar câmera',exact:true}).click();await p.getByRole('button',{name:'Elevar câmera',exact:true}).click();await frame(p);
 const after=await p.evaluate(()=>({yaw:camera.yaw,pitch:camera.pitch,dist:camera.dist,eye:camera.eye.slice(),elapsed:__THIA_WORK.current().elapsed}));
 check(label+': real camera orbit, elevation and zoom while paused',Math.abs(after.yaw-before.yaw)>.3&&after.pitch!==before.pitch&&after.dist<before.dist&&JSON.stringify(after.eye)!==JSON.stringify(before.eye));
 check(label+': observing does not advance the action',Math.abs(before.elapsed-after.elapsed)<.001);
 await p.getByRole('button',{name:'Reenquadrar',exact:true}).click();
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});listen(page);await load(page);
 await page.locator('#objectivesBtn').click();check('Nine concrete tasks are available',await page.locator('[data-task]').count()===9);
 await page.locator('[data-region="family"]').click();check('House includes three tasks',await page.locator('[data-task]').count()===3);
 await page.locator('#closeDialog').click();
 for(const region of ['family','garage','code']){await page.evaluate(region=>__THIA_TEST.openLocation(region),region);check(region+': ACTION opens local tasks',await page.locator('[data-task]').count()===3);await page.locator('#closeDialog').click()}
 const original=await page.evaluate(()=>({x:player.x,z:player.z,stars:state.stars}));
 await page.locator('#objectivesBtn').click();await page.locator('[data-task="roda"]').click();await finishStep(page);
 check('Progress is recorded after a completed stage, without early reward',await page.evaluate(s=>__THIA_WORK.progress('roda')===1&&state.stars===s,original.stars));
 await page.locator('#workLeave').click();check('Exit restores exploration position',await page.evaluate(o=>Math.hypot(player.x-o.x,player.z-o.z)<.001,original));
 await page.reload({waitUntil:'networkidle'});await page.locator('#start').click();
 await page.locator('#objectivesBtn').click();check('Partial task survives reload with a resume button',await page.locator('[data-task="roda"]').innerText().then(t=>t.includes('Retomar etapa 2/3')));await page.locator('#closeDialog').click();
 const tasks=await page.evaluate(()=>__THIA_WORK.tasks.map(t=>({id:t.id,region:t.region,poses:t.steps.map(s=>s[2])})));
 for(const task of tasks){
  await page.locator('#objectivesBtn').click();await page.locator(`[data-task="${task.id}"]`).click();
  const first=await page.evaluate(()=>__THIA_WORK.current().step),stars=await page.evaluate(()=>state.stars);
  for(let step=first;step<3;step++){
   await page.locator('#workDo').click();await page.evaluate(()=>gameStep(3.0));await frame(page);
   check(`${task.id} stage ${step+1}: avatar performs the intended action`,await page.evaluate(pose=>mascotStudio.snapshot[state.avatar].pose===pose,task.poses[step]));
   if(step===1){
    await page.locator('#workDo').click();await cameraTest(page,task.id,{width:1440,height:900});await shot(page,'task-'+task.id);await page.locator('#workDo').click();
   }
   await page.evaluate(()=>gameStep(7));await frame(page);
   check(`${task.id} stage ${step+1}: completed state is saved`,await page.evaluate(({id,n})=>__THIA_WORK.progress(id)===n,{id:task.id,n:step+1}));
   if(step<2)check(`${task.id}: next stage waits for the player`,await page.evaluate(()=>__THIA_WORK.current().phase==='ready'));
  }
  check(task.id+': objective rewards completion',await page.evaluate(stars=>state.stars>=stars+90,stars));
  await page.locator('#workReplay').click();await page.evaluate(()=>gameStep(7));await frame(page);
  check(task.id+': replaying a stage preserves completion',await page.evaluate(id=>__THIA_WORK.progress(id)===3&&__THIA_WORK.current().phase==='complete',task.id));
  await page.locator('#workLeave').click();
 }
 check('All nine objectives and three area achievements complete',await page.evaluate(()=>__THIA_WORK.count()===9&&['family','garage','code'].every(r=>state.medals['work_'+r])));
 const reward=await page.evaluate(()=>state.stars);await page.evaluate(()=>__THIA_WORK.begin('motor'));await page.locator('#workDo').click();
 for(let i=0;i<3;i++)await finishStep(page);
 check('Repeating a completed task does not farm rewards',await page.evaluate(reward=>state.stars===reward&&__THIA_WORK.count()===9,reward));await page.locator('#workLeave').click();
 await page.reload({waitUntil:'networkidle'});await page.locator('#start').click();check('Completed objectives and rewards survive reload',await page.evaluate(reward=>__THIA_WORK.count()===9&&state.stars===reward,reward));
 await page.close();
 for(const [name,viewport] of [['phone',{width:393,height:852}],['small-phone',{width:320,height:568}],['landscape',{width:852,height:393}]]){
  const context=await browser.newContext({...devices['Pixel 7'],viewport,deviceScaleFactor:1});const phone=await context.newPage();listen(phone);await load(phone);
  await phone.locator('#menuBtn').click();await phone.getByRole('button',{name:'Controlar Thamis',exact:true}).click();
  await phone.locator('#objectivesBtn').click();await phone.locator('[data-task="jardim"]').click();await phone.locator('#workDo').click();await phone.evaluate(()=>gameStep(3));await phone.locator('#workDo').click();await frame(phone);
  check(name+': Thamis performs the garden action',await phone.evaluate(()=>state.avatar==='thamis'&&mascotStudio.snapshot.thamis.pose==='garden'));
  await cameraTest(phone,name,viewport);
  const touch=await context.newCDPSession(phone),distance=await phone.evaluate(()=>camera.dist);
  const point=(id,x)=>({id,x:viewport.width*x,y:viewport.height*.4});
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point(1,.45),point(2,.60)]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[point(1,.36),point(2,.69)]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await frame(phone);
  check(name+': two-finger pinch zoom works during the action',await phone.evaluate(d=>camera.dist<d-.5,distance));
  await phone.getByRole('button',{name:'Reenquadrar',exact:true}).click();
  check(name+': panels and buttons fit screen',await phone.evaluate(()=>['workPanel','workCamera'].every(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})&&document.documentElement.scrollWidth<=innerWidth));
  check(name+': task panel leaves the working avatar visible',await phone.evaluate(()=>{
   const point=M.project(camera.vp,[player.x,1.7,player.z],E.width,E.height),panels=['workPanel','workCamera'].map(id=>document.getElementById(id).getBoundingClientRect());
   return point&&point[0]>0&&point[0]<innerWidth&&point[1]>35&&point[1]<innerHeight&&panels.every(r=>point[0]<r.left||point[0]>r.right||point[1]<r.top||point[1]>r.bottom);
  }));
  await shot(phone,'work-'+name);
  await phone.locator('#workLeave').click();check(name+': cancelled work does not complete a stage',await phone.evaluate(()=>__THIA_WORK.progress('jardim')===0&&!__THIA_WORK.isActive()));
  await phone.evaluate(()=>__THIA_WORK.begin('refeicao'));for(let i=0;i<2;i++)await finishStep(phone);await phone.locator('#workDo').click();await phone.evaluate(()=>gameStep(5));await frame(phone);
  check(name+': both dogs approach their meal',await phone.evaluate(()=>pets.every(d=>Math.hypot(d.x-(-.5+(d.id==='luna'?-.56:.56)),d.z-(-4.5+.47))<.2)));
  check(name+': dogs visibly lower their heads to eat',await phone.evaluate(()=>mascotStudio.snapshot.luna.feeding&&mascotStudio.snapshot.liz.feeding));
  await phone.locator('#workDo').click();await frame(phone);await shot(phone,'meal-'+name);
  check(name+': healthy WebGL after all work effects',await phone.evaluate(()=>E.gl.getError()===0));await context.close();
 }
 check('No runtime or console errors',errors.length===0);
 fs.writeFileSync(new URL('activities-report.json',output),JSON.stringify({result:'passed',checks,errors,tasks:9,stages:27},null,2));console.log(JSON.stringify({result:'passed',activityChecks:checks.length,tasks:9,stages:27}));
}catch(error){fs.writeFileSync(new URL('activities-report.json',output),JSON.stringify({result:'failed',error:error.message,checks,errors},null,2));for(const p of browser.contexts().flatMap(c=>c.pages()))await shot(p,'activities-failure').catch(()=>{});throw error}finally{await browser.close();server.kill()}
