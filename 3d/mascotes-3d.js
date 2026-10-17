/* Universo thIAguinho. Volumetric character meshes and hierarchical animation.
 * The approved sheet is the reference; no billboard or image cutout is rendered.
 * Coordinates: +Y up, +Z forward. All geometry is generated once at startup.
 */
(function () {
  'use strict';
  window.createMascotStudio = function (E, M) {
    const PI = Math.PI, TAU = PI * 2;
    const mix = (a, b, t) => a + (b - a) * t;
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    const color = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
    const normalize = a => { const d = Math.hypot(...a) || 1; return a.map(x => x / d); };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const sub = (a, b) => a.map((v, i) => v - b[i]);
    let seed = 68142;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

    function curve(points, t) {
      const f = clamp(t, 0, 1) * (points.length - 1), i = Math.floor(f), u = f - i;
      const a = points[Math.max(0, i - 1)], b = points[i], c = points[Math.min(i + 1, points.length - 1)], d = points[Math.min(i + 2, points.length - 1)];
      return b.map((v, k) => .5 * (2 * v + (-a[k] + c[k]) * u + (2 * a[k] - 5 * v + 4 * c[k] - d[k]) * u * u + (-a[k] + 3 * v - 3 * c[k] + d[k]) * u * u * u));
    }

    class Geometry {
      constructor() { this.vertices = []; }
      vertex(p, n, c) { this.vertices.push(...p, ...n, ...c); }
      surface(fn, rows, columns, tint, shade, flip = 1) {
        const base = color(tint), grid = [];
        for (let i = 0; i <= rows; i++) {
          grid[i] = [];
          for (let j = 0; j <= columns; j++) {
            const u = i / rows, v = j / columns, e = .00015, p = fn(u, v);
            const du = sub(fn(clamp(u + e, .00001, .99999), v), fn(clamp(u - e, .00001, .99999), v));
            const dv = sub(fn(clamp(u, .00001, .99999), v + e), fn(clamp(u, .00001, .99999), v - e));
            let n = normalize(cross(du, dv)).map(x => x * flip);
            if (Math.hypot(...du) < .0000001) n = [0, u < .5 ? -1 : 1, 0];
            grid[i][j] = { p, n, c: shade ? shade(p, u, v, base) : base };
          }
        }
        for (let i = 0; i < rows; i++) for (let j = 0; j < columns; j++) {
          for (const q of [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j], grid[i + 1][j + 1], grid[i][j + 1]]) this.vertex(q.p, q.n, q.c);
        }
        return this;
      }
      ellipsoid(p, s, tint, detail = 14, rot = [0, 0, 0], shade) {
        let mat = M.mul(M.mul(M.mul(M.t(...p), M.rz(rot[2])), M.ry(rot[1])), M.rx(rot[0]));
        return this.surface((u, v) => {
          const t = PI * (1 - u), a = v * TAU;
          return M.transform(mat, [s[0] * Math.sin(t) * Math.cos(a), s[1] * Math.cos(t), s[2] * Math.sin(t) * Math.sin(a)]);
        }, detail, detail * 2, tint, shade);
      }
      loft(rings, tint, detail = 20) {
        return this.surface((u, v) => {
          const a = curve(rings, u), phi = TAU * v;
          return [Math.cos(phi) * Math.max(.0001, a[1]), a[0], (a[3] || 0) + Math.sin(phi) * Math.max(.0001, a[2])];
        }, rings.length * 3, detail, tint, undefined, rings[0][0] > rings[rings.length - 1][0] ? -1 : 1);
      }
      tube(points, radius, tint, segments = 16, sides = 7, endRadius) {
        const cs = color(tint);
        const rings = [];
        for (let i = 0; i <= segments; i++) {
          const t = i / segments, p = curve(points, t), tangent = normalize(sub(curve(points, Math.min(1, t + .002)), curve(points, Math.max(0, t - .002))));
          const axis = Math.abs(tangent[1]) > .94 ? [1, 0, 0] : [0, 1, 0];
          const a = normalize(cross(tangent, axis)), b = normalize(cross(tangent, a));
          const r = Array.isArray(radius) ? curve(radius.map(x => [x]), t)[0] : mix(radius, endRadius === undefined ? radius : endRadius, t);
          const row = [];
          for (let j = 0; j <= sides; j++) {
            const phi = j / sides * TAU, n = a.map((x, k) => x * Math.cos(phi) + b[k] * Math.sin(phi));
            row.push({ p: p.map((x, k) => x + n[k] * r), n });
          }
          rings.push(row);
        }
        for (let i = 0; i < segments; i++) for (let j = 0; j < sides; j++) for (const q of [rings[i][j], rings[i + 1][j], rings[i + 1][j + 1], rings[i][j], rings[i + 1][j + 1], rings[i][j + 1]]) this.vertex(q.p, q.n, cs);
        return this;
      }
      cuboid(p, s, tint, round = .045) {
        // Rounded box made as a superellipsoid rather than a stack of cubes.
        const exponent = round, signed = v => Math.sign(v) * Math.pow(Math.abs(v), exponent);
        return this.surface((u, v) => {
          const lat = (u - .5) * PI, lon = v * TAU;
          return [p[0] + s[0] * signed(Math.cos(lat)) * signed(Math.cos(lon)), p[1] + s[1] * signed(Math.sin(lat)), p[2] + s[2] * signed(Math.cos(lat)) * signed(Math.sin(lon))];
        }, 10, 20, tint);
      }
    }

    class Joint {
      constructor(name, pos, geometry = new Geometry()) { this.name = name; this.pos = pos; this.geometry = geometry; this.children = []; this.rot = [0, 0, 0]; this.buffer = null; }
      child(name, pos, geometry) { const j = new Joint(name, pos, geometry); this.children.push(j); return j; }
      upload() { if (this.geometry.vertices.length) this.buffer = E.createBuffer(this.geometry.vertices); this.geometry = null; this.children.forEach(j => j.upload()); }
      render(parent) {
        let mat = M.mul(M.mul(M.mul(M.mul(parent, M.t(...this.pos)), M.ry(this.rot[1])), M.rx(this.rot[0])), M.rz(this.rot[2]));
        if (this.buffer) E.drawColored(this.buffer, mat);
        for (const j of this.children) j.render(mat);
      }
      count() { return (this.buffer ? this.buffer.count : 0) + this.children.reduce((n, j) => n + j.count(), 0); }
    }

    function roundedFrame(g, cx, cy, z, w, h, tint, feminine) {
      const r = .042, points = [];
      for (let i = 0; i <= 40; i++) {
        const a = i / 40 * TAU, x = Math.cos(a), y = Math.sin(a);
        const xx = cx + Math.sign(x) * (w - r) + r * x;
        const yy = cy + Math.sign(y) * (h - r) + r * y + (feminine ? Math.max(0, Math.abs(xx) - .22) * .12 : 0);
        points.push([xx, yy, z - Math.pow((xx - cx) / w, 2) * .016]);
      }
      g.tube(points, .015, tint, 46, 7);
    }

    function face(isThiago) {
      const skin = isThiago ? '#d99a72' : '#e5a17b', dark = isThiago ? '#2a201e' : '#261a18';
      const g = new Geometry();
      const headPoint = (u, v) => {
        const t = PI * (1 - u), a = TAU * v, y = Math.cos(t), r = Math.sin(t), jaw = y < -.28 ? 1 + (y + .28) * .25 : 1;
        const x = .405 * r * Math.cos(a) * jaw, z = .347 * r * Math.sin(a);
        return [x, y * .475, z + Math.max(0, Math.sin(a)) * .025 * Math.exp(-Math.pow((y + .15) * 3, 2))];
      };
      g.surface(headPoint, 28, 44, skin, (p, u, v, base) => {
        if (isThiago && ((p[1] < -.15 && p[2] > -.035) || (Math.abs(p[0]) > .345 && p[1] < .04 && p[2] > 0))) return color(dark);
        const cheek = Math.exp(-Math.pow((Math.abs(p[0]) - .27) * 8, 2) - Math.pow((p[1] + .065) * 8, 2)) * Math.max(0, p[2]) * .7;
        return [base[0], base[1] * (1 - cheek * .24), base[2] * (1 - cheek * .14)];
      });
      for (const side of [-1, 1]) {
        g.ellipsoid([side * .399, -.015, 0], [.075, .126, .064], skin, 11);
        g.ellipsoid([side * .429, -.012, .033], [.028, .073, .027], '#bc7858', 8);
        if (!isThiago) g.ellipsoid([side * .42, -.107, .033], [.025, .026, .022], '#e9bd66', 8);
        const ex = side * .176;
        g.ellipsoid([ex, .052, .319], [.112, .073, .039], '#fff4e7', 14);
        g.ellipsoid([ex, .052, .354], [.052, .057, .021], '#65422b', 12);
        g.ellipsoid([ex, .052, .372], [.033, .041, .012], '#181313', 12);
        g.ellipsoid([ex - .015, .077, .381], [.014, .017, .008], '#ffffff', 8);
        g.ellipsoid([ex + .013, .035, .38], [.007, .008, .005], '#e5f7ff', 6);
        g.tube([[ex - .105, .069, .334], [ex - .06, .116, .345], [ex + .04, .12, .345], [ex + .103, .08, .331]], .009, '#966045', 14, 6);
        g.tube([[ex - .105, .184, .31], [ex - .03, .204, .326], [ex + .05, .20, .325], [ex + .10, .174, .31]], isThiago ? .025 : .015, dark, 14, 6);
        roundedFrame(g, ex, .065, .405, .149, .115, '#17191e', !isThiago);
        g.tube([[side * .316, .087, .392], [side * .372, .087, .30], [side * .411, .06, .02]], .013, '#17191e', 12, 6);
        if (!isThiago) for (let n = 0; n < 3; n++) g.tube([[ex + side * .09, .08 + n * .009, .35], [ex + side * (.12 + n * .004), .10 + n * .012, .344]], .004, '#25191b', 3, 5);
      }
      g.tube([[-.03, .077, .418], [0, .095, .43], [.03, .077, .418]], .014, '#17191e', 12, 7);
      g.ellipsoid([0, -.047, .357], [.064, .106, .069], skin, 16);
      g.ellipsoid([0, -.093, .412], [.079, .054, .072], skin, 14);
      for (const s of [-1, 1]) g.ellipsoid([s * .058, -.108, .421], [.027, .02, .024], '#b97856', 8);
      g.ellipsoid([0, -.204, .323], [.177, .073, .04], '#67382d', 14);
      g.ellipsoid([0, -.185, .356], [.148, .033, .014], '#fff6e4', 14);
      g.tube([[-.15, -.202, .351], [-.075, -.254, .339], [0, -.263, .333], [.075, -.254, .339], [.15, -.202, .351]], isThiago ? .011 : .014, isThiago ? '#bf8163' : '#be6c64', 24, 7);
      if (isThiago) {
        for (const side of [-1, 1]) g.tube([[0, -.147, .381], [side * .055, -.135, .391], [side * .12, -.16, .37], [side * .17, -.171, .33]], [.023, .03, .026, .009], dark, 18, 7);
        for (let i = 0; i < 65; i++) {
          let u = .18 + random() * .24, v = .02 + random() * .46, p = headPoint(u, v);
          if (p[2] < .08 || (Math.abs(p[0]) < .16 && p[1] > -.29)) continue;
          let q = [p[0], p[1] - .025, p[2] + .006];
          g.tube([[p[0], p[1], p[2] + .007], q], .0035, i % 3 ? '#382923' : '#5b4033', 2, 4, .001);
        }
      }
      return g;
    }

    function hairGeometry(male) {
      const g = new Geometry(), base = male ? '#2b211d' : '#2c1b18';
      g.surface((u, v) => {
        const phi = v * TAU, front = Math.max(0, Math.sin(phi));
        const limit = male ? 1.95 - front * .94 : 1.90 - front * .87;
        const theta = u * limit;
        return [.412 * Math.sin(theta) * Math.cos(phi), .484 * Math.cos(theta) + .012, .354 * Math.sin(theta) * Math.sin(phi) - .012];
      }, 14, 34, base, undefined, -1);
      if (male) {
        g.ellipsoid([0,.395,.045],[.29,.112,.23],base,16);
        const scalp=(x,z)=>.489*Math.sqrt(Math.max(.015,1-(x/.421)**2-(z/.365)**2))+.012;
        for (let i = 0; i < 29; i++) {
          const x = -.31 + i * .022;
          g.tube([[x,scalp(x,.185),.185],[x+.013,scalp(x+.013,.12)+.018,.12],[x+.036,scalp(x+.036,.025)+.015,.025],[x+.052,scalp(x+.052,-.095),-.095]], .012 + random() * .004, ['#39291f', '#493426', '#2b211e', '#59402c'][i % 4], 13, 6, .005);
        }
        for (let i = 0; i < 24; i++) {
          const a = i / 24 * TAU;
          g.tube([[.36 * Math.cos(a), .24, .30 * Math.sin(a)], [.35 * Math.cos(a + .08), .31, .30 * Math.sin(a + .08)]], .012, '#493325', 5, 5, .005);
        }
        // Cropped texture and dark tapered sideburns, including side view.
        for(const side of [-1,1]){
          g.ellipsoid([side*.367,.145,-.052],[.041,.13,.123],'#30231d',12);
          for(let j=0;j<9;j++){
            const z=-.24+j*.055;
            g.tube([[side*.375,.24,z],[side*(.405+((j%3)*.007)),.16,z+.022]],.010,'#432e23',6,6,.002);
          }
        }
      }
      if(!male) {
        const scalp=(x,z)=>.492*Math.sqrt(Math.max(.015,1-(x/.421)**2-(z/.365)**2))+.008;
        for(let i=0;i<22;i++) {
          const x=-.31+i*.029;
          g.tube([[x,scalp(x,.17),.17],[x+.012,scalp(x+.012,.08)+.008,.08],[x+.025,scalp(x+.025,-.04)+.008,-.04],[x+.03,scalp(x+.03,-.16),-.16]],.009,['#34201a','#4b2d21','#2b1b18'][i%3],13,6,.005);
        }
      }
      return g;
    }

    function ponytail() {
      const g = new Geometry();
      // Approved turnaround: raised and curly ponytail in rounded layered locks.
      const locks = [
        [.06,.28,-.43,.17,.20,.18], [.25,.24,-.47,.17,.22,.17],
        [-.04,.06,-.49,.18,.23,.18], [.30,.03,-.49,.17,.25,.17],
        [.07,-.22,-.50,.18,.25,.17], [.30,-.29,-.43,.16,.22,.16],
        [.02,-.48,-.42,.14,.19,.15], [.24,-.51,-.46,.14,.17,.16]
      ];
      locks.forEach((q,i)=>g.ellipsoid(q.slice(0,3),q.slice(3),['#2c1b18','#38231e','#4c2e23','#301d19'][i%4],12));
      for (let i = 0; i < 61; i++) {
        const a = i * 2.399, r = .11 + .15 * Math.sqrt(random());
        const x = .13 + Math.cos(a) * r, z = -.43 + Math.sin(a) * r, top = .40 - random() * .12, length = .68 + random() * .33;
        const pts = [];
        for (let j = 0; j <= 28; j++) {
          const t = j / 28, curl = a + t * TAU * (3.3 + (i % 3) * .25), amp = .026 + t * .025;
          pts.push([x + .07 * t + Math.cos(curl) * amp, top - length * t, z + .025 * t + Math.sin(curl) * amp]);
        }
        g.tube(pts, [.023, .027, .022, .007], ['#34201b', '#4b2e22', '#6b4430', '#3f261d', '#2b1b18'][i % 5], 34, 6);
      }
      g.ellipsoid([.11, .39, -.29], [.115, .052, .115], '#b66b39', 10);
      g.tube([[-.005,.398,-.268],[.10,.416,-.286],[.218,.40,-.318]],.023,'#a65c34',14,7);
      // Ringlets at the temples frame the face without obscuring the glasses.
      for (const side of [-1,1]) {
        const points=[];
        for(let k=0;k<=17;k++){const t=k/17;points.push([side*(.355+.028*Math.sin(t*TAU*2.2)),.12-t*.42,.065+.038*Math.cos(t*TAU*2.2)])}
        g.tube(points,[.022,.028,.018,.006],side<0?'#492b22':'#35211c',20,6);
      }
      return g;
    }

    function shoe(male, side) {
      const g = new Geometry(), tint = male ? '#d53130' : '#737a58';
      g.ellipsoid([0, -.012, .085], [.158, .066, .279], '#ece5d7', 14);
      g.ellipsoid([0, .012, .075], [.153, .065, .271], male ? '#26272c' : '#b5b6a1', 14);
      g.ellipsoid([0, .077, .067], [.146, .109, .259], tint, 16);
      g.ellipsoid([0, .118, -.065], [.128, .112, .118], tint, 12);
      for (let i = 0; i < 4; i++) {
        const z = .04 + i * .037;
        g.tube([[-.067, .17 - i * .009, z], [0, .18 - i * .01, z + .018], [.067, .17 - i * .009, z]], .008, '#eee4d3', 7, 5);
      }
      g.tube([[side * .144, .09, -.04], [side * .148, .07, .04], [side * .125, .09, .135]], .015, male ? '#fff1db' : '#d9dfce', 12, 5);
      g.ellipsoid([0, .056, .258], [.101, .035, .013], tint, 8);
      return g;
    }

    function hand(skin, side) {
      const g = new Geometry();
      g.ellipsoid([0, -.052, .005], [.072, .104, .054], skin, 12);
      // Fingers have individual articulated joints, so the hand can open,
      // close and wave without stretching a single rigid mesh.
      g.tube([[side * .055, -.037, .02], [side * .092, -.076, .045], [side * .082, -.105, .06]], [.027, .025, .016], skin, 10, 6);
      return g;
    }

    function finger(skin, index) {
      const g = new Geometry();
      const length = [.069, .094, .085, .071][index];
      const dx = (index - 1.5) * .009;
      g.tube([[0, .012, 0], [dx * .25, -.027, .012],
        [dx, -length, .026], [dx, -length - .01, .04]],
        [.018, .018, .014, .010], skin, 12, 7);
      g.ellipsoid([dx, -length - .009, .04], [.016, .018, .014], skin, 9);
      return g;
    }

    function shirtLettering(g) {
      const font = {
        T:['11111','00100','00100','00100','00100','00100','00100'],
        H:['10001','10001','10001','11111','10001','10001','10001'],
        I:['01110','00100','00100','00100','00100','00100','01110'],
        A:['01110','10001','10001','11111','10001','10001','10001'],
        G:['01110','10001','10000','10111','10001','10001','01110'],
        U:['10001','10001','10001','10001','10001','10001','01110'],
        N:['10001','11001','11001','10101','10011','10011','10001'],
        O:['01110','10001','10001','10001','10001','10001','01110']
      }, text='THIAGUINHO', cell=.0074, white=color('#f0f2ed');
      const point=(x,y)=>[x,y,-.217*Math.sqrt(Math.max(.1,1-(x/.38)**2))-.005];
      for(let i=0;i<text.length;i++) for(let row=0;row<7;row++) for(let col=0;col<5;col++) if(font[text[i]][row][col]==='1') {
        const x=(i*6+col-(text.length*6-1)/2)*cell,y=1.81+(6-row)*cell,r=cell*.46;
        const a=point(x-r,y-r),b=point(x+r,y-r),c=point(x+r,y+r),d=point(x-r,y+r),n=normalize([x/.38,0,-1]);
        for(const p of [a,b,c,a,c,d])g.vertex(p,n,white);
      }
    }

    function human(id) {
      const male = id === 'thiago', shirt = male ? '#172537' : '#f16d26', skin = male ? '#d99a72' : '#e5a17b', pants = male ? '#292b2f' : '#25232a';
      const root = new Joint(id, [0, 0, 0]);
      const torso = new Geometry();
      torso.loft(male ? [[1.15, .24, .19], [1.22, .335, .22], [1.43, .34, .235], [1.71, .365, .225], [1.90, .38, .205], [1.98, .235, .155], [2.015, .12, .11]] : [[1.22, .26, .18], [1.29, .30, .20], [1.45, .245, .18], [1.64, .29, .215], [1.81, .325, .21], [1.93, .28, .16], [1.985, .115, .10]], shirt, 30);
      torso.ellipsoid([0, 2.015, 0], [.125, .15, .12], skin, 12);
      if (male) {
        shirtLettering(torso);
        torso.tube([[-.17, 1.99, .08], [-.11, 1.93, .20], [0, 1.89, .224], [.11, 1.93, .20], [.17, 1.99, .08]], .035, '#111b29', 20, 6);
        torso.tube([[0, 1.9, .233], [0, 1.73, .234]], .014, '#25344a', 7, 5);
        for (let i = 0; i < 2; i++) torso.ellipsoid([0, 1.85 - i * .06, .249], [.009, .009, .005], '#bbbfb6', 5);
        torso.cuboid([-.20, 1.77, .217], [.045, .007, .009], '#f3f7f0', .3);
        for (let i = 0; i < 3; i++) torso.cuboid([-.22 + i * .022, 1.805 + i * .01, .217], [.007, .025 + i * .007, .008], i === 2 ? '#e9f6f4' : '#39b6cd', .3);
        torso.loft([[1.135, .29, .195], [1.16, .335, .216], [1.20, .336, .218], [1.224, .31, .202]], '#161b22');
        torso.cuboid([0, 1.18, .219], [.043, .025, .009], '#9c9586', .25);
      } else {
        torso.tube([[-.12, 1.98, .065], [-.10, 1.925, .161], [0, 1.905, .182], [.10, 1.925, .161], [.12, 1.98, .065]], .017, '#d95821', 20, 6);
        torso.tube([[-.25, 1.29, .11], [0, 1.27, .205], [.25, 1.29, .11]], .014, '#cb5621', 16, 6);
      }
      root.geometry = torso;
      const hips = new Geometry();
      hips.ellipsoid([0, male ? 1.18 : 1.13, -.004], [male ? .332 : .322, male ? .24 : .22, .218], pants, 18);
      root.child('hips', [0, 0, 0], hips);
      const legs = [], arms = [];
      for (const s of [-1, 1]) {
        const upper = new Geometry();
        upper.loft([[.035, .12, .14], [-.05, male ? .19 : .184, .205], [-.25, male ? .167 : .17, .181], [-.50, .125, .13], [-.555, .10, .11]], pants, 24);
        if (male) {
          upper.cuboid([s * .148, -.25, .017], [.041, .139, .113], '#323438', .45);
          upper.tube([[s * .189, -.17, -.07], [s * .196, -.16, .02], [s * .184, -.17, .11]], .008, '#171d23', 8, 5);
        } else upper.tube([[s * .171, -.02, .001], [s * .168, -.25, .022], [s * .122, -.50, .027]], .008, '#d0d0c9', 13, 5);
        const hip = root.child('hip' + s, [s * .178, 1.22, 0], upper);
        const lower = new Geometry();
        lower.loft([[.045, .125, .13], [-.10, .138, .132], [-.27, .108, .112], [-.445, .098, .104], [-.48, .086, .092]], pants, 22);
        if (!male) lower.tube([[s * .12, -.005, .024], [s * .13, -.12, .026], [s * .095, -.43, .021]], .008, '#d0d0c9', 12, 5);
        if (male) lower.tube([[-.08, -.42, .06], [0, -.43, .11], [.08, -.42, .06]], .01, '#1c2027', 10, 5);
        const knee = hip.child('knee' + s, [0, -.515, 0], lower);
        const ankle = knee.child('ankle' + s, [0, -.50, 0], shoe(male, s));
        legs.push({ hip, knee, ankle, sign: s });
        const sleeve = new Geometry();
        sleeve.loft([[.06,.092,.10],[.015,male?.145:.132,.14],[-.10,male?.148:.133,.145],[-.225,.116,.12],[-.25,.106,.11]],shirt,24);
        sleeve.ellipsoid([s * .025, -.254, .003], [.112, .115, .111], skin, 12);
        sleeve.tube([[-.093, -.22, .075], [0, -.246, .123], [.097, -.22, .075]], .009, male ? '#111e30' : '#d55720', 12, 5);
        const shoulder = root.child('shoulder' + s, [s * (male ? .394 : .338), 1.855, 0], sleeve);
        const fore = new Geometry();
        fore.loft([[.055, .108, .108], [-.08, .104, .107], [-.22, .077, .083], [-.34, .064, .07]], skin, 20);
        if (s === -1) {
          fore.loft([[-.26, .077, .079], [-.29, .079, .081], [-.315, .073, .078]], '#21272e', 20);
          fore.cuboid([0, -.286, .081], [.054, .035, .015], '#343d43', .4);
          fore.cuboid([0, -.286, .099], [.039, .024, .002], '#315763', .5);
        }
        const elbow = shoulder.child('elbow' + s, [s * .025, -.30, 0], fore);
        const palm = elbow.child('hand' + s, [0, -.34, 0], hand(skin, s));
        const fingers = [];
        for (let i = 0; i < 4; i++)
          fingers.push(palm.child('finger' + s + '-' + i,
            [-.047 + i * .031, -.115, .017], finger(skin, i)));
        arms.push({ shoulder, elbow, palm, fingers, sign: s });
      }
      const head = root.child('head', [0, 2.475, .015], face(male));
      head.child('hair', [0, 0, 0], hairGeometry(male));
      const pony = male ? null : head.child('ponytail', [0, 0, 0], ponytail());
      root.upload();
      return { root, head, arms, legs, pony, male, height: male ? 2.995 : 3.10, scale: male ? 1 : 1.037 };
    }

    function fur(g, center, scale, count, colors, length, filter) {
      for (let i = 0; i < Math.floor(count * 1.8); i++) {
        const a = random() * TAU, b = Math.acos(1 - 2 * random());
        const unit = [Math.sin(b) * Math.cos(a), Math.cos(b), Math.sin(b) * Math.sin(a)];
        const p = unit.map((n, k) => center[k] + n * scale[k]);
        if (filter && !filter(p, unit)) continue;
        const len = length * (.6 + random() * .6);
        const q = [p[0] + unit[0] * len * .52, p[1] + unit[1] * len * .40 - len * .12, p[2] + unit[2] * len * .55];
        const r = [q[0] + .008 * Math.sin(i * 4), q[1] - len * .5, q[2] + .008 * Math.cos(i * 4)];
        g.tube([p, q, r], [.007 + random() * .006, .011, .001], colors[i % colors.length], 5, 4);
      }
    }

    function dogFace(luna) {
      const main = luna ? '#ecd6ae' : '#282323', g = new Geometry();
      g.ellipsoid([0, 0, 0], [.297, .29, .265], main, 20);
      const tones = luna ? ['#f6e4c7', '#dfc29d', '#fff0d6', '#ead2af'] : ['#3a302c', '#211f22', '#594239', '#312729'];
      fur(g, [0, .015, -.015], [.284, .278, .257], 105, tones, .105, (p, u) => p[2] < .10 || p[1] > .20 || Math.abs(p[0]) > .23);
      if (!luna) {
        g.ellipsoid([0, .14, .225], [.04, .16, .057], '#eee5d5', 12);
        for (let i = 0; i < 10; i++) {
          let y = -.005 + i * .026;
          g.tube([[0, y, .268], [.009 * Math.sin(i), y + .035, .27]], .009, i % 2 ? '#fff2db' : '#d7cabb', 4, 5, .002);
        }
      }
      for (const s of [-1, 1]) {
        if (!luna) g.ellipsoid([s * .131, .126, .205], [.085, .035, .053], '#d9cab8', 10, [0, 0, s * .2]);
        g.ellipsoid([s * .125, .055, .229], [.077, .082, .048], '#321e16', 14);
        g.ellipsoid([s * .125, .058, .266], [.06, .065, .023], '#171418', 14);
        g.ellipsoid([s * .125 - .018, .082, .285], [.021, .024, .009], '#ffffff', 9);
        g.ellipsoid([s * .125 + .022, .036, .283], [.009, .01, .005], '#b7d9ef', 6);
        g.ellipsoid([s * .101, -.092, .254], [.128, .099, .101], luna ? '#fff0d5' : '#e9dfcb', 14);
        fur(g, [s * .10, -.10, .273], [.12, .09, .065], 18, luna ? ['#fff1dc', '#f4e2c4'] : ['#f3ead8', '#d2c3af'], .10, (p, u) => u[2] > -.1);
      }
      g.ellipsoid([0, -.095, .266], [.098, .08, .056], '#4e2926', 12);
      g.ellipsoid([0, -.019, .342], [.071, .047, .046], '#171619', 14);
      g.ellipsoid([-.02, -.005, .38], [.021, .01, .006], '#6d6662', 6);
      g.ellipsoid([0, -.195, .257], [.15, .085, .06], luna ? '#f7e6c8' : '#ede3d0', 12);
      g.ellipsoid([0, -.145, .321], [.086, .061, .031], '#673235', 12);
      g.ellipsoid([0, -.171, .352], [.052, .068, .022], '#eb858d', 12);
      g.tube([[0, -.14, .373], [0, -.19, .374]], .003, '#c75e74', 6, 5);
      fur(g, [0, -.191, .22], [.16, .076, .08], 24, luna ? ['#fff0d5', '#e8d1b0'] : ['#fff1db', '#d8c7ad'], .10);
      if (!luna) for (const s of [-1, 1]) {
        const x = s * .166, y = .265, z = .07;
        g.ellipsoid([x - .032, y, z], [.06, .043, .026], '#e83140', 10, [0, 0, -.35]);
        g.ellipsoid([x + .032, y, z], [.06, .043, .026], '#f14047', 10, [0, 0, .35]);
        g.ellipsoid([x, y, z + .025], [.024, .024, .022], '#fc645d', 8);
        for (let j = 0; j < 3; j++) g.ellipsoid([x + (j - 1) * .027, y + .01, z + .025], [.006, .006, .004], '#fff5e8', 5);
      }
      return g;
    }

    function dog(id) {
      const luna = id === 'luna', root = new Joint(id, [0, 0, 0]), body = new Geometry();
      const cream = ['#f9e8ca', '#e5ccaa', '#fff0d5', '#edd6b4'], black = ['#312a27', '#453630', '#1e2023', '#544039'];
      const main = luna ? '#f0dabc' : '#2b2628';
      body.ellipsoid([0, .40, -.11], [.265, .255, .41], main, 18);
      body.ellipsoid([0, .48, .15], [.24, .27, .235], luna ? '#f5e3c6' : '#f0e3cf', 16);
      fur(body, [0, .41, -.10], [.26, .247, .398], 150, luna ? cream : black, .14);
      fur(body, [0, .47, .18], [.23, .25, .19], 60, cream, .12, (p, u) => luna || u[2] > .3);
      // A collar follows the neck in 3D; the tag is attached to it.
      const collar = [];
      for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU; collar.push([.207 * Math.cos(a), .565 + .047 * Math.sin(a), .195 + .15 * Math.sin(a)]); }
      body.tube(collar, .024, luna ? '#ed7098' : '#d94353', 42, 7);
      body.ellipsoid([0, .524, .362], [.035, .045, .013], '#e9b957', 9);
      root.geometry = body;
      const legs = [];
      for (const x of [-1, 1]) for (const z of [-1, 1]) {
        const g = new Geometry(), tint = luna || z === 1 ? '#efdfc4' : '#332d2c';
        g.ellipsoid([0, -.052, 0], [.106, .15, .12], tint, 12);
        fur(g, [0, -.054, 0], [.102, .14, .115], 23, luna || z === 1 ? cream : black, .085);
        const hip = root.child('leg' + x + z, [x * .17, .31, z * .27 - .06], g);
        const footG = new Geometry();
        footG.ellipsoid([0, -.03, .024], [.106, .087, .143], luna || z === 1 ? '#f1dfc1' : '#d9cbb8', 12);
        fur(footG, [0, -.02, .033], [.10, .075, .128], 18, cream, .075);
        for (let k = -1; k <= 1; k++) footG.tube([[k * .036, -.051, .138], [k * .036, -.012, .144]], .003, '#bcaa91', 3, 4);
        const knee = hip.child('paw' + x + z, [0, -.15, 0], footG);
        legs.push({ hip, knee, phase: (x === z ? 0 : PI) });
      }
      const head = root.child('head', [0, .763, .30], dogFace(luna));
      const ears = [];
      for (const s of [-1, 1]) {
        const g = new Geometry();
        g.ellipsoid([s * .03, -.12, -.01], [.122, .215, .13], luna ? '#d4af82' : '#2d2524', 16, [0, 0, s * .08]);
        fur(g, [s * .03, -.12, -.01], [.12, .21, .128], 58, luna ? ['#e6c79e', '#d1ab7e', '#f1d5ad', '#caa079'] : black, .14);
        const ear = head.child('ear' + s, [s * .268, .034, -.02], g);
        ears.push({ ear, sign: s });
      }
      const tailG = new Geometry(), tailPts = [];
      for (let i = 0; i <= 22; i++) { const a = -.7 + i / 22 * PI * 1.65; tailPts.push([Math.sin(a) * .145, .16 + Math.cos(a) * .145, -.02 - i / 22 * .07]); }
      tailG.tube(tailPts, [.065, .082, .072, .023], luna ? '#f6e4c6' : '#eee1c9', 28, 9);
      for (let i = 0; i < 42; i++) {
        const p = curve(tailPts, random()), side = i % 2 ? 1 : -1;
        tailG.tube([p, [p[0] + side * .08, p[1] + .04, p[2] - .03], [p[0] + side * .09, p[1] - .025, p[2] - .06]], [.019, .023, .002], luna ? cream[i % 4] : (i % 4 ? '#eee0c8' : '#493a32'), 7, 5);
      }
      const tail = root.child('tail', [0, .54, -.47], tailG);
      root.upload();
      return { root, legs, head, tail, ears, height: 1.10 };
    }

    const rigs = { thiago: human('thiago'), thamis: human('thamis'), luna: dog('luna'), liz: dog('liz') };
    const snapshot = {};
    // Dedicated motion programs for distinct physical procedures.
    const activityPoses = {
      'garage:meter': {left:[-1.05,-0.65,-0.12,-0.2],right:[-1.56,-0.83,-0.2,-0.12],head:0.29,lean:0.11,rate:6.1,amp:0.06,grip:0.62,squat:0},
      'garage:compare': {left:[-0.72,-1.06,-0.05,0.18],right:[-1.24,-0.72,-0.06,0.3],head:0.2,lean:0.03,rate:3.6,amp:0.13,grip:0.32,squat:0},
      'garage:ground': {left:[-1.65,-0.54,0.29,-0.24],right:[-1.65,-0.83,-0.28,0.25],head:0.28,lean:0.17,rate:5,amp:0.09,grip:0.72,squat:0},
      'garage:clean': {left:[-0.94,-1.08,-0.05,-0.18],right:[-1.69,-0.73,-0.13,-0.35],head:0.39,lean:0.23,rate:12,amp:0.22,grip:0.86,squat:0},
      'code:review': {left:[-0.77,-1.08,-0.1,0.04],right:[-1.43,-0.39,-0.28,0.27],head:0.08,lean:0.05,rate:3.5,amp:0.09,grip:0.18,squat:0},
      'code:calculate': {left:[-1.19,-0.93,0.16,0.12],right:[-1.26,-0.98,-0.13,-0.08],head:0.3,lean:0.14,rate:13,amp:0.17,grip:0.27,squat:0},
      'code:responsive': {left:[-1,-1.22,0.04,0.33],right:[-1.6,-0.66,-0.32,-0.27],head:0.09,lean:-0.05,rate:4,amp:0.11,grip:0.46,squat:0},
      'code:tests': {left:[-1.2,-0.58,0.22,-0.04],right:[-1.36,-0.76,-0.17,0.16],head:0.11,lean:0.08,rate:8,amp:0.15,grip:0.39,squat:0},
      'battery:hood': {left:[-2.04,-0.43,0.24,-0.16],right:[-2.01,-0.49,-0.19,0.14],head:-0.18,lean:-0.1,rate:2.5,amp:0.15,grip:0.8,squat:0},
      'battery:negative': {left:[-0.63,-1.13,-0.02,0.17],right:[-1.7,-0.55,-0.08,-0.2],head:0.32,lean:0.2,rate:8.5,amp:0.12,grip:0.73,squat:0},
      'battery:positive': {left:[-1.73,-0.52,0.22,-0.13],right:[-0.83,-1.06,-0.07,0.21],head:0.24,lean:0.12,rate:7.9,amp:0.14,grip:0.76,squat:0},
      'battery:clamp': {left:[-1.08,-0.93,0.16,-0.14],right:[-1.84,-0.56,-0.18,-0.19],head:0.39,lean:0.25,rate:10,amp:0.18,grip:0.86,squat:0},
      'battery:remove': {left:[-0.85,-0.40,0.11,-0.1],right:[-0.86,-0.42,-0.13,-0.1],head:0.29,lean:0.12,rate:3.2,amp:0.05,grip:0.9,squat:0.10},
      'battery:install': {left:[-0.83,-0.43,0.12,-0.12],right:[-0.88,-0.40,-0.12,0.13],head:0.26,lean:0.11,rate:3.3,amp:0.05,grip:0.9,squat:0.10},
      'battery:fix': {left:[-1.17,-0.87,0.08,-0.18],right:[-1.77,-0.65,-0.17,0.31],head:0.31,lean:0.18,rate:9.7,amp:0.13,grip:0.87,squat:0},
      'battery:positive-connect': {left:[-1.16,-.59,.13,.27],right:[-1.72,-.70,-.22,.37],head:.28,lean:.17,rate:6.3,amp:.12,grip:.75,squat:0},
      'battery:negative-connect': {left:[-1.68,-.83,.22,.22],right:[-.84,-1.06,-.05,-.15],head:.24,lean:.14,rate:6.9,amp:.13,grip:.72,squat:0},
      'battery:verify': {left:[-0.36,-0.32,0.03,0.02],right:[-1.25,-0.71,-0.2,-0.13],head:0.19,lean:0.06,rate:3.1,amp:0.1,grip:0.13,squat:0}
    };
    function jointMatrix(parent,joint){
      return M.mul(M.mul(M.mul(M.mul(parent,M.t(...joint.pos)),M.ry(joint.rot[1])),M.rx(joint.rot[0])),M.rz(joint.rot[2]));
    }
    function handWorld(root,arm){
      const elbow=jointMatrix(jointMatrix(root,arm.shoulder),arm.elbow);
      return M.transform(jointMatrix(elbow,arm.palm),[0,-.095,.025]);
    }
    function reachHand(root,arm,target){
      const joints=[[arm.shoulder,0],[arm.shoulder,2],[arm.elbow,0]];
      const err=()=>{const p=handWorld(root,arm);return (p[0]-target[0])**2+(p[1]-target[1])**2+(p[2]-target[2])**2};
      for(let n=0;n<22;n++)for(const [j,k] of joints){
        const base=j.rot[k],delta=.015;
        j.rot[k]=base+delta;const up=err();
        j.rot[k]=base-delta;const down=err();
        j.rot[k]=Math.max(-2.8,Math.min(k===0?.4:1.5,base-(up-down)/(.03)*1.1));
      }
      return handWorld(root,arm);
    }
    function drawHuman(id, x, z, heading, move, run, jump, time, throwing, wave = 0, work = 0, actionPose = null) {
      const rig = rigs[id], walk = clamp(move, 0, 1), frequency = run ? 11.4 : 7.6, gait = Math.sin(time * frequency), bob = walk * Math.cos(time * frequency * 2) * (run ? .035 : .018);
      let root = M.mul(M.tr(x, jump - .06 + bob, z), M.mul(M.ry(heading), M.s(rig.scale, rig.scale, rig.scale)));
      root = M.mul(root, M.rz(walk * Math.sin(time * frequency) * .018));
      // Controlled upper-body pitch adds momentum without replacing the rig.
      root = M.mul(root, M.rx(walk * (run ? .041 : .014)));
      for (const l of rig.legs) {
        const phase = time * frequency + (l.sign === 1 ? 0 : PI), stride = Math.sin(phase) * walk;
        l.hip.rot[0] = stride * (run ? .72 : .48) + (jump > .05 ? -.22 : 0);
        l.knee.rot[0] = Math.max(0, -Math.cos(phase)) * walk * (run ? 1.0 : .57) + (jump > .05 ? .48 : 0);
        l.ankle.rot[0] = -l.knee.rot[0] * .32 - l.hip.rot[0] * .18;
      }
      for (const a of rig.arms) {
        a.shoulder.rot[0] = -gait * a.sign * walk * (run ? .65 : .42) - (throwing && a.sign === 1 ? Math.sin(throwing * PI) * 2.0 : 0);
        a.shoulder.rot[2] = -a.sign * (.07 + Math.sin(time * 1.6) * .014);
        a.elbow.rot[0] = -(run && walk ? .85 : .16) - Math.max(0, gait * a.sign) * walk * .18;
        a.palm.rot[0] = .04 * Math.sin(time * 2);
        const grip = throwing && a.sign === 1 ? Math.sin(throwing * PI) : 0;
        a.fingers.forEach((finger, i) => {
          finger.rot[0] = -.09 - grip * (.55 + i * .055)
            + (wave > 0 && a.sign === 1 ? .11 * Math.sin(time * 11 + i * .35) : 0);
          finger.rot[2] = (i - 1.5) * (wave > 0 && a.sign === 1 ? .075 : .025);
        });
        a.palm.rot[1] = throwing && a.sign === 1 ? -.18 * Math.sin(throwing * PI) : 0;
        if (wave > 0 && a.sign === 1) {
          a.shoulder.rot[2] = -2.25;
          a.shoulder.rot[0] = -.17;
          a.elbow.rot[0] = -.4;
          a.palm.rot[2] = .35 * Math.sin(time * 11);
        } else a.palm.rot[2] = 0;
      }
      // Oficina: cotovelos dobrados e mãos alcançando o compartimento; sem duplicar membros.
      if (work > 0) {
        const amount = clamp(work, 0, 1);
        for (const a of rig.arms) {
          a.shoulder.rot[0] = -1.20 * amount;
          a.shoulder.rot[2] = -a.sign * (.08 + .10 * amount);
          a.elbow.rot[0] = -.90 * amount;
          a.palm.rot[0] = -.12 * amount;
          a.fingers.forEach((finger,i)=>{
            finger.rot[0] = -.55*amount-i*.035*amount;
            finger.rot[2] = (i-1.5)*.015;
          });
        }
      }
      // Never retain the previous task's head tilt on returning to free roam.
      rig.head.rot[0] = 0;
      rig.head.rot[1] = Math.sin(time * .78) * (walk ? .02 : .055);
      rig.head.rot[2] = Math.sin(time * 1.6) * .012;
      if (rig.pony) { rig.pony.rot[0] = walk * Math.sin(time * frequency + .7) * .09; rig.pony.rot[2] = walk * Math.sin(time * frequency) * .06; }
      // Actions are performed by the original rig. Joints return to idle after
      // each scene; no duplicate actor or flat animation overlay is created.
      if (actionPose === 'pickup') {
        root = M.mul(root, M.t(0, -.21, .06));
        for (const l of rig.legs) { l.hip.rot[0] = -.25; l.knee.rot[0] = .74; l.ankle.rot[0] = -.22; }
        for (const a of rig.arms) {
          a.shoulder.rot[0] = -1.15;
          a.elbow.rot[0] = -.52;
          a.palm.rot[0] = -.29;
          for (const f of a.fingers) f.rot[0] = -.43;
        }
        rig.head.rot[0] = .32;
      } else if (actionPose === 'think') {
        rig.head.rot[1] = Math.sin(time * 9) * .13;
        const a = rig.arms[0];
        a.shoulder.rot[0] = -.7; a.elbow.rot[0] = -1.05;
        a.fingers.forEach((f,i) => { f.rot[0] = -.25 - i*.04; });
      } else if (actionPose === 'operate') {
        rig.head.rot[0] = .13;
        for (const a of rig.arms) {
          a.shoulder.rot[0] = -1.15 + .07 * Math.sin(time * 8 + a.sign);
          a.elbow.rot[0] = -.80 + .18 * Math.sin(time * 11 + a.sign);
          a.palm.rot[0] = .14 * Math.cos(time * 10 + a.sign);
          a.fingers.forEach((f,i) => { f.rot[0] = -.31 - .22 * Math.max(0,Math.sin(time*13+i+a.sign)); });
        }
      } else if (actionPose === 'greet') {
        rig.head.rot[1] = .13;
      }
      if (actionPose && typeof actionPose === 'object') {
        const pose = activityPoses[actionPose.kind];
        if (pose) {
          const u=clamp(actionPose.progress ?? 0,0,1);
          const strength=clamp(u*5,0,1)*clamp((1-u)*5,0,1);
          const clock=time*pose.rate;
          for(let i=0;i<rig.arms.length;i++){
            const arm=rig.arms[i],v=i===0?pose.left:pose.right;
            const pulse=Math.sin(clock+i*1.8)*pose.amp*strength;
            arm.shoulder.rot[0]=v[0]+pulse;
            arm.elbow.rot[0]=v[1]-.5*pulse;
            arm.shoulder.rot[2]=v[2]*arm.sign;
            arm.palm.rot[0]=v[3]+pulse*(i?1.5:-.8);
            arm.palm.rot[1]=.13*Math.cos(clock*.42+i);
            arm.fingers.forEach((finger,j)=>{
              finger.rot[0]=-(pose.grip*.73+j*.028)+Math.max(0,Math.sin(clock+j*.5+i))*.09;
              finger.rot[2]=(j-1.5)*.016;
            });
          }
          rig.head.rot[0]=pose.head+.025*Math.sin(clock*.25);
          rig.head.rot[1]=.08*Math.sin(clock*.21);
          root=M.mul(root,M.rx(pose.lean*strength));
          if(pose.squat){
            root=M.mul(root,M.t(0,-pose.squat*strength,0));
            for(const leg of rig.legs){
              leg.hip.rot[0]=-.32*strength;
              leg.knee.rot[0]=.76*strength;
              leg.ankle.rot[0]=-.19*strength;
            }
          }
        }
      }
      if(actionPose&&typeof actionPose==='object'&&Array.isArray(actionPose.targets)){
        for(let k=0;k<rig.arms.length;k++){
          const goal=actionPose.targets[k];
          if(Array.isArray(goal))reachHand(root,rig.arms[k],goal);
        }
      }
      E.contactShadow(x, z, .52, .42, jump);
      rig.root.render(root);
      snapshot[id] = { x, z, heading, move: walk, jump, actionPose: typeof actionPose === 'object' && actionPose ? actionPose.kind : actionPose, handPositions:rig.arms.map(a=>handWorld(root,a)), handTargets: actionPose&&typeof actionPose==='object'?actionPose.targets:null, armAngles: rig.arms.map(a=>[a.shoulder.rot[0],a.elbow.rot[0],a.palm.rot[0]]), joints: rig.legs.map(l => l.hip.rot[0]), head: rig.head.rot.slice() };
    }
    function drawDog(id, x, z, heading, move, phase, time, carrying) {
      const rig = rigs[id], walk = clamp(move, 0, 1), t = time * 12 + phase;
      const bob = Math.abs(Math.sin(t)) * walk * .026;
      const root = M.mul(M.tr(x, .018 + bob, z), M.ry(heading));
      for (const l of rig.legs) {
        const stride = Math.sin(t + l.phase), lift = Math.max(0, Math.cos(t + l.phase));
        l.hip.rot[0] = stride * walk * .53;
        l.knee.rot[0] = lift * walk * .52;
      }
      rig.head.rot[0] = carrying ? -.10 : Math.sin(time * 1.7 + phase) * .035 + walk*.025;
      rig.head.rot[1] = walk ? .026 * Math.sin(t) : .08 * Math.sin(time * 1.4 + phase);
      rig.head.rot[2] = walk * Math.cos(t*.5) * .032;
      rig.tail.rot[2] = Math.sin(time * (walk ? 12 : 7) + phase) * .38;
      rig.tail.rot[1] = Math.sin(time * (walk ? 8 : 5) + phase) * .20;
      for (const a of rig.ears) { a.ear.rot[0] = Math.sin(t + .5) * walk * .13; a.ear.rot[2] = a.sign * Math.sin(t) * walk * .07; }
      E.contactShadow(x, z, .40, .58, 0);
      rig.root.render(root);
      snapshot[id] = { x, z, heading, move: walk, carrying, joints: rig.legs.map(l => l.hip.rot[0]) };
    }
    return { drawHuman, drawDog, rigs, snapshot, stats: Object.fromEntries(Object.entries(rigs).map(([id, rig]) => [id, { vertices: rig.root.count(), height: rig.height, type: 'articulated-volumetric-mesh' }])) };
  };
})();
