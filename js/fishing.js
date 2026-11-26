// ============ Fishing: bobber, bottom, lure, fly, ice jigging, fights ============
const F = { st: 'off', hold: false, holdT: 0, t: 0, power: 0, dist: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), pos: new THREE.Vector3(), point: null, struct: null, style: 'bobber', bait: 'worm', wait: 0, win: 0, speed: 0, T: 0, P: 0, st2: 0, surge: 0, surgeT: 0, jumpT: 0, jumpPhase: 0, fish: null, k: 1, stamina: 100, nib: 0, depth: 0, interest: 0, lastJig: 0, igloo: null, netT: 0, drift: 0, strike: 0, arcs: [] };
// ---------- gear meshes ----------
const rodG = new THREE.Group(); rodG.position.set(.38, -.44, -.6); rodG.rotation.set(-1.05, 0, -.18); rodG.visible = false; cam.add(rodG);
cyl(.022, .026, .32, 6, '#2a2a2a', 0, .1, 0, rodG); const reel = cyl(.045, .045, .04, 12, '#6a6a6a', .045, .18, 0, rodG); reel.rotation.z = Math.PI / 2;
const rodSegs = []; { let parent = rodG, y0 = .26; for (let i = 0; i < 4; i++) { const g = new THREE.Group(); g.position.y = i ? .36 : y0; parent.add(g); cyl(.018 - i * .004, .022 - i * .004, .36, 5, i % 2 ? '#2a3a4a' : '#3a2a1a', 0, .18, 0, g); rodSegs.push(g); parent = g; } }
const rodTip = new THREE.Object3D(); rodTip.position.y = .36; rodSegs[3].add(rodTip);
const bob = new THREE.Group(); add(new THREE.SphereGeometry(.11, 10, 8), '#ff3b30', 0, 0, 0, bob, true); add(new THREE.SphereGeometry(.112, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), '#ffffff', 0, .005, 0, bob, true); cyl(.01, .01, .25, 4, '#222', 0, .17, 0, bob); bob.visible = false; scene.add(bob);
const lureM = new THREE.Group(); add(new THREE.SphereGeometry(.07, 8, 6), M('#e8e8f0', { metalness: .9, roughness: .2 }), 0, 0, 0, lureM, true); lureM.visible = false; scene.add(lureM);
const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const fline = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xf4f4f4, transparent: true, opacity: .8 })); fline.frustumCulled = false; fline.visible = false; scene.add(fline);
let fightFish = null; const tipW = new THREE.Vector3();
const splashes = []; for (let i = 0; i < 24; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xe8f6ff, transparent: true, opacity: 0, depthWrite: false })); scene.add(s); splashes.push({ s, v: new THREE.Vector3(), life: 0 }); }
function splash(p, n, big) { let c = 0; for (const q of splashes) { if (q.life > 0) continue; q.s.position.copy(p); q.v.set(rnd(-1.5, 1.5) * (big ? 1.6 : 1), rnd(2, 4) * (big ? 1.5 : 1), rnd(-1.5, 1.5)); q.life = 1; q.s.scale.setScalar(big ? .5 : .3); if (++c >= n) break; } SFX.splash(big); }
function tickSplashes(dt) { for (const q of splashes) { if (q.life <= 0) { q.s.material.opacity = 0; continue; } q.life -= dt * 1.4; q.v.y -= 9 * dt; q.s.position.addScaledVector(q.v, dt); q.s.material.opacity = Math.max(0, q.life) * .9; } }

// ---------- conditions ----------
const rodNow = () => RODS[S.rod];
const haveBait = b => BAITS[b].lure ? (S.lures[b] || 0) > 0 : (S.bait[b] || 0) > 0;
function structAt(x, z) { return SPOT.structs.find(s => Math.hypot(x - s.x, z - s.z) < s.r) || null; }
function speciesWeights(bait, struct, depth) {
  const per = period(S.clock), w = curWeather(), out = [];
  for (const s of SPECIES) {
    const base = s.spots[SPOT.id]; if (!base) continue;
    let m = base * (s.bait[bait] || .06) * TIMES[s.time].m[per];
    if (w === 'rain') m *= s.rain; if (w === 'fog' && s.time !== 'day') m *= 1.15;
    if (struct && STRUCT[struct.type] && STRUCT[struct.type].fav.includes(s.id)) m *= 2.2;
    if (bait === 'fly' && S.rod === 'fly') m *= RODS.fly.flyBonus;
    if (depth !== undefined && s.depth) m *= (depth >= s.depth[0] && depth <= s.depth[1]) ? 1 : .05;
    out.push([s.id, m]);
  }
  return out;
}
function biteRate(bait, struct, depth) { const ws = speciesWeights(bait, struct, depth); const tot = ws.reduce((a, b) => a + b[1], 0); return { ws, rate: clamp(tot / 55, .015, .55) * (struct ? 1.6 : 1) }; }
function legendCheck(bait) {
  const L = LEGENDS[SPOT.id]; if (!L || !S.pages[SPOT.id] || S.legends[SPOT.id]) return false; const n = L.need;
  if (!n.time.includes(period(S.clock))) return false; if (!n.bait.includes(bait)) return false;
  if (n.far && F.dist < n.far) return false; if (n.rod && S.rod !== n.rod) return false; if (n.weather && curWeather() !== n.weather) return false;
  if (n.depth && F.depth < n.depth) return false;
  return Math.random() < .08;
}
function hookFish() {
  const bait = F.bait; let x;
  if (legendCheck(bait)) {
    const L = LEGENDS[SPOT.id], s = SP[L.sp]; const len = (L.sp === 'algar' ? s.adult * rnd(1.25, 1.45) : s.big * L.size);
    x = makeFish(L.sp, len, len, L.traits.slice(), true); x.legend = SPOT.id; x.health = 100;
  } else {
    const { ws } = biteRate(bait, F.struct, F.mode === 'ice' ? F.depth : undefined); const sp = wpick(ws), s = SP[sp];
    let f = .42 + Math.random() * .55 + (Math.random() < .12 ? rnd(.1, .45) : 0) + (F.struct ? .08 : 0) + Math.min(.12, F.dist / 300);
    f = clamp(f, .35, s.big / s.adult);
    const tr = rollTraits(sp, 1 + (F.struct ? .3 : 0)); const L = s.adult * f * (tr.includes('giant') ? 1.3 : 1);
    x = makeFish(sp, L, Math.max(L, s.adult * rnd(1, 1.1) * (tr.includes('giant') ? 1.4 : 1)), tr, true);
  }
  F.fish = x; const W = weightOf(x.sp, x.L), line = rodNow().line;
  F.k = (.5 + 1.15 * clamp(W / line, 0, 1.7)) * (x.legend ? 1.35 : 1);
  F.stamina = (x.legend ? 220 : 100) * (.75 + .25 * Math.min(1.6, W / 4));
  F.st = 'reel'; F.T = 18; F.P = 22; F.surge = 0; F.surgeT = 1; F.jumpT = rnd(2.5, 5); F.jumpPhase = 0;
  if (!BAITS[bait].lure) S.bait[bait] = Math.max(0, (S.bait[bait] || 0) - 0);
  if (fightFish) scene.remove(fightFish); fightFish = fishMesh(x.sp, x.traits); fightFish.visible = false; scene.add(fightFish);
  const fl = SP[x.sp].fight; msg(x.legend ? 'Something huge is on!' : 'Fish on! Hold to reel', true); SFX.bite();
  showMeters(['tension', 'progress']); tip('reel'); if (fl === 'jumper') setTimeout(() => tip('jump'), 2500);
}

// ---------- start / stop ----------
function startFishing(p) {
  mode = 'fish'; F.point = p; F.mode = 'cast'; const P = player.position; P.set(p.x, SPOT.walk(p.x, p.z) || 0, p.z); yaw = p.yaw; fpPitch = -.1;
  rodG.visible = true; rodG.scale.setScalar(1); fishUI(true); readyState(); tip('fish');
  if (!haveBait(S.sel)) { const any = Object.keys(BAITS).find(b => haveBait(b) && BAITS[b].style !== 'jig'); if (any) S.sel = any; }
  renderBaitBar();
}
function enterIgloo(p) {
  const ig = SPOT.igloos[p.igloo]; mode = 'ice'; F.mode = 'ice'; F.igloo = ig; F.depth = 0; F.interest = 0;
  rodG.visible = true; rodG.scale.setScalar(.55); fishUI(true, true);
  if (haveBait('jig')) S.sel = 'jig'; else if (haveBait('minnow')) S.sel = 'minnow';
  readyState(); tip('ice'); renderBaitBar(); genArcs();
  if (!SPOT.iceLight) { SPOT.iceLight = new THREE.PointLight(0xffc890, 2.6, 14, 1); ROOT.add(SPOT.iceLight); }
  SPOT.iceLight.position.set(ig.x + 1.2, 1, ig.z - 1.2); SPOT.iceLight.visible = true;
}
function leaveFishing() {
  if (F.st === 'result') return;
  const wasIce = mode === 'ice'; mode = 'walk'; F.st = 'off'; F.hold = false; rodG.visible = false; bob.visible = false; lureM.visible = false; fline.visible = false;
  if (fightFish) { scene.remove(fightFish); fightFish = null; } fishUI(false);
  if (wasIce) { const ig = F.igloo; player.position.set(ig.x, .02, ig.z - 5.2); yaw = 0; if (SPOT.iceLight) SPOT.iceLight.visible = false; }
  else { const p = F.point, back = 1.6; const nx = p.x + Math.sin(p.yaw) * back, nz = p.z + Math.cos(p.yaw) * back; if (SPOT.walk(nx, nz) !== null) player.position.set(nx, SPOT.walk(nx, nz), nz); }
}
function readyState() {
  F.st = 'ready'; F.hold = false; bob.visible = false; lureM.visible = false; fline.visible = F.mode === 'ice';
  if (F.mode === 'ice') { msg('Hold DROP to sink your line'); showMeters(['depth']); }
  else { F.style = BAITS[S.sel] ? BAITS[S.sel].style : 'bobber'; msg(haveBait(S.sel) ? 'Hold to charge a cast, release to throw' : 'Out of that bait. Pick another below.'); showMeters(['power']); }
}
function fishKey(k, down, e) {
  if (k === ' ') { e.preventDefault(); if (down && !e.repeat) fishDown(); if (!down) fishUp(); return; }
  if (!down || e.repeat) return;
  if (k === 'q') leaveFishing();
  const n = parseInt(k); if (n >= 1 && n <= 9) { const b = baitList()[n - 1]; if (b) selectBait(b); }
}
function fishDown() {
  if (uiBlocking()) return; F.hold = true; F.holdT = 0; audioInit();
  if (F.mode === 'ice') { if (F.st === 'bite') { hookFish(); return; } if (F.st === 'ready' || F.st === 'jig') jig(); return; }
  if (F.st === 'ready') { if (!haveBait(S.sel)) { msg('No ' + BAITS[S.sel].name.toLowerCase() + ' left. Pick another bait.'); return; } F.style = BAITS[S.sel].style; F.bait = S.sel; F.st = 'charge'; F.t = 0; }
  else if (F.st === 'bite') hookFish();
  else if (F.st === 'wait') { msg(F.style === 'bottom' ? 'Just a nibble. Wait for the hard pull.' : 'Too early! Wait for the bobber to go under.'); F.wait += 1.5; }
  else if (F.st === 'drift' && F.strike > 0) hookFish();
  else if (F.st === 'net') tryNet();
}
function fishUp() {
  const tap = F.holdT < .22; F.hold = false;
  if (F.st === 'charge') doCast();
  else if (F.st === 'retrieve' && tap && BAITS[F.bait].twitch) { F.strike = Math.max(F.strike, .9); SFX.click(); }
}
function doCast() {
  const rod = rodNow(); F.dist = 4 + F.power * rod.cast; if (!BAITS[F.bait].lure) S.bait[F.bait]--;
  rodSegs[0].parent.updateMatrixWorld(true); rodTip.getWorldPosition(F.from);
  const P = player.position, dx = -Math.sin(yaw), dz = -Math.cos(yaw);
  let d = F.dist; while (d > 3 && !SPOT.isWater(P.x + dx * d, P.z + dz * d)) d -= .5;
  F.dist = d; F.to.set(P.x + dx * d + rnd(-.8, .8), SPOT.waterY(0, 0), P.z + dz * d + rnd(-.8, .8));
  if (SPOT.id === 'creek') F.to.y = SPOT.waterY(F.to.x, F.to.z);
  F.struct = structAt(F.to.x, F.to.z); F.st = 'fly'; F.t = 0; SFX.cast(); showMeters([]);
  const lure = F.style === 'lure' || F.style === 'fly'; bob.visible = !lure; lureM.visible = lure; fline.visible = true;
  renderBaitBar();
}
function landed() {
  splash(F.to, 4, false); SFX.plop(); F.pos.copy(F.to);
  if (F.struct) toast(STRUCT[F.struct.type].name + '! Good spot.', 'var(--brass)');
  const { rate } = biteRate(F.bait, F.struct); F.rate = rate;
  if (F.style === 'bobber' || F.style === 'bottom') { F.st = 'wait'; F.wait = clamp(-Math.log(Math.random()) / rate, 2.5, 30); F.nib = rnd(1, 2); msg(F.style === 'bottom' ? 'Let it sit. Watch the rod tip...' : 'Wait for the bobber to dip...'); }
  else if (F.style === 'lure') { F.st = 'retrieve'; F.speed = 0; F.strike = 0; msg('Hold to reel it in. Keep the speed in the green.'); showMeters(['speed']); }
  else if (F.style === 'fly') { F.st = 'drift'; F.drift = 9; F.strike = 0; F.wait = clamp(-Math.log(Math.random()) / (rate * 1.2), 1.5, 14); msg('Let it drift. Watch for a rise...'); }
}

// ---------- per-frame ----------
function fishTick(dt, t) {
  if (F.st === 'off') return;
  if (F.hold) F.holdT += dt;
  rodG.updateMatrixWorld(true); rodTip.getWorldPosition(tipW);
  const bend = F.st === 'reel' ? F.T / 100 : F.st === 'bite' ? .5 : (F.st === 'wait' && F.style === 'bottom' && F.nib < .3) ? .25 : 0;
  rodSegs.forEach((s, i) => s.rotation.x = lerp(s.rotation.x, -bend * (.07 + i * .07), Math.min(1, dt * 10)));
  if (F.mode === 'ice') return iceTick(dt, t);
  const WY = F.to.y;
  if (F.st === 'charge') { F.t += dt; F.power = (1 - Math.cos(F.t * 2.4)) / 2; setMeter('power', F.power, Math.round(4 + F.power * rodNow().cast) + ' yd'); }
  if (F.st === 'fly') { F.t += dt / .75; const k = Math.min(1, F.t); F.pos.lerpVectors(F.from, F.to, k); F.pos.y += Math.sin(Math.PI * k) * (2 + F.dist * .08); if (k >= 1) landed(); }
  if (F.st === 'wait') {
    F.wait -= dt; F.nib -= dt; F.pos.y = WY + Math.sin(t * 2) * .03;
    if (F.nib < 0) { F.nib = rnd(1.2, 3.5); if (F.style === 'bobber') F.pos.y -= .06; SFX.click(); }
    if (F.style === 'bottom' && F.nib < .3) F.pos.y = WY;
    if (F.wait <= 0) { F.st = 'bite'; F.win = F.style === 'bottom' ? 1.25 : 1.05; msg(F.style === 'bottom' ? 'HARD PULL! Set the hook!' : 'BITE! Click now!', true); SFX.bite(); ripple(F.pos.x, F.pos.z); }
  }
  if (F.st === 'bite') { F.win -= dt; F.pos.y = WY - (F.style === 'bobber' ? .22 : 0) + Math.sin(t * 30) * .03; if (F.win <= 0) { lose(F.style === 'bottom' ? 'It dropped the bait.' : 'Missed it. It stole your bait.'); } }
  if (F.st === 'retrieve') {
    F.speed = clamp(F.speed + (F.hold ? 1.4 : -1.8) * dt, 0, 1);
    const zone = BAITS[F.bait].speed, inZone = F.speed >= zone[0] && F.speed <= zone[1];
    setMeter('speed', F.speed, inZone ? 'Perfect' : F.speed < zone[0] ? 'Too slow' : 'Too fast', zone);
    const P = player.position, dir = new THREE.Vector3(P.x - F.pos.x, 0, P.z - F.pos.z); const dl = dir.length();
    F.pos.addScaledVector(dir.normalize(), F.speed * 3.2 * dt); F.pos.y = WY - (BAITS[F.bait].twitch ? .25 * F.speed : .05);
    F.strike = Math.max(0, F.strike - dt);
    F.struct = structAt(F.pos.x, F.pos.z);
    const chance = F.rate * (inZone ? 1.5 : .25) * (F.strike > 0 ? 2.5 : 1) * dt;
    if (Math.random() < chance && F.speed > .05) { splash(F.pos, 3, false); if (F.hold) hookFish(); else { F.st = 'bite'; F.win = .7; msg('STRIKE! Click!', true); } }
    else if (dl < 3 || !SPOT.isWater(F.pos.x, F.pos.z)) { msg('Reeled all the way in. Cast again.'); setTimeout(() => { if (F.st === 'retrieve') readyState(); }, 50); F.st = 'pause'; }
  }
  if (F.st === 'drift') {
    F.drift -= dt; F.wait -= dt; const fl = SPOT.flow; F.pos.x += (fl[0] || .15) * dt * .8; F.pos.z += (fl[1] || .1) * dt * .8; F.pos.y = WY + Math.sin(t * 3) * .02;
    if (F.hold) { const P = player.position, dir = new THREE.Vector3(P.x - F.pos.x, 0, P.z - F.pos.z).normalize(); F.pos.addScaledVector(dir, 1.5 * dt); }
    F.struct = structAt(F.pos.x, F.pos.z);
    if (F.strike > 0) { F.strike -= dt; if (F.strike <= 0) { lose('Too slow. It spat the fly.'); } }
    else if (F.wait <= 0) { F.strike = .65; splash(F.pos, 5, false); ripple(F.pos.x, F.pos.z, true); msg('RISE! Click!', true); SFX.bite(); }
    else if (F.drift <= 0 || !SPOT.isWater(F.pos.x, F.pos.z)) { msg('Drift is over. Cast again.'); readyState(); }
  }
  if (F.st === 'reel' || F.st === 'net') fightTick(dt, t);
  // visuals
  const vis = F.st !== 'ready' && F.st !== 'charge' && F.st !== 'pause';
  bob.visible = vis && (F.style === 'bobber' || F.style === 'bottom') && F.st !== 'reel' && F.st !== 'net'; lureM.visible = vis && !bob.visible && F.st !== 'reel' && F.st !== 'net';
  bob.position.copy(F.pos); lureM.position.copy(F.pos); fline.visible = vis;
  const p = lineGeo.attributes.position; p.setXYZ(0, tipW.x, tipW.y, tipW.z); p.setXYZ(1, F.pos.x, F.pos.y + .08, F.pos.z); p.needsUpdate = true;
}
function fightTick(dt, t) {
  const x = F.fish, s = SP[x.sp], style = s.fight, k = F.k, fade = .4 + .6 * clamp(F.stamina / 100, 0, 1.5), reelSp = rodNow().reel;
  if (F.st === 'reel') {
    F.surgeT -= dt;
    if (F.surgeT <= 0) {
      if (F.surge > 0) { F.surge = 0; F.surgeT = style === 'thrasher' ? rnd(.5, 1.1) : rnd(1, 2.4); if (F.jumpPhase === 0) msg('Hold to reel', false); }
      else { const str = { gentle: .5, runner: 1.1, jumper: .9, digger: .8, thrasher: 1.5 }[style]; F.surge = str * k * fade; F.surgeT = style === 'thrasher' ? rnd(.18, .32) : style === 'runner' ? rnd(1.1, 2.2) : rnd(.5, 1.1); msg(style === 'thrasher' ? 'Head shakes!' : style === 'runner' ? "It's running! Ease off!" : 'It pulls! Ease off!', true); }
    }
    if (style === 'jumper' && F.jumpPhase === 0) { F.jumpT -= dt; if (F.jumpT <= 0) { F.jumpPhase = 1; F.jt = .55; msg('It’s going to JUMP!', true); } }
    else if (F.jumpPhase === 1) { F.jt -= dt; if (F.jt <= 0) { F.jumpPhase = 2; F.jt = 1; splash(F.pos, 8, true); } }
    else if (F.jumpPhase === 2) { F.jt -= dt; if (F.hold) F.T += 190 * dt; if (F.jt <= 0) { F.jumpPhase = 0; F.jumpT = rnd(3, 6); splash(F.pos, 6, true); msg('Hold to reel', false); } }
    if (F.hold) {
      F.T += (20 + F.surge * 62 + (style === 'digger' ? 12 * k : 0)) * dt;
      F.P += (24 * reelSp / (1 + k * .55)) * (F.surge > 0 ? .12 : 1) * (style === 'digger' ? .7 : 1) * (1.4 - .4 * clamp(F.stamina / 100, 0, 1)) * dt;
      if (Math.random() < dt * 12) SFX.click();
    } else { F.T -= (52 - F.surge * 28) * dt; F.P -= (F.surge > 0 ? 9 * k : 2.5) * dt; }
    F.stamina -= dt * (F.T / 100) * 9;
    F.T = clamp(F.T, 0, 100);
    setMeter('tension', F.T / 100, Math.round(F.T) + '%'); setMeter('progress', clamp(F.P, 0, 100) / 100, Math.round(clamp(F.P, 0, 100)) + '%');
    if (F.T >= 100) { if (BAITS[F.bait].lure) { S.lures[F.bait] = Math.max(0, (S.lures[F.bait] || 1) - 1); } SFX.snap(); lose(BAITS[F.bait].lure ? 'SNAP! Line broke and your ' + BAITS[F.bait].name.toLowerCase() + ' is gone.' : 'SNAP! The line broke.'); return; }
    if (F.P <= 0) { lose(F.jumpPhase === 2 ? 'It threw the hook mid-jump!' : 'It got away.'); return; }
    if (F.P >= 100) { const W = weightOf(x.sp, x.L); if (W >= 4 || x.legend) { F.st = 'net'; F.netT = 0; msg('Get the net under it! Click in the green.', true); showMeters([]); $('netring').classList.add('on'); tip('net'); } else catchIt(); }
  }
  if (F.st === 'net') { F.netT += dt; const sc = 1 - ((F.netT * .85) % 1); $('netring').style.setProperty('--s', sc.toFixed(3)); F.netScale = sc; }
  // fish position & visuals
  const P = player.position, kp = clamp(F.P, 0, 100) / 100;
  if (F.mode === 'ice') { const ig = F.igloo; F.pos.set(ig.x, -F.depth * (1 - kp) * .3 - .5, ig.z); }
  else F.pos.set(lerp(F.to.x, P.x - Math.sin(yaw) * 2.5, kp * .9) + Math.sin(t * 7) * .3 * (F.surge > 0 ? 2 : 1), F.to.y - .1, lerp(F.to.z, P.z - Math.cos(yaw) * 2.5, kp * .9));
  if (fightFish) {
    const L = x.L / 39.37 * 2.2; fightFish.scale.setScalar(Math.max(.25, L));
    const jumping = F.jumpPhase === 2; const near = kp > .75 || F.st === 'net';
    fightFish.visible = F.mode !== 'ice' && (jumping || F.surge > 0 || near);
    fightFish.position.copy(F.pos); fightFish.position.y = F.to.y + (jumping ? Math.sin((1 - F.jt) * Math.PI) * 1.8 : near ? -.05 : -.2);
    fightFish.rotation.y = yaw + Math.PI / 2 + Math.sin(t * 9) * .3; fightFish.rotation.z = jumping ? Math.sin(t * 14) * .6 : 0;
    fightFish.userData.tail.rotation.y = Math.sin(t * 18) * .6;
    if (F.surge > 0 && Math.random() < dt * 6) splash(F.pos, 1, false);
  }
}
function tryNet() { if (F.netScale > .38 && F.netScale < .62) { $('netring').classList.remove('on'); catchIt(); } else { $('netring').classList.remove('on'); F.st = 'reel'; F.P = 72; F.T = Math.min(90, F.T + 25); msg('Missed with the net! Keep fighting.', true); showMeters(['tension', 'progress']); splash(F.pos, 6, true); } }
function lose(why) { F.st = 'pause'; msg(why); toast(why, 'var(--bad)'); $('netring').classList.remove('on'); if (fightFish) { scene.remove(fightFish); fightFish = null; } setTimeout(() => { if (mode === 'fish' || mode === 'ice') { readyState(); renderBaitBar(); } }, 1100); }
function catchIt() {
  const x = F.fish; F.st = 'result'; bob.visible = false; lureM.visible = false; fline.visible = F.mode === 'ice';
  if (fightFish) { scene.remove(fightFish); fightFish = null; } splash(F.pos, 10, true);
  const newSp = !S.guide[x.sp]; const rec = S.guide[x.sp] ? x.L > S.guide[x.sp].bestL : true;
  logGuide(x); S.catches++; if (x.legend) S.legends[x.legend] = 1;
  const xp = Math.round(10 + weightOf(x.sp, x.L) * 4 + x.traits.length * 25 + (newSp ? 30 : 0) + (x.legend ? 500 : 0)); addXP(xp);
  save(); showCatch(x, { newSp, rec, xp });
}
function addXP(n) { const before = level(); S.xp += n; const after = level(); if (after > before) { toast('Level up! You are now level ' + after + '.', 'var(--brass)'); SFX.coin(); const un = SPOT_ORDER.filter(id => SPOTS[id].lvl === after); un.forEach(id => toast(SPOTS[id].name + ' unlocked. Drive there in your truck.', 'var(--brass)')); } }
function afterCatch() { F.fish = null; if (mode === 'fish' || mode === 'ice') { readyState(); renderBaitBar(); } }

// ---------- ice ----------
function jig() {
  const now = performance.now() / 1000, gap = now - F.lastJig; F.lastJig = now;
  if (F.st === 'ready') { msg('Drop your line first (hold DROP or S).'); return; }
  if (gap > .45 && gap < 1.5) F.interest = Math.min(100, F.interest + 16); else if (gap <= .45) { F.interest = Math.max(0, F.interest - 14); msg('Too fast! You’re spooking them.'); }
  F.jigAnim = .25; SFX.click();
}
function iceTick(dt, t) {
  const ig = F.igloo, P = player.position; player.visible = false;
  P.set(ig.x - 1.5, .02, ig.z + 1.5); cam.position.set(ig.x - 1.5, 1.6, ig.z + 1.5); cam.lookAt(ig.x + .3, .1, ig.z - .3);
  const down = keys.s || $('btn-drop').classList.contains('held'), up = keys.w || $('btn-up').classList.contains('held');
  if (F.st === 'ready' || F.st === 'jig') {
    if (down) { F.depth = Math.min(ig.depth, F.depth + 7 * dt); if (F.st === 'ready' && F.depth > 1) { F.st = 'jig'; msg('Tap JIG (space or click) in a slow, steady rhythm'); } }
    if (up) F.depth = Math.max(0, F.depth - 9 * dt);
    F.interest = Math.max(0, F.interest - dt * 4);
    setMeter('depth', F.depth / ig.depth, F.depth.toFixed(0) + ' ft of ' + ig.depth, null, 'Interest ' + Math.round(F.interest) + '%');
    if (F.st === 'jig' && F.interest > 35 && F.depth > 1) { const { rate } = biteRate(F.bait = S.sel, null, F.depth); if (Math.random() < rate * (F.interest / 100) * 1.6 * dt) { F.st = 'bite'; F.win = 1; msg('The rod bends! Set the hook!', true); SFX.bite(); } }
  }
  if (F.st === 'bite') { F.win -= dt; if (F.win <= 0) { F.interest *= .5; lose('Too slow. It let go.'); } }
  if (F.st === 'reel' || F.st === 'net') { F.bait = S.sel; fightTick(dt, t); }
  F.jigAnim = Math.max(0, (F.jigAnim || 0) - dt);
  rodG.rotation.x = -1.05 + (F.jigAnim > 0 ? .25 : 0) - (F.st === 'bite' ? .2 : 0);
  F.pos.set(ig.x, -F.depth * .05, ig.z);
  const p = lineGeo.attributes.position; p.setXYZ(0, tipW.x, tipW.y, tipW.z); p.setXYZ(1, ig.x, -.5, ig.z); p.needsUpdate = true; fline.visible = true;
  drawFinder(dt, t);
}
function genArcs() { F.arcs = []; }
function drawFinder(dt, t) {
  const c = $('finder'), g = c.getContext('2d'), W = c.width, H = c.height, ig = F.igloo, md = ig.depth;
  if (Math.random() < dt * 1.3) { const ws = speciesWeights(S.sel, null).filter(w => SP[w[0]].depth); const sp = wpick(ws.length ? ws.map(w => [w[0], SP[w[0]].spots.ice]) : [['perch', 1]]); const d = SP[sp].depth; const dep = Math.min(md - 1, rnd(d[0], Math.min(d[1], md))); if (dep > 0) F.arcs.push({ x: W, d: dep, big: SP[sp].adult > 18 }); }
  g.fillStyle = '#06141c'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(120,200,255,.15)'; g.lineWidth = 1; for (let d = 0; d <= md; d += 10) { const y = 10 + d / md * (H - 24); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.fillStyle = 'rgba(160,210,240,.6)'; g.font = '11px Nunito'; g.fillText(d + 'ft', 4, y - 2); }
  const by = H - 14; g.fillStyle = '#7a5a2a'; g.fillRect(0, by, W, 14);
  F.arcs.forEach(a => { a.x -= dt * 26; const y = 10 + a.d / md * (H - 24); g.strokeStyle = a.big ? '#ffcf4a' : '#5fe08a'; g.lineWidth = a.big ? 4 : 3; g.beginPath(); g.arc(a.x, y + 6, a.big ? 12 : 8, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); });
  F.arcs = F.arcs.filter(a => a.x > -20);
  const jy = 10 + F.depth / md * (H - 24); g.strokeStyle = '#ff6a3d'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * .5, 0); g.lineTo(W * .5, jy); g.stroke(); g.fillStyle = '#ff6a3d'; g.beginPath(); g.arc(W * .5, jy + (F.jigAnim > 0 ? -4 : 0), 5, 0, 7); g.fill();
}
// ---------- bait bar ----------
function baitList() { return Object.keys(BAITS).filter(b => haveBait(b) && (F.mode === 'ice' ? (b === 'jig' || b === 'minnow' || b === 'cutbait') : b !== 'jig')); }
function selectBait(b) { if (F.st !== 'ready' && F.st !== 'jig') { toast('Reel in before switching.'); return; } S.sel = b; SFX.ui(); readyState(); renderBaitBar(); }
function renderBaitBar() {
  const list = baitList(); const el = $('baitbar');
  if (!list.length) { el.innerHTML = '<span class="dim">No bait or lures. Buy some at Bait & Fry.</span>'; return; }
  el.innerHTML = list.map((b, i) => { const B = BAITS[b]; const n = B.lure ? S.lures[b] : S.bait[b]; return `<button class="bait ${S.sel === b ? 'sel' : ''}" data-act="bait" data-id="${b}" title="${esc(B.info)}"><span>${i + 1}</span>${esc(B.name)}<em>${B.lure ? (n > 1 ? '×' + n : 'lure') : '×' + n}</em></button>`; }).join('')
    + `<span class="style">${esc(STYLES[BAITS[S.sel] ? BAITS[S.sel].style : 'bobber'])}</span>`;
}
