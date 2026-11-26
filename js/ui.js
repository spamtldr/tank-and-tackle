// ============ UI: HUD, panels, fish info, shop, map, orders, guide, tips ============
function toast(m, col) { const d = document.createElement('div'); d.textContent = m; if (col) d.style.borderLeftColor = col; $('toast').prepend(d); while ($('toast').children.length > 4) $('toast').lastChild.remove(); setTimeout(() => d.remove(), 4200); }
let tipQueue = [];
function tip(k) { if (!S.tipsOn || S.tips[k] || !TIPS[k]) return; S.tips[k] = 1; tipQueue.push(k); if (tipQueue.length === 1) showTip(); }
function showTip() { const k = tipQueue[0]; if (!k) { $('tip').classList.remove('on'); return; } $('tiptext').textContent = TIPS[k]; $('tip').classList.add('on'); }
function nextTip() { tipQueue.shift(); showTip(); save(); }
function msg(t, hot) { const m = $('fishmsg'); m.textContent = t; m.classList.toggle('hot', !!hot); }
const METERS = { power: 'Cast power', speed: 'Reel speed', tension: 'Line tension', progress: 'Reel in', depth: 'Depth' };
function showMeters(list) { for (const k in METERS) $('m-' + k).classList.toggle('on', list.includes(k)); }
function setMeter(k, v, label, zone, extra) {
  const el = $('m-' + k); el.querySelector('i').style.width = clamp(v * 100, 0, 100) + '%'; el.querySelector('.v').textContent = (extra ? extra + ' · ' : '') + label;
  if (k === 'tension') el.querySelector('i').className = v > .85 ? 'bad' : v > .65 ? 'warn' : 'good';
  const z = el.querySelector('.zone'); if (z) { if (zone) { z.style.left = zone[0] * 100 + '%'; z.style.width = (zone[1] - zone[0]) * 100 + '%'; z.style.display = 'block'; } else z.style.display = 'none'; }
}
function fishUI(on, ice) { document.body.classList.toggle('fishing', on); document.body.classList.toggle('icing', !!(on && ice)); }
function hud() {
  const L = level(), need0 = xpNeed(L), need1 = xpNeed(L + 1), per = period(S.clock), w = curWeather();
  const icon = { clear: per === 'night' ? 'moon' : 'sun', cloudy: 'cloud', rain: 'rain', fog: 'fog', snow: 'snow' }[w];
  $('hud').innerHTML = `<div class="chip money ${S.money < 0 ? 'neg' : ''}">${money(S.money)}</div><div class="chip lvl"><b>Lv ${L}</b><span class="xp"><i style="width:${(S.xp - need0) / (need1 - need0) * 100}%"></i></span></div><div class="chip">${svgIcon(icon)} ${clockStr(S.clock)} · ${esc(SPOTS[S.spot].name)}</div>`;
  const hungry = S.tanks.reduce((a, t) => a + t.fish.filter(f => f.hunger >= 75).length, 0), alert = S.tanks.some(t => t.water < 35 || t.filter <= 0 || t.fish.some(f => f.health < 50));
  $('tankbtn').classList.toggle('alert', !!(hungry || alert)); $('tankbtn').title = hungry ? hungry + ' hungry fish' : '';
  if (S.money < 0) tip('debt');
  S.tanks.forEach(t => { if (t.filter < 15) tip('filter'); if (t.algae > 55) tip('algae'); if (stocking(t) > 1.1) tip('crowd'); if (t.fish.some(f => !tempOK(f.sp, t.temp))) tip('temp'); });
}
function svgIcon(n) {
  const p = { sun: '<circle cx="12" cy="12" r="5" fill="#ffd24a"/><g stroke="#ffd24a" stroke-width="2">' + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="12" y1="2" x2="12" y2="5" transform="rotate(${a} 12 12)"/>`).join('') + '</g>', moon: '<path d="M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z" fill="#e8ecff"/>', cloud: '<path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11 1 3.5 3.5 0 0 0 1 7z" fill="#d8e0e8"/>', rain: '<path d="M7 14h10a4 4 0 0 0 0-8 6 6 0 0 0-11 1 3.5 3.5 0 0 0 1 7z" fill="#b8c4d0"/><g stroke="#7ab8f0" stroke-width="2"><line x1="8" y1="17" x2="7" y2="21"/><line x1="12" y1="17" x2="11" y2="21"/><line x1="16" y1="17" x2="15" y2="21"/></g>', fog: '<g stroke="#d8e0e8" stroke-width="2.5" stroke-linecap="round"><line x1="4" y1="8" x2="20" y2="8"/><line x1="2" y1="13" x2="18" y2="13"/><line x1="6" y1="18" x2="22" y2="18"/></g>', snow: '<g stroke="#ffffff" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="4" y1="7.5" x2="20" y2="16.5"/><line x1="4" y1="16.5" x2="20" y2="7.5"/></g>' }[n];
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}
// ---------- panels ----------
function openPanel(html, wide) { const p = $('panel'); p.innerHTML = html; p.classList.toggle('wide', !!wide); p.classList.add('open'); for (const k in keys) keys[k] = false; dragging = false; }
function closeAll() { document.querySelectorAll('.panel.open,.modal.open').forEach(p => p.classList.remove('open')); }
function closeTop() { const m = $('modal'); if (m.classList.contains('open')) { m.classList.remove('open'); return true; } const p = $('panel'); if (p.classList.contains('open')) { if (p.dataset.lock) return true; p.classList.remove('open'); return true; } return false; }
const head = (t, sub) => `<div class="phead"><div><h2>${t}</h2>${sub ? `<p class="sub">${sub}</p>` : ''}</div><button class="ghost small" data-act="close">Close</button></div>`;
// ---------- fish info modal ----------
function showFishInfo(spId, x) {
  const s = SP[spId], T = TEMPS[s.temp], g = S.guide[spId], known = g || x;
  const topBaits = Object.entries(s.bait).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => BAITS[b].name);
  const foods = Object.keys(FOOD_EFF).filter(k => FOOD_EFF[k][s.diet] >= 1.1 && k !== 'color' && k !== 'meds').map(k => FOODS[k].name);
  const where = SPOT_ORDER.filter(id => s.spots[id]).map(id => SPOTS[id].name);
  const fav = Object.entries(STRUCT).filter(([k, v]) => v.fav.includes(spId)).map(([k, v]) => v.name);
  const wA = weightOf(spId, s.adult), wB = weightOf(spId, s.big);
  let h = `<div class="phead"><div class="row tight"><img src="${fishThumb(spId, x ? x.traits : [])}" width="160" height="80" alt=""><div><h2>${esc(x ? fishName(x) : s.name)}</h2><div class="sci">${esc(s.sci)}</div></div></div><button class="ghost small" data-act="mclose">Close</button></div>`;
  if (x) h += `<div class="stats"><div><b>${x.L.toFixed(1)} in</b><small>current length</small></div><div><b>${lbs(weightOf(x.sp, x.L))}</b><small>current weight</small></div><div><b>${x.maxL.toFixed(1)} in</b><small>its full size</small></div><div><b class="price">${money(fishValue(x))}</b><small>worth now</small></div></div>`;
  h += `<div class="grid2">
  <div><b>Water</b><span>${s.water === 'salt' ? 'Saltwater' : 'Freshwater'} · ${T.name} ${s.water === 'salt' ? '' : `(${T.min}–${T.max}°F, best ${T.ideal[0]}–${T.ideal[1]}°F)`}</span></div>
  <div><b>Typical adult</b><span>${s.adult} in · about ${lbs(wA)}</span></div>
  <div><b>Big ones</b><span>${s.big} in · about ${lbs(wB)}</span></div>
  <div><b>Your record</b><span>${g ? g.bestL.toFixed(1) + ' in · ' + lbs(g.bestW) : 'None yet'}</span></div>
  <div><b>Native range</b><span>${esc(s.range)}</span></div>
  <div><b>Habitat</b><span>${esc(s.habitat)}</span></div>
  <div><b>Where to catch it</b><span>${where.length ? esc(where.join(', ')) : 'Only one, somewhere special'}${fav.length ? ' · hangs around ' + esc(fav.join(', ').toLowerCase()) : ''}</span></div>
  <div><b>Best bait</b><span>${esc(topBaits.join(', '))}</span></div>
  <div><b>Bites</b><span>${TIMES[s.time].name}${s.rain > 1.15 ? '; more in the rain' : ''}</span></div>
  <div><b>Fights</b><span>${esc(FIGHTS[s.fight])}</span></div>
  <div><b>Eats in the wild</b><span>${esc(s.eats)}</span></div>
  <div><b>Tank food</b><span>${esc(DIETS[s.diet])}. Best: ${esc(foods.join(', ') || 'Sinking pellets')}. Feed every ~${s.feedH} hours.</span></div>
  <div><b>Raising</b><span>${s.water === 'salt' ? 'Needs a saltwater tank (not available yet).' : `Grows from fry to adult in about ${s.growH} hours of good care. An adult needs ~${Math.ceil(s.adult / .6)} gallons of space.${s.fry ? ' Fry cost ' + money(s.fry) + ' at Bait & Fry.' : ' Not sold as fry: catch one.'}`}</span></div>
  <div><b>Value</b><span>Adult, healthy: about ${money(s.val)} wild, ${money(s.val * 1.6)} tank-raised.</span></div></div>
  <p class="fact">${esc(s.fact)}</p>`;
  if (x && x.traits.length) h += x.traits.map(k => `<p class="fact"><b>${TRAITS[k].name} (×${TRAITS[k].mult} value):</b> ${esc(TRAITS[k].info)}</p>`).join('');
  if (!known) h = h.replace('<p class="fact">', '<p class="dim">You haven’t found one yet. Some details unlock when you do.</p><p class="fact">');
  const m = $('modal'); m.innerHTML = h; m.classList.add('open');
}
// ---------- catch result ----------
function showCatch(x, info) {
  const s = SP[x.sp], W = weightOf(x.sp, x.L), salt = s.water === 'salt', home = atHome();
  const title = x.legend ? LEGENDS[x.legend].name + '!' : x.traits.length ? 'A rare one!' : W > weightOf(x.sp, s.adult) * 1.8 ? 'Trophy!' : 'Nice catch!';
  let keep = '';
  if (salt) keep = '<p class="dim">Saltwater fish need a saltwater tank. Sell it or let it go.</p>';
  else if (home) keep = S.tanks.map((t, i) => { const ok = tempOK(x.sp, t.temp); return `<button class="small" data-act="keep-tank" data-id="${i}" ${t.fish.length < 30 ? '' : 'disabled'}>Into tank ${i + 1}${ok ? '' : ' (wrong temp!)'}</button>`; }).join('');
  else keep = `<button class="small" data-act="keep-truck" ${S.truck.length < WELLS[S.well].cap ? '' : 'disabled'}>Live well (${S.truck.length}/${WELLS[S.well].cap})</button>`;
  const h = `<div class="phead"><div><h2>${title}</h2><p class="sub">${info.newSp ? '<span class="tag">New species!</span>' : ''}${info.rec && !info.newSp ? '<span class="tag">Personal record!</span>' : ''} +${info.xp} XP</p></div></div>
  <div class="catch"><img src="${fishThumb(x.sp, x.traits)}" alt="" width="280" height="140"><div><div class="fc-name">${esc(fishName(x))}</div><div class="sci">${esc(s.sci)}</div><div>${x.traits.map(k => `<span class="tag">${TRAITS[k].name}</span>`).join('')}</div>
  <div class="stats"><div><b>${x.L.toFixed(1)} in</b><small>length</small></div><div><b>${lbs(W)}</b><small>weight</small></div><div><b class="price">${money(fishValue(x))}</b><small>sell now</small></div></div></div></div>
  <p class="fact">${esc(x.legend ? LEGENDS[x.legend].clue.split('.')[0] + '. Gus would be proud.' : s.fact)}</p>
  <div class="row">${keep}<button class="small ghost" data-act="sell-catch">Sell · ${money(fishValue(x))}</button><button class="small ghost" data-act="release">Release (+5 XP)</button><button class="small ghost" data-act="info" data-sp="${x.sp}">Species info</button></div>`;
  openPanel(h); $('panel').dataset.lock = '1';
}
// ---------- shop ----------
let shopTab = 'fry';
function openShop(baitOnly) {
  if (baitOnly) shopTab = 'bait'; const tabs = baitOnly ? [['bait', 'Bait & lures']] : [['fry', 'Fry'], ['food', 'Tank food'], ['bait', 'Bait & lures'], ['rods', 'Rods'], ['truck', 'Truck']];
  const fryFresh = SPECIES.filter(s => s.fry > 0);
  let h = head(baitOnly ? "Rosa's bait counter" : 'Bait & Fry', `You have <b class="price">${money(S.money)}</b>${S.money < 0 ? ' · sell fish to get out of the red before buying' : ''}`);
  if (!baitOnly) h += `<p class="npcline">“${esc(pick(NPCS.marla))}” <span class="dim">— Marla</span></p>`;
  h += `<div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${shopTab === k ? 'on' : ''}" data-act="stab" data-id="${k}" data-bait="${baitOnly ? 1 : ''}">${n}</button>`).join('')}</div><div class="grid">`;
  const can = p => S.money >= p && S.money >= 0;
  if (shopTab === 'fry') { h += fryFresh.map(s => `<div class="card"><button class="thumbbtn" data-act="info" data-sp="${s.id}" title="Details"><img src="${fishThumb(s.id, [])}" alt=""></button><div class="nm">${s.name}</div><div class="sci">${s.sci}</div><div class="dim">${TEMPS[s.temp].name} · adult in ~${s.growH}h · sells ~${money(s.val * 1.6)} raised</div><div class="row"><button class="small" data-act="buyfry" data-id="${s.id}" ${can(s.fry) ? '' : 'disabled'}>Buy fry · ${money(s.fry)}</button><button class="small ghost" data-act="info" data-sp="${s.id}">Details</button></div></div>`).join('') + `<div class="card"><div class="nm">Lucky fry bag</div><div class="dim">A random fry with 4× the odds of a rare trait.</div><div class="row"><button class="small" data-act="lucky" ${can(150) ? '' : 'disabled'}>Buy · $150</button></div></div>`; }
  if (shopTab === 'food') h += Object.entries(FOODS).map(([k, f]) => `<div class="card"><div class="nm">${f.name} ×${f.qty}</div><div class="dim">${f.info}</div><div class="dim">You have ${S.food[k] || 0}</div><div class="row"><button class="small" data-act="buyfood" data-id="${k}" ${can(f.price) ? '' : 'disabled'}>Buy · ${money(f.price)}</button></div></div>`).join('');
  if (shopTab === 'bait') h += Object.entries(BAITS).map(([k, b]) => `<div class="card"><div class="nm">${b.name}${b.lure ? '' : ' ×' + b.qty}</div><div class="dim">${b.info}</div><div class="dim">${STYLES[b.style].split(':')[0]} · you have ${b.lure ? (S.lures[k] || 0) : (S.bait[k] || 0)}</div><div class="row"><button class="small" data-act="buybait" data-id="${k}" ${can(b.price) ? '' : 'disabled'}>Buy · ${money(b.price)}</button></div></div>`).join('');
  if (shopTab === 'rods') h += Object.entries(RODS).map(([k, r]) => { const own = S.rods.includes(k); return `<div class="card"><div class="nm">${r.name}</div><div class="dim">${r.info}</div><div class="dim">Line ${r.line} lb · casts ${r.cast} yd · reel ×${r.reel}</div><div class="row">${own ? `<button class="small ${S.rod === k ? 'on' : 'ghost'}" data-act="userod" data-id="${k}">${S.rod === k ? 'Using' : 'Use'}</button>` : `<button class="small" data-act="buyrod" data-id="${k}" ${can(r.price) ? '' : 'disabled'}>Buy · ${money(r.price)}</button>`}</div></div>`; }).join('');
  if (shopTab === 'truck') h += WELLS.map((w, i) => `<div class="card"><div class="nm">${w.name}</div><div class="dim">${w.info}</div><div class="dim">Holds ${w.cap} · fish lose ~${w.decay}% health per hour</div><div class="row">${i <= S.well ? `<span class="good">${i === S.well ? 'Installed' : 'Replaced'}</span>` : `<button class="small" data-act="buywell" data-id="${i}" ${can(w.price) && i === S.well + 1 ? '' : 'disabled'}>Buy · ${money(w.price)}</button>`}</div></div>`).join('');
  h += '</div>'; openPanel(h, true); delete $('panel').dataset.lock; if (shopTab === 'truck') tip('well');
}
function openTackle() { if (mode === 'tank') return; let h = head('Tackle box', `Rod: <b>${esc(RODS[S.rod].name)}</b> · ${RODS[S.rod].line} lb line`); h += `<h3>Rods</h3><div class="row">${S.rods.map(k => `<button class="small ${S.rod === k ? 'on' : 'ghost'}" data-act="userod" data-id="${k}">${esc(RODS[k].name)}</button>`).join('')}</div><h3>Bait & lures</h3><div class="grid">${Object.entries(BAITS).filter(([k]) => haveBait(k)).map(([k, b]) => `<div class="card"><div class="nm">${b.name} <span class="dim">${b.lure ? '×' + S.lures[k] : '×' + S.bait[k]}</span></div><div class="dim">${b.info}</div></div>`).join('') || '<p class="dim">Empty.</p>'}</div><h3>Fishing styles</h3>${Object.values(STYLES).map(s => `<p class="dim">${esc(s)}</p>`).join('')}`; openPanel(h, true); }
// ---------- map ----------
function openMap() {
  const L = level(); tip('truck');
  const pins = SPOT_ORDER.map(id => { const s = SPOTS[id], [x, y] = s.map, lock = L < s.lvl, here = id === S.spot; return `<g class="pin ${lock ? 'lock' : ''} ${here ? 'here' : ''}" transform="translate(${x * 6},${y * 4})"><circle r="${here ? 14 : 11}"/><text y="30" text-anchor="middle">${esc(s.name)}</text>${lock ? `<text y="5" text-anchor="middle" class="lk">${s.lvl}</text>` : ''}</g>`; }).join('');
  let h = head('Where to?', `Gas costs money. Your live well holds ${WELLS[S.well].cap} (${S.truck.length} aboard).`);
  h += `<svg class="map" viewBox="0 0 600 400" role="img" aria-label="Map"><rect width="600" height="400" rx="18" fill="#e8dcb8"/><path d="M0 300 Q150 250 300 290 T600 260 L600 400 L0 400Z" fill="#cfe0b8"/><path d="M520 0 Q560 200 540 400 L600 400 L600 0Z" fill="#8cc4dc"/><path d="M60 60 L160 40 L120 120 Z M260 20 L360 30 L320 90Z" fill="#b8b8a8"/><path d="M130 90 Q250 170 384 150 Q430 260 444 320" stroke="#6a8aa0" stroke-width="5" fill="none" stroke-dasharray="2 8" stroke-linecap="round"/>${pins}</svg>`;
  h += '<div class="grid">' + SPOT_ORDER.map(id => { const s = SPOTS[id], lock = L < s.lvl, here = id === S.spot, gas = Math.max(SPOTS[S.spot].gas, s.gas) || 15; const w = weatherAt(id, S.day); return `<div class="card ${lock ? 'locked' : ''}"><div class="nm">${esc(s.name)}</div><div class="dim">${esc(s.blurb)}</div><div class="dim">${svgIcon({ clear: 'sun', cloudy: 'cloud', rain: 'rain', fog: 'fog', snow: 'snow' }[w])} ${w} today</div><div class="row">${here ? '<span class="good">You are here</span>' : lock ? `<span class="dim">Unlocks at level ${s.lvl}</span>` : `<button class="small" data-act="drive" data-id="${id}" ${S.money >= gas ? '' : 'disabled'}>Drive · ${money(gas)} gas</button>`}</div></div>`; }).join('') + '</div>';
  openPanel(h, true);
}
function travel(id) {
  const gas = Math.max(SPOTS[S.spot].gas, SPOTS[id].gas) || 15; if (S.money < gas) return;
  S.money -= gas; closeAll(); SFX.engine(); $('fade').classList.add('on');
  setTimeout(() => { S.spot = id; S.seenSpots = S.seenSpots || {}; S.clock += 45; loadSpot(); save(); setTimeout(() => $('fade').classList.remove('on'), 150); toast('Arrived at ' + SPOTS[id].name + '.'); if (id !== 'lake') tip('legend'); }, 700);
}
// ---------- orders ----------
function refreshOrders() {
  if (S.ordersDay === S.day) return; S.ordersDay = S.day; S.orders = {};
  for (const id of SPOT_ORDER) { const b = SPOTS[id].buyer; S.orders[id] = [0, 1, 2].map(i => { const sp = pick(b.wants), s = SP[sp]; const minL = Math.round(s.adult * rnd(.6, 1) * 2) / 2, raised = Math.random() < .4; const pay = Math.round(s.val * Math.pow(minL / s.adult, 2) * (raised ? 1.6 : 1) * rnd(1.9, 2.6) / 5) * 5 + 20; return { id: S.day * 10 + i, sp, minL, raised, pay, xp: 30 + Math.round(pay / 8) }; }); }
}
const fitsOrder = (o, x) => x.sp === o.sp && x.L >= o.minL && (!o.raised || isRaised(x)) && x.health >= 40;
function openOrders() {
  refreshOrders(); tip('order'); const list = S.orders[S.spot] || [], b = SPOTS[S.spot].buyer; const home = atHome();
  const pool = home ? allFishOwned() : S.truck.map(f => [f, null]);
  let h = head(esc(b.name), `New orders every day. ${home ? 'Deliver from your tanks or truck.' : 'Deliver from your truck’s live well.'}`);
  h += list.length ? '<div class="grid">' + list.map(o => { const s = SP[o.sp]; const ok = pool.filter(([x]) => fitsOrder(o, x)); return `<div class="card"><button class="thumbbtn" data-act="info" data-sp="${o.sp}"><img src="${fishThumb(o.sp, [])}" alt=""></button><div class="nm">${s.name}</div><div class="dim">At least ${o.minL} in${o.raised ? ' · tank-raised only' : ''} · healthy</div><div class="price big">${money(o.pay)} <span class="dim">+${o.xp} XP</span></div><div class="dim">Market price for that fish: about ${money(s.val * Math.pow(o.minL / s.adult, 2.55) * (o.raised ? 1.6 : 1))}</div><div class="row">${ok.length ? ok.slice(0, 3).map(([x, t]) => `<button class="small" data-act="deliver" data-id="${o.id}" data-fid="${x.id}">Deliver ${x.L.toFixed(1)} in${t ? ' (tank)' : ' (truck)'}</button>`).join('') : '<span class="dim">No matching fish with you.</span>'}</div></div>`; }).join('') + '</div>' : '<p class="dim">All filled for today. Check back tomorrow.</p>';
  openPanel(h, true);
}
function deliver(oid, fid) {
  const list = S.orders[S.spot], o = list.find(q => q.id === oid); if (!o) return;
  let removed = false;
  for (const t of S.tanks) { const i = t.fish.findIndex(f => f.id === fid); if (i >= 0 && fitsOrder(o, t.fish[i])) { t.fish.splice(i, 1); removed = true; } }
  const j = S.truck.findIndex(f => f.id === fid); if (!removed && j >= 0 && fitsOrder(o, S.truck[j])) { S.truck.splice(j, 1); removed = true; }
  if (!removed) return; S.money += o.pay; addXP(o.xp); S.orders[S.spot] = list.filter(q => q !== o); SFX.coin(); toast(`Delivered! +${money(o.pay)}`, 'var(--brass)'); refreshHomeTanks(); openOrders();
}
// ---------- rest, talk, pages, guide ----------
function openRest() { openPanel(head('Gus’s cabin', 'Resting skips the clock ahead for fishing. Your tanks run on real time, so it won’t grow (or starve) your fish.') + `<div class="row">${[['Until dawn (5:00 AM)', 300], ['Until noon', 720], ['Until dusk (5:30 PM)', 1050], ['Until night (9:00 PM)', 1260]].map(([n, m]) => `<button class="small" data-act="rest" data-id="${m}">${n}</button>`).join('')}</div>`); }
function rest(m) { if (m <= S.clock % 1440) S.day++; S.clock = m; closeAll(); $('fade').classList.add('on'); setTimeout(() => $('fade').classList.remove('on'), 600); toast('You rest until ' + clockStr(m) + '.'); refreshOrders(); }
function talk(n) { const lines = NPCS[n] || ['Fresh fish fried every night. Bring me some from your tanks and I’ll pay well. Check the board.']; const who = { hatch: 'Hatchery keeper', lou: 'Old Lou', rosa: 'Rosa', ice: 'Camp boss', fry: 'The cook', marla: 'Marla' }[n] || ''; openPanel(head(esc(who)) + `<p class="npcline big">“${esc(pick(lines))}”</p><div class="row"><button class="small ghost" data-act="talk" data-id="${n}">Ask something else</button></div>`); }
function readPage(id) { const p = PAGES[id]; const first = !S.pages[id]; S.pages[id] = 1; if (first) { addXP(50); tip('legend'); } openPanel(head(esc(p.title), first ? '+50 XP · added to your Field Guide' : '') + `<div class="page">${esc(p.text)}</div><p class="dim"><b>Legend clue:</b> ${esc(LEGENDS[id].clue)}</p>`); save(); }
let guideTab = 'species';
function openGuide() {
  if (mode === 'fish' || mode === 'ice') { if (F.st !== 'ready' && F.st !== 'jig') return; }
  const found = SPECIES.filter(s => S.guide[s.id]).length, tabs = [['species', 'Species'], ['traits', 'Rare traits'], ['legends', 'Legends'], ['log', "Gus's logbook"], ['help', 'Help']];
  let h = head('Field Guide', `${found} of ${SPECIES.length} species found · ${S.catches} catches · level ${level()}`) + `<div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${guideTab === k ? 'on' : ''}" data-act="gtab" data-id="${k}">${n}</button>`).join('')}</div>`;
  if (guideTab === 'species') h += '<div class="grid">' + SPECIES.filter(s => !s.legendOnly || S.guide[s.id]).map(s => { const g = S.guide[s.id]; return `<button class="card fishcard ${g ? '' : 'locked'}" data-act="info" data-sp="${s.id}"><img src="${fishThumb(s.id, [])}" alt="" style="${g ? '' : 'filter:brightness(0) opacity(.35)'}"><span class="nm">${g ? s.name : '???'}</span><span class="dim">${g ? 'Best ' + g.bestL.toFixed(1) + ' in · ' + lbs(g.bestW) : SPOT_ORDER.filter(id => s.spots[id]).map(id => SPOTS[id].name).join(', ')}</span></button>`; }).join('') + '</div>';
  if (guideTab === 'traits') h += '<div class="grid">' + Object.entries(TRAITS).map(([k, t]) => `<div class="card ${S.traits[k] ? '' : 'locked'}"><div class="nm">${S.traits[k] ? t.name : '??? trait'} <span class="dim">×${t.mult} value</span></div><div class="dim">${S.traits[k] ? t.info : 'Not found yet.'}</div></div>`).join('') + '</div>';
  if (guideTab === 'legends') h += '<div class="grid">' + SPOT_ORDER.map(id => { const L = LEGENDS[id], c = S.legends[id], p = S.pages[id]; return `<div class="card ${c ? '' : 'locked'}">${c ? `<img src="${fishThumb(L.sp, L.traits)}" alt="">` : ''}<div class="nm">${c || p ? L.name : '???'}</div><div class="dim">${SPOTS[id].name}</div><div class="dim">${c ? 'Caught!' : p ? 'Clue: ' + L.clue : "Find Gus's page here for a clue."}</div></div>`; }).join('') + '</div>';
  if (guideTab === 'log') h += SPOT_ORDER.map(id => S.pages[id] ? `<div class="page"><b>${esc(PAGES[id].title)}</b><br>${esc(PAGES[id].text)}</div>` : `<div class="page locked">${esc(PAGES[id].title.split(':')[0])}: not found yet (${esc(SPOTS[id].name)}).</div>`).join('');
  if (guideTab === 'help') h += `<details open><summary>Controls</summary><p>WASD or arrows to walk, Shift to run, drag to look, scroll to zoom, V to swap first/third person, E to interact. T tanks, G guide, B tackle box, M sound. While fishing: hold and release to cast, number keys pick bait, Q leaves.</p></details><details><summary>Fishing styles</summary>${Object.values(STYLES).map(s => `<p>${esc(s)}</p>`).join('')}</details><details><summary>Hot spots</summary><p>Weed beds, rock piles, sunken timber, drop-offs, plunge pools, current seams, pilings and sandbars hold more fish, and bigger ones. Look for ripples, reeds and branches poking up. Each kind of structure draws its own species.</p></details><details><summary>Money</summary><p>Sell fish, fill orders, raise fry. Tank-raised fish sell for 1.6×. Power bills, food and gas cost money every day.</p></details>${helpHTML()}<p><label><input type="checkbox" data-act="tipsOn" ${S.tipsOn ? 'checked' : ''}> Show tips</label> <button class="small ghost" data-act="tipsReset">Show all tips again</button> <button class="small ghost" data-act="reset" id="resetbtn">Start over</button></p>`;
  openPanel(h, true);
}
function toggleSound() { setSound(!S.sound); $('soundbtn').textContent = S.sound ? 'Sound on' : 'Sound off'; }

// ---------- click router ----------
let resetArm = false;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || !started) return; const a = b.dataset.act, id = b.dataset.id; audioInit();
  const findOwned = fid => { for (const t of S.tanks) { const f = t.fish.find(q => q.id === +fid); if (f) return [f, t]; } return [S.truck.find(q => q.id === +fid), null]; };
  const pay = p => { if (S.money < p || S.money < 0) { toast('Not enough money.', 'var(--bad)'); return false; } S.money -= p; SFX.coin(); return true; };
  const tk = TV.tank;
  switch (a) {
    case 'close': delete $('panel').dataset.lock; closeAll(); break;
    case 'mclose': $('modal').classList.remove('open'); break;
    case 'tipnext': nextTip(); break;
    case 'open-tanks': openTankView(); break; case 'open-guide': openGuide(); break; case 'open-tackle': openTackle(); break;
    case 'view': toggleView(); break; case 'sound': toggleSound(); break; case 'quality': { const o = ['low', 'high', 'ultra']; S.quality = o[(o.indexOf(S.quality || 'high') + 1) % 3]; applyQuality(); toast('Graphics: ' + S.quality + (S.quality === 'ultra' ? '. Sharpest, but heavier on older devices.' : S.quality === 'low' ? '. Faster on older devices.' : '.')); } break; case 'interact': interact(); break; case 'leave': leaveFishing(); break;
    case 'bait': selectBait(id); break;
    case 'info': showFishInfo(b.dataset.sp); break;
    case 'gtab': guideTab = id; openGuide(); break;
    case 'stab': shopTab = id; openShop(!!b.dataset.bait); break;
    case 'buyfry': { const s = SP[id]; if (pay(s.fry)) { const f = fryFish(id, .5); const t = S.tanks.find(q => tempOK(id, q.temp)) || S.tanks[0]; t.fish.push(f); logGuide(f); toast(`${s.name} fry went into tank ${S.tanks.indexOf(t) + 1}${f.traits.length ? ': looks rare!' : '.'}`); if (!tempOK(id, t.temp)) toast('Heads up: that tank is the wrong temperature for it.', 'var(--warn)'); refreshHomeTanks(); openShop(); } } break;
    case 'lucky': if (pay(150)) { const s = pick(SPECIES.filter(q => q.fry > 0)); const f = fryFish(s.id, 4); const t = S.tanks.find(q => tempOK(s.id, q.temp)) || S.tanks[0]; t.fish.push(f); logGuide(f); toast(`Lucky bag: ${s.name}${f.traits.length ? ' · ' + f.traits.map(k => TRAITS[k].name).join(', ') + '!' : ' (no rare traits).'}`); refreshHomeTanks(); openShop(); } break;
    case 'buyfood': if (pay(FOODS[id].price)) { S.food[id] = (S.food[id] || 0) + FOODS[id].qty; openShop(); } break;
    case 'buybait': if (pay(BAITS[id].price)) { if (BAITS[id].lure) S.lures[id] = (S.lures[id] || 0) + 1; else S.bait[id] = (S.bait[id] || 0) + BAITS[id].qty; openShop(shopTab === 'bait' && !atHome()); } break;
    case 'buyrod': if (pay(RODS[id].price)) { S.rods.push(id); S.rod = id; toast(RODS[id].name + ' is now your rod.'); openShop(); } break;
    case 'userod': S.rod = id; toast('Using ' + RODS[id].name + '.'); if ($('panel').innerHTML.includes('Tackle box')) openTackle(); else openShop(); break;
    case 'buywell': if (+id === S.well + 1 && pay(WELLS[id].price)) { S.well = +id; refreshTruckCargo(); toast(WELLS[id].name + ' installed in your truck.'); openShop(); } break;
    case 'drive': travel(id); break;
    case 'deliver': deliver(+id, +b.dataset.fid); break;
    case 'rest': rest(+id); break;
    case 'talk': talk(id); break;
    // catch result
    case 'keep-tank': { const t = S.tanks[+id]; t.fish.push(F.fish); toast(`${fishName(F.fish)} is in tank ${+id + 1}.`); delete $('panel').dataset.lock; closeAll(); refreshHomeTanks(); afterCatch(); } break;
    case 'keep-truck': if (S.truck.length < WELLS[S.well].cap) { S.truck.push(F.fish); toast('In the live well. Take it home to a tank, or deliver it.'); tip('well'); delete $('panel').dataset.lock; closeAll(); afterCatch(); } break;
    case 'sell-catch': { const v = fishValue(F.fish); S.money += v; SFX.coin(); toast('Sold for ' + money(v) + '.'); delete $('panel').dataset.lock; closeAll(); afterCatch(); } break;
    case 'release': addXP(5); toast('Released. Good on you.'); splash(F.to, 4, false); delete $('panel').dataset.lock; closeAll(); afterCatch(); break;
    // tank view
    case 'tank-close': closeTankView(); break; case 'tank-prev': switchTank(-1); break; case 'tank-next': switchTank(1); break;
    case 'ttab': TV.tab = id; renderTankPanel(); break;
    case 'tsel': TV.sel = +id; renderTankPanel(); break;
    case 'feed1': { const [f, t] = findOwned(id); const owned = Object.keys(FOODS).filter(k => (S.food[k] || 0) > 0 && FOOD_EFF[k][SP[f.sp].diet] > 0); const fd = owned.includes(TV.food) ? TV.food : owned[0]; if (!fd) { toast('No food it will eat.'); break; } const r = feedOne(t, f, fd); toast(FEED_MSG[r] + (r === 'ok' ? ' (' + FOODS[fd].name + ')' : ''), r === 'ok' ? null : 'var(--warn)'); tip('feed'); renderTankPanel(); } break;
    case 'feedall': { let n = 0, waste = 0; for (const f of tk.fish) { if (f.hunger < 40) continue; const r = feedOne(tk, f, TV.food); if (r === 'ok') n++; } toast(n ? `Fed ${n} fish.` : 'Nobody was hungry enough.'); tip('feed'); renderTankPanel(); } break;
    case 'sell1': { const [f, t] = findOwned(id); const v = fishValue(f); S.money += v; t.fish.splice(t.fish.indexOf(f), 1); SFX.coin(); toast(`Sold ${fishName(f)} for ${money(v)}.`); TV.sel = null; syncTankFish(tk); renderTankPanel(); } break;
    case 'to-truck': { const [f, t] = findOwned(id); if (S.truck.length < WELLS[S.well].cap) { t.fish.splice(t.fish.indexOf(f), 1); S.truck.push(f); TV.sel = null; syncTankFish(tk); renderTankPanel(); toast('Moved to the truck live well.'); tip('well'); } } break;
    case 'to-tank': { const i = S.truck.findIndex(f => f.id === +id); if (i >= 0) { const f = S.truck.splice(i, 1)[0]; tk.fish.push(f); syncTankFish(tk); renderTankPanel(); if (!tempOK(f.sp, tk.temp)) toast('Careful: wrong temperature for it here.', 'var(--warn)'); } } break;
    case 'wchange': { const c = Math.round(tankGal(tk) * .25); if (pay(c)) { tk.water = Math.min(100, tk.water + 70); tk.waste = Math.max(0, tk.waste - 15); updateTankLook(tk); toast('Water changed.'); renderTankPanel(); } } break;
    case 'cart': if (pay(FILTERS[tk.ft].cart)) { tk.filter = 100; toast('Fresh filter cartridge in.'); renderTankPanel(); } break;
    case 'scrub': TV.tool = TV.tool === 'scrub' ? 'select' : 'scrub'; renderTankPanel(); break;
    case 'vac': if (!TV.vac) TV.vac = .01; break;
    case 'buy-filter': { const nf = FILTERS[tk.ft + 1]; if (nf && pay(nf.price)) { tk.ft++; tk.filter = 100; buildTankScene(tk); syncTankFish(tk); renderTankPanel(); } } break;
    case 'buy-heater': if (pay(HEATER.price)) { tk.heater = true; buildTankScene(tk); syncTankFish(tk); renderTankPanel(); } break;
    case 'buy-chiller': if (pay(CHILLER.price)) { tk.chiller = true; buildTankScene(tk); syncTankFish(tk); renderTankPanel(); } break;
    case 'buy-feeder': if (pay(FEEDER.price)) { tk.feeder = true; buildTankScene(tk); syncTankFish(tk); renderTankPanel(); } break;
    case 'buy-size': { const ns = TANK_SIZES[tk.size + 1]; if (ns && pay(ns.price)) { tk.size++; syncTankFish(tk); renderTankPanel(); toast('Upgraded to the ' + ns.name + '!'); } } break;
    case 'buy-tank': if (pay(EXTRA_TANK_PRICE[S.tanks.length])) { S.tanks.push(newTank(40)); toast('New tank installed.'); openTankView(S.tanks.length - 1); } break;
    case 'tipsReset': S.tips = {}; toast('Tips will show again.'); break;
    case 'reset': if (!resetArm) { resetArm = true; b.textContent = 'Click again to erase everything'; setTimeout(() => resetArm = false, 4000); } else { try { localStorage.removeItem(SAVE_KEY); } catch (er) { } location.reload(); } break;
  }
  if (a !== 'reset') { hud(); save(); }
});
document.addEventListener('change', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
  if (a === 'temp' && TV.tank) { TV.tank.set = +b.value; renderTankPanel(); }
  if (a === 'foodsel') { TV.food = b.value; renderTankPanel(); }
  if (a === 'feedersel' && TV.tank) TV.tank.feederFood = b.value;
  if (a === 'tipsOn') S.tipsOn = b.checked;
  save();
});
['btn-drop', 'btn-up'].forEach(id => { const el = $(id); const on = e => { e.preventDefault(); el.classList.add('held'); }, off = () => el.classList.remove('held'); el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off); });
$('btn-jig').addEventListener('pointerdown', e => { e.preventDefault(); if (F.st === 'bite') hookFish(); else if (F.st === 'reel') { F.hold = true; } else jig(); });
$('btn-jig').addEventListener('pointerup', () => { if (F.st === 'reel') F.hold = false; });
