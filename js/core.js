// ============ Engine: renderer, sky, light, weather, water, helpers, audio ============
const R = new THREE.WebGLRenderer({ canvas: $('c'), antialias: true, powerPreference: 'high-performance' });
const QUALITY = { low: { pr: 1, sh: 1024 }, high: { pr: Math.min(Math.max(devicePixelRatio, 1.5), 2), sh: 4096 }, ultra: { pr: Math.min(Math.max(devicePixelRatio * 1.5, 2), 3), sh: 4096 } };
function applyQuality() { const q = QUALITY[S.quality || 'high']; R.setPixelRatio(q.pr); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } sun.shadow.mapSize.set(q.sh, q.sh); if (typeof resize === 'function') resize(); const b = document.getElementById('qualbtn'); if (b) b.textContent = 'Graphics: ' + (S.quality || 'high'); }
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
R.outputEncoding = THREE.sRGBEncoding;
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .9;

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(62, 1, .05, 1200); scene.add(cam);
scene.fog = new THREE.Fog(0xffffff, 80, 260);

// ---------- materials & mesh helpers ----------
const lin = h => new THREE.Color(h).convertSRGBToLinear();
const mats = {};
function M(c, o) {
  const key = c + (o ? JSON.stringify(o) : '');
  if (mats[key]) return mats[key];
  return mats[key] = new THREE.MeshStandardMaterial(Object.assign({ color: lin(c), flatShading: true, roughness: .88, metalness: 0 }, o || {}));
}
let ROOT = new THREE.Group(); scene.add(ROOT);
function add(geo, mat, x, y, z, parent, noShadow) {
  const m = new THREE.Mesh(geo, typeof mat === 'object' && mat.isMaterial ? mat : M(mat));
  m.position.set(x || 0, y || 0, z || 0);
  if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
  (parent || ROOT).add(m); return m;
}
const box = (w, h, d, c, x, y, z, p) => add(new THREE.BoxGeometry(w, h, d), c, x, y, z, p);
const cyl = (rt, rb, h, seg, c, x, y, z, p) => add(new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y, z, p);

// ---------- value noise ----------
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const h = (a, b) => hash(a * 57.1 + b * 113.3);
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(h(xi, zi), h(xi + 1, zi), u), lerp(h(xi, zi + 1), h(xi + 1, zi + 1), u), v);
}
const fbm = (x, z) => vnoise(x, z) * .55 + vnoise(x * 2.1, z * 2.1) * .3 + vnoise(x * 4.3, z * 4.3) * .15;

// ---------- instancing ----------
function instances(geo, mat, list, shadow = true) {
  if (!list.length) return null;
  const im = new THREE.InstancedMesh(geo, typeof mat === 'object' && mat.isMaterial ? mat : M(mat), list.length);
  const o = new THREE.Object3D();
  list.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.rotation.set(p[5] || 0, p[4] || 0, p[6] || 0); const s = p[3] || 1; o.scale.set(s * (p[7] || 1), s * (p[8] || 1), s * (p[9] || 1)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); });
  im.instanceMatrix.needsUpdate = true; im.castShadow = shadow; im.receiveShadow = true; ROOT.add(im); return im;
}
// multi-part instanced props. parts: [geo, color, offsetY, offsetX, offsetZ]
function propSet(parts, list, shadow) {
  for (const [geo, col, oy, ox, oz] of parts) instances(geo, col, list.map(p => [p[0] + (ox || 0) * (p[3] || 1), p[1] + oy * (p[3] || 1), p[2] + (oz || 0) * (p[3] || 1), p[3], p[4]]), shadow);
}
const G = {
  trunk: new THREE.CylinderGeometry(.18, .3, 2, 6),
  pineA: new THREE.ConeGeometry(1.7, 2.8, 7), pineB: new THREE.ConeGeometry(1.3, 2.4, 7), pineC: new THREE.ConeGeometry(.8, 1.8, 7),
  ball: new THREE.IcosahedronGeometry(1.6, 0), ball2: new THREE.IcosahedronGeometry(1.1, 0),
  rock: new THREE.DodecahedronGeometry(1, 0), grass: new THREE.ConeGeometry(.07, .7, 3), reed: new THREE.CylinderGeometry(.03, .04, 1.8, 4),
  cattail: new THREE.CylinderGeometry(.07, .07, .35, 6),
  pad: new THREE.CylinderGeometry(.5, .5, .04, 9), flower: new THREE.IcosahedronGeometry(.09, 0)
};
function pines(list, snow) {
  propSet([[G.trunk, '#5a3a22', 1], [G.pineA, snow ? '#2f5a46' : '#2d5e3a', 2.6], [G.pineB, snow ? '#356450' : '#336a40', 3.9], [G.pineC, snow ? '#3d6e58' : '#3a7446', 5]], list);
  if (snow) propSet([[new THREE.ConeGeometry(.9, 1, 7), '#f4f8fb', 5.6], [new THREE.ConeGeometry(1.3, .6, 7), '#eef4f8', 4.55]], list, false);
}
function leafy(list, c1 = '#4f8a3a', c2 = '#5f9a44') {
  propSet([[new THREE.CylinderGeometry(.22, .34, 2.6, 6), '#6a4a2a', 1.3], [G.ball, c1, 3.6], [G.ball2, c2, 4.5, .7, .3]], list);
}
function rocks(list, col = '#8e918c') { instances(G.rock, col, list.map(p => [p[0], p[1], p[2], p[3], p[4] || 0, .2, .4, 1, .7, 1.1])); }
function grass(list, col = '#5e9a3e') { instances(G.grass, col, list, false); }

// ---------- sky & sun ----------
const skyMat = new THREE.ShaderMaterial({
  uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color() }, moonDir: { value: new THREE.Vector3(0, -1, 0) }, stars: { value: 0 } },
  vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform vec3 top,hor,bot,sunCol,sunDir,moonDir;uniform float stars;varying vec3 vP;
  float h3(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
  void main(){float h=vP.y;vec3 c=h>0.?mix(hor,top,pow(clamp(h,0.,1.),.55)):mix(hor,bot,pow(clamp(-h,0.,1.),.35));
  float s=max(dot(vP,sunDir),0.);c+=sunCol*(smoothstep(.9985,.9995,s)*1.6+pow(s,10.)*.3);
  float m=max(dot(vP,moonDir),0.);c+=vec3(.9,.95,1.)*smoothstep(.9992,.9996,m)*stars;
  if(h>0.){vec3 q=floor(vP*260.);float st=step(.9975,h3(q));c+=vec3(st)*stars*(.5+.5*h3(q+1.));}
  gl_FragColor=vec4(c,1.);}`,
  side: THREE.BackSide, depthWrite: false, fog: false
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
const hemi = new THREE.HemisphereLight(0xffffff, 0x445533, .6); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 200 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
scene.add(sun); scene.add(sun.target);

const SKY = { // sRGB: top, horizon, bottom, sun color, light color, light, hemi sky, hemi ground, hemi int
  night: ['#0e1a3e', '#2a3a62', '#0a1020', '#000000', '#8fa4e0', .38, '#5a6a9a', '#1a2230', .5],
  dawn: ['#3d5f9a', '#f2a36a', '#30384a', '#ffb070', '#ffc38a', .8, '#a8b4d8', '#5a4a3a', .5],
  day: ['#2f7fd0', '#bfe3f5', '#5e8494', '#fff6d8', '#fff2dc', .95, '#bcd8f0', '#4a5a32', .42],
  dusk: ['#33468a', '#f08458', '#2a2a40', '#ff8a50', '#ff9a66', .7, '#9a8ac0', '#4a3a3a', .45]
};
const KEYS = [[0, 'night'], [290, 'night'], [370, 'dawn'], [470, 'day'], [1030, 'day'], [1130, 'dusk'], [1215, 'night'], [1440, 'night']];
const cA = new THREE.Color(), cB = new THREE.Color();
function mixPal(a, b, k, i) { cA.set(a[i]); cB.set(b[i]); return cA.lerp(cB, k).clone(); }
const WEATHER_TINT = { clear: 0, cloudy: .45, rain: .7, fog: .55, snow: .5 };
let spotFogMul = 1, spotTint = null;
function updateSky(minute, weather, focus) {
  let i = 0; while (i < KEYS.length - 1 && KEYS[i + 1][0] <= minute) i++;
  const [m0, p0] = KEYS[i], [m1, p1] = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const k = m1 > m0 ? (minute - m0) / (m1 - m0) : 0;
  const A = SKY[p0], B = SKY[p1];
  const g = WEATHER_TINT[weather] || 0;
  const gray = new THREE.Color('#8a949c'), grayN = new THREE.Color('#2a3038');
  const night = p0 === 'night' && p1 === 'night' ? 1 : (p0 === 'night' ? 1 - k : p1 === 'night' ? k : 0);
  const gc = gray.clone().lerp(grayN, night);
  const top = mixPal(A, B, k, 0).lerp(gc, g * .8), hor = mixPal(A, B, k, 1).lerp(gc, g * .7), bot = mixPal(A, B, k, 2).lerp(gc, g * .5);
  if (spotTint) { hor.lerp(new THREE.Color(spotTint), .25); }
  skyMat.uniforms.top.value.copy(top); skyMat.uniforms.hor.value.copy(hor); skyMat.uniforms.bot.value.copy(bot);
  skyMat.uniforms.sunCol.value.copy(mixPal(A, B, k, 3)).multiplyScalar(1 - g);
  skyMat.uniforms.stars.value = night * (1 - g);
  const a = (minute - 360) / 1440 * Math.PI * 2;
  const sd = new THREE.Vector3(Math.cos(a) * .75, Math.sin(a), -.45).normalize();
  skyMat.uniforms.sunDir.value.copy(sd); skyMat.uniforms.moonDir.value.copy(sd).multiplyScalar(-1);
  const up = sd.y > -.05 ? sd : sd.clone().multiplyScalar(-1);
  sun.position.copy(focus).addScaledVector(up, 90); sun.target.position.copy(focus);
  sun.color.copy(lin(mixPal(A, B, k, 4).getHexString ? '#' + mixPal(A, B, k, 4).getHexString() : '#ffffff'));
  sun.intensity = lerp(A[5], B[5], k) * (1 - g * .55);
  hemi.color.copy(lin('#' + mixPal(A, B, k, 6).getHexString())); hemi.groundColor.copy(lin('#' + mixPal(A, B, k, 7).getHexString()));
  hemi.intensity = lerp(A[8], B[8], k) * (1 - g * .2) + g * .12;
  scene.fog.color.copy(lin('#' + hor.getHexString()));
  const fogNear = weather === 'fog' ? 6 : weather === 'snow' ? 25 : weather === 'rain' ? 40 : 90;
  const fogFar = weather === 'fog' ? 70 : weather === 'snow' ? 140 : weather === 'rain' ? 170 : 320;
  scene.fog.near = fogNear * spotFogMul; scene.fog.far = fogFar * spotFogMul;
  return night;
}

// ---------- weather particles ----------
const rainGeo = new THREE.BufferGeometry(); const RAIN_N = 1600;
{ const p = new Float32Array(RAIN_N * 6); for (let i = 0; i < RAIN_N; i++) { const x = rnd(-40, 40), y = rnd(0, 30), z = rnd(-40, 40); p.set([x, y, z, x + .05, y - .7, z], i * 6); } rainGeo.setAttribute('position', new THREE.BufferAttribute(p, 3)); }
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xaac4dd, transparent: true, opacity: .45, fog: false })); rain.frustumCulled = false; rain.visible = false; scene.add(rain);
const snowGeo = new THREE.BufferGeometry(); const SNOW_N = 1400;
{ const p = new Float32Array(SNOW_N * 3); for (let i = 0; i < SNOW_N; i++) p.set([rnd(-40, 40), rnd(0, 30), rnd(-40, 40)], i * 3); snowGeo.setAttribute('position', new THREE.BufferAttribute(p, 3)); }
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: .16, transparent: true, opacity: .9, fog: false })); snow.frustumCulled = false; snow.visible = false; scene.add(snow);
const flyGeo = new THREE.BufferGeometry(); const FLY_N = 120;
{ const p = new Float32Array(FLY_N * 3); for (let i = 0; i < FLY_N; i++) p.set([rnd(-30, 30), rnd(.5, 4), rnd(-30, 30)], i * 3); flyGeo.setAttribute('position', new THREE.BufferAttribute(p, 3)); }
const fireflies = new THREE.Points(flyGeo, new THREE.PointsMaterial({ color: 0xdfff7a, size: .22, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending })); fireflies.frustumCulled = false; scene.add(fireflies);
function updateParticles(dt, t, weather, night, center, ff) {
  rain.visible = weather === 'rain'; snow.visible = weather === 'snow';
  if (rain.visible) { rain.position.set(center.x, 0, center.z); const p = rainGeo.attributes.position; for (let i = 0; i < RAIN_N; i++) { let y = p.getY(i * 2) - dt * 22; if (y < -1) y += 31; p.setY(i * 2, y); p.setY(i * 2 + 1, y - .7); } p.needsUpdate = true; }
  if (snow.visible) { snow.position.set(center.x, 0, center.z); const p = snowGeo.attributes.position; for (let i = 0; i < SNOW_N; i++) { let y = p.getY(i) - dt * 1.6; if (y < -1) y += 31; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t + i) * dt * .3); } p.needsUpdate = true; }
  fireflies.material.opacity = ff ? night * (.55 + .45 * Math.sin(t * 3)) : 0;
  if (ff && night > .1) { fireflies.position.set(center.x, 0, center.z); const p = flyGeo.attributes.position; for (let i = 0; i < FLY_N; i++) { p.setX(i, p.getX(i) + Math.sin(t * .7 + i) * dt * .4); p.setY(i, 1.5 + Math.sin(t * .9 + i * 1.7) * 1.2); } p.needsUpdate = true; }
}

// ---------- water ----------
function makeWater(o) { // o: {w,d,x,z,y,seg,color,deep,amp,speed,opacity,flow}
  const g = new THREE.PlaneGeometry(o.w, o.d, o.seg || 60, o.seg || 60); g.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: lin(o.color), roughness: .12, metalness: .15, transparent: true, opacity: o.opacity || .88, flatShading: true });
  const m = new THREE.Mesh(g, mat); m.position.set(o.x || 0, o.y || 0, o.z || 0); m.receiveShadow = true; ROOT.add(m);
  const base = Float32Array.from(g.attributes.position.array);
  m.userData = { base, amp: o.amp || .06, speed: o.speed || 1, flow: o.flow || 0 };
  return m;
}
function animateWater(m, t) {
  const u = m.userData, p = m.geometry.attributes.position, b = u.base;
  for (let i = 0; i < p.count; i++) {
    const x = b[i * 3], z = b[i * 3 + 2], fx = x - t * u.flow;
    p.array[i * 3 + 1] = u.amp * (Math.sin(fx * .35 + t * 1.1 * u.speed) + Math.sin(z * .28 - t * .8 * u.speed) * .8 + Math.sin((fx + z) * .9 + t * 2.1 * u.speed) * .25);
  }
  p.needsUpdate = true; m.geometry.computeVertexNormals();
}

// ---------- canvas text signs ----------
const signDraws = [];
function sign(text, bg, fg, w, h, x, y, z, ry, parent) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.max(64, Math.round(512 * h / w));
  const tex = new THREE.CanvasTexture(cv); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
  const draw = () => { const g = cv.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 10; g.strokeRect(5, 5, cv.width - 10, cv.height - 10); g.fillStyle = fg; let fs = Math.round(cv.height * .5); g.font = `${fs}px "Alfa Slab One", Georgia, serif`; while (g.measureText(text).width > cv.width - 40 && fs > 10) { fs -= 2; g.font = `${fs}px "Alfa Slab One", Georgia, serif`; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, cv.width / 2, cv.height * .54); tex.needsUpdate = true; };
  draw(); signDraws.push(draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: .9 }));
  m.position.set(x, y, z); m.rotation.y = ry || 0; (parent || ROOT).add(m); return m;
}
if (document.fonts) document.fonts.ready.then(() => signDraws.forEach(d => d()));

// ---------- glow sprite (lanterns, logbook pages) ----------
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,240,180,1)'); r.addColorStop(.4, 'rgba(255,200,100,.5)'); r.addColorStop(1, 'rgba(255,180,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function glow(x, y, z, s, color, parent) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: color || 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.position.set(x, y, z); sp.scale.setScalar(s); (parent || ROOT).add(sp); return sp; }

// ---------- audio (all synthesized) ----------
const AU = { ctx: null, master: null, amb: {}, on: true };
function audioInit() {
  if (AU.ctx) return; try { AU.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  const c = AU.ctx; AU.master = c.createGain(); AU.master.gain.value = S.sound ? .55 : 0; AU.master.connect(c.destination);
  const len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
  AU.brown = buf;
  const wbuf = c.createBuffer(1, len, c.sampleRate), wd = wbuf.getChannelData(0); for (let i = 0; i < len; i++) wd[i] = Math.random() * 2 - 1; AU.white = wbuf;
  const chan = (b, type, f, q) => { const s = c.createBufferSource(); s.buffer = b; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || .7; const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(AU.master); s.start(); return { g, fl }; };
  AU.amb.water = chan(AU.brown, 'lowpass', 500); AU.amb.rush = chan(AU.white, 'bandpass', 900, .5); AU.amb.wind = chan(AU.brown, 'bandpass', 300, .4); AU.amb.rain = chan(AU.white, 'highpass', 2500); AU.amb.surf = chan(AU.brown, 'lowpass', 700);
}
function ambSet(name, v, t) { if (!AU.ctx || !AU.amb[name]) return; AU.amb[name].g.gain.setTargetAtTime(v, AU.ctx.currentTime, t || .6); }
function tone(type, f0, f1, dur, vol, delay) {
  if (!AU.ctx || !S.sound) return; const c = AU.ctx, t = c.currentTime + (delay || 0);
  const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(AU.master); o.start(t); o.stop(t + dur + .05);
}
function noiseHit(dur, f, vol, type, delay) {
  if (!AU.ctx || !S.sound) return; const c = AU.ctx, t = c.currentTime + (delay || 0);
  const s = c.createBufferSource(); s.buffer = AU.white; const fl = c.createBiquadFilter(); fl.type = type || 'lowpass'; fl.frequency.value = f; const g = c.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(fl); fl.connect(g); g.connect(AU.master); s.start(t, Math.random() * 2); s.stop(t + dur + .05);
}
const SFX = {
  cast: () => { noiseHit(.35, 1800, .25, 'bandpass'); tone('sine', 900, 300, .3, .05); },
  plop: () => { tone('sine', 420, 90, .18, .3); noiseHit(.15, 1200, .12); },
  splash: (big) => { noiseHit(big ? .7 : .4, big ? 900 : 1500, big ? .5 : .3); tone('sine', 200, 60, .3, .15); },
  click: () => noiseHit(.025, 4000, .12, 'highpass'),
  snap: () => { tone('sawtooth', 1200, 200, .25, .18); noiseHit(.1, 3000, .2, 'highpass'); },
  coin: () => { tone('triangle', 988, 988, .12, .18); tone('triangle', 1319, 1319, .25, .18, .09); },
  bubble: () => tone('sine', rnd(500, 900), rnd(1200, 1800), .08, .06),
  ui: () => tone('sine', 660, 660, .05, .06),
  bite: () => { tone('sine', 300, 120, .15, .3); noiseHit(.12, 2000, .2); },
  chirp: () => { const f = rnd(2600, 4200); tone('sine', f, f * rnd(1.1, 1.4), .09, .05); tone('sine', f * 1.1, f * .9, .08, .04, .12); },
  cricket: () => { for (let i = 0; i < 3; i++) tone('square', 4400, 4500, .025, .012, i * .05); },
  frog: () => { tone('sawtooth', rnd(110, 150), rnd(80, 100), .22, .06); },
  gull: () => { tone('sawtooth', 1400, 800, .35, .03); tone('sawtooth', 1300, 750, .3, .025, .4); },
  loon: () => { tone('sine', 620, 920, .9, .05); tone('sine', 920, 700, .9, .04, .9); },
  engine: () => { tone('sawtooth', 70, 140, 1.4, .08); noiseHit(1.2, 300, .15); }
};
function setSound(on) { S.sound = on; if (AU.master) AU.master.gain.setTargetAtTime(on ? .55 : 0, AU.ctx.currentTime, .1); }
