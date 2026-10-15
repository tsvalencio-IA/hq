import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const output = new URL('../test-results/', import.meta.url);
fs.mkdirSync(output, { recursive: true });
const server = spawn('python3', ['-u', '-m', 'http.server', '8031', '--bind', '127.0.0.1'], { cwd: new URL('../', import.meta.url), stdio: ['ignore', 'pipe', 'pipe'] });
await once(server.stdout, 'data');
const base = 'http://127.0.0.1:8031/3d/';
const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
const checks = [], errors = [], failedRequests = [];
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); console.log('PASS', name); };
const listen = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => failedRequests.push(r.url()));
};
async function screenshot(page, name) { await page.screenshot({ path: new URL(name + '.png', output).pathname }); }
async function load(page, route = base) {
  await page.goto(route, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__THIA_TEST, { timeout: 45000 });
  await page.getByRole('button', { name: /ENTRAR NO MUNDO 3D/ }).click();
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); listen(page);
  await load(page, base.replace('/3d/', '/'));
  check('Main entry opens the 3D game', page.url().includes('/3d/'));
  check('Five-achievement total is displayed', await page.locator('.counter').last().innerText().then(t => t.includes('/5')));
  check('Four articulated models loaded', await page.evaluate(() => Object.keys(__THIA_TEST.mascotStudio.rigs).length === 4 && __THIA_TEST.artMode() === false));
  check('WebGL draws without errors', await page.evaluate(() => E.gl.getError() === 0));
  await page.evaluate(() => { started = false; toastTime = 0; $('toast').classList.remove('show'); player.x = 0; player.z = 8; player.heading = 0; partner.x = 1.5; partner.z = 8; partner.heading = 0; pets[0].x = -.65; pets[0].z = 9.7; pets[0].heading = 0; pets[1].x = 1.3; pets[1].z = 9.7; pets[1].heading = 0; camera.yaw = 0; camera.pitch = .12; camera.dist = 7.1; });
  await screenshot(page, 'desktop-front');
  await page.evaluate(() => { camera.yaw = .82; camera.pitch = .22; }); await screenshot(page, 'desktop-three-quarter');
  await page.evaluate(() => { camera.yaw = Math.PI; camera.pitch = .17; }); await screenshot(page, 'desktop-back');
  await page.evaluate(() => { camera.yaw = 0; camera.pitch = .18; camera.dist = 5.2; player.x = -.25; partner.x = 1.1; pets[0].x = -1.1; pets[1].x = 1.7; pets[0].z = 7.1; pets[1].z = 7.1; }); await screenshot(page, 'character-close');
  await page.evaluate(() => { started = true; camera.yaw = 0; camera.dist = 8.5; });
  const z = await page.evaluate(() => player.z);
  await page.keyboard.down('w');
  await page.waitForFunction(z => Math.abs(player.z - z) > .4, z); await page.keyboard.up('w');
  check('Keyboard moves player', await page.evaluate(z => Math.abs(player.z - z) > .4, z));
  await page.getByRole('button', { name: /PULAR/ }).click();
  await page.waitForFunction(() => player.jump > .05);
  check('Jump leaves ground', await page.evaluate(() => player.jump > 0));
  await page.waitForFunction(() => player.jump === 0);
  await page.locator('#artToggle').click();
  check('Wave animates selected character', await page.evaluate(() => player.wave > 0));

  let deliveries = 0;
  for (const spot of [{ x: 0, z: 8 }, { x: 30, z: -13 }, { x: -46, z: -16 }]) {
    for (const dog of ['luna', 'liz']) for (const toy of ['ball', 'disk', 'bone']) {
      await page.evaluate(({ spot, dog, toy }) => {
        player.x = spot.x; player.z = spot.z; player.heading = Math.PI / 2; player.jump = 0;
        pets.forEach((p, i) => { p.x = spot.x + i; p.z = spot.z + 1; p.status = 'follow'; });
        __THIA_TEST.selectDog(dog); __THIA_TEST.selectToy(toy);
      }, { spot, dog, toy });
      const before = await page.evaluate(() => state.wins);
      await page.locator('#throw').click();
      check(`${dog} ${toy} launches at ${spot.x},${spot.z}`, await page.evaluate(() => !!__THIA_TEST.getBall()));
      check('No reward before delivery', await page.evaluate(before => state.wins === before, before));
      const returned = await page.evaluate(() => { for (let n = 0; n < 2400 && __THIA_TEST.getBall(); n++) __THIA_TEST.gameStep(1 / 60); return !__THIA_TEST.getBall(); });
      check(`${dog} ${toy} returns`, returned && await page.evaluate(before => state.wins === before + 1, before));
      deliveries++;
    }
  }
  check('Both dogs unlock family achievement', await page.evaluate(() => state.medals.family === true));
  await page.evaluate(() => { player.x = 0; player.z = 8; player.heading = 0; partner.x = 1.3; partner.z = 6.5; camera.yaw = 0; camera.pitch = .65; camera.dist = 11; });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  const aimedPoint = await page.evaluate(() => M.project(camera.vp, [3, 0, 9.5], E.width, E.height));
  await page.locator('#aimToggle').click();
  await page.mouse.click(aimedPoint[0], aimedPoint[1]);
  const aimedLanding = await page.evaluate(() => __THIA_TEST.getBall()?.land);
  check('Ground targeting matches the world position', !!aimedLanding && Math.hypot(aimedLanding.x - 3, aimedLanding.z - 9.5) < .35);
  await page.evaluate(() => { for (let i = 0; i < 2400 && __THIA_TEST.getBall(); i++) __THIA_TEST.gameStep(1 / 60); });
  check('Aimed toy is returned', await page.evaluate(() => !__THIA_TEST.getBall()));

  await page.evaluate(() => __THIA_TEST.openLocation('garage'));
  for (const answer of [1, 0, 1, 0]) await page.locator('#dialogActions button.choice').nth(answer).click();
  check('Garage mission completes', await page.evaluate(() => state.medals.garage === true));
  await page.locator('#closeDialog').click();
  // Regression: the standalone battery animation must not alter garage choices
  // or the player's saved world position when the observation mode closes.
  await page.evaluate(() => __THIA_TEST.openLocation('garage'));
  check('Battery training opens as a separate workshop action', await page.locator('[data-battery-training]').count() === 1);
  const positionBeforeBattery = await page.evaluate(() => ({ x: player.x, z: player.z }));
  await page.locator('[data-battery-training]').click();
  check('Animated battery workshop activates', await page.evaluate(() => window.__THIA_BATTERY_TEST?.isActive() === true));
  const startX = await page.evaluate(() => player.x);
  await page.evaluate(() => gameStep(.9)); // invokes workshop wrapper, not original test helper
  check('Mechanic walks toward the vehicle', await page.evaluate(startX => player.x > startX, startX));
  await page.evaluate(() => window.__THIA_BATTERY_TEST.advance(window.__THIA_BATTERY_TEST.total));
  check('Battery workshop completes 11 visible steps', await page.locator('#batteryStepTitle').innerText().then(t => t.includes('concluído')));
  await screenshot(page, 'battery-workshop');
  await page.locator('#batteryLeave').click();
  check('Exiting the workshop restores the world and avatar', await page.evaluate(position => !window.__THIA_BATTERY_TEST.isActive() && Math.abs(player.x - position.x) < .001 && Math.abs(player.z - position.z) < .001, positionBeforeBattery));
  await page.evaluate(() => __THIA_TEST.openLocation('code'));
  for (const answer of [1, 2, 0, 1]) await page.locator('#dialogActions button').nth(answer).click();
  check('Technology mission completes', await page.evaluate(() => state.medals.code === true));
  await page.locator('#closeDialog').click();
  await page.evaluate(() => { __THIA_TEST.startRace(); for (const p of __THIA_TEST.racePoints) { player.x = p.x; player.z = p.z; __THIA_TEST.gameStep(.05); } });
  check('All six race checkpoints finish', await page.evaluate(() => state.medals.race === true && __THIA_TEST.getRace() === null));
  await page.evaluate(() => { for (const p of __THIA_TEST.collectible) { player.x = p.x; player.z = p.z; __THIA_TEST.gameStep(.01); } });
  check('All hidden stars unlock exploration', await page.evaluate(() => state.medals.explore === true));
  await page.locator('#menuBtn').click();
  await page.getByRole('button', { name: 'Controlar Thamis', exact: true }).click();
  check('Avatar selection works', await page.evaluate(() => state.avatar === 'thamis'));
  const saved = await page.evaluate(() => ({ stars: state.stars, wins: state.wins, avatar: state.avatar, medals: state.medals }));
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => window.__THIA_TEST);
  check('Progress and avatar survive reload', await page.evaluate(saved => state.stars === saved.stars && state.wins === saved.wins && state.avatar === saved.avatar && JSON.stringify(state.medals) === JSON.stringify(saved.medals), saved));
  await page.close();

  for (const [name, viewport] of [['mobile', { width: 393, height: 852 }], ['small-mobile', { width: 320, height: 568 }], ['landscape', { width: 852, height: 393 }]]) {
    const context = await browser.newContext({ ...devices['Pixel 7'], viewport, deviceScaleFactor: 1 });
    const phone = await context.newPage(); listen(phone); await load(phone);
    check(`${name}: no horizontal overflow`, await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    check(`${name}: controls stay inside viewport`, await phone.locator('#controls').evaluate(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }));
    await screenshot(phone, name);
    const before = await phone.evaluate(() => ({ x: player.x, z: player.z }));
    const stick = await phone.locator('#stick').boundingBox();
    await phone.mouse.move(stick.x + stick.width / 2, stick.y + stick.height / 2); await phone.mouse.down();
    await phone.mouse.move(stick.x + stick.width * .8, stick.y + stick.height * .25);
    await phone.waitForFunction(before => Math.hypot(player.x - before.x, player.z - before.z) > .25, before); await phone.mouse.up();
    check(`${name}: joystick moves player`, await phone.evaluate(before => Math.hypot(player.x - before.x, player.z - before.z) > .25, before));
    const yaw = await phone.evaluate(() => camera.yaw);
    await phone.mouse.move(viewport.width * .3, viewport.height * .43); await phone.mouse.down(); await phone.mouse.move(viewport.width * .6, viewport.height * .49, { steps: 5 }); await phone.mouse.up();
    check(`${name}: orbit camera moves`, await phone.evaluate(yaw => Math.abs(camera.yaw - yaw) > .2, yaw));
    check(`${name}: WebGL is healthy`, await phone.evaluate(() => E.gl.getError() === 0));
    await context.close();
  }
  check('No uncaught JavaScript or console errors', errors.length === 0);
  check('No failed asset requests', failedRequests.length === 0);
  fs.writeFileSync(new URL('report.json', output), JSON.stringify({ result: 'passed', checks, deliveries, errors, failedRequests }, null, 2));
  console.log(JSON.stringify({ result: 'passed', checks: checks.length, deliveries }));
} catch (error) {
  fs.writeFileSync(new URL('report.json', output), JSON.stringify({ result: 'failed', error: error.message, checks, errors, failedRequests }, null, 2));
  for (const page of browser.contexts().flatMap(c => c.pages())) await screenshot(page, 'failure').catch(() => {});
  throw error;
} finally { await browser.close(); server.kill(); }
