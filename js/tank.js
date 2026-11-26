// ============ Tanks: simulation, care actions, full-screen tank view ============
const tankIn = t => TANK_SIZES[t.size].inches;
const tankGal = t => TANK_SIZES[t.size].gal;
const stocking = t => t.fish.reduce((a, f) => a + f.L, 0) / (tankGal(t) * .6);
const tMin = t => t.chiller ? CHILLER.min : ROOM_T, tMax = t => t.heater ? HEATER.max : ROOM_T;
const tempOK = (sp, T) => { const r = TEMPS[SP[sp].temp]; return T >= r.min - .5 && T <= r.max + .5; };
const tempIdeal = (sp, T) => { const r = TEMPS[SP[sp].temp].ideal; return T >= r[0] && T <= r[1]; };
function powerRate(t) { let r = FILTERS[t.ft].power + .3; if (t.heater && t.temp < t.set - .2) r += HEATER.power; if (t.heater && t.set > ROOM_T) r += HEATER.power * .4; if (t.chiller && t.set < ROOM_T) r += CHILLER.power * (.5 + .5 * clamp((ROOM_T - t.set) / 20, 0, 1)); if (t.feeder) r += FEEDER.power; return r; }
const totalPower = () => S.tanks.reduce((a, t) => a + powerRate(t), 0) + (S.well === 3 && S.truck.length ? 2 : 0);
const atHome = () => SPOT && SPOT.id === 'lake';

function simAll(dt) {
  const h = dt / 3600;
  for (const t of S.tanks) {
    const bio = stocking(t), F0 = FILTERS[t.ft];
    t.set = clamp(t.set, tMin(t), tMax(t));
    t.temp += clamp(t.set - t.temp, -6 * h, 6 * h);
    t.filter = Math.max(0, t.filter - h * 100 / F0.life);
    const eff = t.filter > 0 ? F0.eff : .1;
    t.water = clamp(t.water - h * (2 + bio * 7) * (1 - eff * .85) * (1 + t.waste / 110) * (bio > 1 ? 1.8 : 1), 0, 100);
    t.algae = Math.min(100, t.algae + h * 7 * (t.water < 50 ? 1.6 : 1));
    t.waste = Math.min(100, t.waste + h * (1 + bio * 2.5));
    for (const x of t.fish) {
      const s = SP[x.sp];
      x.hunger = Math.min(100, x.hunger + h * 100 / (s.feedH * 1.5));
      if (t.feeder && x.hunger >= 60) { const fd = (S.food[t.feederFood] || 0) > 0 ? t.feederFood : Object.keys(S.food).find(k => S.food[k] > 0 && FOOD_EFF[k][s.diet] > 0 && k !== 'meds'); if (fd) feedOne(t, x, fd, true); }
      const ok = tempOK(x.sp, t.temp);
      const bad = (x.hunger >= 100 ? 1 : 0) + (t.water < 25 ? 1 : 0) + (!ok ? 1 : 0) + (bio > 1.25 ? 1 : 0);
      x.health = clamp(x.health + (bad ? -22 * bad : 12) * h, 5, 100);
      x.bonusT = Math.max(0, x.bonusT - h); x.vividT = Math.max(0, x.vividT - h);
      if (x.hunger < 75 && t.water >= 40 && ok && x.health >= 50 && bio <= 1.1 && x.L < x.maxL) {
        const rate = (x.maxL - Math.min(x.L0, s.adult * .12)) / s.growH;
        x.L = Math.min(x.maxL, x.L + rate * h * (x.bonusT > 0 ? x.bonus : 1) * (tempIdeal(x.sp, t.temp) ? 1.2 : 1));
      }
    }
    S.money -= powerRate(t) * h;
  }
  const W = WELLS[S.well];
  for (const x of S.truck) { x.hunger = Math.min(100, x.hunger + h * 100 / (SP[x.sp].feedH * 1.5)); const cold = SP[x.sp].temp === 'cold' && !W.cold; x.health = clamp(x.health - W.decay * (cold ? 1.6 : 1) * h - (x.hunger >= 100 ? 10 * h : 0), 5, 100); }
  if (S.well === 3 && S.truck.length) S.money -= 2 * h;
}
function fishStatus(t, x) {
  const s = SP[x.sp], out = [];
  if (t) {
    if (!tempOK(x.sp, t.temp)) out.push(['Wrong temperature (' + TEMPS[s.temp].min + '–' + TEMPS[s.temp].max + '°F needed)', 'bad']);
    if (x.hunger >= 75) out.push(['Hungry', x.hunger >= 100 ? 'bad' : 'warn']);
    if (t.water < 40) out.push(['Water too dirty', t.water < 25 ? 'bad' : 'warn']);
    if (stocking(t) > 1.1) out.push(['Tank overcrowded', 'warn']);
  } else out.push(['In the truck live well', 'warn']);
  if (x.health < 50) out.push(['Sick', 'bad']);
  if (!out.length) out.push([x.L >= x.maxL - .05 ? 'Fully grown' : 'Growing well', 'good']);
  return out;
}
function feedOne(t, x, food, auto) {
  if ((S.food[food] || 0) <= 0) return 'none';
  const s = SP[x.sp], eff = FOOD_EFF[food][s.diet];
  if (eff === 0) return 'refuse';
  S.food[food]--;
  if (x.hunger < 25 && food !== 'meds') { t.waste = Math.min(100, t.waste + 3); return 'full'; }
  const fill = FOODS[food].small && x.L > 8 ? 30 : 100;
  x.hunger = Math.max(0, x.hunger - fill * Math.min(1, eff + .2)); t.waste = Math.min(100, t.waste + 1.2);
  if (eff > 1) { x.bonus = eff; x.bonusT = 2; }
  if (food === 'color') x.vividT = 6;
  if (food === 'meds') x.health = Math.min(100, x.health + 30);
  if (!auto && TV.on && TV.tank === t) dropFood(x);
  return 'ok';
}
const FEED_MSG = { none: 'You’re out of that food.', refuse: 'It won’t eat that.', full: 'Not hungry. The food sank and dirtied the water.', ok: 'Fed.' };

// ---------- full-screen tank view ----------
const TV = { on: false, idx: 0, tank: null, sel: null, tab: 'fish', tool: 'select', scrubbing: false, fish: {}, food: 'pellets', algae: [], vac: 0 };
const tscene = new THREE.Scene(); const tcam = new THREE.PerspectiveCamera(42, 1, .1, 200);
const TW = 10, TH = 5.6, TD = 3.6;
tscene.add(new THREE.HemisphereLight(0xcfe8ff, 0x2a2018, .55));
const tlight = new THREE.DirectionalLight(0xffffff, 1.1); tlight.position.set(1, 12, 3); tlight.castShadow = true; tlight.shadow.mapSize.set(2048, 2048); Object.assign(tlight.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7 }); tscene.add(tlight);
const tankRoot = new THREE.Group(); tscene.add(tankRoot);
const causticTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; for (let i = 0; i < 70; i++) { g.beginPath(); const x = rnd(0, 256), y = rnd(0, 256), r = rnd(10, 34); g.ellipse(x, y, r, r * rnd(.5, 1), rnd(0, 3), 0, Math.PI * 2); g.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); return t; })();
const algaeTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(70,120,40,.85)'); r.addColorStop(.7, 'rgba(90,140,50,.45)'); r.addColorStop(1, 'rgba(90,140,50,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
let tWater, tFog, plants = [], bubbles, wasteIM, heaterGlow, foodBits = [], selGlow, filterFall;
function buildTankScene(t) {
  while (tankRoot.children.length) tankRoot.remove(tankRoot.children[0]); TV.fish = {}; TV.algae = []; plants = []; foodBits = [];
  const P = tankRoot, lm = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: lin(c), roughness: .8, flatShading: true }, o || {}));
  const mk = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; P.add(m); return m; };
  // room
  mk(new THREE.PlaneGeometry(60, 30), lm('#3a2a20'), 0, 8, -6).receiveShadow = true;
  for (let i = 0; i < 14; i++) mk(new THREE.BoxGeometry(.06, 30, .1), lm('#2a1e16'), -26 + i * 4, 8, -5.95);
  const fl = mk(new THREE.PlaneGeometry(60, 30), lm('#4a3a2c'), 0, -3.2, 5); fl.rotation.x = -Math.PI / 2;
  mk(new THREE.BoxGeometry(TW + .8, 3.2, TD + .8), lm('#2a1e16'), 0, -1.6, 0);
  mk(new THREE.BoxGeometry(TW + .6, .1, .1), lm('#c8a050', { metalness: .6, roughness: .3 }), 0, -.6, TD / 2 + .41);
  // frame & glass
  const blk = lm('#151515', { roughness: .4 });
  mk(new THREE.BoxGeometry(TW + .3, .25, TD + .3), blk, 0, -.12, 0); mk(new THREE.BoxGeometry(TW + .3, .25, TD + .3), blk, 0, TH + .12, 0).scale.set(1, 1, 1);
  const hood = mk(new THREE.BoxGeometry(TW + .3, .35, TD + .3), lm('#1a1a1a'), 0, TH + .42, 0);
  const glassM = new THREE.MeshStandardMaterial({ color: 0xe8f8ff, transparent: true, opacity: .08, roughness: .05, metalness: .1, depthWrite: false });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), glassM); front.position.set(0, TH / 2, TD / 2); P.add(front); TV.front = front;
  const back = mk(new THREE.PlaneGeometry(TW, TH), new THREE.MeshBasicMaterial({ color: lin('#0d3a52') }), 0, TH / 2, -TD / 2 + .01);
  for (const s of [-1, 1]) { const sd = new THREE.Mesh(new THREE.PlaneGeometry(TD, TH), glassM); sd.rotation.y = Math.PI / 2; sd.position.set(s * TW / 2, TH / 2, 0); P.add(sd); }
  // sand with caustics
  const sg = new THREE.PlaneGeometry(TW, TD, 40, 16); sg.rotateX(-Math.PI / 2); const sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) sp.setY(i, (fbm(sp.getX(i) * .5, sp.getZ(i) * .5) - .5) * .35 + (-sp.getZ(i) + TD / 2) * .12);
  sg.computeVertexNormals();
  mk(sg, new THREE.MeshStandardMaterial({ color: lin(t.size >= 2 ? '#c8b48a' : '#d4c094'), roughness: .95, flatShading: true, emissive: lin('#9fd8ff'), emissiveMap: causticTex, emissiveIntensity: .35 }), 0, .2, 0);
  // decor
  for (let i = 0; i < 7; i++) mk(new THREE.DodecahedronGeometry(rnd(.3, .8), 0), lm(pick(['#7a7a74', '#8a8070', '#6a6a66'])), rnd(-TW / 2 + 1, -1) + (i > 3 ? TW / 2 + .5 : 0), .4, rnd(-TD / 2 + .4, -.2));
  for (let i = 0; i < 3; i++) { const d = mk(new THREE.CylinderGeometry(.09, .16, rnd(2.4, 3.6), 6), lm('#5a4030'), rnd(-2, 2), 1, rnd(-1.2, -.6)); d.rotation.set(rnd(-.3, .3), rnd(0, 3), rnd(.6, 1.2) * (Math.random() < .5 ? 1 : -1)); }
  const plantCols = ['#3f9a4a', '#4aa856', '#5aa83a', '#2f8a5a'];
  for (let i = 0; i < 26; i++) { const g = new THREE.Group(); const x = rnd(-TW / 2 + .4, TW / 2 - .4), z = rnd(-TD / 2 + .3, -.3); g.position.set(x, .3, z); P.add(g); const n = Math.floor(rnd(3, 7)), hgt = rnd(1.2, TH * .75); for (let k = 0; k < n; k++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(.18, hgt), lm(pick(plantCols), { side: THREE.DoubleSide })); b.position.y = hgt / 2; b.rotation.y = rnd(0, 3); b.rotation.z = rnd(-.15, .15); g.add(b); } plants.push({ g, ph: rnd(0, 6) }); }
  // equipment
  const F0 = t.ft;
  if (F0 === 0) { mk(new THREE.CylinderGeometry(.35, .35, 1.2, 10), lm('#1a1a1a', { roughness: 1 }), -TW / 2 + .6, 1, -TD / 2 + .5); }
  if (F0 === 1) { mk(new THREE.BoxGeometry(1.4, 1.4, .7), lm('#2a2a2a'), TW / 2 - 1.2, TH - .2, -TD / 2 - .2); filterFall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.3), new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: .45, map: causticTex })); filterFall.position.set(TW / 2 - 1.2, TH - .9, -TD / 2 + .25); P.add(filterFall); } else filterFall = null;
  if (F0 === 2) { for (const dx of [0, .5]) mk(new THREE.CylinderGeometry(.08, .08, TH, 8), lm('#3a5a3a', { roughness: .3 }), TW / 2 - 1.5 + dx, TH / 2 + .5, -TD / 2 + .3); mk(new THREE.CylinderGeometry(.6, .6, 2, 14), lm('#2a2a2a'), TW / 2 - 1, -1.6, TD / 2 + .9); }
  if (t.heater) { mk(new THREE.CylinderGeometry(.09, .09, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0xdddddd, transparent: true, opacity: .6 }), -TW / 2 + .35, 2.6, -TD / 2 + .3); heaterGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xff7a2a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); heaterGlow.position.set(-TW / 2 + .35, 2, -TD / 2 + .35); heaterGlow.scale.setScalar(1); P.add(heaterGlow); } else heaterGlow = null;
  if (t.chiller) { mk(new THREE.BoxGeometry(2, 2.2, 1.6), lm('#d8dde2', { roughness: .4 }), -TW / 2 - 2.2, -2.1, .4); const led = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x3ab0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); led.position.set(-TW / 2 - 2.2, -1.3, 1.25); led.scale.setScalar(.6); P.add(led); }
  if (t.feeder) mk(new THREE.BoxGeometry(.9, .6, .7), lm('#e8e8e8'), 2.2, TH + .9, .3);
  // bubbles
  const bg = new THREE.BufferGeometry(), N = 60, bp = new Float32Array(N * 3); for (let i = 0; i < N; i++) bp.set([-TW / 2 + .6 + rnd(-.2, .2), rnd(.4, TH), -TD / 2 + .5 + rnd(-.2, .2)], i * 3); bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
  bubbles = new THREE.Points(bg, new THREE.PointsMaterial({ color: 0xffffff, size: .09, transparent: true, opacity: .8 })); P.add(bubbles);
  // water volume tint (in front of everything inside)
  tWater = new THREE.Mesh(new THREE.BoxGeometry(TW - .02, TH - .3, TD - .02), new THREE.MeshBasicMaterial({ color: 0x3aa0d0, transparent: true, opacity: .08, depthWrite: false })); tWater.position.set(0, TH / 2 - .1, 0); P.add(tWater);
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(TW, TD), new THREE.MeshStandardMaterial({ color: lin('#9fdcf4'), transparent: true, opacity: .35, roughness: .1 })); surf.rotation.x = -Math.PI / 2; surf.position.y = TH - .25; P.add(surf);
  // waste
  wasteIM = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.06, 0), lm('#4a3a1a'), 80); const o = new THREE.Object3D(); for (let i = 0; i < 80; i++) { o.position.set(rnd(-TW / 2 + .3, TW / 2 - .3), .3 + rnd(0, .1), rnd(-TD / 2 + .3, TD / 2 - .3)); o.updateMatrix(); wasteIM.setMatrixAt(i, o.matrix); } P.add(wasteIM);
  // algae patches
  for (let i = 0; i < 46; i++) { const a = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: algaeTex, transparent: true, depthWrite: false })); const s = rnd(.7, 1.8); a.scale.set(s, s, 1); a.position.set(rnd(-TW / 2 + .5, TW / 2 - .5), rnd(.5, TH - .5), TD / 2 - .03); a.renderOrder = 5; P.add(a); TV.algae.push(a); }
  selGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff0a0, transparent: true, opacity: .0, depthWrite: false, blending: THREE.AdditiveBlending })); P.add(selGlow);
  updateTankLook(t);
}
function updateTankLook(t) {
  const q = t.water / 100; tWater.material.color.copy(lin('#3aa0d0').lerp(lin('#6a7a2a'), 1 - q)); tWater.material.opacity = .06 + .5 * Math.pow(1 - q, 1.4);
  wasteIM.count = Math.round(t.waste / 100 * 80);
  const n = Math.round(t.algae / 100 * TV.algae.length); TV.algae.forEach((a, i) => a.visible = i < n);
  tscene.fog = new THREE.FogExp2(lin('#1a4a5a').lerp(lin('#4a5a2a'), 1 - q).getHex(), .01 + .05 * (1 - q));
}
function syncTankFish(t) {
  const ids = new Set(t.fish.map(f => String(f.id)));
  for (const id in TV.fish) if (!ids.has(id)) { tankRoot.remove(TV.fish[id].m); delete TV.fish[id]; }
  for (const f of t.fish) {
    let o = TV.fish[f.id]; const key = f.sp + f.traits.join();
    if (!o || o.key !== key) { if (o) tankRoot.remove(o.m); const m = fishMesh(f.sp, f.traits, { shadow: true }); m.position.set(rnd(-3, 3), rnd(1, 4), rnd(-1, 1)); m.userData.fid = f.id; tankRoot.add(m); o = TV.fish[f.id] = { m, key, tx: 0, ty: 2, tz: 0, ph: rnd(0, 6), sp: rnd(.6, 1.1) }; newTarget(o, f); }
    o.m.scale.setScalar(Math.max(.25, f.L / tankIn(t) * TW));
  }
}
function newTarget(o, f) { const s = SP[f.sp], len = f.L / tankIn(TV.tank) * TW, bottom = s.diet === 'bottom' || s.look.s === 'flat' || s.look.s === 'cat'; const mx = TW / 2 - len * .6 - .2; o.tx = rnd(-mx, mx); o.ty = bottom ? rnd(.5, 1.4) : rnd(1, TH - .8); o.tz = rnd(-TD / 2 + .5, TD / 2 - .5); }
function dropFood(x) { for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.05, 5, 4), M('#8a5a2a')); b.position.set(rnd(-3, 3), TH - .3, rnd(-1, 1)); tankRoot.add(b); foodBits.push({ m: b, life: 6 }); } SFX.bubble(); }
function tankTick(dt, t) {
  const tk = TV.tank; if (!tk) return;
  causticTex.offset.x += dt * .03; causticTex.offset.y += dt * .02;
  plants.forEach(p => p.g.rotation.z = Math.sin(t * .8 + p.ph) * .06);
  const bp = bubbles.geometry.attributes.position; for (let i = 0; i < bp.count; i++) { let y = bp.getY(i) + dt * rnd(.8, 1.4); if (y > TH - .3) y = .4; bp.setY(i, y); bp.setX(i, bp.getX(i) + Math.sin(t * 4 + i) * .003); } bp.needsUpdate = true;
  if (filterFall) filterFall.material.map.offset.y -= dt;
  if (heaterGlow) heaterGlow.material.opacity = tk.temp < tk.set - .2 ? .8 : .25;
  for (const b of foodBits) { b.life -= dt; b.m.position.y = Math.max(.35, b.m.position.y - dt * .5); if (b.life <= 0) tankRoot.remove(b.m); }
  foodBits = foodBits.filter(b => b.life > 0);
  for (const f of tk.fish) {
    const o = TV.fish[f.id]; if (!o) continue; const m = o.m;
    if (foodBits.length && f.hunger < 30) { const b = foodBits[f.id % foodBits.length]; o.tx = b.m.position.x; o.ty = b.m.position.y; o.tz = b.m.position.z; }
    const dx = o.tx - m.position.x, dy = o.ty - m.position.y, dz = o.tz - m.position.z, d = Math.hypot(dx, dy, dz);
    if (d < .15) { newTarget(o, f); continue; }
    const len = m.scale.x, spd = (.5 + len * .5) * o.sp * (f.health < 50 ? .4 : 1);
    m.position.x += dx / d * spd * dt; m.position.y += dy / d * spd * dt * .6; m.position.z += dz / d * spd * dt;
    const want = Math.atan2(dz, -dx); let df = want - m.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); m.rotation.y += df * Math.min(1, dt * 3);
    m.rotation.z = clamp(-dy / d * .4, -.4, .4); m.userData.tail.rotation.y = Math.sin(t * (6 + spd * 4) + o.ph) * .45;
  }
  if (TV.sel && TV.fish[TV.sel]) { const m = TV.fish[TV.sel].m; selGlow.position.copy(m.position); selGlow.scale.setScalar(m.scale.x * 2.2); selGlow.material.opacity = .35 + .15 * Math.sin(t * 4); } else selGlow.material.opacity = 0;
  if (TV.vac > 0) { TV.vac += dt; $('vacbar').style.width = Math.min(100, TV.vac / 2.5 * 100) + '%'; if (TV.vac >= 2.5) { TV.vac = 0; tk.waste = 0; toast('Gravel vacuumed. Waste removed.'); SFX.bubble(); renderTankPanel(); } }
  const mx = TV.mx || 0, my = TV.my || 0; tcam.position.set(mx * .8, 3 + my * .5, TV.camZ); tcam.lookAt(0, 2.7, 0);
}
function tankResize() {
  const w = innerWidth, h = innerHeight, narrow = w < 760; tcam.aspect = w / h; TV.camZ = narrow ? 17 : 12.5;
  if (narrow) { const ph = Math.min(h * .48, 420); tcam.setViewOffset(w, h, 0, ph * .5, w, h); }
  else tcam.setViewOffset(w, h, 200, 0, w, h);
  tcam.updateProjectionMatrix();
}
function openTankView(idx) {
  if (mode === 'fish' || mode === 'ice') return;
  closeAll(); mode = 'tank'; TV.on = true; TV.idx = clamp(idx ?? TV.idx, 0, S.tanks.length - 1); TV.tank = S.tanks[TV.idx]; TV.sel = null; TV.tool = 'select';
  buildTankScene(TV.tank); syncTankFish(TV.tank); tankResize(); document.body.classList.add('tankmode'); renderTankPanel(); tip('tank'); SFX.bubble();
}
function closeTankView() { mode = 'walk'; TV.on = false; document.body.classList.remove('tankmode'); TV.tank = null; refreshHomeTanks(); }
function switchTank(d) { openTankView((TV.idx + d + S.tanks.length) % S.tanks.length); }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function tankPointer(e, kind) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, tcam);
  TV.mx = ndc.x; TV.my = ndc.y;
  if (kind === 'down') {
    if (TV.tool === 'scrub') { if (!atHome()) { toast('Head home to scrub the glass.'); return; } TV.scrubbing = true; }
    else { const hits = ray.intersectObjects(Object.values(TV.fish).map(o => o.m), true); if (hits.length) { let o = hits[0].object; while (o && o.userData.fid === undefined) o = o.parent; if (o) { TV.sel = o.userData.fid; TV.tab = 'fish'; renderTankPanel(); SFX.ui(); } } }
  }
  if (kind === 'up') TV.scrubbing = false;
  if (TV.scrubbing) { const hit = ray.intersectObject(TV.front); if (hit.length) { const p = hit[0].point; let n = 0; TV.algae.forEach(a => { if (a.visible && Math.hypot(a.position.x - p.x, a.position.y - p.y) < .8) { a.visible = false; n++; } }); if (n) { TV.tank.algae = Math.max(0, TV.tank.algae - n * (100 / TV.algae.length)); SFX.click(); if (TV.tank.algae < 1) { TV.tool = 'select'; toast('Glass is spotless.'); renderTankPanel(); } } } }
}

// ---------- tank panel ----------
const barH = (v, cls) => `<div class="bar"><i class="${cls || ''}" style="width:${clamp(v, 0, 100)}%"></i></div>`;
const lvlCls = v => v > 60 ? 'good' : v > 30 ? 'warn' : 'bad';
function renderTankPanel() {
  const t = TV.tank; if (!t) return; const home = atHome(); const el = $('tankpanel');
  const st = stocking(t), tabs = [['fish', 'Fish'], ['care', 'Care'], ['gear', 'Gear'], ['help', 'How it works']];
  let h = `<div class="tp-head"><div><div class="eyebrow">Tank ${TV.idx + 1} of ${S.tanks.length}</div><h2>${TANK_SIZES[t.size].name}</h2></div><div class="row tight">${S.tanks.length > 1 ? '<button class="ghost small" data-act="tank-prev" aria-label="Previous tank">◀</button><button class="ghost small" data-act="tank-next" aria-label="Next tank">▶</button>' : ''}<button class="ghost small" data-act="tank-close">Close</button></div></div>`;
  if (!home) h += `<div class="note">Tank cam. You’re at ${esc(SPOTS[SPOT.id].name)}; head home to feed, clean or move fish. Gear can still be ordered.</div>`;
  h += `<div class="chips"><span class="c ${lvlCls(t.water)}">Water ${Math.round(t.water)}%</span><span class="c ${lvlCls(t.filter)}">Filter ${Math.round(t.filter)}%</span><span class="c ${lvlCls(100 - t.algae)}">Algae ${Math.round(t.algae)}%</span><span class="c ${lvlCls(100 - t.waste)}">Waste ${Math.round(t.waste)}%</span><span class="c">${t.temp.toFixed(1)}°F</span><span class="c ${st > 1.1 ? 'bad' : st > .85 ? 'warn' : 'good'}">Space ${Math.round(st * 100)}%</span><span class="c">Power ${money(powerRate(t))}/hr</span></div>`;
  h += `<div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${TV.tab === k ? 'on' : ''}" data-act="ttab" data-id="${k}">${n}</button>`).join('')}</div>`;
  if (TV.tab === 'fish') {
    const x = t.fish.find(f => f.id === TV.sel);
    if (x) h += fishCardHTML(x, t, home);
    else h += `<p class="dim">Click a fish in the tank to inspect it.</p>`;
    h += `<h3>In this tank (${t.fish.length})</h3>` + (t.fish.length ? `<div class="flist">${t.fish.map(f => { const s = fishStatus(t, f)[0]; return `<button class="frow ${f.id === TV.sel ? 'on' : ''}" data-act="tsel" data-id="${f.id}"><img src="${fishThumb(f.sp, f.traits)}" alt=""><span><b>${esc(fishName(f))}</b><small>${f.L.toFixed(1)} in · ${lbs(weightOf(f.sp, f.L))}</small></span><i class="dot ${s[1]}" title="${esc(s[0])}"></i></button>`; }).join('')}</div>` : '<p class="dim">Empty. Buy fry at Bait & Fry, or bring fish home in the truck.</p>');
    if (S.truck.length) h += `<h3>Truck live well (${S.truck.length}/${WELLS[S.well].cap})</h3><div class="flist">${S.truck.map(f => `<div class="frow"><img src="${fishThumb(f.sp, f.traits)}" alt=""><span><b>${esc(fishName(f))}</b><small>${f.L.toFixed(1)} in · health ${Math.round(f.health)}%</small></span><button class="small" data-act="to-tank" data-id="${f.id}" ${home && SP[f.sp].water === 'fresh' ? '' : 'disabled'}>Move in</button></div>`).join('')}</div>`;
  }
  if (TV.tab === 'care') {
    const owned = Object.keys(FOODS).filter(k => (S.food[k] || 0) > 0); if (!owned.includes(TV.food) && owned.length) TV.food = owned[0];
    const wc = Math.round(tankGal(t) * .25), cart = FILTERS[t.ft].cart;
    h += careRow('Water quality', t.water, `Waste and leftover food foul the water. Below 40% fish stop growing; below 25% they get sick.`, `<button class="small" data-act="wchange" ${home ? '' : 'disabled'}>Water change · ${money(wc)}</button>`);
    h += careRow('Filter cartridge', t.filter, `${FILTERS[t.ft].name}. Lasts about ${FILTERS[t.ft].life} hours. At 0% the water dirties ~3× faster.`, `<button class="small" data-act="cart" ${home ? '' : 'disabled'}>Replace · ${money(cart)}</button>`);
    h += careRow('Algae on glass', 100 - t.algae, 'Grows every hour, faster in dirty water. Free to scrub: pick the scrubber, then drag across the glass.', `<button class="small ${TV.tool === 'scrub' ? 'on' : ''}" data-act="scrub" ${home ? '' : 'disabled'}>${TV.tool === 'scrub' ? 'Scrubbing… drag on glass' : 'Scrub glass'}</button>`);
    h += careRow('Gravel waste', 100 - t.waste, 'Builds up from fish waste and food. Makes the water foul faster. Vacuum it (free).', `<button class="small" data-act="vac" ${home ? '' : 'disabled'}>Vacuum gravel</button><div class="bar thin"><i id="vacbar" style="width:0"></i></div>`);
    const mn = tMin(t), mxT = tMax(t);
    h += `<div class="care"><div class="lbl"><b>Temperature</b><span>${t.temp.toFixed(1)}°F now · set ${t.set.toFixed(0)}°F</span></div>${mn === mxT ? `<p class="dim">Room temperature (${ROOM_T}°F). Add a heater or chiller in Gear to change it.</p>` : `<input type="range" min="${mn}" max="${mxT}" step="1" value="${t.set}" data-act="temp" aria-label="Set temperature">`}<p class="dim">Cold 48–60°F (trout, char, grayling) · Cool 55–70°F (perch, walleye, smallmouth, pike) · Warm 68–84°F (sunfish, bass, catfish, gar).</p></div>`;
    h += `<div class="care"><div class="lbl"><b>Feeding</b><span>${t.fish.filter(f => f.hunger >= 60).length} hungry</span></div>${owned.length ? `<select data-act="foodsel" aria-label="Food">${owned.map(k => `<option value="${k}" ${k === TV.food ? 'selected' : ''}>${esc(FOODS[k].name)} (${S.food[k]})</option>`).join('')}</select>` : '<p class="dim">No food. Buy some at Bait & Fry.</p>'}<p class="dim">${owned.length ? esc(FOODS[TV.food].info) : ''}</p><div class="row"><button class="small" data-act="feedall" ${home && owned.length ? '' : 'disabled'}>Feed hungry fish</button>${t.feeder ? `<label class="dim">Auto-feeder uses: <select data-act="feedersel">${Object.keys(FOODS).filter(k => k !== 'meds').map(k => `<option value="${k}" ${k === t.feederFood ? 'selected' : ''}>${esc(FOODS[k].name)}</option>`).join('')}</select></label>` : ''}</div></div>`;
  }
  if (TV.tab === 'gear') {
    const row = (name, info, owned, btn) => `<div class="care"><div class="lbl"><b>${name}</b>${owned ? '<span class="good">Installed</span>' : ''}</div><p class="dim">${info}</p>${btn || ''}</div>`;
    const nf = FILTERS[t.ft + 1];
    h += row(FILTERS[t.ft].name, FILTERS[t.ft].info + ` Runs ${money(FILTERS[t.ft].power)}/hr.`, true, nf ? `<button class="small" data-act="buy-filter" ${S.money >= nf.price ? '' : 'disabled'}>Upgrade to ${nf.name} · ${money(nf.price)}</button>` : '');
    h += row('Heater', HEATER.info + ` Uses ${money(HEATER.power)}/hr while heating.`, t.heater, t.heater ? '' : `<button class="small" data-act="buy-heater" ${S.money >= HEATER.price ? '' : 'disabled'}>Buy · ${money(HEATER.price)}</button>`);
    h += row('Chiller', CHILLER.info + ` Uses up to ${money(CHILLER.power)}/hr while cooling.`, t.chiller, t.chiller ? '' : `<button class="small" data-act="buy-chiller" ${S.money >= CHILLER.price ? '' : 'disabled'}>Buy · ${money(CHILLER.price)}</button>`);
    h += row('Auto-feeder', FEEDER.info, t.feeder, t.feeder ? '' : `<button class="small" data-act="buy-feeder" ${S.money >= FEEDER.price ? '' : 'disabled'}>Buy · ${money(FEEDER.price)}</button>`);
    const ns = TANK_SIZES[t.size + 1];
    h += row('Tank size', `${TANK_SIZES[t.size].name}: room for about ${Math.round(tankGal(t) * .6)} inches of fish in total.`, false, ns ? `<button class="small" data-act="buy-size" ${S.money >= ns.price ? '' : 'disabled'}>Upgrade to ${ns.name} · ${money(ns.price)}</button>` : '');
    if (S.tanks.length < 3) { const p = EXTRA_TANK_PRICE[S.tanks.length]; h += row('Another tank', 'Add a second 40-gallon tank to keep cold and warm fish apart.', false, `<button class="small" data-act="buy-tank" ${S.money >= p ? '' : 'disabled'}>Buy · ${money(p)}</button>`); }
  }
  if (TV.tab === 'help') h += helpHTML();
  el.innerHTML = h;
}
function careRow(name, good, info, btn) { return `<div class="care"><div class="lbl"><b>${name}</b><span>${Math.round(good)}%</span></div>${barH(good, lvlCls(good))}<p class="dim">${info}</p><div class="row">${btn}</div></div>`; }
function fishCardHTML(x, t, home) {
  const s = SP[x.sp], W = weightOf(x.sp, x.L), stt = fishStatus(t, x);
  return `<div class="fcard"><img src="${fishThumb(x.sp, x.traits)}" alt="" class="big"><div class="fc-name">${esc(fishName(x))}</div><div class="sci">${esc(s.sci)}</div>
  <div>${x.traits.map(k => `<span class="tag">${TRAITS[k].name}</span>`).join('')}${isRaised(x) ? '<span class="tag raised">Tank-raised ×1.6</span>' : '<span class="tag wild">Wild</span>'}${x.vividT > 0 ? '<span class="tag">Vivid</span>' : ''}</div>
  <div class="stats"><div><b>${x.L.toFixed(1)} in</b><small>length</small></div><div><b>${lbs(W)}</b><small>weight</small></div><div><b>${Math.round(x.L / x.maxL * 100)}%</b><small>of full size (${x.maxL.toFixed(1)} in)</small></div><div><b class="price">${money(fishValue(x))}</b><small>worth now</small></div></div>
  <div class="lbl"><span>Fullness</span><span>${Math.round(100 - x.hunger)}%</span></div>${barH(100 - x.hunger, lvlCls(100 - x.hunger))}
  <div class="lbl"><span>Health</span><span>${Math.round(x.health)}%</span></div>${barH(x.health, lvlCls(x.health))}
  <div class="status">${stt.map(([m, c]) => `<span class="${c}">${esc(m)}</span>`).join(' · ')}</div>
  <div class="row"><button class="small" data-act="feed1" data-id="${x.id}" ${home ? '' : 'disabled'}>Feed</button><button class="small ghost" data-act="sell1" data-id="${x.id}" ${home ? '' : 'disabled'}>Sell · ${money(fishValue(x))}</button><button class="small ghost" data-act="to-truck" data-id="${x.id}" ${home && S.truck.length < WELLS[S.well].cap ? '' : 'disabled'}>To truck</button><button class="small ghost" data-act="info" data-sp="${x.sp}">Species info</button></div></div>`;
}
function helpHTML() {
  return `<details open><summary>Feeding</summary><p>Each fish eats one portion per feeding. Small fish (sunfish, perch) get hungry about every 2 hours, trout and bass every 3, catfish and big predators every 4. A hungry fish stops growing; a starving one gets sick. Feeding a full fish wastes food and dirties the water.</p>
  <table class="mini"><tr><th>Food</th><th>Best for</th><th>Effect</th></tr>${Object.entries(FOODS).map(([k, f]) => `<tr><td>${f.name}</td><td>${['insect', 'omni', 'pred', 'bottom'].filter(d => FOOD_EFF[k][d] >= 1.1).map(d => ({ insect: 'bug-eaters', omni: 'omnivores', pred: 'predators', bottom: 'bottom feeders' }[d])).join(', ') || 'everyone'}</td><td>${f.info}</td></tr>`).join('')}</table></details>
  <details><summary>Water, filter, algae, waste</summary><p>Fish waste fouls the water every hour. Your filter slows that down until its cartridge wears out, so replace cartridges on time. Water changes reset the water but cost conditioner. Algae and gravel waste are free to clean but take your time. More fish means everything gets dirty faster.</p></details>
  <details><summary>Temperature</summary><p>Every fish has a range. Outside it, fish stop growing and slowly get sick. Inside the ideal middle of the range they grow 20% faster. Room temperature is ${ROOM_T}°F: fine for warmwater and coolwater fish, too warm for trout, so cold fish need a chiller. Keep cold and warm fish in separate tanks.</p></details>
  <details><summary>Space</summary><p>A tank holds roughly 0.6 inches of fish per gallon. A 40-gallon tank fits 24 inches total: a few panfish, or one big trout. Overcrowded tanks foul fast and stress everyone.</p></details>
  <details><summary>Power bill</summary><p>Filters, heaters, chillers and feeders draw power, billed every hour, even while you’re away. Chillers are the most expensive by far. If your money goes negative, you can’t buy anything until you sell fish.</p></details>
  <details><summary>Why raise fish?</summary><p>Buyers pay 1.6× for tank-raised fish. Bigger and healthier fish are worth more, rare traits multiply value, and color-boost food adds 12% while it lasts. Buyers at each spot pay even more for the exact fish they order.</p></details>`;
}
