// ============ State, save, shared helpers ============
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const money = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function wpick(entries) { let t = 0; for (const e of entries) t += e[1]; let r = Math.random() * t; for (const e of entries) { r -= e[1]; if (r <= 0) return e[0]; } return entries[entries.length - 1][0]; }
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

const SAVE_KEY = 'tankTackle.v2';
let tankSeq = 1;
function newTank(gal) {
  return { id: tankSeq++, size: TANK_SIZES.findIndex(t => t.gal === gal), ft: 0, filter: 100, water: 100, algae: 4, waste: 0, temp: ROOM_T, set: ROOM_T, heater: false, chiller: false, feeder: false, feederFood: 'pellets', fish: [] };
}
function freshState() {
  return {
    v: 2, money: 150, xp: 0, clock: 6 * 60 + 10, day: 1, spot: 'lake',
    bait: { worm: 15 }, lures: { spinner: 1 }, sel: 'worm', rod: 'old', rods: ['old'],
    food: { pellets: 30, flakes: 20 }, tanks: [newTank(40)], well: 0, truck: [],
    guide: {}, traits: {}, pages: {}, legends: {}, tips: {}, orders: {}, ordersDay: 0,
    catches: 0, last: Date.now(), id: 1, sound: true, tipsOn: true, tankSeq: 2
  };
}
let S = freshState();
let hadSave = false;
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const o = JSON.parse(raw); if (o && o.v === 2) { S = Object.assign(freshState(), o); hadSave = true; } } } catch (e) { }
tankSeq = S.tankSeq || 2;
function save() { S.last = Date.now(); S.tankSeq = tankSeq; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }

// ---------- fish helpers ----------
const weightOf = (sp, L) => SP[sp].c * L * L * L;
const lbs = w => w < 1 ? (w * 16).toFixed(1) + ' oz' : w.toFixed(w < 10 ? 2 : 1) + ' lb';
function rollTraits(sp, luck) {
  let t = [];
  for (const k in TRAITS) { const T = TRAITS[k]; if (T.only && !T.only.includes(sp)) continue; if (Math.random() < T.chance * luck) t.push(k); }
  if (t.includes('golden')) t = t.filter(k => k !== 'albino' && k !== 'melanistic');
  if (t.includes('albino')) t = t.filter(k => k !== 'melanistic' && k !== 'piebald');
  return t;
}
function makeFish(sp, L, maxL, traits, wild) {
  return { id: S.id++, sp, L, L0: L, maxL: Math.max(L, maxL), traits, wild, hunger: wild ? 45 : 20, health: wild ? rnd(80, 98) : 100, bonusT: 0, bonus: 1, vividT: 0, legend: null, raisedIn: 0 };
}
function fryFish(sp, luck) {
  const s = SP[sp], tr = rollTraits(sp, luck);
  const maxL = s.adult * (tr.includes('giant') ? 1.4 : 1) * rnd(.97, 1.08);
  return makeFish(sp, s.adult * .12, maxL, tr, false);
}
const isRaised = x => !x.wild || (x.L - x.L0) >= x.L0 * .3;
function fishValue(x) {
  const s = SP[x.sp]; let m = 1; x.traits.forEach(t => m *= TRAITS[t].mult);
  const ratio = Math.pow(weightOf(x.sp, x.L) / weightOf(x.sp, s.adult), .85);
  let v = s.val * ratio * m * (.45 + .55 * x.health / 100);
  if (x.vividT > 0) v *= 1.12;
  if (isRaised(x)) v *= 1.6;
  if (x.legend) v = LEGENDS[x.legend].val * (.6 + .4 * x.health / 100);
  return Math.max(1, Math.round(v));
}
function fishName(x) { return x.legend ? LEGENDS[x.legend].name : SP[x.sp].name; }
function logGuide(x) {
  const g = S.guide[x.sp] || (S.guide[x.sp] = { n: 0, bestL: 0, bestW: 0 });
  g.n++; g.bestL = Math.max(g.bestL, x.L); g.bestW = Math.max(g.bestW, weightOf(x.sp, x.L));
  x.traits.forEach(t => S.traits[t] = 1);
}
const allFishOwned = () => [...S.tanks.flatMap(t => t.fish.map(f => [f, t])), ...S.truck.map(f => [f, null])];

// ---------- level ----------
const xpNeed = L => Math.round(100 * Math.pow(L - 1, 1.6));
function level() { let L = 1; while (S.xp >= xpNeed(L + 1)) L++; return L; }

// ---------- clock ----------
function period(m) { m = ((m % 1440) + 1440) % 1440; if (m >= 300 && m < 480) return 'dawn'; if (m >= 480 && m < 1020) return 'day'; if (m >= 1020 && m < 1200) return 'dusk'; return 'night'; }
function clockStr(m) { m = Math.floor(((m % 1440) + 1440) % 1440); let h = Math.floor(m / 60), mm = m % 60; const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return h + ':' + String(mm).padStart(2, '0') + ' ' + ap; }
function weatherAt(spot, day) {
  const W = SPOTS[spot].weather; let t = 0; for (const w of W) t += w[1];
  let r = hash(day * 13.7 + spot.length * 7.3 + spot.charCodeAt(0)) * t;
  for (const w of W) { r -= w[1]; if (r <= 0) return w[0]; } return W[0][0];
}
const curWeather = () => weatherAt(S.spot, S.day);
