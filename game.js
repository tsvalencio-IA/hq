const ASSETS = {
  thiago: 'assets/thiago.webp',
  thamis: 'assets/thamis.webp',
  luna: 'assets/clara.webp',
  liz: 'assets/pretinha.webp',
  corrida: 'assets/bg_corrida.webp',
  oficina: 'assets/bg_oficina.webp',
  sistemas: 'assets/bg_tecnologia.webp',
  familia: 'assets/bg_familia.webp'
};

const app = {
  playfield: document.getElementById('playfield'),
  sceneControls: document.getElementById('sceneControls'),
  sceneTabs: [...document.querySelectorAll('.scene-tab')],
  chapterName: document.getElementById('chapterName'),
  missionProgress: document.getElementById('missionProgress'),
  starCount: document.getElementById('starCount'),
  lifeCount: document.getElementById('lifeCount'),
  objectiveTitle: document.getElementById('objectiveTitle'),
  objectiveText: document.getElementById('objectiveText'),
  objectiveExtra: document.getElementById('objectiveExtra'),
  speakerName: document.getElementById('speakerName'),
  dialogText: document.getElementById('dialogText'),
  resetBtn: document.getElementById('resetBtn'),
  voiceBtn: document.getElementById('voiceBtn')
};

const state = {
  scene: 'familia',
  totalStars: 0,
  lives: 3,
  voice: false,
  victories: (()=>{try{return JSON.parse(localStorage.getItem('hq_v4_completed') || '{}')||{};}catch{return {};}})(),
  lastTime: 0,
  sceneState: null,
  raf: null,
  dims: { width: 0, height: 0 },
};

const scenes = {};
let toastTimer = 0;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rnd(min, max) { return Math.random() * (max - min) + min; }
function percent(value, total) { return Math.round(clamp(value / total, 0, 1) * 100); }
function px(v) { return `${v}px`; }
function byId(id) { return document.getElementById(id); }

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'feedback-toast';
  el.textContent = msg;
  app.playfield.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 1800);
}

function speak(text) {
  if (!state.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    u.rate = 1.02;
    speechSynthesis.speak(u);
  } catch { /* noop */ }
}

function setDialog(speaker, text) {
  app.speakerName.textContent = speaker;
  app.dialogText.textContent = text;
  speak(`${speaker}. ${text}`);
}

function updateHud(extra = {}) {
  app.chapterName.textContent = extra.chapter || state.scene[0].toUpperCase() + state.scene.slice(1);
  app.missionProgress.textContent = `${extra.progress ?? 0}%`;
  app.starCount.textContent = state.totalStars;
  app.lifeCount.textContent = state.lives;
  if (state.victories[state.scene]) app.missionProgress.textContent = '✓ 100%';
  if (extra.title) app.objectiveTitle.textContent = extra.title;
  if (extra.text) app.objectiveText.textContent = extra.text;
  if (extra.extra) app.objectiveExtra.textContent = extra.extra;
}

function clearPlayfield() {
  app.playfield.innerHTML = '';
  app.playfield.style.cursor = 'default';
  app.playfield.style.backgroundImage = '';
}

function createSceneBase(background, overlay = true) {
  clearPlayfield();
  app.playfield.style.backgroundImage = `linear-gradient(rgba(7,22,37,.12), rgba(7,22,37,.24)), url(${background})`;
  const sceneLayer = document.createElement('div');
  sceneLayer.className = 'scene-layer';
  sceneLayer.id = 'sceneLayer';
  app.playfield.appendChild(sceneLayer);

  const ground = document.createElement('div');
  ground.className = 'ground-shadow';
  sceneLayer.appendChild(ground);

  if (overlay) {
    const road = document.createElement('div');
    road.className = 'road-strip';
    road.style.backgroundImage = 'linear-gradient(90deg, rgba(255,255,255,.35) 0 18px, rgba(255,255,255,0) 18px 40px)';
    sceneLayer.appendChild(road);
  }
  return sceneLayer;
}

function makeActor(asset, label, size = 120, className = 'idle') {
  const tpl = document.getElementById('characterTemplate');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.classList.add(className);
  node.style.setProperty('--actor-w', `${size}px`);
  const img = node.querySelector('img');
  img.src = asset;
  const tag = document.createElement('div');
  tag.className = 'character-tag';
  tag.textContent = label;
  node.appendChild(tag);
  if (['Thiago','Thamis'].includes(label)) {
    const lower = img.cloneNode(); lower.className='actor-lower'; lower.alt=''; lower.setAttribute('aria-hidden','true'); node.querySelector('.actor-bob').appendChild(lower);
  }
  return node;
}

function setScene(sceneName) {
  if (!scenes[sceneName]) return;
  app.playfield.onpointerdown = null; app.playfield.onpointermove = null; app.playfield.onpointerup = null; app.playfield.onpointercancel = null;
  state.lives = 3;
  state.scene = sceneName;
  app.sceneTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.scene === sceneName));
  scenes[sceneName].enter();
}

function loseLife(reason) {
  state.lives = Math.max(0, state.lives - 1);
  toast(`-${1} vida • ${reason}`);
  if (state.lives === 0) {
    setDialog('thIAguinho', 'Calma! Vamos tentar de novo com método e capricho.');
  }
}

function addStars(qtd, reason = '') {
  state.totalStars += qtd;
  toast(`+${qtd} estrela${qtd > 1 ? 's' : ''}${reason ? ' • ' + reason : ''}`);
}

function setButtons(buttons) {
  app.sceneControls.innerHTML = '';
  buttons.forEach(btn => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `action-btn ${btn.primary ? 'primary' : ''} ${btn.disabled ? 'disabled' : ''}`;
    el.textContent = btn.label;
    el.addEventListener('click', btn.onClick);
    app.sceneControls.appendChild(el);
  });
}

function syncDims() {
  const r = app.playfield.getBoundingClientRect();
  state.dims.width = r.width;
  state.dims.height = r.height;
}
window.addEventListener('resize', syncDims);

scenes.corrida = {
  enter() {
    syncDims();
    const layer = createSceneBase(ASSETS.corrida);
    const runners = document.createElement('div');
    runners.style.position = 'absolute';
    runners.style.left = '11%';
    runners.style.bottom = '16%';
    runners.style.width = '240px';
    runners.style.height = '260px';
    layer.appendChild(runners);

    const thiago = makeActor(ASSETS.thiago, 'Thiago', 112, 'idle');
    const thamis = makeActor(ASSETS.thamis, 'Thamis', 126, 'idle');
    thiago.style.left = '0px'; thiago.style.bottom = '0px';
    thamis.style.left = '96px'; thamis.style.bottom = '-2px';
    runners.appendChild(thiago); runners.appendChild(thamis);

    const entityLayer = document.createElement('div');
    entityLayer.className = 'fx-layer';
    layer.appendChild(entityLayer);

    state.sceneState = {
      type: 'corrida', started: false, finished: false, sceneLayer: layer, entityLayer,
      thiago, thamis, progress: 0, distance: 0, targetDistance: 1700,
      speed: 205, boost: 1, boostTimer: 0, jumpTimer: 0, slideTimer: 0,
      lastObstacle: 0, lastStar: 0, obstacles: [], tokens: [], hitCooldown: 0
    };

    setDialog('Thiago', 'Bora correr juntos. Pula os cones, desliza nas barreiras e chega até o fim!');
    updateHud({ chapter: 'Corrida', progress: 0, title: 'Nossa corrida', text: 'Corra com a Thamis, pule cones, deslize nas barreiras e termine a pista com energia.', extra: 'Pista viva' });
    this.refreshButtons();
  },
  refreshButtons() {
    const s = state.sceneState;
    setButtons([
      { label: s.started ? '▶ Continuar' : '▶ Iniciar corrida', primary: true, onClick: () => { s.started = true; s.finished = false; s.thiago?.classList.add('running'); s.thamis?.classList.add('running'); s.thiago?.classList.remove('idle'); s.thamis?.classList.remove('idle'); setDialog('Thamis', 'Vai! Ritmo, foco e qualidade de vida!'); } },
      { label: '↑ Pular', onClick: () => { if (!s.started || s.jumpTimer > 0) return; s.jumpTimer = .85; setDialog('Thiago', 'Pulando!'); } },
      { label: '↓ Deslizar', onClick: () => { if (!s.started || s.slideTimer > 0) return; s.slideTimer = .8; setDialog('Thamis', 'Passa baixo!'); } },
      { label: '⚡ Acelerar', onClick: () => { if (!s.started) return; s.boostTimer = 1.5; s.boost = 1.55; setDialog('thIAguinho', 'Turbo liberado!'); } }
    ]);
  },
  update(dt) {
    const s = state.sceneState; if (!s || s.type !== 'corrida') return;
    if (!s.started || s.finished || state.lives <= 0) return;
    s.distance += s.speed * s.boost * dt;
    s.progress = percent(s.distance, s.targetDistance);
    s.lastObstacle += dt;
    s.lastStar += dt;
    s.hitCooldown = Math.max(0, s.hitCooldown - dt);
    s.boostTimer = Math.max(0, s.boostTimer - dt);
    if (s.boostTimer <= 0) s.boost = 1;
    s.jumpTimer = Math.max(0, s.jumpTimer - dt);
    s.slideTimer = Math.max(0, s.slideTimer - dt);

    const jumpPhase = s.jumpTimer > 0 ? Math.sin((1 - s.jumpTimer / 0.85) * Math.PI) : 0;
    const jumpY = jumpPhase * 120;
    s.thiago.style.transform = `translateY(${-jumpY}px)`;
    s.thamis.style.transform = `translateY(${-jumpY * 0.92}px)`;
    if (s.slideTimer > 0) {
      s.thiago.style.bottom = '-16px'; s.thamis.style.bottom = '-18px';
      s.thiago.style.transform += ' scaleY(.85)'; s.thamis.style.transform += ' scaleY(.85)';
    } else {
      s.thiago.style.bottom = '0px'; s.thamis.style.bottom = '-2px';
    }

    if (s.lastObstacle > 1.45) {
      s.lastObstacle = 0;
      const type = Math.random() > 0.5 ? 'cone' : 'barrier';
      const el = document.createElement('div');
      el.className = `obstacle ${type}`;
      s.entityLayer.appendChild(el);
      s.obstacles.push({ el, type, x: state.dims.width + 30, y: type === 'cone' ? state.dims.height * .2 : state.dims.height * .16 });
    }
    if (s.lastStar > 1.55) {
      s.lastStar = 0;
      const el = document.createElement('div');
      el.className = 'token';
      s.entityLayer.appendChild(el);
      s.tokens.push({ el, x: state.dims.width + 20, y: state.dims.height * (Math.random() > .5 ? .26 : .22) });
    }

    const playerX = state.dims.width * .18;
    s.obstacles = s.obstacles.filter(item => {
      item.x -= (s.speed * 1.8 + 50) * dt;
      item.el.style.left = px(item.x);
      item.el.style.bottom = px(item.y);
      if (item.x < -120) { item.el.remove(); return false; }
      const close = Math.abs(item.x - playerX) < (item.type === 'cone' ? 28 : 60);
      if (close && s.hitCooldown <= 0 && !item.resolved) {
        item.resolved = true;
        const avoided = item.type === 'cone' ? jumpY > 55 : s.slideTimer > .15;
        if (!avoided) {
          s.hitCooldown = 1;
          loseLife(item.type === 'cone' ? 'Cone derrubado' : 'Barreira atingida');
          s.thiago.classList.add('hit'); s.thamis.classList.add('hit');
          setTimeout(() => { s.thiago.classList.remove('hit'); s.thamis.classList.remove('hit'); }, 250);
        } else {
          addStars(1, 'desvio limpo');
        }
      }
      return true;
    });

    s.tokens = s.tokens.filter(item => {
      item.x -= (s.speed * 1.8 + 50) * dt;
      item.el.style.left = px(item.x);
      item.el.style.bottom = px(item.y + (Math.sin(item.x / 30) * 4));
      if (item.x < -50) { item.el.remove(); return false; }
      const close = Math.abs(item.x - playerX) < 24 && jumpY + 50 > (item.y - state.dims.height * .18);
      if (close) { item.el.remove(); addStars(1, 'ritmo'); return false; }
      return true;
    });

    if (s.progress >= 100) {
      s.finished = true;
      addStars(5, 'pista concluída');
      setDialog('Thamis', 'Conseguimos! Disciplina e parceria!');
      updateHud({ chapter: 'Corrida', progress: 100, title: 'Corrida concluída', text: 'Vocês terminaram a pista. Agora siga para outro capítulo jogável.', extra: 'Vitória!' });
      completeMission('corrida','Corrida concluída com Thamis!');
      this.refreshButtons();
    } else {
      updateHud({ chapter: 'Corrida', progress: s.progress, title: 'Nossa corrida', text: 'Corra com a Thamis, pule cones, deslize nas barreiras e termine a pista com energia.', extra: 'Meta: 100%' });
    }
  }
};

scenes.oficina = {
  enter() {
    syncDims();
    const layer = createSceneBase(ASSETS.oficina, false);
    const thiago = makeActor(ASSETS.thiago, 'Thiago', 136, 'idle');
    thiago.style.left = '3%'; thiago.style.bottom = '14%';
    layer.appendChild(thiago);

    const car = document.createElement('div');
    car.className = 'car';
    car.innerHTML = '<div class="car-top"></div><div class="car-body"></div><div class="hood"></div><div class="wheel left"></div><div class="wheel right"></div>';
    layer.appendChild(car);

    const panel = document.createElement('div');
    panel.className = 'scan-panel';
    panel.innerHTML = `
      <h3>Treino técnico (simulação)</h3>
      <div class="gauge"><div class="gauge-label"><span>RPM</span><span id="rpmRead">0</span></div><div class="gauge-track"><div class="gauge-fill" id="gFill1"></div><div class="gauge-needle" id="gNeedle1"></div></div></div>
      <div class="gauge"><div class="gauge-label"><span>Tensão</span><span id="voltRead">0 V</span></div><div class="gauge-track"><div class="gauge-fill" id="gFill2"></div><div class="gauge-needle" id="gNeedle2"></div></div></div>
      <div class="gauge"><div class="gauge-label"><span>Pressão</span><span id="pressRead">0 kPa</span></div><div class="gauge-track"><div class="gauge-fill" id="gFill3"></div><div class="gauge-needle" id="gNeedle3"></div></div></div>
      <div class="label">Capturas corretas: <span id="captureCount">0</span>/3</div>`;
    layer.appendChild(panel);

    const result = document.createElement('div');
    result.className = 'result-panel';
    result.style.top = 'auto';
    result.style.bottom = '90px';
    result.innerHTML = '<h3>Plano de trabalho</h3><div id="oficinaStatus">1) Ler dados<br>2) Testar em carga<br>3) Confirmar reparo</div>';
    layer.appendChild(result);

    state.sceneState = {
      type: 'oficina', layer, thiago, panel, result,
      step: 0, captures: 0, gaugeTime: 0, finished: false, bolts: [], orderIndex: 0,
      choices: ['Ler scanner', 'Testar em carga', 'Trocar peça no chute', 'Conferir sensores', 'Confirmar reparo'],
      expected: ['Ler scanner', 'Testar em carga', 'Conferir sensores', 'Confirmar reparo']
    };

    setDialog('Thiago', 'Na oficina não é chute. Primeiro leitura, depois teste, comparação e só então reparo.');
    updateHud({ chapter: 'Oficina', progress: 0, title: 'Diagnóstico correto', text: 'Treine medição, comparação e sequência técnica. Valores fictícios para o jogo.', extra: 'Método' });
    this.renderBolts();
    this.refreshButtons();
  },
  renderBolts() {
    const s = state.sceneState;
    s.bolts.forEach(b => b.el.remove());
    s.bolts = [];
    const positions = [ [36,34], [68,34], [42,56], [62,56] ];
    positions.forEach(([x,y], idx) => {
      const el = document.createElement('button');
      el.className = 'bolt';
      el.textContent = '✚';
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.addEventListener('click', () => {
        if (state.scene !== 'oficina' || s.step < 3 || el.classList.contains('done')) return;
        el.classList.add('done');
        addStars(1, 'parafuso');
        const allDone = s.bolts.every(b => b.el.classList.contains('done'));
        if (allDone) {
          s.finished = true;
          addStars(4, 'reparo finalizado');
          setDialog('thIAguinho', 'Etapas concluídas no simulador. Um carro real exigiria conferir a causa com medições.');
          completeMission('oficina','Diagnóstico simulado concluído');
        }
      });
      s.bolts.push({ el, idx });
      s.layer.appendChild(el);
    });
  },
  refreshButtons() {
    const s = state.sceneState;
    const buttons = [];
    if (s.step === 0) buttons.push({ label: '🔌 Conectar scanner', primary: true, onClick: () => { s.step = 1; s.thiago.classList.add('talking'); setTimeout(()=>s.thiago.classList.remove('talking'),600); setDialog('Thiago', 'Agora capture 3 boas leituras no momento certo.'); } });
    if (s.step === 1) buttons.push({ label: '📸 Capturar leitura', primary: true, onClick: () => this.captureReading() });
    if (s.step === 2) {
      s.choices.forEach(label => buttons.push({ label, onClick: () => this.pickChoice(label) }));
    }
    if (s.step >= 3) buttons.push({ label: '🔩 Apertar parafusos', primary: true, onClick: () => setDialog('ThIAguinho', 'Toque nos 4 parafusos sobre o capô para concluir o serviço.') });
    if (s.finished) buttons.push({ label: '✅ Serviço concluído', primary: true, onClick: () => setDialog('Cliente', 'Agora sim. Diagnóstico com precisão!') });
    setButtons(buttons);
  },
  captureReading() {
    const s = state.sceneState;
    if (s.step !== 1) return;
    const good1 = s.rpmPct > .55 && s.rpmPct < .79;
    const good2 = s.voltPct > .60 && s.voltPct < .82;
    const good3 = s.pressPct > .50 && s.pressPct < .68;
    if (good1 && good2 && good3) {
      s.captures += 1;
      addStars(1, 'leitura válida');
      document.getElementById('captureCount').textContent = s.captures;
      setDialog('Thiago', 'Leitura boa. Continua observando o padrão.');
      if (s.captures >= 3) {
        s.step = 2;
        setDialog('thIAguinho', 'Leituras coletadas. Agora escolha a sequência correta de diagnóstico.');
        this.refreshButtons();
      }
    } else {
      loseLife('captura fora da zona boa');
      setDialog('thIAguinho', 'Ainda não. Espere os indicadores entrarem na faixa ideal.');
    }
  },
  pickChoice(label) {
    const s = state.sceneState;
    const expected = s.expected[s.orderIndex];
    if (label === expected) {
      s.orderIndex += 1;
      addStars(1, 'etapa correta');
      setDialog('Thiago', `${label}. Exatamente assim que se trabalha.`);
      byId('oficinaStatus').innerHTML = `${s.orderIndex}/4 etapas corretas<br>${s.expected.slice(0, s.orderIndex).join(' • ')}`;
      if (s.orderIndex >= s.expected.length) {
        s.step = 3;
        setDialog('thIAguinho', 'Confirmado. Agora aperte os parafusos do reparo para encerrar o serviço.');
      }
    } else {
      loseLife('ordem errada');
      setDialog('thIAguinho', 'Pular etapas dá defeito. Vamos com método.');
    }
    this.refreshButtons();
  },
  update(dt) {
    const s = state.sceneState; if (!s || s.type !== 'oficina') return;
    s.gaugeTime += dt;
    s.rpmPct = 0.5 + Math.sin(s.gaugeTime * 2.4) * 0.28;
    s.voltPct = 0.55 + Math.sin(s.gaugeTime * 1.8 + 1.4) * 0.23;
    s.pressPct = 0.48 + Math.sin(s.gaugeTime * 2.2 + .7) * 0.18;
    const rpm = Math.round(650 + s.rpmPct * 350);
    const volt = (12.4 + s.voltPct * 1.5).toFixed(1);
    const press = Math.round(18 + s.pressPct * 26);
    byId('gNeedle1').style.left = `${s.rpmPct * 100}%`; byId('gFill1').style.width = `${s.rpmPct * 100}%`; byId('rpmRead').textContent = rpm;
    byId('gNeedle2').style.left = `${s.voltPct * 100}%`; byId('gFill2').style.width = `${s.voltPct * 100}%`; byId('voltRead').textContent = `${volt} V`;
    byId('gNeedle3').style.left = `${s.pressPct * 100}%`; byId('gFill3').style.width = `${s.pressPct * 100}%`; byId('pressRead').textContent = `${press} kPa`;
    const progress = s.finished ? 100 : s.step === 0 ? 0 : s.step === 1 ? percent(s.captures, 3) : s.step === 2 ? percent(s.orderIndex, 4) : 75 + s.bolts.filter(b => b.el.classList.contains('done')).length * 6;
    updateHud({ chapter: 'Oficina', progress, title: s.finished ? 'Serviço concluído' : 'Diagnóstico correto', text: 'Treine medição, comparação e sequência técnica. Valores fictícios para o jogo.', extra: s.finished ? 'OK técnico' : 'Precisão' });
  }
};

scenes.sistemas = {
  enter() {
    syncDims();
    const layer = createSceneBase(ASSETS.sistemas, false);
    const thiago = makeActor(ASSETS.thiago, 'Thiago', 124, 'idle');
    thiago.style.left = '4%'; thiago.style.bottom = '15%';
    layer.appendChild(thiago);
    const laptop = document.createElement('div');
    laptop.className = 'laptop-screen';
    laptop.innerHTML = '<div class="laptop-code"></div><div class="progress-mini"><span id="bugFill"></span></div>';
    layer.appendChild(laptop);
    const desk = document.createElement('div');
    desk.className = 'system-desk';
    layer.appendChild(desk);

    state.sceneState = {
      type: 'sistemas', layer, thiago, laptop,
      started: false, sequence: ['Ideia', 'Protótipo', 'Teste', 'Deploy'], index: 0,
      cards: [], bugs: [], phase: 'sequence', bugCount: 0, timer: 0
    };

    this.renderSequence();
    setDialog('thIAguinho', 'Do celular para sistemas reais: primeiro estrutura, depois teste e entrega.');
    updateHud({ chapter: 'Sistemas', progress: 0, title: 'Projeto em ação', text: 'Monte a sequência certa e depois elimine os bugs antes do deploy.', extra: 'Build' });
    this.refreshButtons();
  },
  renderSequence() {
    const s = state.sceneState;
    s.cards.forEach(c => c.remove()); s.cards = [];
    const labels = ['Deploy', 'Teste', 'Ideia', 'Protótipo'];
    labels.forEach((label, i) => {
      const card = document.createElement('button');
      card.className = 'system-card';
      card.textContent = label;
      card.style.left = `${10 + (i % 2) * 32}%`;
      card.style.top = `${24 + Math.floor(i / 2) * 18}%`;
      card.addEventListener('click', () => this.pickCard(label, card));
      s.cards.push(card);
      s.layer.appendChild(card);
    });
  },
  refreshButtons() {
    const s = state.sceneState;
    const buttons = [];
    if (s.phase === 'sequence') buttons.push({ label: '📌 Montar fluxo', primary: true, onClick: () => setDialog('Thiago', 'Toque nos cards na ordem certa: Ideia, Protótipo, Teste, Deploy.') });
    if (s.phase === 'bugs') buttons.push({ label: '🐞 Caçar bugs', primary: true, onClick: () => { s.started = true; setDialog('thIAguinho', 'Agora toque nos bugs que aparecerem até completar o deploy.'); } });
    if (s.phase === 'done') buttons.push({ label: '🚀 Projeto pronto', primary: true, onClick: () => setDialog('Cliente', 'Projeto entregue com qualidade e agilidade!') });
    setButtons(buttons);
  },
  pickCard(label, card) {
    const s = state.sceneState;
    if (s.phase !== 'sequence') return;
    const expected = s.sequence[s.index];
    if (label === expected) {
      card.classList.add('correct');
      addStars(1, 'fluxo');
      s.index += 1;
      setDialog('Thiago', `${label}. Etapa confirmada.`);
      if (s.index >= s.sequence.length) {
        s.phase = 'bugs';
        setDialog('thIAguinho', 'Fluxo montado. Agora vamos limpar os bugs do deploy.');
        this.refreshButtons();
      }
    } else {
      card.classList.add('wrong');
      loseLife('fluxo fora de ordem');
      setDialog('thIAguinho', 'Ainda não. A base vem antes do deploy.');
    }
  },
  spawnBug() {
    const s = state.sceneState;
    const bug = document.createElement('button');
    bug.className = 'bug';
    bug.textContent = '🐞';
    bug.style.width = '40px'; bug.style.height = '40px'; bug.style.fontSize = '28px';
    bug.style.left = `${rnd(12, 86)}%`;
    bug.style.top = `${rnd(22, 74)}%`;
    bug.addEventListener('click', () => {
      if (bug.dataset.done) return;
      bug.dataset.done = '1';
      addStars(1, 'bug corrigido');
      s.bugCount += 1;
      bug.remove();
      if (s.bugCount >= 6) {
        s.phase = 'done';
        s.started = false;
        addStars(3, 'deploy feito');
        setDialog('thIAguinho', 'Deploy concluído. Mais um projeto pronto para rodar.');
        completeMission('sistemas','Sistema publicado e testado!');
        this.refreshButtons();
      }
    });
    s.bugs.push({ bug, life: 2.4 });
    s.layer.appendChild(bug);
  },
  update(dt) {
    const s = state.sceneState; if (!s || s.type !== 'sistemas') return;
    if (s.phase === 'bugs' && s.started) {
      s.timer += dt;
      if (Math.random() < 0.02 + dt * .9 && s.bugs.length < 4) this.spawnBug();
      s.bugs = s.bugs.filter(item => {
        item.life -= dt;
        if (item.life <= 0) { item.bug.remove(); return false; }
        return true;
      });
    }
    const progress = s.phase === 'sequence' ? percent(s.index, 4) : s.phase === 'bugs' ? 50 + percent(s.bugCount, 6) / 2 : 100;
    byId('bugFill').style.width = `${s.phase === 'bugs' || s.phase === 'done' ? percent(s.bugCount, 6) : 0}%`;
    updateHud({ chapter: 'Sistemas', progress, title: s.phase === 'done' ? 'Deploy concluído' : 'Projeto em ação', text: 'Monte a sequência certa e depois elimine os bugs antes do deploy.', extra: s.phase === 'done' ? 'Entregue' : 'Progresso' });
  }
};

scenes.familia = {
  enter() {
    syncDims();
    const layer = createSceneBase(ASSETS.familia, false);
    const owner = document.createElement('div'); owner.className='family-owner';
    const thiago=makeActor(ASSETS.thiago,'Thiago',85,'idle');
    const thamis=makeActor(ASSETS.thamis,'Thamis',95,'idle');
    owner.append(thiago,thamis);layer.appendChild(owner);
    const luna=makeActor(ASSETS.luna,'Luna',86,'idle');
    const liz=makeActor(ASSETS.liz,'Liz',89,'idle');
    layer.append(luna,liz);
    const guide=document.createElement('canvas');guide.id='throwCanvas';layer.appendChild(guide);
    const s=state.sceneState={type:'familia',layer,owner,thiago,thamis,luna,liz,guide,
      selectedDog:'Luna',selectedToy:'bolinha',fetching:false,returned:{Luna:0,Liz:0},throws:0,misses:0,longShots:0,
      phase:'aim',aim:null,activeDog:null,toyEl:null,throwObj:null,wait:0,finished:false,
      dogState:{Luna:{x:30,y:16,homeX:30,homeY:16,actor:luna},Liz:{x:47,y:16,homeX:47,homeY:16,actor:liz}}};
    this.renderDogPositions();
    app.playfield.style.cursor='crosshair';
    app.playfield.onpointerdown=e=>this.pointerDown(e);
    app.playfield.onpointermove=e=>this.pointerMove(e);
    app.playfield.onpointerup=e=>this.pointerUp(e);
    app.playfield.onpointercancel=()=>{s.aim=null;this.drawAim();};
    setDialog('Thamis','Luna e Liz estão prontas! Escolha quem vai buscar e ARRASTE pelo jardim para lançar.');
    updateHud({chapter:'Família',progress:0,title:'Luna e Liz • Busca!',text:'Missão: 2 entregas da Luna + 2 da Liz. Arraste no gramado para arremessar.',extra:'0/4 entregas'});
    this.refreshButtons();
  },
  renderDogPositions() {
    const s=state.sceneState;if(!s||s.type!=='familia')return;
    for(const d of Object.values(s.dogState)){d.actor.style.left=`${d.x}%`;d.actor.style.bottom=`${d.y}%`;
      d.actor.style.transform=`scale(${.78 + .002*d.y})`;
    }
  },
  refreshButtons() {
    const s=state.sceneState;
    setButtons([
      {label:`${s.selectedDog==='Luna'?'✓ ':''}🐶 Luna ${s.returned.Luna}/2`,primary:s.selectedDog==='Luna',onClick:()=>{if(s.fetching)return;s.selectedDog='Luna';setDialog('Luna','Au au! Minha vez!');this.refreshButtons();}},
      {label:`${s.selectedDog==='Liz'?'✓ ':''}🐕 Liz ${s.returned.Liz}/2`,primary:s.selectedDog==='Liz',onClick:()=>{if(s.fetching)return;s.selectedDog='Liz';setDialog('Liz','Vamos brincar!');this.refreshButtons();}},
      {label:`${s.selectedToy==='bolinha'?'✓ ':''}⚽ Bola`,onClick:()=>{if(s.fetching)return;s.selectedToy='bolinha';this.refreshButtons();}},
      {label:`${s.selectedToy==='brinquedo'?'✓ ':''}🧸 Brinquedo`,onClick:()=>{if(s.fetching)return;s.selectedToy='brinquedo';this.refreshButtons();}},
    ]);
  },
  coords(ev) {const r=app.playfield.getBoundingClientRect();return {x:clamp(ev.clientX-r.left,20,r.width-20),y:clamp(ev.clientY-r.top,r.height*.30,r.height*.74)};},
  pointerDown(ev) {
    const s=state.sceneState;if(s.type!=='familia'||s.fetching||s.finished)return;
    const c=this.coords(ev);s.aim={start:c,end:c};
    try{app.playfield.setPointerCapture(ev.pointerId)}catch(_){}
    this.drawAim();
  },
  pointerMove(ev) {
    const s=state.sceneState;if(!s?.aim||s.type!=='familia')return;
    s.aim.end=this.coords(ev);this.drawAim();
  },
  pointerUp(ev) {
    const s=state.sceneState;if(!s?.aim||s.type!=='familia')return;
    s.aim.end=this.coords(ev);
    const start=s.aim.start,end=s.aim.end;
    const drag=Math.hypot(start.x-end.x,start.y-end.y);
    const landing=drag<10 ? end : {x:clamp(start.x+(start.x-end.x)*.7,25,state.dims.width-25),y:clamp(start.y+(start.y-end.y)*.7,state.dims.height*.30,state.dims.height*.74)};
    s.aim=null;this.drawAim();this.throwToy(landing.x,landing.y,drag);
  },
  drawAim(){
    const s=state.sceneState; if(s.type!=='familia')return;
    const canvas=s.guide;const w=app.playfield.clientWidth,h=app.playfield.clientHeight;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    const c=canvas.getContext('2d');c.clearRect(0,0,w,h);
    if(!s.aim)return;
    const a=s.aim.start,b=s.aim.end;
    c.strokeStyle='#ffef91';c.fillStyle='#fff';c.lineWidth=3;c.setLineDash([8,7]);c.beginPath();c.moveTo(a.x,a.y);c.quadraticCurveTo((a.x+b.x)*.5,(a.y+b.y)*.5-55,b.x,b.y);c.stroke();c.setLineDash([]);
    c.beginPath();c.arc(b.x,b.y,9,0,Math.PI*2);c.fill();
  },
  throwToy(x,y,drag){
    const s=state.sceneState;if(s.fetching||s.finished)return;
    const toy=document.createElement('div');toy.id='toyMotion'; if(s.selectedToy==='brinquedo')toy.classList.add('teddy');
    s.layer.appendChild(toy);
    s.toyEl?.remove();s.toyEl=toy;s.fetching=true;s.phase='flight';s.activeDog=s.selectedDog;
    s.throws++;const w=state.dims.width,h=state.dims.height;
    s.target={x,y,px:x/w*100,by:(h-y)/h*100};
    s.throwObj={t:0,duration:.48,startX:w*.18,startY:h*.70,drag};
    if(drag>80)s.longShots++;
    s.owner.classList.add('throwing');
    const dog=s.dogState[s.activeDog];dog.actor.classList.add('ready');
    setDialog('Thiago',`${s.activeDog}, vai buscar ${s.selectedToy==='bolinha'?'a bolinha':'o brinquedo'}!`);
    this.refreshButtons();
  },
  update(dt){
    const s=state.sceneState;if(!s||s.type!=='familia'||s.finished)return;
    const w=state.dims.width,h=state.dims.height;
    if(s.phase==='flight'){
      const f=s.throwObj;f.t=clamp(f.t+dt/f.duration,0,1);
      const xx=f.startX+(s.target.x-f.startX)*f.t;
      const yy=f.startY+(s.target.y-f.startY)*f.t-Math.sin(f.t*Math.PI)*Math.min(90,h*.18);
      s.toyEl.style.left=px(xx);s.toyEl.style.top=px(yy);
      if(f.t>=1){s.phase='go';s.owner.classList.remove('throwing');s.dogState[s.activeDog].actor.classList.remove('ready');s.dogState[s.activeDog].actor.classList.add('fetching');}
    }else if(s.phase==='go'||s.phase==='back'){
      const d=s.dogState[s.activeDog];const back=s.phase==='back';
      const x=back?d.homeX:s.target.px;
      const y=back?d.homeY:s.target.by;
      const dx=x-d.x,dy=y-d.y;const distance=Math.hypot(dx,dy);
      const step=dt*(back?26:33);
      if(distance>1){d.x+=dx/distance*Math.min(step,distance);d.y+=dy/distance*Math.min(step,distance);}
      if(back){s.toyEl.style.left=`${d.x+3}%`;s.toyEl.style.bottom=`${d.y+20}%`;s.toyEl.style.top='auto';}
      if(distance<1.2){
        if(!back){s.phase='pickup';s.wait=.4;s.toyEl.classList.add('carried');setDialog(s.activeDog,'Peguei! Vou devolver!');}
        else{
          s.phase='aim';s.fetching=false;s.toyEl?.remove();s.toyEl=null;d.actor.classList.remove('fetching');d.actor.classList.add('idle');
          s.returned[s.activeDog]++;addStars(2,`${s.activeDog} devolveu`);
          s.owner.classList.add('celebrating');setTimeout(()=>s.owner.classList.remove('celebrating'),500);
          const total=s.returned.Luna+s.returned.Liz;
          setDialog('Thamis',`Boa, ${s.activeDog}! Já são ${total} entregas!`);
          if(s.returned.Luna>=2&&s.returned.Liz>=2){s.finished=true;addStars(5,'Luna e Liz juntas');completeMission('familia','Luna e Liz: equipe campeã!');}
          this.refreshButtons();
        }
      }
    }else if(s.phase==='pickup'){
      s.wait-=dt;if(s.wait<=0){s.phase='back';setDialog('Thiago',`${s.activeDog}, traz aqui!`);}
    }
    this.renderDogPositions();
    const progress=Math.round(clamp((Math.min(2,s.returned.Luna)+Math.min(2,s.returned.Liz))/4,0,1)*100);
    updateHud({chapter:'Família',progress,title:s.finished?'Brincadeira concluída!':'Luna e Liz • Busca!',text:`Luna ${s.returned.Luna}/2 • Liz ${s.returned.Liz}/2. Arraste para lançar bolinha ou brinquedo.`,extra:`${s.returned.Luna+s.returned.Liz}/4 entregas`});
  }
};

function completeMission(name, title) {
  if (state.victories[name]) return;
  state.victories[name] = true;
  try { localStorage.setItem('hq_v4_completed', JSON.stringify(state.victories)); } catch(_) {}
  const pane = document.createElement('div');
  pane.id='celebrate';
  const h=document.createElement('h2');h.textContent='🏆 '+title;
  const p=document.createElement('p');p.textContent='Capítulo concluído! Você ganhou a conquista e pode tentar as outras aventuras.';
  const next=document.createElement('button');next.textContent='Jogar outro capítulo';
  next.onclick=()=>{pane.remove();const list=['familia','corrida','oficina','sistemas'];setScene(list[(list.indexOf(name)+1)%list.length]);};
  pane.append(h,p,next); app.playfield.appendChild(pane);
}

app.sceneTabs.forEach(btn => btn.addEventListener('click', () => setScene(btn.dataset.scene)));
app.resetBtn.addEventListener('click', () => {
  state.totalStars = 0; state.lives = 3; setScene(state.scene);
  setDialog('thIAguinho', 'Tudo resetado. Agora vamos jogar de novo, com capricho.');
});
app.voiceBtn.addEventListener('click', () => {
  state.voice = !state.voice;
  app.voiceBtn.classList.toggle('active', state.voice);
  app.voiceBtn.textContent = state.voice ? '🔊 Voz ON' : '🔊 Voz OFF';
  setDialog('thIAguinho', state.voice ? 'Voz ativada. Agora a aventura fala com você.' : 'Voz desligada.');
});

function gameLoop(t) {
  const dt = clamp((t - state.lastTime) / 1000 || 0, 0, 0.05);
  state.lastTime = t;
  const scene = scenes[state.scene];
  scene?.update(dt);
  state.raf = requestAnimationFrame(gameLoop);
}

setScene('familia');
state.raf = requestAnimationFrame(gameLoop);