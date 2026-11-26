// ============ World builders: the six fishing spots ============
let SPOT = null;
const yawTo = (px, pz, tx, tz) => Math.atan2(-(tx - px), -(tz - pz));
function segD(x, z, a, b) { const vx = b[0] - a[0], vz = b[1] - a[1], wx = x - a[0], wz = z - a[1]; const t = clamp((wx * vx + wz * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(wx - vx * t, wz - vz * t); }
const winMat = new THREE.MeshStandardMaterial({ color: lin('#3a4a5a'), emissive: lin('#ffc46a'), emissiveIntensity: 0, roughness: .3 });
const fireMat = new THREE.MeshStandardMaterial({ color: lin('#ff8a2a'), emissive: lin('#ff6a1a'), emissiveIntensity: 1.5, flatShading: true });

function clearWorld() {
  scene.remove(ROOT);
  const keep = new Set(Object.values(G));
  ROOT.traverse(o => { if (o.geometry && !keep.has(o.geometry)) o.geometry.dispose(); });
  ROOT = new THREE.Group(); scene.add(ROOT); signDraws.length = 0;
}
function terrain(hf, cf, size, seg) {
  size = size || 260; seg = seg || 130;
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cols = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = hf(x, z); p.setY(i, y); c.set(cf(x, z, y)); c.offsetHSL(0, 0, (hash(i * 1.3) - .5) * .035); c.convertSRGBToLinear(); cols.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .96 })); m.receiveShadow = true; ROOT.add(m); return m;
}
function scatter(n, area, ok, sMin, sMax, hf) {
  const out = []; for (let i = 0; i < n * 8 && out.length < n; i++) { const x = rnd(area[0], area[1]), z = rnd(area[2], area[3]); if (!ok(x, z)) continue; out.push([x, hf ? hf(x, z) : 0, z, rnd(sMin, sMax), rnd(0, Math.PI * 2)]); } return out;
}
function mountains(r, n, base, snowy) {
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rnd(-.1, .1), rr = r + rnd(-15, 25), h = rnd(45, 85), w = rnd(35, 55);
    const m = add(new THREE.ConeGeometry(w, h, 7), ['#5d7f72', '#6b8a7e', '#557568'][i % 3], Math.cos(a) * rr, base + h / 2 - 4, Math.sin(a) * rr, null, true);
    if (snowy || h > 70) add(new THREE.ConeGeometry(w * .36, h * .36, 7), '#f2f6f8', m.position.x, base + h - 4 - h * .18 + .5, m.position.z, null, true); }
}
// ---------- people ----------
// smooth, rounded characters
const SMM = {};
function SM(c, o) { const k = c + (o ? JSON.stringify(o) : ''); return SMM[k] || (SMM[k] = new THREE.MeshStandardMaterial(Object.assign({ color: lin(c), roughness: .75, metalness: 0 }, o || {}))); }
const GEO = {};
function capsuleGeo(r, len) { const k = 'cap' + r + '_' + len; if (GEO[k]) return GEO[k]; const pts = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r - len / 2)); } for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI / 2; pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r + len / 2)); } return GEO[k] = new THREE.LatheGeometry(pts, 20); }
function sphGeo(r, ws, hs, p0, pl, t0, tl) { const k = ['s', r, ws, hs, p0, pl, t0, tl].join('_'); return GEO[k] || (GEO[k] = new THREE.SphereGeometry(r, ws || 24, hs || 18, p0, pl, t0, tl)); }
function part(geo, c, x, y, z, parent, o) { const m = new THREE.Mesh(geo, typeof c === 'string' ? SM(c, o) : c); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
function torsoGeo(w, open) { const k = 'torso' + w + open; if (GEO[k]) return GEO[k]; const prof = [[.0, 0], [.3, .02], [.33, .15], [.31, .35], [.34, .55], [.4, .78], [.38, .88], [.26, .96], [.12, 1], [0, 1]]; const pts = prof.map(([r, y]) => new THREE.Vector2(r * w, y * .92)); return GEO[k] = open ? new THREE.LatheGeometry(pts.slice(1, 8), 24, .42, Math.PI * 2 - .84) : new THREE.LatheGeometry(pts, 24); }
function person(shirt, pants, hat, skin, o) {
  o = o || {}; skin = skin || '#e8b892'; const g = new THREE.Group(); const hips = [], arms = [];
  const body = new THREE.Group(); g.add(body);
  // legs
  for (const s of [-1, 1]) {
    const h = new THREE.Group(); h.position.set(s * .16, .92, 0); body.add(h);
    part(capsuleGeo(.14, .5), pants, 0, -.38, 0, h);
    const boot = part(sphGeo(.15), o.boots || '#4a3220', 0, -.84, .07, h); boot.scale.set(1, .62, 1.45);
    part(new THREE.CylinderGeometry(.155, .16, .05, 20), '#2a1e14', 0, -.9, .07, h).scale.set(1, 1, 1.42);
    hips.push(h);
  }
  part(capsuleGeo(.27, .08), pants, 0, .95, 0, body).scale.set(1, .7, .72);
  // torso + vest
  const t = part(torsoGeo(1), shirt, 0, .9, 0, body); t.scale.set(1, 1, .7);
  if (o.vest) { const v = part(torsoGeo(1.06, true), o.vest, 0, .93, 0, body, { side: THREE.DoubleSide }); v.scale.set(1, .9, .72);
    for (const s of [-1, 1]) { const pk = part(new THREE.BoxGeometry(.16, .14, .05), o.vest, s * .17, 1.18, .25, body); pk.rotation.y = s * .35; part(new THREE.BoxGeometry(.17, .04, .06), '#3a3420', s * .17, 1.26, .255, body).rotation.y = s * .35; } }
  part(new THREE.TorusGeometry(.3, .035, 8, 28), '#3a2a1a', 0, 1, 0, body).scale.set(1, 1, .74);
  part(new THREE.TorusGeometry(.3, .035, 8, 28), '#3a2a1a', 0, 1, 0, body).rotation.x = Math.PI / 2;
  body.children[body.children.length - 1].scale.set(1, .72, 1);
  part(new THREE.BoxGeometry(.1, .07, .03), '#c8a050', 0, 1, .225, body, { metalness: .7, roughness: .3 });
  // arms
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * .4, 1.66, 0); a.rotation.z = s * .08; body.add(a);
    part(sphGeo(.13), shirt, 0, 0, 0, a);
    part(capsuleGeo(.105, .3), shirt, 0, -.22, 0, a);
    const fa = new THREE.Group(); fa.position.y = -.42; fa.rotation.x = -.15; a.add(fa);
    part(capsuleGeo(.088, .26), o.sleeves === false ? skin : shirt, 0, -.15, 0, fa);
    part(capsuleGeo(.092, .02), o.cuff || shirt, 0, -.27, 0, fa).scale.set(1.05, 1, 1.05);
    const hand = part(sphGeo(.095), skin, 0, -.37, .01, fa); hand.scale.set(.9, 1.1, .75);
    part(sphGeo(.04), skin, -s * .06, -.33, .05, fa);
    arms.push(a);
  }
  // neck + head
  part(new THREE.CylinderGeometry(.1, .12, .16, 16), skin, 0, 1.79, 0, body);
  const head = new THREE.Group(); head.position.set(0, 2.06, 0); body.add(head);
  const hd = part(sphGeo(.29, 32, 24), skin, 0, 0, 0, head); hd.scale.set(.95, 1.06, 1);
  part(sphGeo(.2, 24, 16), skin, 0, -.1, .06, head).scale.set(1, .7, 1);
  for (const s of [-1, 1]) { part(sphGeo(.07, 12, 10), skin, s * .27, -.01, -.01, head).scale.set(.5, 1, .8);
    part(sphGeo(.052, 16, 12), '#f8f6f0', s * .1, .04, .245, head, { roughness: .3 }).scale.set(1, 1.1, .6);
    part(sphGeo(.03, 12, 10), o.eyes || '#3a2a1a', s * .1, .035, .275, head, { roughness: .2 });
    part(sphGeo(.01, 6, 6), '#ffffff', s * .1 + .01, .05, .3, head);
    const br = part(capsuleGeo(.016, .07), o.hair || '#4a3020', s * .1, .12, .255, head); br.rotation.z = Math.PI / 2 + s * .12; }
  const nose = part(sphGeo(.05, 14, 12), skin, 0, -.02, .29, head); nose.scale.set(.8, 1, 1);
  const mouth = part(new THREE.TorusGeometry(.05, .011, 6, 16, Math.PI), '#7a3a30', 0, -.1, .255, head); mouth.rotation.z = Math.PI;
  if (o.beard) { const bd = part(sphGeo(.22, 20, 14), o.beard, 0, -.14, .08, head); bd.scale.set(1.05, .9, .85); part(capsuleGeo(.02, .1), o.beard, 0, -.06, .275, head).rotation.z = Math.PI / 2; }
  if (o.hair && !hat) { const hr = part(sphGeo(.305, 28, 16, 0, Math.PI * 2, 0, Math.PI * .5), o.hair, 0, .02, -.01, head); hr.scale.set(.98, 1.1, 1.04); }
  if (hat) {
    if (o.beanie) { const b = part(sphGeo(.31, 28, 16, 0, Math.PI * 2, 0, Math.PI * .55), hat, 0, .05, 0, head); b.scale.set(1, 1.12, 1.03); part(new THREE.TorusGeometry(.29, .045, 10, 28), hat, 0, .03, 0, head).rotation.x = Math.PI / 2; part(sphGeo(.07), '#f4f0e8', 0, .4, 0, head); }
    else { if (o.hair) { const hr = part(sphGeo(.3, 28, 16, 0, Math.PI * 2, 0, Math.PI * .62), o.hair, 0, .03, -.03, head); hr.scale.set(1, 1.05, 1.02); }
      const c = part(sphGeo(.305, 28, 16, 0, Math.PI * 2, 0, Math.PI * .5), hat, 0, .14, -.01, head); c.scale.set(1, .72, 1.03);
      part(new THREE.CylinderGeometry(.305, .305, .04, 28), hat, 0, .14, -.01, head).scale.set(1, 1, 1.03);
      const brim = part(new THREE.CylinderGeometry(.2, .2, .03, 24, 1, false, -Math.PI / 2, Math.PI), hat, 0, .13, .25, head); brim.scale.set(1.2, 1, 1.25); brim.rotation.x = .12;
      part(sphGeo(.03), hat, 0, .37, -.01, head); }
  }
  g.userData = { hips, arms, head }; return g;
}
function npc(x, z, ry, shirt, pants, hat, skin, o) { const p = person(shirt, pants, hat, skin, o); p.position.set(x, SPOT.walk(x, z) || 0, z); p.rotation.y = ry; ROOT.add(p); SPOT.npcs.push(p); return p; }
// ---------- props ----------
function truck(x, z, ry) {
  const g = new THREE.Group(); g.position.set(x, SPOT.ground(x, z), z); g.rotation.y = ry; ROOT.add(g);
  box(2.3, .9, 5.4, '#b8442e', 0, 1.05, 0, g); box(2.2, 1, 2, '#b8442e', 0, 1.95, .45, g); box(2.24, .7, .1, '#a8d4ea', 0, 2.05, 1.46, g);
  box(.1, .6, 1.4, '#a8d4ea', 1.13, 2.05, .45, g); box(.1, .6, 1.4, '#a8d4ea', -1.13, 2.05, .45, g); box(2.4, .25, .3, '#c8c8c8', 0, .75, 2.75, g); box(2.4, .25, .3, '#c8c8c8', 0, .75, -2.75, g);
  box(2.1, .1, 2.6, '#7a2a1e', 0, 1.52, -1.3, g);
  for (const [wx, wz] of [[1.15, 1.7], [-1.15, 1.7], [1.15, -1.7], [-1.15, -1.7]]) { const w = cyl(.45, .45, .35, 12, '#222222', wx, .45, wz, g); w.rotation.z = Math.PI / 2; }
  glow(.8, 1.2, 2.78, .8, 0xffe8b0, g); glow(-.8, 1.2, 2.78, .8, 0xffe8b0, g);
  const cargo = new THREE.Group(); cargo.position.set(0, 1.55, -1.4); g.add(cargo); g.userData.cargo = cargo; SPOT.truck = g; refreshTruckCargo(); return g;
}
function refreshTruckCargo() {
  if (!SPOT || !SPOT.truck) return; const c = SPOT.truck.userData.cargo; while (c.children.length) c.remove(c.children[0]);
  if (S.well === 0) { cyl(.35, .3, .6, 10, '#e8e8e0', 0, .3, 0, c); }
  else if (S.well === 1) { box(1.2, .7, .8, '#e8e8e8', 0, .35, 0, c); box(1.22, .12, .82, '#3a7ac8', 0, .72, 0, c); }
  else if (S.well === 2) { box(1.8, .8, 1.2, '#3a6a9a', 0, .4, 0, c); box(.3, .3, .3, '#444', .7, .9, .4, c); }
  else { box(1.9, 1.1, 2.3, '#cfe8f4', 0, .55, 0, c).material = new THREE.MeshStandardMaterial({ color: lin('#9fd6f0'), transparent: true, opacity: .55, roughness: .1 }); box(.5, .6, .5, '#5a6a7a', .7, .3, -1, c); }
}
function logCabin(x, z, w, d, col, roofCol) {
  const g = new THREE.Group(); g.position.set(x, 0, z); ROOT.add(g);
  const logG = new THREE.CylinderGeometry(.3, .3, 1, 7);
  for (let i = 0; i < 8; i++) {
    const y = .3 + i * .55, c = i % 2 ? col : '#9a6436';
    for (const s of [-1, 1]) { const m = add(logG, c, 0, y, s * d / 2, g); m.rotation.z = Math.PI / 2; m.scale.y = w + .6; const n = add(logG, c, s * w / 2, y + .27, 0, g); n.rotation.x = Math.PI / 2; n.scale.y = d + .6; }
  }
  const rl = Math.hypot(w / 2 + .8, 2.2);
  for (const s of [-1, 1]) { const r = box(rl, .25, d + 1.4, roofCol, s * (w / 4 + .2), 5.3, 0, g); r.rotation.z = -s * Math.atan2(2.2, w / 2 + .8); }
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, 0, 0, w / 2, 0, 0, 0, 2.2, 0], 3)); tri.computeVertexNormals();
  for (const s of [-1, 1]) { const m = new THREE.Mesh(tri, M(col, { side: THREE.DoubleSide })); m.position.set(0, 4.4, s * d / 2); m.castShadow = true; g.add(m); }
  box(1.3, 2.3, .12, '#5a3a22', 0, 1.15, d / 2 + .32, g);
  for (const s of [-1, 1]) { const wdw = add(new THREE.BoxGeometry(1.3, 1, .1), winMat, s * w * .28, 2.3, d / 2 + .32, g); wdw.castShadow = false; }
  box(1, 2.4, 1, '#8a8580', w * .3, 5.8, -d * .2, g);
  return g;
}
function shedBuilding(x, z, w, d, h, wall, roof, openFront) {
  const g = new THREE.Group(); g.position.set(x, 0, z); ROOT.add(g);
  box(w, h, .25, wall, 0, h / 2, -d / 2, g); box(.25, h, d, wall, -w / 2, h / 2, 0, g); box(.25, h, d, wall, w / 2, h / 2, 0, g);
  if (!openFront) { box(w, h, .25, wall, 0, h / 2, d / 2, g); add(new THREE.BoxGeometry(1.2, 2.2, .1), '#4a3020', 0, 1.1, d / 2 + .1, g); }
  else { box(.25, h, .25, wall, -w / 2 + .15, h / 2, d / 2, g); box(.25, h, .25, wall, w / 2 - .15, h / 2, d / 2, g); box(w, .4, .3, wall, 0, h - .2, d / 2, g); }
  const r = box(w + 1, .22, d + 1.2, roof, 0, h + .3, 0, g); r.rotation.x = -.08;
  box(w - .3, .1, d - .3, '#8a7a60', 0, .05, 0, g);
  return g;
}
function campfire(x, z) {
  const y = SPOT.ground(x, z), g = new THREE.Group(); g.position.set(x, y, z); ROOT.add(g);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; add(G.rock, '#7a7a74', Math.cos(a) * .9, .1, Math.sin(a) * .9, g).scale.setScalar(.22); }
  for (let i = 0; i < 3; i++) { const l = cyl(.1, .1, 1.3, 6, '#5a3a22', 0, .2, 0, g); l.rotation.z = Math.PI / 2; l.rotation.y = i * 1.05; }
  const f1 = add(new THREE.ConeGeometry(.35, .9, 6), fireMat, 0, .6, 0, g, true), f2 = add(new THREE.ConeGeometry(.22, .6, 5), fireMat, .15, .5, .1, g, true);
  const gl = glow(0, .8, 0, 3, 0xffa040, g);
  const light = new THREE.PointLight(0xff9a4a, 0, 14, 2); light.position.set(0, 1.2, 0); g.add(light);
  for (const [lx, lz, r] of [[2.2, 0, 0], [-1.6, 1.5, .8]]) { const b = cyl(.28, .28, 1.8, 8, '#6a4a2a', lx, .3, lz, g); b.rotation.z = Math.PI / 2; b.rotation.y = r; }
  SPOT.ticks.push((dt, t, n) => { const k = .8 + Math.sin(t * 13) * .1 + Math.sin(t * 7.3) * .1; f1.scale.set(1, k, 1); f2.scale.set(1, 2 - k, 1); light.intensity = .4 + n * 2.2 * k; gl.material.opacity = .5 + n * .5; });
}
function lamp(x, z, h, parent) { const y = SPOT.walk(x, z) || 0; cyl(.07, .09, h, 6, '#2a2a2a', x, y + h / 2, z); box(.35, .4, .35, '#3a3020', x, y + h + .1, z); const gl = glow(x, y + h + .1, z, 2.2, 0xffd890); SPOT.ticks.push((dt, t, n) => gl.material.opacity = n * .9); }
function pagePaper(x, y, z, ry) { const p = add(new THREE.PlaneGeometry(.45, .6), M('#f2e6c8', { side: THREE.DoubleSide, emissive: lin('#3a3020') }), x, y, z, null, true); p.rotation.y = ry || 0; const gl = glow(x, y, z, 1.4, 0xfff0b0); SPOT.ticks.push((dt, t) => { gl.material.opacity = S.pages[SPOT.id] ? 0 : .5 + .3 * Math.sin(t * 3); }); return p; }
function board(x, z, ry, title) { const y = SPOT.ground(x, z); for (const s of [-1, 1]) cyl(.08, .08, 2.2, 6, '#5a3a22', x + Math.cos(ry) * s * .9, y + 1.1, z - Math.sin(ry) * s * .9); const b = box(2.2, 1.3, .1, '#8a6a42', x, y + 1.6, z); b.rotation.y = ry; sign(title, '#2c4a3a', '#f4e8c8', 2, .45, x + Math.sin(ry) * .07, y + 2.05, z + Math.cos(ry) * .07, ry); for (let i = 0; i < 3; i++) { const n = add(new THREE.PlaneGeometry(.45, .55), '#f4f0e0', x + Math.sin(ry) * .07 + Math.cos(ry) * (i - 1) * .6, y + 1.35, z + Math.cos(ry) * .07 - Math.sin(ry) * (i - 1) * .6, null, true); n.rotation.y = ry; } }
function structVisual(s) {
  const y = SPOT.waterY(s.x, s.z);
  if (s.type === 'weeds') { const l = []; for (let i = 0; i < 70; i++) { const a = rnd(0, 6.3), r = Math.sqrt(Math.random()) * s.r; l.push([s.x + Math.cos(a) * r, y + .5, s.z + Math.sin(a) * r, rnd(.6, 1.2), 0, rnd(-.2, .2)]); } instances(G.reed, '#7a9a3a', l, false); instances(G.pad, '#3f8a3a', l.slice(0, 18).map(p => [p[0] + rnd(-1, 1), y + .03, p[2] + rnd(-1, 1), rnd(.7, 1.3)]), false); }
  if (s.type === 'rocks' || s.type === 'current') { rocks(Array.from({ length: s.type === 'rocks' ? 7 : 4 }, () => [s.x + rnd(-s.r, s.r) * .7, y - .3, s.z + rnd(-s.r, s.r) * .7, rnd(.5, 1.1)]), '#7e807a'); }
  if (s.type === 'timber' || s.type === 'pool') { if (s.type === 'timber') for (let i = 0; i < 4; i++) { const b = cyl(.08, .14, rnd(2, 3.4), 5, '#4a3a2a', s.x + rnd(-s.r, s.r) * .5, y + .3, s.z + rnd(-s.r, s.r) * .5); b.rotation.set(rnd(-.7, .7), 0, rnd(-.7, .7)); } }
}
// ripples where fish are rising over structure
const ripplePool = [];
function initRipples() { ripplePool.length = 0; for (let i = 0; i < 8; i++) { const r = add(new THREE.RingGeometry(.3, .38, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), 0, 0, 0, null, true); r.rotation.x = -Math.PI / 2; r.renderOrder = 3; ripplePool.push(r); } }
function ripple(x, z, big) { const r = ripplePool.find(q => q.material.opacity <= 0.01); if (!r) return; r.position.set(x, SPOT.waterY(x, z) + .08, z); r.scale.setScalar(big ? 1.6 : 1); r.material.opacity = .8; }
function tickRipples(dt) { for (const r of ripplePool) if (r.material.opacity > 0) { r.material.opacity = Math.max(0, r.material.opacity - dt * .55); r.scale.multiplyScalar(1 + dt * 1.1); } }

function newSpot(id) {
  SPOT = { id, points: [], structs: [], plats: [], blocks: [], circles: [], waters: [], ticks: [], npcs: [], flow: [0, 0], amb: {}, ff: false, igloos: [], fogMul: 1, tint: null };
  SPOT.walk = (x, z) => {
    if (Math.abs(x) > 118 || Math.abs(z) > 118) return null;
    for (const p of SPOT.plats) if (x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1) return p.y1 === undefined ? p.y : lerp(p.y, p.y1, (z - p.z0) / (p.z1 - p.z0));
    for (const b of SPOT.blocks) if (x > b[0] && x < b[1] && z > b[2] && z < b[3]) return null;
    for (const c of SPOT.circles) if (Math.hypot(x - c[0], z - c[1]) < c[2]) return null;
    const g = SPOT.ground(x, z); if (SPOT.iceWalk && SPOT.iceWalk(x, z)) return .02;
    if (g < SPOT.waterY(x, z) - .05) return null; return Math.max(g, SPOT.waterY(x, z) - .05);
  };
  SPOT.isWater = (x, z) => !(SPOT.iceWalk && SPOT.iceWalk(x, z)) && SPOT.ground(x, z) < SPOT.waterY(x, z) - .15;
  return SPOT;
}
function finishSpot() {
  for (const s of SPOT.structs) structVisual(s);
  initRipples();
  SPOT.ticks.push((dt, t) => { if (Math.random() < dt * .5 && SPOT.structs.length) { const s = pick(SPOT.structs); if (s.type !== 'ice') ripple(s.x + rnd(-s.r, s.r) * .6, s.z + rnd(-s.r, s.r) * .6, Math.random() < .3); } tickRipples(dt); });
  spotFogMul = SPOT.fogMul; spotTint = SPOT.tint;
}

// =============== WILLOW LAKE (home) ===============
function buildLake() {
  const sp = newSpot('lake'); const WY = -.15;
  const lakeD = (x, z) => (x / 34) ** 2 + ((z - 45) / 22) ** 2 + (fbm(x * .07 + 3, z * .07) - .5) * .22;
  const paths = [[[0, -9], [-2, 4], [8, 19]], [[-2, 4], [-18, 0]], [[0, -9], [16, -5]], [[-2, 4], [-6, 11]]];
  const pathD = (x, z) => { let m = 99; for (const pl of paths) for (let i = 0; i < pl.length - 1; i++) m = Math.min(m, segD(x, z, pl[i], pl[i + 1])); return m; };
  const flats = [[0, -14, 9], [18, -10, 8], [-20, -4, 8], [-11, 2, 5], [-6, 12, 4.5]];
  sp.ground = (x, z) => {
    const d = lakeD(x, z);
    if (d < 1) return WY - .35 - 3.6 * Math.pow(1 - d, .8) - (d < .35 ? 1.5 : 0);
    let y = Math.min(.45, (d - 1) * 1.4) + fbm(x * .06, z * .06) * .5;
    const r = Math.hypot(x, z - 15); if (r > 62) y += Math.pow((r - 62) * .12, 1.6) * (.6 + fbm(x * .03, z * .03));
    for (const [a, b, rr] of flats) { const q = Math.hypot(x - a, z - b); if (q < rr) y = lerp(.12, y, clamp((q - rr * .6) / (rr * .4), 0, 1)); }
    return y;
  };
  sp.waterY = () => WY;
  terrain(sp.ground, (x, z, y) => {
    if (y < WY - .1) return y < -3 ? '#56604a' : '#8c7b54';
    const d = lakeD(x, z);
    if (d < 1.16 && y < .55) return '#d9c48c';
    if (pathD(x, z) < 1.1) return '#b59a6a';
    if (y > 9) return '#8a8a82'; if (y > 3.5) return '#4c7c3a';
    return fbm(x * .09, z * .09) > .55 ? '#6aa646' : '#5c983e';
  });
  sp.waters.push(makeWater({ w: 92, d: 62, x: 0, z: 45, y: WY, color: '#2a7cab', amp: .05, seg: 56 }));
  // dock
  box(2.6, .18, 14.5, '#9b6b3f', 8, .32, 26); for (let z = 20; z <= 33; z += 2.6) for (const s of [-1, 1]) cyl(.13, .13, 3, 6, '#5a3a22', 8 + s * 1.2, -.8, z);
  sp.plats.push({ x0: 6.7, x1: 9.3, z0: 18.6, z1: 33.2, y: .42 });
  { const b = new THREE.Group(); b.position.set(10.9, WY + .05, 27.5); b.rotation.y = .15; ROOT.add(b); box(1.3, .5, 3.6, '#2f6a8a', 0, .15, 0, b); box(1.1, .1, 3.3, '#a87a4a', 0, .35, 0, b); box(1.1, .3, .25, '#a87a4a', 0, .3, .5, b); }
  // buildings
  logCabin(0, -14, 9, 6.5, '#b07844', '#6a3a2e'); sp.blocks.push([-5.4, 5.4, -17.9, -10.3]);
  box(4.2, .22, 2.2, '#8b6038', 0, .12, -9.4); sign("GUS'S CABIN", '#4a2e1a', '#f2e2c0', 3.4, .62, 0, 3.7, -10.68);
  const fh = shedBuilding(18, -10, 11, 7, 3.8, '#6f8a9a', '#3d4f5a', true); sp.blocks.push([12.3, 23.7, -13.8, -7.4]);
  sign('FISH HOUSE', '#2a4a5a', '#e8f4f8', 4.2, .75, 18, 3.6, -6.3); sp.fishHouse = fh; refreshHomeTanks();
  const bf = shedBuilding(-20, -4, 8.5, 5.5, 3.4, '#c8b48a', '#8a3a2a', true); sp.blocks.push([-24.5, -15.5, -7, -1.4]);
  box(8, 1.1, .9, '#8a5a34', -20, .55, -1.6); box(8.2, .1, 1.1, '#5a3a22', -20, 1.12, -1.6);
  for (let i = 0; i < 9; i++) { const a = box(.95, .1, 2.2, i % 2 ? '#ffffff' : '#d9443a', -24 + i * .95 + .47, 3.55, -.7); a.rotation.x = -.25; }
  for (let i = 0; i < 4; i++) { add(new THREE.BoxGeometry(1.4, .8, .6), M('#6fc8ef', { emissive: lin('#1a6a9a'), emissiveIntensity: .5 }), -23 + i * 2, 2.1, -6.3, null, true); }
  sign('BAIT & FRY', '#d9443a', '#ffffff', 4.6, 1, -20, 4.25, -1.28);
  npc(-20, -3.2, 0, '#3f86c0', '#3a3a3a', null, '#f0c4a0', { hair: '#8a4a2a', vest: '#e8c547' });
  board(-14.4, -.6, -.3, 'ORDERS');
  truck(-11, 2, .9);
  campfire(-6, 12);
  for (const [x, z] of [[-4, -3], [6, 15], [-15, 5], [9, -6]]) lamp(x, z, 2.6);
  // mailbox & fence
  cyl(.06, .06, 1.1, 5, '#5a3a22', -3, .55, 1); box(.4, .3, .6, '#3a5a8a', -3, 1.2, 1);
  // points
  const P = sp.points;
  P.push({ type: 'cast', x: 8, z: 32.7, yaw: Math.PI, label: 'Fish off the dock' });
  P.push({ type: 'cast', x: -37.5, z: 44, yaw: yawTo(-37.5, 44, -25, 44), label: 'Fish the reedy shore' });
  P.push({ type: 'cast', x: 37.5, z: 52, yaw: yawTo(37.5, 52, 24, 52), label: 'Fish the rocky point' });
  P.push({ type: 'tanks', x: 18, z: -4.6, r: 3.6, label: 'Check your tanks' });
  P.push({ type: 'shop', x: -20, z: .2, r: 3.4, label: 'Shop at Bait & Fry' });
  P.push({ type: 'buyer', x: -14.4, z: .6, r: 2.2, label: 'Read the order board' });
  P.push({ type: 'truck', x: -11, z: 2, r: 3.8, label: 'Drive somewhere' });
  P.push({ type: 'cabin', x: 0, z: -9.3, r: 2.4, label: 'Rest in the cabin' });
  P.push({ type: 'page', x: 9.4, z: 30.2, r: 1.8, label: "Read Gus's logbook page" });
  cyl(.12, .12, 1.6, 6, '#5a3a22', 9.4, .9, 30.4); pagePaper(9.4, 1.25, 30.27, Math.PI);
  sp.structs.push({ type: 'weeds', x: -26, z: 44, r: 5 }, { type: 'timber', x: -6, z: 35, r: 4 }, { type: 'drop', x: 8, z: 55, r: 7 }, { type: 'rocks', x: 25, z: 52, r: 4 });
  // nature
  const keep = (x, z) => lakeD(x, z) > 1.35 && pathD(x, z) > 3 && !flats.some(([a, b, r]) => Math.hypot(x - a, z - b) < r + 4) && !P.some(p => Math.hypot(x - p.x, z - p.z) < 5);
  pines(scatter(170, [-115, 115, -115, 115], keep, .9, 1.6, sp.ground));
  leafy(scatter(55, [-80, 80, -60, 90], keep, .8, 1.3, sp.ground));
  grass(scatter(900, [-70, 70, -40, 85], (x, z) => keep(x, z) || (lakeD(x, z) > 1.05 && lakeD(x, z) < 1.4), .7, 1.4, sp.ground));
  instances(G.flower, '#f4d84a', scatter(140, [-60, 60, -40, 80], keep, .8, 1.4, sp.ground).map(p => [p[0], p[1] + .25, p[2], p[3]]), false);
  instances(G.reed, '#7a9a3a', scatter(160, [-50, 50, 15, 75], (x, z) => { const d = lakeD(x, z); return d > .92 && d < 1.08; }, .6, 1.1, sp.ground).map(p => [p[0], p[1] + .6, p[2], p[3]]), false);
  rocks(scatter(40, [-60, 60, 10, 80], (x, z) => { const d = lakeD(x, z); return d > 1 && d < 1.3; }, .3, .8, sp.ground));
  mountains(185, 18, -6, false);
  sp.spawn = { x: 1, z: 6, yaw: Math.PI * .92 };
  sp.amb = { water: .18, birds: 1, crickets: 1, loon: 1 };
  finishSpot();
}
function refreshHomeTanks() {
  if (!SPOT || SPOT.id !== 'lake' || !SPOT.fishHouse) return;
  const g = SPOT.fishHouse; if (g.userData.tanks) g.remove(g.userData.tanks);
  const t = new THREE.Group(); g.add(t); g.userData.tanks = t;
  S.tanks.forEach((tk, i) => {
    const x = (i - (S.tanks.length - 1) / 2) * 3.4, w = 1.6 + tk.size * .35;
    box(w + .2, .9, 1.1, '#3a2a1e', x, .45, -2, t);
    const q = tk.water / 100; const col = new THREE.Color('#5fc4ea').lerp(new THREE.Color('#7a8a3a'), 1 - q);
    add(new THREE.BoxGeometry(w, 1.1, .9), new THREE.MeshStandardMaterial({ color: col.convertSRGBToLinear(), emissive: lin('#2a7aa8'), emissiveIntensity: .35, transparent: true, opacity: .7, roughness: .1 }), x, 1.5, -2, t, true);
    box(w, .08, .9, '#222222', x, 2.08, -2, t);
    tk.fish.slice(0, 6).forEach((f, j) => { const m = fishMesh(f.sp, f.traits); m.scale.setScalar(.25 + Math.min(.5, f.L / 60)); m.position.set(x + (j % 3 - 1) * w * .28, 1.25 + Math.floor(j / 3) * .45, -1.9); m.rotation.y = j % 2 ? Math.PI : 0; t.add(m); });
  });
}

// =============== CEDAR CREEK ===============
function buildCreek() {
  const sp = newSpot('creek');
  const cx = z => 6 * Math.sin(z * .045) + (z < -30 ? (z + 30) * .1 : 0);
  const hw = z => (z < -1 && z > -15) ? 8.5 : 4.6;
  const lvl = z => z > 0 ? 4 : 0;
  const bankL = z => 4 * clamp((z + 1.5) / 3, 0, 1);
  sp.waterY = (x, z) => lvl(z);
  sp.ground = (x, z) => {
    const dx = Math.abs(x - cx(z)), w = hw(z);
    if (dx < w) { const k = 1 - (dx / w) ** 2; return lvl(z) - .45 - 1.4 * k - ((z < -1 && z > -15) ? 1.8 * k : 0); }
    let y = bankL(z) + .45 + (dx - w) * .32 + fbm(x * .08, z * .08) * .9;
    if (dx > 24) y += Math.pow(dx - 24, 1.3) * .5;
    return y;
  };
  terrain(sp.ground, (x, z, y) => {
    const dx = Math.abs(x - cx(z)), w = hw(z);
    if (dx < w) return '#7a7a68';
    if (dx < w + 1.6) return '#9a978a';
    if (y > 16) return '#8a8c88'; if (y > 11) return '#5a6a4e';
    return fbm(x * .1, z * .1) > .55 ? '#4f8a40' : '#477e3a';
  });
  sp.waters.push(makeWater({ w: 70, d: 92, x: 0, z: -46, y: 0, color: '#3d8fa8', amp: .07, speed: 1.8, seg: 40 }));
  sp.waters.push(makeWater({ w: 70, d: 92, x: 0, z: 46.2, y: 4, color: '#3d8fa8', amp: .07, speed: 1.8, seg: 40 }));
  // waterfall
  const fc = document.createElement('canvas'); fc.width = 64; fc.height = 256; const fg = fc.getContext('2d');
  for (let i = 0; i < 70; i++) { fg.fillStyle = `rgba(255,255,255,${rnd(.2, .8)})`; fg.fillRect(rnd(0, 64), rnd(0, 256), rnd(1, 4), rnd(20, 70)); }
  const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(4, 1);
  const fall = add(new THREE.PlaneGeometry(9.4, 4.6, 1, 1), new THREE.MeshBasicMaterial({ map: ft, color: 0xcfeefa, transparent: true, opacity: .9, side: THREE.DoubleSide }), cx(0), 2, -.1, null, true);
  const foam = [0, 1, 2, 3, 4].map(i => glow(cx(0) - 3.5 + i * 1.75, .3, -1.1, 3.2, 0xffffff));
  sp.ticks.push((dt, t) => { ft.offset.y += dt * 1.6; foam.forEach((f, i) => { f.scale.setScalar(2.6 + Math.sin(t * 4 + i) * .5); f.material.opacity = .45; }); const d = Math.hypot(player.position.x - cx(0), player.position.z); ambSet('rush', clamp(.55 - d * .01, .12, .55)); });
  rocks(Array.from({ length: 26 }, () => { const z = rnd(-85, 85); return [cx(z) + rnd(-3.5, 3.5), lvl(z) - .55, z, rnd(.35, .9)]; }), '#7e807a');
  rocks(scatter(60, [-30, 30, -90, 90], (x, z) => { const dx = Math.abs(x - cx(z)); return dx > hw(z) + .5 && dx < hw(z) + 6; }, .5, 1.6, sp.ground), '#8a8c86');
  // hatchery
  const hx = 17, hz = -66; shedBuilding(hx, hz, 8, 6, 3.2, '#8a9aa0', '#3a4a52'); sp.blocks.push([hx - 4.3, hx + 4.3, hz - 3.4, hz + 3.4]);
  sign('CEDAR CREEK HATCHERY', '#2c4a3a', '#e8f0e0', 5.4, .7, hx, 3.6, hz + 3.15);
  for (let i = 0; i < 3; i++) { box(1.4, .6, 6, '#a8a8a0', hx - 9 + i * 2, .3 + sp.ground(hx - 9 + i * 2, hz), hz - 1); box(1.1, .1, 5.7, '#4aa0c0', hx - 9 + i * 2, .62 + sp.ground(hx - 9 + i * 2, hz), hz - 1); }
  sp.blocks.push([hx - 10, hx - 4.5, hz - 4, hz + 2]);
  npc(hx + 2.5, hz + 4.6, Math.PI * .9, '#5a7a4a', '#4a4030', '#3a5a3a', null, { vest: '#8a7a4a', beard: '#6a4a2a' });
  board(hx - 2.4, hz + 4.8, 0, 'HATCHERY ORDERS');
  truck(9, -55, -.4);
  const P = sp.points;
  P.push({ type: 'cast', x: cx(-7) + 10.6, z: -7, yaw: yawTo(cx(-7) + 10.6, -7, cx(-7), -7), label: 'Fish the falls pool' });
  P.push({ type: 'cast', x: cx(-38) - 7.6, z: -38, yaw: yawTo(cx(-38) - 7.6, -38, cx(-38), -38), label: 'Fish the riffle bend' });
  P.push({ type: 'cast', x: cx(26) + 7.6, z: 26, yaw: yawTo(cx(26) + 7.6, 26, cx(26), 26), label: 'Fish the upper run' });
  P.push({ type: 'truck', x: 9, z: -55, r: 3.8, label: 'Drive somewhere' });
  P.push({ type: 'npc', npc: 'hatch', x: hx + 2.5, z: hz + 5.6, r: 2.4, label: 'Talk to the hatchery keeper' });
  P.push({ type: 'buyer', x: hx - 2.4, z: hz + 6, r: 2.2, label: 'Read the hatchery orders' });
  const px = cx(-12) - 11.5; P.push({ type: 'page', x: px + 1.6, z: -12, r: 2, label: "Read Gus's logbook page" });
  add(G.rock, '#8a8c86', px, sp.ground(px, -12) + .6, -12).scale.set(1.6, 1.4, 1.6); pagePaper(px + 1.45, sp.ground(px, -12) + 1.4, -12, Math.PI / 2);
  sp.structs.push({ type: 'pool', x: cx(-7), z: -7, r: 6 }, { type: 'rocks', x: cx(-38), z: -38, r: 4 }, { type: 'current', x: cx(26), z: 26, r: 4 });
  const keep = (x, z) => Math.abs(x - cx(z)) > hw(z) + 3 && !P.some(p => Math.hypot(x - p.x, z - p.z) < 5) && Math.hypot(x - hx, z - hz) > 12 && Math.hypot(x - 9, z + 55) > 6;
  pines(scatter(260, [-110, 110, -115, 115], keep, .9, 1.8, sp.ground));
  grass(scatter(700, [-40, 40, -90, 90], keep, .7, 1.3, sp.ground), '#5a8a3a');
  mountains(150, 22, 0, true);
  sp.spawn = { x: 7, z: -60, yaw: Math.PI };
  sp.flow = [0, -1.1];
  sp.amb = { rush: .3, birds: 1, crickets: .6 };
  finishSpot();
}

// =============== BIG FORK RIVER ===============
function buildRiver() {
  const sp = newSpot('river'); const rz = x => 5 * Math.sin(x * .025); const HW = 11;
  sp.waterY = () => 0;
  sp.ground = (x, z) => {
    const dz = Math.abs(z - rz(x));
    if (dz < HW) return -.45 - 2.4 * (1 - (dz / HW) ** 2);
    let y = Math.min(1.1, (dz - HW) * .28) + fbm(x * .05, z * .05) * .45;
    if (dz > 48) y += (dz - 48) * .16 * (.6 + fbm(x * .02, z * .02));
    return y;
  };
  terrain(sp.ground, (x, z, y) => {
    const dz = Math.abs(z - rz(x));
    if (dz < HW) return '#6a6450'; if (dz < HW + 3.5) return '#aa9c80';
    if (dz > 20 && dz < 40 && z > 0) return Math.floor(x / 7) % 2 ? '#a8a24a' : '#8fa84a';
    return fbm(x * .08, z * .08) > .55 ? '#6aa646' : '#5c983e';
  });
  sp.waters.push(makeWater({ w: 250, d: 30, x: 0, z: 0, y: 0, color: '#3f7f8a', amp: .06, speed: 1.4, flow: 1.4, seg: 80 }));
  // covered bridge
  const bz0 = rz(0) - 16, bz1 = rz(0) + 16, by = 1.5;
  box(4.6, .3, bz1 - bz0, '#7a5a3a', 0, by - .15, (bz0 + bz1) / 2); sp.plats.push({ x0: -2.1, x1: 2.1, z0: bz0, z1: bz1, y: by });
  for (const s of [-1, 1]) { box(.18, 1.1, bz1 - bz0, '#9a3a2a', s * 2.2, by + .55, (bz0 + bz1) / 2); for (let z = bz0; z <= bz1; z += 2.5) box(.25, 3.4, .25, '#7a2a1e', s * 2.2, by + 1.7, z); box(.2, .8, bz1 - bz0, '#9a3a2a', s * 2.2, by + 3.1, (bz0 + bz1) / 2); }
  for (const s of [-1, 1]) { const r = box(3.2, .2, bz1 - bz0 + 1, '#4a4a4a', s * 1.35, by + 4.15, (bz0 + bz1) / 2); r.rotation.z = -s * .55; }
  for (const s of [-1, 1]) box(1.6, 3.5, 1.6, '#8a8a80', 0, -1, rz(0) + s * 5);
  sign('BIG FORK BRIDGE', '#7a2a1e', '#f4e4c8', 3.6, .6, 0, by + 3.2, bz0 - .15, Math.PI);
  // diner
  const dx = -22, dzz = -32; shedBuilding(dx, dzz, 10, 7, 3.6, '#d8d0b8', '#2a5a7a'); sp.blocks.push([dx - 5.3, dx + 5.3, dzz - 3.8, dzz + 3.8]);
  sign('BIG FORK FISH FRY', '#2a5a7a', '#ffffff', 6, .9, dx, 3.9, dzz + 3.62);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.8, 1, .1), winMat, dx + s * 3, 1.9, dzz + 3.56, null, true);
  npc(dx + 4, dzz + 5, 0, '#e8e8e8', '#3a3a3a', '#ffffff', '#d8a888', { vest: '#c83a2a' });
  board(dx - 3, dzz + 5.2, 0, 'FISH FRY ORDERS');
  truck(-8, -30, .3);
  // farm stuff
  for (let i = 0; i < 14; i++) { const x = -60 + i * 9; cyl(.08, .1, 1.3, 5, '#7a5a3a', x, sp.ground(x, 22) + .6, 22); box(9, .1, .08, '#9a7a4a', x + 4.5, sp.ground(x, 22) + 1, 22); }
  for (const [x, z] of [[20, 30], [26, 34], [-30, 32], [-40, 27]]) { const h = cyl(.9, .9, 1.4, 12, '#d8b860', x, sp.ground(x, z) + .7, z); h.rotation.z = Math.PI / 2; }
  { const bx = 45, bz = 58; shedBuilding(bx, bz, 12, 9, 6, '#a8342a', '#4a4a4a'); }
  const P = sp.points;
  P.push({ type: 'cast', x: 1.7, z: rz(0) + 3, yaw: -Math.PI / 2, label: 'Fish off the covered bridge', plat: true });
  P.push({ type: 'cast', x: 30, z: rz(30) - 13.5, yaw: Math.PI, label: 'Fish the gravel bar' });
  P.push({ type: 'cast', x: -34, z: rz(-34) + 13.5, yaw: 0, label: 'Fish the catfish hole' });
  P.push({ type: 'truck', x: -8, z: -30, r: 3.8, label: 'Drive somewhere' });
  P.push({ type: 'buyer', x: dx - 3, z: dzz + 6.2, r: 2.2, label: 'Read the Fish Fry orders' });
  P.push({ type: 'npc', npc: 'fry', x: dx + 4, z: dzz + 6, r: 2.2, label: 'Talk to the cook' });
  P.push({ type: 'page', x: -1.2, z: bz0 + 5, r: 1.8, label: "Read Gus's logbook page" });
  pagePaper(-2.05, by + 1.6, bz0 + 5, Math.PI / 2);
  sp.structs.push({ type: 'current', x: 10, z: rz(10), r: 5 }, { type: 'rocks', x: 30, z: rz(30) - 5, r: 4 }, { type: 'timber', x: -34, z: rz(-34) + 5, r: 4 }, { type: 'drop', x: -12, z: rz(-12), r: 5 });
  const keep = (x, z) => Math.abs(z - rz(x)) > HW + 5 && !P.some(p => Math.hypot(x - p.x, z - p.z) < 5) && Math.hypot(x - dx, z - dzz) > 10 && !(Math.abs(z - rz(x)) > 20 && Math.abs(z - rz(x)) < 40 && z > 0) && Math.hypot(x - 45, z - 58) > 12 && Math.abs(x) > 4;
  leafy(scatter(120, [-115, 115, -115, 115], keep, .9, 1.6, sp.ground), '#4f8a3a', '#6a9e44');
  pines(scatter(60, [-115, 115, -115, 115], (x, z) => keep(x, z) && Math.abs(z) > 50, .9, 1.5, sp.ground));
  grass(scatter(900, [-90, 90, -60, 60], keep, .7, 1.5, sp.ground));
  instances(G.reed, '#7a9a3a', scatter(140, [-110, 110, -20, 20], (x, z) => { const d = Math.abs(z - rz(x)); return d > HW - .6 && d < HW + 1; }, .6, 1.1, sp.ground).map(p => [p[0], p[1] + .6, p[2], p[3]]), false);
  mountains(190, 16, -4, false);
  sp.spawn = { x: -12, z: -24, yaw: Math.PI }; sp.flow = [1.2, 0];
  sp.amb = { water: .3, birds: 1, crickets: 1 };
  finishSpot();
}

// =============== BLACK BAYOU ===============
function buildBayou() {
  const sp = newSpot('bayou');
  const ponds = [[0, 32, 19], [24, 8, 12], [-22, -6, 10], [-38, 30, 14], [40, 40, 16], [-10, 70, 22]];
  const lands = [[0, -46, 14], [31, -12, 7], [-4, -20, 4]];
  sp.waterY = () => 0;
  sp.ground = (x, z) => {
    let y = (fbm(x * .045 + 7, z * .045) - .48) * 2.6;
    for (const [a, b, r] of ponds) { const q = Math.hypot(x - a, z - b) / r; if (q < 1) y = Math.min(y, lerp(-1.9, y, q * q)); }
    for (const [a, b, r] of lands) { const q = Math.hypot(x - a, z - b) / r; if (q < 1) y = Math.max(y, lerp(.75, y, q * q)); }
    return y;
  };
  terrain(sp.ground, (x, z, y) => y < -.1 ? '#3a3a2a' : y < .35 ? '#5a5a38' : fbm(x * .1, z * .1) > .5 ? '#4a6a32' : '#55743a');
  sp.waters.push(makeWater({ w: 240, d: 240, x: 0, z: 0, y: 0, color: '#3a4a30', amp: .025, speed: .6, seg: 70, opacity: .93 }));
  const plank = '#7a6a50';
  const walk = (x0, x1, z0, z1) => { box(x1 - x0, .15, z1 - z0, plank, (x0 + x1) / 2, .72, (z0 + z1) / 2); sp.plats.push({ x0, x1, z0, z1, y: .8 }); const L = Math.max(x1 - x0, z1 - z0), alongZ = (z1 - z0) > (x1 - x0); for (let k = 0; k <= L; k += 3) for (const s of [-1, 1]) { const px = alongZ ? (s > 0 ? x1 : x0) : x0 + k, pz = alongZ ? z0 + k : (s > 0 ? z1 : z0); cyl(.1, .1, 2.6, 5, '#4a3a2a', px, -.4, pz); cyl(.05, .05, 1, 4, '#4a3a2a', px, 1.3, pz); } };
  walk(-1.3, 1.3, -36, 16); walk(0, 24, -6.3, -3.7); walk(-12, 0, -5.3, -2.7);
  // shack on stilts
  const sx = 31, sz = -11; for (const [a, b] of [[-3, -2.5], [3, -2.5], [-3, 2.5], [3, 2.5]]) cyl(.15, .15, 3, 6, '#4a3a2a', sx + a, .2, sz + b);
  box(7, .2, 6.5, '#6a5a44', sx, 1.2, sz); sp.plats.push({ x0: sx - 3.5, x1: sx + 3.5, z0: sz - 3.2, z1: sz + 4.8, y: 1.3 });
  box(7, .2, 2, '#6a5a44', sx, 1.2, sz + 3.8);
  const sh = shedBuilding(sx, sz - .6, 6, 4.6, 3, '#7a7060', '#8a8f94'); sh.position.y = 1.3; sp.blocks.push([sx - 3.2, sx + 3.2, sz - 3, sz + 1.8]);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(1, .8, .1), winMat, sx + s * 1.8, 3.2, sz + 1.72, null, true);
  const lt = glow(sx - 2.6, 3.6, sz + 2, 2.4, 0xffc070); sp.ticks.push((dt, t, n) => lt.material.opacity = .25 + n * .75);
  sign("OLD LOU'S", '#3a3020', '#f0d8a0', 3, .6, sx, 4.1, sz + 1.75);
  npc(sx + 1.6, sz + 3.6, Math.PI * 1.1, '#6a3a2a', '#3a3a4a', '#4a4a3a', '#8a5a3a', { beard: '#d8d8d0', boots: '#2a4a2a' });
  board(sx - 1.8, sz + 4.4, 0, "LOU'S ORDERS");
  pagePaper(sx + 3.12, 2.5, sz + .2, Math.PI / 2);
  truck(5, -50, .2);
  const P = sp.points;
  P.push({ type: 'cast', x: 0, z: 15.2, yaw: Math.PI, label: 'Fish the end of the boardwalk', plat: true });
  P.push({ type: 'cast', x: 27.5, z: -6.6, yaw: yawTo(27.5, -6.6, 24, 8), label: "Fish from Lou's porch", plat: true });
  P.push({ type: 'cast', x: -11.2, z: -4, yaw: yawTo(-11.2, -4, -22, -6), label: 'Fish the cypress hole', plat: true });
  P.push({ type: 'truck', x: 5, z: -50, r: 3.8, label: 'Drive somewhere' });
  P.push({ type: 'npc', npc: 'lou', x: sx + 1.6, z: sz + 4.6, r: 2, label: 'Talk to Old Lou' });
  P.push({ type: 'buyer', x: sx - 1.8, z: sz + 5, r: 1.8, label: "Read Lou's orders" });
  P.push({ type: 'page', x: sx + 3, z: sz + 2.5, r: 1.8, label: "Read Gus's logbook page" });
  sp.structs.push({ type: 'timber', x: 0, z: 27, r: 5 }, { type: 'weeds', x: 22, z: 10, r: 5 }, { type: 'timber', x: -21, z: -6, r: 4 }, { type: 'drop', x: 0, z: 40, r: 6 });
  // cypress
  const cyp = scatter(110, [-110, 110, -70, 110], (x, z) => !P.some(p => Math.hypot(x - p.x, z - p.z) < 6) && Math.abs(x) > 3 && Math.hypot(x - sx, z - sz) > 9 && sp.ground(x, z) > -1.4, .8, 1.5, sp.ground);
  propSet([[new THREE.CylinderGeometry(.25, .9, 2.2, 7), '#6a5a44', 0], [new THREE.CylinderGeometry(.18, .26, 5, 6), '#7a6a54', 3.4], [new THREE.IcosahedronGeometry(2.4, 0), '#4a6a3a', 6.6], [new THREE.IcosahedronGeometry(1.8, 0), '#5a7a42', 7.6, 1.2, .5]], cyp.map(p => [p[0], Math.max(p[1], -.3), p[2], p[3], p[4]]));
  instances(new THREE.ConeGeometry(.25, 2.2, 4), '#8a9a7a', cyp.flatMap(p => [0, 1, 2].map(i => [p[0] + Math.cos(i * 2.1 + p[4]) * 1.6 * p[3], Math.max(p[1], -.3) + 5.2 * p[3], p[2] + Math.sin(i * 2.1 + p[4]) * 1.6 * p[3], p[3], 0, Math.PI])), false);
  instances(new THREE.ConeGeometry(.18, .7, 5), '#6a5a44', cyp.flatMap(p => [0, 1, 2, 3].map(i => [p[0] + Math.cos(i * 1.7) * 2, .1, p[2] + Math.sin(i * 1.7) * 2, rnd(.7, 1.2)])));
  instances(G.pad, '#3f7a34', scatter(180, [-60, 60, -20, 90], (x, z) => sp.ground(x, z) < -.4, .6, 1.3).map(p => [p[0], .03, p[2], p[3]]), false);
  instances(G.reed, '#6a8a3a', scatter(300, [-80, 80, -40, 90], (x, z) => { const y = sp.ground(x, z); return y > -.4 && y < .2; }, .7, 1.2, sp.ground).map(p => [p[0], .6, p[2], p[3]]), false);
  grass(scatter(500, [-80, 80, -60, 80], (x, z) => sp.ground(x, z) > .1, .7, 1.3, sp.ground), '#5a7a3a');
  sp.spawn = { x: -3, z: -42, yaw: Math.PI }; sp.fogMul = .7; sp.ff = true; sp.tint = '#9aa080';
  sp.amb = { water: .1, frogs: 1, crickets: 1, birds: .5 };
  finishSpot();
}

// =============== GULL POINT PIER ===============
function buildPier() {
  const sp = newSpot('pier');
  sp.waterY = () => 0;
  sp.ground = (x, z) => {
    let y = -z * .11 + fbm(x * .1, z * .1) * .3;
    if (z < -8) y += fbm(x * .05 + 9, z * .05) * 2.6 * Math.min(1, (-z - 8) / 12);
    const lh = Math.hypot(x - 44, z + 8); if (lh < 10) y = Math.max(y, 2.5 - lh * .15 + fbm(x * .3, z * .3) * 1.4);
    return Math.max(y, -9);
  };
  terrain(sp.ground, (x, z, y) => { if (Math.hypot(x - 44, z + 8) < 9 && y > 1) return '#7a7a76'; if (y < -.3) return '#c8b07a'; if (y < 1.4) return '#ecd9a4'; return fbm(x * .12, z * .12) > .5 ? '#c8c07a' : '#e2d29a'; });
  sp.waters.push(makeWater({ w: 260, d: 160, x: 0, z: 78, y: 0, color: '#1f7fa0', amp: .32, speed: 1.3, seg: 80, opacity: .9 }));
  const foam = add(new THREE.PlaneGeometry(240, 2.5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false }), 0, .12, 1, null, true); foam.rotation.x = -Math.PI / 2;
  sp.ticks.push((dt, t) => { foam.position.z = 1.5 + Math.sin(t * .9) * 1.6; foam.material.opacity = .35 + .25 * Math.sin(t * .9 + 1); });
  // pier
  const py = 3.2, pz0 = -6, pz1 = 72;
  box(3.8, .22, pz1 - pz0, '#9a8a70', 0, py - .1, (pz0 + pz1) / 2); sp.plats.push({ x0: -1.8, x1: 1.8, z0: pz0, z1: pz1, y: py });
  const rampY0 = sp.ground(0, -12); const ramp = box(3.4, .2, 6.4, '#9a8a70', 0, (rampY0 + py) / 2 - .05, -9); ramp.rotation.x = Math.atan2(py - rampY0, 6.2);
  sp.plats.push({ x0: -1.7, x1: 1.7, z0: -12.2, z1: -6, y: rampY0, y1: py });
  const pil = []; for (let z = pz0 + 2; z <= pz1; z += 4) for (const s of [-1, 1]) pil.push([s * 1.75, -3, z, 1]);
  instances(new THREE.CylinderGeometry(.22, .25, 12.5, 7), '#5a4a3a', pil);
  for (const s of [-1, 1]) { box(.12, .12, pz1 - pz0, '#c8c0b0', s * 1.85, py + 1, (pz0 + pz1) / 2); instances(new THREE.BoxGeometry(.12, 1, .12), '#c8c0b0', Array.from({ length: 40 }, (_, i) => [s * 1.85, py + .5, pz0 + i * 2, 1])); }
  for (const z of [10, 30, 50, 70]) lamp(1.6, z, 2.6);
  box(3.8, .22, 4, '#9a8a70', 0, py - .1, pz1 + 1.5); sp.plats.push({ x0: -3.5, x1: 3.5, z0: pz1 - .1, z1: pz1 + 3.4, y: py }); box(7, .22, 3.6, '#9a8a70', 0, py - .1, pz1 + 1.6);
  // shack
  const sx = -9, sz = -17; shedBuilding(sx, sz, 7, 5, 3.2, '#d8e8f0', '#3a7aa8', true); for (const s of [-1, 1]) { } sp.blocks.push([sx - 3.7, sx + 3.7, sz - 2.8, sz + 1.8]);
  const shY = sp.ground(sx, sz); ROOT.children[ROOT.children.length - 1].position.y = shY - .1;
  sign("ROSA'S SEAFOOD SHACK", '#3a7aa8', '#ffffff', 5, .7, sx, shY + 3.5, sz + 2.55);
  box(6.6, 1, .8, '#a8c8d8', sx, shY + .5, sz + 2.1); npc(sx, sz + .6, 0, '#e8604a', '#3a3a5a', null, '#a8704a', { hair: '#1a1410', sleeves: false });
  board(sx + 5, sz + 3, -.3, "ROSA'S ORDERS");
  // lighthouse
  const lx = 44, lz = -8, ly = sp.ground(lx, lz);
  for (let i = 0; i < 6; i++) cyl(2 - i * .14 - .14, 2 - i * .14, 2.2, 14, i % 2 ? '#d8402a' : '#f4f4f0', lx, ly + 1.1 + i * 2.2, lz);
  cyl(1.1, 1.1, 1.6, 10, '#2a2a2a', lx, ly + 14.2, lz); const lampG = glow(lx, ly + 14.2, lz, 7, 0xfff0b0);
  const beamM = new THREE.MeshBasicMaterial({ color: 0xfff6c8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const beam = new THREE.Group(); beam.position.set(lx, ly + 14.2, lz); ROOT.add(beam); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.ConeGeometry(4, 60, 16, 1, true), beamM); b.rotation.z = s * Math.PI / 2; b.position.x = s * 30; beam.add(b); }
  cyl(1.3, 1.3, .3, 12, '#2a2a2a', lx, ly + 15.15, lz); add(new THREE.ConeGeometry(1.3, 1.2, 12), '#2a2a2a', lx, ly + 15.9, lz);
  sp.ticks.push((dt, t, n) => { beam.rotation.y = t * .7; beamM.opacity = n * .18; lampG.material.opacity = .3 + n * .7; });
  // gulls
  const gulls = []; for (let i = 0; i < 7; i++) { const g = new THREE.Group(); ROOT.add(g); for (const s of [-1, 1]) { const w = box(1, .05, .3, '#f4f4f4', s * .45, 0, 0, g); w.rotation.z = s * .3; } box(.2, .15, .5, '#e8e8e8', 0, 0, 0, g); gulls.push({ g, a: rnd(0, 6), r: rnd(10, 30), h: rnd(9, 16), s: rnd(.2, .4) * (Math.random() < .5 ? -1 : 1), cx: rnd(-20, 20), cz: rnd(20, 60) }); }
  sp.ticks.push((dt, t, n) => gulls.forEach(q => { q.a += dt * q.s; q.g.position.set(q.cx + Math.cos(q.a) * q.r, q.h + Math.sin(t + q.a) * .5, q.cz + Math.sin(q.a) * q.r); q.g.rotation.y = -q.a + (q.s > 0 ? 0 : Math.PI); q.g.visible = n < .7; }));
  // dune fence & grass
  for (let i = 0; i < 20; i++) cyl(.05, .05, 1, 4, '#8a7a5a', -40 + i * 4, sp.ground(-40 + i * 4, -22) + .5, -22);
  instances(G.grass, '#a8a85a', scatter(800, [-100, 100, -100, -6], (x, z) => sp.ground(x, z) > 1 && Math.hypot(x - sx, z - sz) > 6 && Math.abs(x) > 3, .8, 1.6, sp.ground), false);
  truck(4, -26, -.3);
  const P = sp.points;
  P.push({ type: 'cast', x: 0, z: 74.4, yaw: Math.PI, label: 'Fish off the end of the pier', plat: true });
  P.push({ type: 'cast', x: 1.4, z: 36, yaw: -Math.PI / 2, label: 'Fish the pier pilings', plat: true });
  P.push({ type: 'cast', x: -24, z: -3, yaw: Math.PI, label: 'Surf fish from the beach' });
  P.push({ type: 'truck', x: 4, z: -26, r: 3.8, label: 'Drive somewhere' });
  P.push({ type: 'shop', bait: true, x: sx, z: sz + 3.3, r: 2.6, label: "Buy bait at Rosa's" });
  P.push({ type: 'npc', npc: 'rosa', x: sx - 2.6, z: sz + 3.3, r: 1.6, label: 'Talk to Rosa' });
  P.push({ type: 'buyer', x: sx + 5, z: sz + 4, r: 2, label: "Read Rosa's orders" });
  P.push({ type: 'page', x: lx - 1, z: lz - 2.8, r: 2, label: "Read Gus's logbook page" });
  box(1, 1.8, .1, '#3a2a1a', lx - .9, ly + .9, lz - 1.95).rotation.y = .4; pagePaper(lx - .9, ly + 1.2, lz - 2.05, Math.PI + .4);
  sp.circles.push([lx, lz, 2.1]);
  sp.structs.push({ type: 'pilings', x: 4, z: 38, r: 5 }, { type: 'bar', x: -24, z: 15, r: 7 }, { type: 'drop', x: 0, z: 92, r: 10 });
  sp.spawn = { x: -2, z: -28, yaw: Math.PI }; sp.tint = '#a8d8e8';
  sp.amb = { surf: .45, wind: .12, gulls: 1, crickets: .3 };
  finishSpot();
}

// =============== FROSTBITE LAKE (ice) ===============
function buildIce() {
  const sp = newSpot('ice'); const LC = [0, 25], LR = 75;
  const q = (x, z) => Math.hypot(x - LC[0], z - LC[1]) / LR;
  sp.waterY = () => -5;
  sp.iceWalk = (x, z) => q(x, z) < 1;
  sp.ground = (x, z) => { const k = q(x, z); if (k < 1) return 0; return (k - 1) * 28 * (.55 + fbm(x * .04, z * .04)) + fbm(x * .1, z * .1) * .6; };
  terrain(sp.ground, (x, z, y) => { if (q(x, z) < 1) { const f = fbm(x * .05, z * .09); return f > .62 ? '#e4f0f6' : f < .38 ? '#b2d0e0' : '#c8e0ec'; } if (y > 12 && fbm(x * .2, z * .2) > .6) return '#8a8c90'; return '#f2f6f9'; }, 300, 150);
  const igloo = (x, z, depth, i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); ROOT.add(g);
    const dg = new THREE.SphereGeometry(3.2, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2); const p = dg.attributes.position, cols = [], c = new THREE.Color();
    for (let k = 0; k < p.count; k++) { const yy = p.getY(k), a = Math.atan2(p.getZ(k), p.getX(k)); const row = Math.floor(yy / .55); const seam = Math.abs(((a * 3.2 + row * .5) % 1 + 1) % 1 - .5) < .05 || Math.abs((yy / .55) % 1) < .08; c.set(seam ? '#b8d4e4' : '#f4f9fc'); c.convertSRGBToLinear(); cols.push(c.r, c.g, c.b); }
    dg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const dome = new THREE.Mesh(dg, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true, roughness: .7 })); dome.castShadow = true; dome.receiveShadow = true; g.add(dome);
    const tun = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 12, 1, true, 0, Math.PI), M('#eef6fa', { side: THREE.DoubleSide })); tun.rotation.set(Math.PI / 2, 0, Math.PI / 2); tun.position.set(0, 0, -3.4); tun.castShadow = true; g.add(tun);
    add(new THREE.CircleGeometry(.6, 20), M('#0a2232', { roughness: .1 }), 0, .03, 0, g, true).rotation.x = -Math.PI / 2;
    add(new THREE.RingGeometry(.6, .85, 20), M('#dfeef6'), 0, .035, 0, g, true).rotation.x = -Math.PI / 2;
    box(.25, .35, .25, '#2a2a2a', 1.2, .18, -1.2, g); const lg = glow(1.2, .5, -1.2, .7, 0xffc070, g); box(.9, .5, .5, '#6a4a2a', -1.4, .25, -1.4, g); cyl(.03, .03, 1.2, 4, '#3a2a1a', -1.4, .9, -1.4, g);
    sign(depth + ' FT', '#2a4a6a', '#ffffff', 1.2, .4, 1.6, 1.3, -4.6, Math.PI);
    cyl(.05, .05, 1.6, 4, '#5a3a22', 1.6, .8, -4.55);
    sp.circles.push([x, z, 3.3]); sp.igloos.push({ x, z, depth, g });
    sp.points.push({ type: 'ice', igloo: sp.igloos.length - 1, x, z: z - 4.9, r: 2.2, label: `Enter igloo ${i} (${depth} ft deep)` });
  };
  igloo(-14, 14, 18, 1); igloo(12, 30, 28, 2); igloo(30, 6, 40, 3); igloo(-28, 44, 40, 4);
  // camp hut
  const hx = 0, hz = -56, hy = sp.ground(hx, hz); const hut = shedBuilding(hx, hz, 7, 5, 3, '#8a5a3a', '#e8eef2'); hut.position.y = hy; sp.blocks.push([hx - 3.7, hx + 3.7, hz - 2.8, hz + 2.8]);
  sign('FROSTBITE ICE CAMP', '#2a4a6a', '#ffffff', 5, .7, hx, hy + 3.4, hz + 2.65);
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(1.2, .8, .1), winMat, hx + s * 2, hy + 1.8, hz + 2.56, null, true);
  npc(hx + 3, hz + 4, 0, '#c83a3a', '#2a2a3a', '#2a2a3a', null, { beanie: 1, beard: '#5a3a24' });
  board(hx - 3, hz + 4.2, 0, 'ICE CAMP ORDERS');
  truck(-9, -60, .2);
  campfire(6, -50);
  // tip-up flags
  for (let i = 0; i < 10; i++) { const a = rnd(0, 6.3), r = rnd(8, 60); const x = Math.cos(a) * r, z = 25 + Math.sin(a) * r; if (sp.igloos.some(g => Math.hypot(g.x - x, g.z - z) < 6)) continue; cyl(.03, .03, 1.2, 4, '#5a3a22', x, .6, z); box(.35, .25, .02, '#ff6a2a', x + .18, 1.1, z); }
  // aurora
  const auroraM = new THREE.ShaderMaterial({ uniforms: { t: { value: 0 }, a: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: 'uniform float t;varying vec2 vU;void main(){vU=uv;vec3 p=position;p.z+=sin(p.x*.03+t*.3)*14.;p.y+=sin(p.x*.05+t*.5)*3.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader: 'uniform float t,a;varying vec2 vU;void main(){float f=smoothstep(0.,.3,vU.y)*smoothstep(1.,.4,vU.y);float s=.6+.4*sin(vU.x*40.+t);vec3 c=mix(vec3(.2,1.,.5),vec3(.6,.3,1.),vU.y);gl_FragColor=vec4(c*f*s*a,1.);}' });
  for (let i = 0; i < 3; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(420, 70, 60, 1), auroraM); m.position.set(rnd(-40, 40), 120 + i * 18, 150 + i * 40); ROOT.add(m); }
  sp.ticks.push((dt, t, n) => { auroraM.uniforms.t.value = t; auroraM.uniforms.a.value = n * (curWeather() === 'snow' ? .25 : .9); });
  const P = sp.points;
  P.push({ type: 'truck', x: -9, z: -60, r: 3.8, label: 'Drive somewhere' });
  P.push({ type: 'npc', npc: 'ice', x: hx + 3, z: hz + 5, r: 2, label: 'Talk to the camp boss' });
  P.push({ type: 'buyer', x: hx - 3, z: hz + 5.2, r: 2, label: 'Read the camp orders' });
  P.push({ type: 'page', x: -28, z: 44 - 5.6, r: 1.6, label: "Read Gus's logbook page" }); pagePaper(-27.6, 1.1, 44 - 4.5, Math.PI);
  pines(scatter(240, [-140, 140, -140, 140], (x, z) => q(x, z) > 1.06 && Math.hypot(x - hx, z - hz) > 9 && Math.hypot(x + 9, z + 60) > 6 && Math.hypot(x - 6, z + 50) > 5, .9, 1.8, sp.ground), true);
  rocks(scatter(40, [-120, 120, -120, 140], (x, z) => q(x, z) > 1.02 && q(x, z) < 1.3, .5, 1.5, sp.ground), '#8a8c90');
  mountains(200, 20, 0, true);
  sp.spawn = { x: -4, z: -45, yaw: Math.PI }; sp.tint = '#c8e0f0';
  sp.amb = { wind: .3, crickets: 0 };
  finishSpot();
}
const BUILDERS = { lake: buildLake, creek: buildCreek, river: buildRiver, bayou: buildBayou, pier: buildPier, ice: buildIce };
function buildSpot(id) { clearWorld(); BUILDERS[id](); }
