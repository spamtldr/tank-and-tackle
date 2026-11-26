// ============ Online: anglers board, species records, legend wall, news, cloud save ============
// Uses the shared Firebase project (same one as Spark Up). Everything degrades to offline quietly.
const FB_CFG = { apiKey: 'AIzaSyD7yXia334pZkVavBGu822shVQPKD9r4uM', authDomain: 'spark-up-81558.firebaseapp.com', projectId: 'spark-up-81558', storageBucket: 'spark-up-81558.firebasestorage.app', messagingSenderId: '740705988313', appId: '1:740705988313:web:7b393f83b21281b36698c8' };
const FBV = '10.12.2';
const ON = { fb: null, state: 'connecting', anglers: [], records: {}, legends: {}, feed: [], since: Date.now(), bkT: null, syncT: null };
const CODE_ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode() { const a = new Uint32Array(10); crypto.getRandomValues(a); return Array.from(a, x => CODE_ALPH[x % CODE_ALPH.length]).join(''); }
const fmtCode = c => c ? c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8) : '';
const validName = n => /^[A-Za-z0-9 _.\-']{2,20}$/.test(n) && n.trim().length >= 2;

async function onlineInit() {
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 12000));
  try {
    const base = `https://www.gstatic.com/firebasejs/${FBV}/`;
    await Promise.race([timeout, (async () => {
      const [A0, A, Fs] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
      const app = A0.initializeApp(FB_CFG, 'tankTackle'); const auth = A.getAuth(app);
      const cur = await new Promise(res => { const u = A.onAuthStateChanged(auth, x => { u(); res(x); }); });
      const user = cur || (await A.signInAnonymously(auth)).user;
      ON.fb = { db: Fs.getFirestore(app), uid: user.uid, F: Fs };
    })()]);
    ON.state = 'online';
    await ensureOwner();
    const F = ON.fb.F, db = ON.fb.db;
    F.onSnapshot(F.query(F.collection(db, 'tt_anglers'), F.limit(300)), s => { ON.anglers = s.docs.map(d => Object.assign({ id: d.id }, d.data())); refreshOnlinePanel(); }, onErr);
    F.onSnapshot(F.collection(db, 'tt_records'), s => { ON.records = {}; s.docs.forEach(d => ON.records[d.id] = d.data()); refreshOnlinePanel(); }, onErr);
    F.onSnapshot(F.collection(db, 'tt_legends'), s => { ON.legends = {}; s.docs.forEach(d => ON.legends[d.id] = d.data()); refreshOnlinePanel(); }, onErr);
    F.onSnapshot(F.query(F.collection(db, 'tt_feed'), F.orderBy('at', 'desc'), F.limit(30)), s => {
      s.docChanges().forEach(ch => { const d = ch.doc.data(); if (ch.type === 'added' && d.uid !== ON.fb.uid && d.at && d.at.toMillis && d.at.toMillis() > ON.since) toast(d.text, 'var(--brass)'); });
      ON.feed = s.docs.map(d => Object.assign({ id: d.id }, d.data())); refreshOnlinePanel();
    }, onErr);
    syncMe(); backupSoon();
  } catch (e) { ON.fb = null; ON.state = 'offline'; }
  refreshOnlinePanel(); updateOnlineBtn();
}
function onErr(e) { if (String(e && e.code).includes('permission')) { ON.state = 'rules'; refreshOnlinePanel(); updateOnlineBtn(); } }
async function ensureOwner() {
  const F = ON.fb.F;
  if (!S.pid || !S.code) { S.pid = S.pid || ON.fb.uid; S.code = S.code || genCode(); save(); }
  if (S.ownerUid !== ON.fb.uid) { try { await F.setDoc(F.doc(ON.fb.db, 'tt_owners', S.pid), { uid: ON.fb.uid, code: S.code }); S.ownerUid = ON.fb.uid; save(); } catch (e) { onErr(e); } }
}
function myBest() {
  let best = null; const consider = (sp, L, traits, legend) => { const W = weightOf(sp, L); if (!best || W > best.W) best = { sp, L: +L.toFixed(1), W: +W.toFixed(2), traits: traits.slice(0, 6), legend: legend || '' }; };
  for (const k in S.guide) consider(k, S.guide[k].bestL, []);
  if (S.bestCatch) best = S.bestCatch;
  return best;
}
function syncMe() {
  if (!ON.fb || !S.name || !S.pid) return; const F = ON.fb.F;
  const d = { name: S.name, level: Math.min(200, level()), catches: Math.min(1e6, S.catches), species: Object.keys(S.guide).length, legends: Object.keys(S.legends).length, updated: F.serverTimestamp() };
  const b = myBest(); if (b) d.best = b;
  F.setDoc(F.doc(ON.fb.db, 'tt_anglers', S.pid), d).catch(onErr);
}
function syncSoon() { clearTimeout(ON.syncT); ON.syncT = setTimeout(syncMe, 2500); }
function backupSoon() { clearTimeout(ON.bkT); ON.bkT = setTimeout(backup, 4000); }
function backup() {
  if (!ON.fb || !S.code || !S.pid) return; const F = ON.fb.F; const d = Object.assign({}, S); delete d.ownerUid;
  const data = JSON.stringify(d); if (data.length > 300000) return;
  F.setDoc(F.doc(ON.fb.db, 'tt_saves', S.code), { pid: S.pid, data, updated: F.serverTimestamp() }).catch(onErr);
}
function post(text, sp, traits) { if (!ON.fb || !S.name) return; const F = ON.fb.F; F.addDoc(F.collection(ON.fb.db, 'tt_feed'), { uid: ON.fb.uid, name: S.name, text: String(text).slice(0, 140), sp: sp || '', traits: (traits || []).slice(0, 6), at: F.serverTimestamp() }).catch(onErr); }
// called from catchIt()
function onlineCatch(x) {
  const W = weightOf(x.sp, x.L);
  if (!S.bestCatch || W > S.bestCatch.W) S.bestCatch = { sp: x.sp, L: +x.L.toFixed(1), W: +W.toFixed(2), traits: x.traits.slice(0, 6), legend: x.legend || '' };
  if (!ON.fb || !S.name) { syncSoon(); return; }
  const F = ON.fb.F, db = ON.fb.db, nm = fishName(x);
  const rec = ON.records[x.sp];
  if (!rec || W > rec.W) {
    F.setDoc(F.doc(db, 'tt_records', x.sp), { pid: S.pid, name: S.name, L: +x.L.toFixed(1), W: +W.toFixed(2), traits: x.traits.slice(0, 6), legend: x.legend || '', at: F.serverTimestamp() }).catch(onErr);
    if (rec && rec.pid !== S.pid) post(`${S.name} broke ${rec.name}'s ${SP[x.sp].name} record: ${lbs(W)}!`, x.sp, x.traits);
    else post(`${S.name} set the ${SP[x.sp].name} record: ${x.L.toFixed(1)} in, ${lbs(W)}.`, x.sp, x.traits);
    toast('New anglers board record!', 'var(--brass)');
  }
  if (x.legend && !ON.legends[x.legend]) {
    F.setDoc(F.doc(db, 'tt_legends', x.legend), { pid: S.pid, name: S.name, L: +x.L.toFixed(1), W: +W.toFixed(2), at: F.serverTimestamp() }).catch(onErr);
    post(`${S.name} caught ${nm}! First angler ever.`, x.sp, x.traits);
  } else if (x.legend) post(`${S.name} caught ${nm}!`, x.sp, x.traits);
  else if (x.traits.some(t => t !== 'spotted')) post(`${S.name} landed a ${x.traits.map(t => TRAITS[t].name).join(' ')} ${SP[x.sp].name}.`, x.sp, x.traits);
  syncSoon(); backupSoon();
}
async function restoreCode(raw) {
  const code = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 10) throw new Error('A save code is 10 letters and numbers, like ABCD-EFGH-JK.');
  if (!ON.fb) throw new Error('Can’t reach the server right now. Try again in a minute.');
  const F = ON.fb.F; let snap;
  try { snap = await F.getDoc(F.doc(ON.fb.db, 'tt_saves', code)); } catch (e) { throw new Error('Can’t reach the server right now.'); }
  if (!snap.exists()) throw new Error('No save matches that code. Check it and try again.');
  const { pid, data } = snap.data(); let d; try { d = JSON.parse(data); } catch (e) { throw new Error('That save is damaged.'); }
  await F.setDoc(F.doc(ON.fb.db, 'tt_owners', pid), { uid: ON.fb.uid, code });
  S = Object.assign(freshState(), d, { pid, code, ownerUid: ON.fb.uid }); save(); location.reload();
}

// ---------- UI ----------
let onTab = 'board', onlineOpen = false;
function updateOnlineBtn() { const b = $('onlinebtn'); if (!b) return; const n = ON.anglers.length; b.textContent = ON.state === 'online' ? `Anglers${n ? ' (' + n + ')' : ''}` : 'Anglers'; b.classList.toggle('dimmed', ON.state !== 'online'); }
function refreshOnlinePanel() { updateOnlineBtn(); if (onlineOpen && $('panel').classList.contains('open')) openOnline(true); }
const ago = ts => { if (!ts || !ts.toMillis) return 'just now'; const s = (Date.now() - ts.toMillis()) / 1000; return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + 'm ago' : s < 86400 ? Math.floor(s / 3600) + 'h ago' : Math.floor(s / 86400) + 'd ago'; };
function openOnline(keep) {
  onlineOpen = true; const sc = keep ? $('panel').scrollTop : 0;
  const tabs = [['board', 'Anglers'], ['records', 'Species records'], ['legends', 'Legend wall'], ['news', 'News'], ['me', 'My card']];
  let h = head('Anglers board', ON.state === 'online' ? `${ON.anglers.length} anglers fishing Tank & Tackle` : ON.state === 'connecting' ? 'Connecting…' : ON.state === 'rules' ? 'The server isn’t set up for Tank & Tackle yet.' : 'Offline. The board needs the GitHub Pages version and an internet connection.');
  if (!S.name && ON.state === 'online') onTab = 'me';
  h += `<div class="tabs">${tabs.map(([k, n]) => `<button class="tab ${onTab === k ? 'on' : ''}" data-act="otab" data-id="${k}">${n}</button>`).join('')}</div>`;
  if (onTab === 'board') {
    const L = ON.anglers.slice().sort((a, b) => (b.level - a.level) || (b.catches - a.catches));
    h += L.length ? `<div class="flist">${L.map((a, i) => `<div class="frow ${a.id === S.pid ? 'on' : ''}"><b class="rank">${i + 1}</b>${a.best && SP[a.best.sp] ? `<img src="${fishThumb(a.best.sp, a.best.traits || [])}" alt="">` : '<span style="width:64px"></span>'}<span><b>${esc(a.name)}</b><small>Level ${a.level} · ${a.catches} catches · ${a.species} species${a.legends ? ' · ' + a.legends + ' legend' + (a.legends > 1 ? 's' : '') : ''}${a.best && SP[a.best.sp] ? ' · best: ' + esc(a.best.legend ? LEGENDS[a.best.legend].name : SP[a.best.sp].name) + ' ' + lbs(a.best.W) : ''}</small></span></div>`).join('')}</div>` : '<p class="dim">Nobody on the board yet.</p>';
  }
  if (onTab === 'records') h += '<div class="grid">' + SPECIES.filter(s => !s.legendOnly).map(s => { const r = ON.records[s.id]; return `<button class="card fishcard ${r ? '' : 'locked'}" data-act="info" data-sp="${s.id}"><img src="${fishThumb(s.id, r ? r.traits || [] : [])}" alt=""><span class="nm">${s.name}</span><span class="dim">${r ? `<b class="price">${lbs(r.W)}</b> · ${r.L} in · ${esc(r.name)}${r.pid === S.pid ? ' (you)' : ''}` : 'No record yet. Be first.'}</span></button>`; }).join('') + '</div>';
  if (onTab === 'legends') h += '<div class="grid">' + SPOT_ORDER.map(id => { const Lg = LEGENDS[id], r = ON.legends[id]; return `<div class="card ${r ? '' : 'locked'}">${r ? `<img src="${fishThumb(Lg.sp, Lg.traits)}" alt="">` : ''}<div class="nm">${r || S.pages[id] ? Lg.name : '???'}</div><div class="dim">${SPOTS[id].name}</div><div class="dim">${r ? `First caught by <b>${esc(r.name)}</b> · ${lbs(r.W)} · ${ago(r.at)}` : 'Nobody has caught it yet.'}</div></div>`; }).join('') + '</div>';
  if (onTab === 'news') h += ON.feed.length ? ON.feed.map(n => `<div class="frow">${n.sp && SP[n.sp] ? `<img src="${fishThumb(n.sp, n.traits || [])}" alt="">` : ''}<span>${esc(n.text)}<small>${ago(n.at)}</small></span></div>`).join('') : '<p class="dim">No news yet. Records, legends and rare catches show up here.</p>';
  if (onTab === 'me') {
    h += `<div class="care"><div class="lbl"><b>Angler name</b></div><p class="dim">Shown to everyone on the board. 2–20 letters or numbers.</p><div class="row"><input id="nameIn" maxlength="20" value="${esc(S.name || '')}" placeholder="Your name" aria-label="Angler name"><button class="small" data-act="setname">${S.name ? 'Change' : 'Join the board'}</button></div></div>`;
    h += `<div class="care"><div class="lbl"><b>Cloud save code</b></div>${S.code && ON.state === 'online' ? `<p>Your code: <b class="price big">${fmtCode(S.code)}</b></p><p class="dim">Write it down. Enter it on another device to bring this game there. Keep it private: anyone with it can load your game.</p>` : '<p class="dim">Available once you’re online.</p>'}<div class="row"><input id="codeIn" maxlength="14" placeholder="ABCD-EFGH-JK" aria-label="Save code"><button class="small ghost" data-act="restore">Load a save</button></div><p class="dim" id="restoreMsg"></p></div>`;
  }
  openPanel(h, true); onlineOpen = true; $('panel').scrollTop = sc;
}
function onlineClick(a, b) {
  if (a === 'otab') { onTab = b.dataset.id; openOnline(); return true; }
  if (a === 'open-online') { openOnline(); return true; }
  if (a === 'setname') { const n = $('nameIn').value.trim(); if (!validName(n)) { toast('Use 2–20 letters, numbers, spaces, dots or dashes.', 'var(--bad)'); return true; } const first = !S.name; S.name = n; save(); syncMe(); backupSoon(); if (first) post(`${n} joined Tank & Tackle. Tight lines!`); toast(first ? 'You’re on the board!' : 'Name changed.'); onTab = 'board'; openOnline(); return true; }
  if (a === 'restore') { const m = $('restoreMsg'); m.textContent = 'Loading…'; restoreCode($('codeIn').value).catch(e => { m.textContent = e.message; }); return true; }
  return false;
}
