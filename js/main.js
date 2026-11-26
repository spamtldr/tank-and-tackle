// ============ Boot & main loop ============
function loadSpot() {
  buildSpot(S.spot); const sp = SPOT.spawn;
  player.position.set(sp.x, SPOT.walk(sp.x, sp.z) || 0, sp.z); yaw = sp.yaw; player.rotation.y = yaw + Math.PI; mode = 'walk';
  F.st = 'off'; fishUI(false); refreshOrders();
}
// offline catch-up (real time, up to 48 hours)
const away = Math.min(48 * 3600, Math.max(0, (Date.now() - S.last) / 1000));
for (let t = 0; t < away; t += 60) simAll(Math.min(60, away - t));
loadSpot();
if (hadSave) { const n = S.tanks.reduce((a, t) => a + t.fish.length, 0); $('savenote').textContent = `Welcome back. ${n} fish in your tanks${away > 600 ? `. You were away ${away >= 3600 ? Math.floor(away / 3600) + 'h ' : ''}${Math.floor(away % 3600 / 60)}m and the power bill kept running` : ''}.`; $('start').textContent = 'Continue'; }
$('start').addEventListener('click', () => { $('splash').classList.add('gone'); started = true; audioInit(); cv.focus(); tip('start'); hud(); });
$('soundbtn').textContent = S.sound ? 'Sound on' : 'Sound off';
function resize() { R.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); tankResize(); }
addEventListener('resize', resize); applyQuality();

function ambience(night, per) {
  const a = SPOT.amb || {}, w = curWeather(), inside = mode === 'tank';
  ambSet('water', inside ? 0 : (a.water || 0)); if (SPOT.id !== 'creek') ambSet('rush', 0); if (inside) ambSet('rush', 0);
  ambSet('surf', inside ? 0 : (a.surf || 0)); ambSet('wind', inside ? 0 : (a.wind || 0) + (w === 'snow' ? .12 : 0) + (w === 'rain' ? .05 : 0)); ambSet('rain', inside ? 0 : w === 'rain' ? .22 : 0);
}
let last = performance.now(), uiT = 0, ambT = 0, saveT = 0, tankUiT = 0;
function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
  if (started) { S.clock += dt; if (S.clock >= 1440) { S.clock -= 1440; S.day++; refreshOrders(); toast('A new day: new weather and new orders.'); } }
  simAll(dt);
  const per = period(S.clock);
  if (mode === 'tank') { tankTick(dt, t); R.render(tscene, tcam); }
  else {
    if (started && mode === 'walk' && !uiBlocking()) movePlayer(dt);
    if (mode === 'fish' || mode === 'ice') fishTick(dt, t);
    updateCam(t);
    const focus = mode === 'ice' ? cam.position : player.position;
    const night = updateSky(S.clock, curWeather(), focus);
    winMat.emissiveIntensity = night * 1.3;
    for (const w of SPOT.waters) animateWater(w, t);
    for (const f of SPOT.ticks) f(dt, t, night);
    SPOT.npcs.forEach((n, i) => { n.userData.arms[0].rotation.x = Math.sin(t * 1.3 + i) * .12; });
    updateParticles(dt, t, curWeather(), night, focus, SPOT.ff);
    tickSplashes(dt); sky.position.copy(cam.position); findPoint();
    R.render(scene, cam);
    if (started && S.sound && AU.ctx) {
      const a = SPOT.amb || {}, r = Math.random;
      if (per !== 'night' && a.birds && r() < dt * .45 * a.birds) SFX.chirp();
      if (per === 'night' && a.crickets && r() < dt * 2 * a.crickets) SFX.cricket();
      if (per === 'night' && a.frogs && r() < dt * .9) SFX.frog();
      if (per !== 'night' && a.gulls && r() < dt * .12) SFX.gull();
      if ((per === 'dusk' || per === 'night') && a.loon && r() < dt * .025) SFX.loon();
    }
  }
  uiT += dt; ambT += dt; saveT += dt; tankUiT += dt;
  if (uiT > .5) { uiT = 0; if (started) hud(); }
  if (ambT > 1) { ambT = 0; ambience(0, per); }
  if (mode === 'tank' && tankUiT > 1) { tankUiT = 0; updateTankLook(TV.tank); syncTankFish(TV.tank); const ae = document.activeElement; if (!$('tankpanel').contains(ae) || ae === document.body) { const sc = $('tankpanel').scrollTop; renderTankPanel(); $('tankpanel').scrollTop = sc; } }
  if (saveT > 5) { saveT = 0; save(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('pagehide', save); document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
