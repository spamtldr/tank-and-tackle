// ============ Player, input, camera, interaction ============
const player = person('#d9573a', '#34507a', '#2d6a4f', '#e8b892', { vest: '#6f7a44', hair: '#5a3a22' }); scene.add(player);
player.traverse(o => { if (o.isMesh) o.castShadow = true; });
let mode = 'walk', view = 'tp', yaw = Math.PI, tpPitch = .32, fpPitch = 0, camDist = 7.5;
const keys = {}; let dragging = false, dragMoved = 0, lx = 0, ly = 0, joyV = { x: 0, y: 0 }, phase = 0, curPoint = null, started = false;
const cv = $('c');
const uiBlocking = () => !!document.querySelector('.panel.open, .modal.open');

addEventListener('keydown', e => {
  if (!started) return; const k = e.key.toLowerCase();
  if (k === 'escape') { if (closeTop()) return; if (mode === 'fish' || mode === 'ice') leaveFishing(); else if (mode === 'tank') closeTankView(); return; }
  if (uiBlocking()) return;
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
  keys[k] = true;
  if (mode === 'fish' || mode === 'ice') { fishKey(k, true, e); return; }
  if (e.repeat) return;
  if (mode === 'walk') { if (k === 'e') interact(); if (k === 'v') toggleView(); }
  if (k === 't' && mode !== 'tank') openTankView(); if (k === 'g') openGuide(); if (k === 'm') toggleSound(); if (k === 'b') openTackle();
});
addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys[k] = false; if (mode === 'fish' || mode === 'ice') fishKey(k, false, e); });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (mode === 'fish' || mode === 'ice') fishUp(); });
cv.addEventListener('pointerdown', e => {
  if (!started || uiBlocking()) return; cv.focus(); audioInit();
  if (mode === 'tank') { tankPointer(e, 'down'); return; }
  if (mode === 'fish' || mode === 'ice') { fishDown(); return; }
  dragging = true; dragMoved = 0; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId);
});
cv.addEventListener('pointermove', e => {
  if (mode === 'tank') { tankPointer(e, 'move'); return; }
  if (!dragging) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; dragMoved += Math.abs(dx) + Math.abs(dy);
  yaw -= dx * .006; if (view === 'fp') fpPitch = clamp(fpPitch - dy * .005, -1.2, 1.2); else tpPitch = clamp(tpPitch + dy * .005, .05, 1.25);
});
const endDrag = e => { if (mode === 'tank') { tankPointer(e, 'up'); return; } dragging = false; if (mode === 'fish' || mode === 'ice') fishUp(); };
cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
cv.addEventListener('wheel', e => { if (mode === 'walk') camDist = clamp(camDist + e.deltaY * .01, 3.5, 16); }, { passive: true });
if (matchMedia('(pointer:coarse)').matches) {
  const j = $('joy'), kn = j.querySelector('i'); j.classList.add('on');
  const mv = e => { const r = j.getBoundingClientRect(); let x = (e.clientX - r.left - 60) / 50, y = (e.clientY - r.top - 60) / 50; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } joyV = { x, y: -y }; kn.style.transform = `translate(${x * 35}px,${y * 35}px)`; };
  j.addEventListener('pointerdown', e => { j.setPointerCapture(e.pointerId); mv(e); }); j.addEventListener('pointermove', e => { if (e.buttons) mv(e); });
  const st = () => { joyV = { x: 0, y: 0 }; kn.style.transform = ''; }; j.addEventListener('pointerup', st); j.addEventListener('pointercancel', st);
}
function toggleView() { view = view === 'tp' ? 'fp' : 'tp'; fpPitch = 0; $('viewbtn').textContent = view === 'tp' ? '1st person' : '3rd person'; }

function movePlayer(dt) {
  let ix = 0, iy = 0;
  if (keys.w || keys.arrowup) iy += 1; if (keys.s || keys.arrowdown) iy -= 1; if (keys.d || keys.arrowright) ix += 1; if (keys.a || keys.arrowleft) ix -= 1;
  ix += joyV.x; iy += joyV.y; const l = Math.hypot(ix, iy), P = player.position;
  if (l > .05) {
    ix /= Math.max(1, l); iy /= Math.max(1, l); const sp = (keys.shift ? 10 : 5.5) * dt;
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const dx = (fx * iy + rx * ix) * sp, dz = (fz * iy + rz * ix) * sp;
    const tryMove = (nx, nz) => { const y = SPOT.walk(nx, nz); return y !== null && y - P.y < 1.25 ? y : null; };
    let y = tryMove(P.x + dx, P.z); if (y !== null) { P.x += dx; P.y = y; }
    y = tryMove(P.x, P.z + dz); if (y !== null) { P.z += dz; P.y = y; }
    if (view === 'tp') { const want = Math.atan2(dx, dz); let d = want - player.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); player.rotation.y += d * Math.min(1, dt * 10); } else player.rotation.y = yaw + Math.PI;
    phase += dt * (keys.shift ? 14 : 10);
  } else phase *= .85;
  const gy = SPOT.walk(P.x, P.z); if (gy !== null) P.y = lerp(P.y, gy, Math.min(1, dt * 12));
  const sw = Math.sin(phase) * (l > .05 ? .7 : 0), u = player.userData;
  u.hips[0].rotation.x = sw; u.hips[1].rotation.x = -sw; u.arms[0].rotation.x = -sw * .8; u.arms[1].rotation.x = sw * .8;
}
function updateCam(t) {
  const P = player.position;
  if (mode === 'ice') return; // fishing.js places the camera
  if (mode === 'fish' || view === 'fp') {
    const p = fpPitch, sway = mode === 'fish' ? Math.sin(t * .6) * .006 : 0;
    cam.position.set(P.x, P.y + 2.1, P.z);
    cam.lookAt(P.x - Math.sin(yaw + sway) * Math.cos(p), P.y + 2.1 + Math.sin(p), P.z - Math.cos(yaw + sway) * Math.cos(p));
    player.visible = false;
  } else {
    player.visible = true; const cp = Math.cos(tpPitch);
    let cx = P.x + Math.sin(yaw) * cp * camDist, cz = P.z + Math.cos(yaw) * cp * camDist, cy = P.y + 1.7 + Math.sin(tpPitch) * camDist;
    const g = Math.max(SPOT.ground(cx, cz), SPOT.waterY(cx, cz)) + .6; if (cy < g) cy = g;
    cam.position.set(cx, cy, cz); cam.lookAt(P.x, P.y + 1.6, P.z);
  }
}
function findPoint() {
  const P = player.position; let best = null, bd = 1e9;
  if (mode === 'walk') for (const p of SPOT.points) { const d = Math.hypot(P.x - p.x, P.z - p.z); if (d < (p.r || 2.4) && d < bd) { bd = d; best = p; } }
  curPoint = best; const pr = $('prompt');
  if (best && !uiBlocking()) { pr.classList.add('on'); pr.textContent = 'E · ' + best.label; } else pr.classList.remove('on');
}
function interact() {
  const p = curPoint; if (!p || uiBlocking()) return; SFX.ui();
  if (p.type === 'cast') startFishing(p);
  else if (p.type === 'ice') enterIgloo(p);
  else if (p.type === 'tanks') openTankView();
  else if (p.type === 'shop') openShop(p.bait);
  else if (p.type === 'truck') openMap();
  else if (p.type === 'buyer') openOrders();
  else if (p.type === 'cabin') openRest();
  else if (p.type === 'page') readPage(SPOT.id);
  else if (p.type === 'npc') talk(p.npc);
}
