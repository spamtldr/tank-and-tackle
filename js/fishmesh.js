// ============ Procedural fish models (per species, with trait colors) ============
const SHAPES = { // h, w, tail, extra
  sun: { h: .58, w: .17, tail: .32 }, perch: { h: .3, w: .17, tail: .3, dorsal2: 1 }, bass: { h: .34, w: .2, tail: .32 },
  trout: { h: .26, w: .16, tail: .3 }, grayling: { h: .25, w: .14, tail: .3, sail: 1 }, cat: { h: .22, w: .24, tail: .28, barbels: 1, flatHead: 1 },
  carp: { h: .34, w: .21, tail: .34, barbels: .5 }, pike: { h: .16, w: .14, tail: .26, snout: .25 }, gar: { h: .12, w: .11, tail: .2, snout: .4 },
  bowfin: { h: .22, w: .16, tail: .26, longDorsal: 1 }, flat: { h: .07, w: .46, tail: .22, flat: 1 }, drum: { h: .33, w: .2, tail: .3 }
};
function traitPalette(look, traits) {
  let b = new THREE.Color(look.b), m = new THREE.Color(look.m), u = new THREE.Color(look.u), f = new THREE.Color(look.f);
  let st = look.st ? new THREE.Color(look.st) : null, bars = look.bars ? new THREE.Color(look.bars) : null, sp = look.sp ? new THREE.Color(look.sp) : null, eye = new THREE.Color('#111111');
  if (traits.includes('golden')) { b = new THREE.Color('#e8a020'); m = new THREE.Color('#f6c840'); u = new THREE.Color('#fff0c0'); f = new THREE.Color('#f0b030'); st = new THREE.Color('#ff7a30'); sp = null; }
  if (traits.includes('albino')) { b = new THREE.Color('#f4e4e0'); m = new THREE.Color('#fbefec'); u = new THREE.Color('#ffffff'); f = new THREE.Color('#f8d8d4'); st = st ? new THREE.Color('#f4b8c0') : null; bars = null; sp = null; eye = new THREE.Color('#e0405a'); }
  if (traits.includes('melanistic')) { [b, m, u, f].forEach(c => c.multiplyScalar(.28)); if (st) st.multiplyScalar(.4); }
  return { b, m, u, f, st, bars, sp, eye };
}
function fishMesh(spId, traits, opts) {
  traits = traits || []; const s = SP[spId], sh = SHAPES[s.look.s], P = traitPalette(s.look, traits);
  const piebald = traits.includes('piebald'), heavy = traits.includes('spotted');
  const root = new THREE.Group(); const g = new THREE.Group(); root.add(g);
  // body
  const geo = new THREE.SphereGeometry(.5, 22, 14); const pos = geo.attributes.position, cols = [], c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = x / .5, ny = y / .5;
    // taper tail end, blunt head
    const taper = nx > 0 ? 1 - Math.pow(nx, 2) * .55 : 1 - Math.pow(-nx, 3) * .25;
    let yy = y * taper, zz = z * taper;
    if (sh.flatHead && nx < -.2) yy *= .75;
    pos.setXYZ(i, x, yy, zz);
    // color
    if (ny > .1) c.copy(P.m).lerp(P.b, Math.min(1, (ny - .1) / .5)); else c.copy(P.m).lerp(P.u, Math.min(1, (.1 - ny) / .5));
    if (P.st && Math.abs(ny + .02) < .14 && nx > -.7) c.lerp(P.st, .75);
    if (P.bars && ny > -.35 && Math.sin((nx + .5) * Math.PI * 7) > .45) c.lerp(P.bars, .7);
    const hh = hash(Math.round(x * 60) * 7.1 + Math.round(y * 60) * 13.3 + Math.round(z * 60) * 3.7);
    if (P.sp && ny > -.3 && hh > (heavy ? .72 : .86)) c.copy(P.sp);
    if (piebald && vnoise(x * 6 + 3, y * 6 + z * 4) > .62) c.set('#f6f1ea');
    c.convertSRGBToLinear(); cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .45, metalness: .08, flatShading: true }));
  body.scale.set(1, sh.h * 1.1, sh.w);
  g.add(body);
  const finMat = new THREE.MeshStandardMaterial({ color: P.f.clone().convertSRGBToLinear(), roughness: .6, side: THREE.DoubleSide, flatShading: true, transparent: true, opacity: .92 });
  const tri = (pts) => { const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(pts.flat(), 3)); bg.computeVertexNormals(); return new THREE.Mesh(bg, finMat); };
  const H = sh.h * .55, TH = sh.flat ? sh.w * .5 : H;
  // tail (pivot)
  const tail = new THREE.Group(); tail.position.x = .46; g.add(tail);
  const tl = sh.tail;
  tail.add(tri([[0, 0, 0], [tl, TH * 1.1, 0], [tl * .8, 0, 0]])); tail.add(tri([[0, 0, 0], [tl * .8, 0, 0], [tl, -TH * 1.1, 0]]));
  if (sh.flat) tail.rotation.x = Math.PI / 2;
  // dorsal
  if (!sh.flat) {
    if (sh.sail) g.add(tri([[-.2, H * .9, 0], [.05, H * 2.4, 0], [.3, H * .8, 0]]));
    else if (sh.longDorsal) g.add(tri([[-.15, H * .9, 0], [.38, H * 1.2, 0], [.38, H * .6, 0]]));
    else g.add(tri([[-.12, H * .95, 0], [.05, H * 1.7, 0], [.25, H * .8, 0]]));
    if (sh.dorsal2) g.add(tri([[.12, H * .85, 0], [.2, H * 1.35, 0], [.32, H * .7, 0]]));
    g.add(tri([[.0, -H * .9, 0], [.12, -H * 1.35, 0], [.22, -H * .7, 0]]));
    // pectorals
    for (const sgn of [1, -1]) g.add(tri([[-.22, -H * .2, sh.w * sgn * .45], [-.05, -H * .6, sh.w * sgn * .9], [-.02, -H * .1, sh.w * sgn * .45]]));
  }
  // snout
  if (sh.snout) { const sn = new THREE.Mesh(new THREE.ConeGeometry(H * .7, sh.snout, 6), body.material); sn.rotation.z = Math.PI / 2; sn.position.x = -.5 - sh.snout / 2 + .04; sn.scale.set(1, 1, .7); g.add(sn); }
  // eyes
  const eyeM = new THREE.MeshStandardMaterial({ color: P.eye.clone().convertSRGBToLinear(), roughness: .2, metalness: .3 });
  const whiteM = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: .3 });
  const er = Math.max(.028, H * .2);
  for (const sgn of [1, -1]) {
    const ew = new THREE.Mesh(new THREE.SphereGeometry(er, 10, 8), whiteM), ep = new THREE.Mesh(new THREE.SphereGeometry(er * .62, 10, 8), eyeM);
    if (sh.flat) { ew.position.set(-.3, H * .8, .05 + (sgn > 0 ? 0 : .1)); ep.position.set(-.3, H * .8 + er * .5, .05); }
    else { const ez = (sh.w * .36) * sgn; ew.position.set(-.36, H * .25, ez); ep.position.set(-.38, H * .25, ez + sgn * er * .5); }
    g.add(ew); g.add(ep);
  }
  if (sh.barbels) { const bm = new THREE.MeshStandardMaterial({ color: P.b.clone().convertSRGBToLinear() }); for (const [yy, zz, l] of [[-.02, .08, .3], [-.02, -.08, .3], [-.08, .04, .18], [-.08, -.04, .18]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.006, .012, l * sh.barbels, 4), bm); b.rotation.z = Math.PI / 2 + .5; b.rotation.y = zz * 4; b.position.set(-.5 - l * .3 * sh.barbels, yy, zz); g.add(b); } }
  if (opts && opts.shadow) root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  root.userData.tail = tail; root.userData.body = g;
  return root;
}
// ---------- thumbnails ----------
var thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
thumbR.setPixelRatio(2); thumbR.setSize(320, 160); thumbR.outputEncoding = THREE.sRGBEncoding; thumbR.toneMapping = THREE.ACESFilmicToneMapping;
const thumbScene = new THREE.Scene(); thumbScene.add(new THREE.HemisphereLight(0xffffff, 0x556677, 1.1));
const tl = new THREE.DirectionalLight(0xffffff, 1.2); tl.position.set(-2, 3, 4); thumbScene.add(tl);
const thumbCam = new THREE.PerspectiveCamera(30, 2, .1, 20); thumbCam.position.set(0, .15, 3.2); thumbCam.lookAt(0, 0, 0);
const thumbCache = {};
function fishThumb(spId, traits) {
  traits = traits || []; const key = spId + '|' + traits.slice().sort().join(',');
  if (thumbCache[key]) return thumbCache[key];
  const m = fishMesh(spId, traits); const sh = SHAPES[SP[spId].look.s];
  const span = 1 + (sh.snout || 0) + sh.tail; m.scale.setScalar(1.75 / span); m.position.x = ((sh.snout || 0) - sh.tail) * .4 * (1.75 / span);
  m.rotation.y = sh.flat ? 0 : .12; if (sh.flat) m.rotation.x = .9;
  thumbScene.add(m); thumbR.render(thumbScene, thumbCam); thumbScene.remove(m);
  return thumbCache[key] = thumbR.domElement.toDataURL();
}
const thumbImg = (sp, tr, w) => `<img class="thumb" src="${fishThumb(sp, tr)}" width="${w || 120}" height="${(w || 120) / 2}" alt="">`;
