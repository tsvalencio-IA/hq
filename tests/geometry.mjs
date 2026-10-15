import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../3d/index.html', import.meta.url), 'utf8');
const ctx = { window: {}, document: { getElementById: () => null }, console, Float32Array, Math };
vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('const $=id=>'), html.indexOf('function mesh()')) + ';this.mathM=M;', ctx);
const M = ctx.mathM;
for (const angle of [0, .3, Math.PI / 2, Math.PI]) {
  for (const name of ['rx', 'ry', 'rz']) {
    const mat = M[name](angle);
    assert.equal(mat.length, 16, `${name}: 16 matrix elements`);
    assert.ok(mat.every(Number.isFinite), `${name}: finite matrix`);
    const p = M.transform(mat, [.3, .6, .8]);
    assert.ok(Math.abs(Math.hypot(...p) - Math.hypot(.3, .6, .8)) < 1e-8, `${name}: preserve length`);
  }
}
vm.runInContext(fs.readFileSync(new URL('../3d/mascotes-3d.js', import.meta.url), 'utf8'), ctx);
let buffers = 0, vertices = 0;
const E = {
  createBuffer(array) {
    buffers++; vertices += array.length / 9;
    assert.equal(array.length % 9, 0, 'position + normal + RGB');
    assert.ok(array.every(Number.isFinite), `buffer ${buffers}: no NaN or infinity`);
    for (let i = 3; i < array.length; i += 9) {
      const length = Math.hypot(array[i], array[i + 1], array[i + 2]);
      assert.ok(Math.abs(length - 1) < .01, `buffer ${buffers}: unit normals`);
    }
    return { count: array.length / 9, data: array };
  },
  drawColored() {}, contactShadow() {}
};
const studio = ctx.window.createMascotStudio(E, M);
for (const [id, rig] of Object.entries(studio.rigs)) {
  const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
  const visit = (joint, parent) => {
    const mat = M.mul(parent, M.t(...joint.pos));
    if (joint.buffer) for (let i = 0; i < joint.buffer.data.length; i += 9) {
      const p = M.transform(mat, joint.buffer.data.slice(i, i + 3));
      p.forEach((x, k) => { bounds.min[k] = Math.min(bounds.min[k], x); bounds.max[k] = Math.max(bounds.max[k], x); });
    }
    joint.children.forEach(j => visit(j, mat));
  };
  visit(rig.root, M.I());
  assert.ok(bounds.max[2] - bounds.min[2] > .5, `${id}: volume in depth`);
  assert.ok(bounds.max[1] - bounds.min[1] > (id === 'thiago' || id === 'thamis' ? 2.7 : .9), `${id}: full body`);
}
for (const id of ['thiago', 'thamis']) {
  const rightArm = studio.rigs[id].arms.find(a => a.sign === 1);
  assert.equal(rightArm.fingers.length, 4, `${id}: individually rigged fingers`);
  studio.drawHuman(id, 0, 0, 0, 1, true, 0, .1, 0);
  const first = [...studio.snapshot[id].joints];
  const fingersBefore = rightArm.fingers.map(f => f.rot[0]);
  studio.drawHuman(id, 0, 0, .8, 1, true, .4, .3, .5);
  assert.ok(first.some((x, i) => x !== studio.snapshot[id].joints[i]), `${id}: moving joints`);
  assert.ok(rightArm.fingers.some((f, i) => Math.abs(f.rot[0] - fingersBefore[i]) > .2), `${id}: fingers grip naturally during throw`);
}
for (const id of ['luna', 'liz']) {
  studio.drawDog(id, 0, 0, 0, 1, 0, .1, false);
  const first = [...studio.snapshot[id].joints];
  studio.drawDog(id, 0, 0, .8, 1, 0, .3, true);
  assert.ok(first.some((x, i) => x !== studio.snapshot[id].joints[i]), `${id}: moving paws`);
}
console.log(JSON.stringify({ geometry: 'passed', buffers, vertices, characters: studio.stats }));
