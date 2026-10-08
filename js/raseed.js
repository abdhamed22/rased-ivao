/* رصد — in-browser engine: FSD log -> branded 1080x1920 60fps video (WebCodecs).  No server. */
(function (global) {
'use strict';
const W = 1080, H = 1920, MX = 540, MY = 1020, RAD = 490, SQH = 420, R0 = 520, R1 = 1520, RH = R1 - R0;
const MONTHS = ['كانون الثاني','شباط','آذار','نيسان','أيار','حزيران','تموز','آب','أيلول','تشرين الأول','تشرين الثاني','كانون الأول'];
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const merc = la => Math.log(Math.tan(Math.PI / 4 + la * Math.PI / 360)) * 180 / Math.PI;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

// ---------- theme
const DEFAULT_THEME = { bg0: '#0f4c81', bg1: '#0a2f55', bg2: '#071a2e', accent: '#f2c97a', clock: '#ffd27a', text: '#ffffff', planeDep: '#ffd046', planeArr: '#96e5ff', mapFill: '#78b9ff', mapFillA: 0.15, outline: '#bee1ff', glow: '#ff9f3a', net: '#8ccdff', ring: '#ffffff', badgeText: '#101826',
  font: 'Cairo', bgStyle: 'linear', sweep: false, outlineStyle: 'glow', fillStyle: 'solid', shape: 'circle', grid: false, rings: true, planeStyle: 'jet', planeSize: 1, trailLen: 1, netAmt: 1, labelSize: 1, showBadge: true, showClock: true, showProgress: true, showCounters: true, showLabels: true, titleWeight: 900 };
const THEMES = {
  raseed: { name: 'الرصد (أزرق وذهبي)' },
  night: { name: 'ليلي سماوي', bg0: '#0b1220', bg1: '#0e1a2f', bg2: '#05080f', accent: '#5ad1ff', clock: '#8fe3ff', text: '#e8f1ff', planeDep: '#5ad1ff', planeArr: '#ff9f5a', mapFill: '#5a8cff', outline: '#9ec5ff', glow: '#3a7bff', net: '#6aa8ff', badgeText: '#04121f' },
  sunset: { name: 'غروب', bg0: '#3a1c71', bg1: '#6a2c70', bg2: '#1a0b2e', accent: '#ffb26b', clock: '#ffcf9a', text: '#fff6ee', planeDep: '#ffb26b', planeArr: '#ff7aa8', mapFill: '#ff9ad0', outline: '#ffd1e8', glow: '#ff5fa0', net: '#ffb8d9', badgeText: '#2a0b1f' },
  radar: { name: 'رادار أخضر', bg0: '#04170f', bg1: '#06261a', bg2: '#020c08', accent: '#7dff9b', clock: '#9dffb4', text: '#d8ffe4', planeDep: '#7dff9b', planeArr: '#ffe27a', mapFill: '#2cff7a', mapFillA: 0.08, outline: '#8dffb1', glow: '#2cff7a', net: '#5dffa0', ring: '#7dff9b', badgeText: '#02140b', fillStyle: 'hatch', grid: true, sweep: true, planeStyle: 'blip' },
  mono: { name: 'رمادي أحادي', bg0: '#2a2a2e', bg1: '#1b1b1f', bg2: '#0c0c0e', accent: '#f2f2f2', clock: '#ffffff', text: '#ffffff', planeDep: '#ffffff', planeArr: '#9aa0a6', mapFill: '#ffffff', mapFillA: 0.06, outline: '#d0d0d0', glow: '#ffffff', net: '#cccccc', badgeText: '#111111' },
  light: { name: 'فاتح', bg0: '#f4f7fb', bg1: '#e3ecf6', bg2: '#cfdcec', accent: '#0f4c81', clock: '#0f4c81', text: '#0b2540', planeDep: '#d9480f', planeArr: '#0b6bcb', mapFill: '#0f4c81', mapFillA: 0.10, outline: '#0f4c81', glow: '#5aa0e0', net: '#2a6fb5', ring: '#0b2540', badgeText: '#ffffff' },
};
for (const k in THEMES) THEMES[k] = Object.assign({}, DEFAULT_THEME, THEMES[k]);
const hex2rgb = h => { h = String(h || '#000').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const rgba = (h, a) => { const c = hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const isLight = T => { const c = hex2rgb(T.bg1); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.55; };
let FONT = 'Cairo';
const fontStack = () => `"${FONT}", Cairo, sans-serif`;
const themeOf = cfg => Object.assign({}, DEFAULT_THEME, cfg.theme || {});


// ---------- numeric helpers
function gauss1d(a, sigma) {
  const n = a.length, r = Math.ceil(4 * sigma), k = new Float64Array(2 * r + 1); let s = 0;
  for (let i = 0; i <= 2 * r; i++) { k[i] = Math.exp(-0.5 * ((i - r) / sigma) ** 2); s += k[i]; }
  for (let i = 0; i <= 2 * r; i++) k[i] /= s;
  const out = new Float64Array(n);
  for (let i = 0; i < n; i++) { let acc = 0; for (let j = -r; j <= r; j++) { const idx = i + j < 0 ? 0 : i + j >= n ? n - 1 : i + j; acc += a[idx] * k[j + r]; } out[i] = acc; }
  return out;
}
function unwrap(a) {
  const o = new Float64Array(a.length); if (!a.length) return o; o[0] = a[0]; let off = 0;
  for (let i = 1; i < a.length; i++) { let d = a[i] - a[i - 1]; if (d > Math.PI) off -= 2 * Math.PI * Math.ceil((d - Math.PI) / (2 * Math.PI)); else if (d < -Math.PI) off += 2 * Math.PI * Math.ceil((-d - Math.PI) / (2 * Math.PI)); o[i] = a[i] + off; }
  return o;
}
function interpArr(grid, xp, fp) { // np.interp
  const out = new Float64Array(grid.length); let j = 0; const n = xp.length;
  for (let i = 0; i < grid.length; i++) {
    const x = grid[i]; if (x <= xp[0]) { out[i] = fp[0]; continue; } if (x >= xp[n - 1]) { out[i] = fp[n - 1]; continue; }
    while (j < n - 2 && xp[j + 1] < x) j++; const f = (x - xp[j]) / (xp[j + 1] - xp[j] || 1); out[i] = fp[j] + (fp[j + 1] - fp[j]) * f;
  }
  return out;
}
const percentile = (arr, p) => { const a = Array.from(arr).sort((x, y) => x - y), k = (a.length - 1) * p / 100, f = Math.floor(k), c = Math.min(a.length - 1, f + 1); return a[f] + (a[c] - a[f]) * (k - f); };
const median = arr => percentile(arr, 50);

// ---------- log parsing
async function parseLog(file, onProg) {
  const pos = new Map(); let rest = ''; const CH = 8 << 20;
  const bom = new Uint8Array(await file.slice(0, 4).arrayBuffer()), enc = bom[0] === 0xFF && bom[1] === 0xFE ? 'utf-16le' : bom[0] === 0xFE && bom[1] === 0xFF ? 'utf-16be' : 'utf-8', dec = new TextDecoder(enc);
  const handle = l => {
    if (l.length < 30 || l.charCodeAt(14) !== 59 || l.charCodeAt(15) !== 64) return;
    const p = l.slice(18).split(':'); if (p.length < 9) return;
    const lat = +p[3], lon = +p[4], alt = +p[5], gs = +p[6]; if (!(lat === lat && lon === lon) || (Math.abs(lat) < 1 && Math.abs(lon) < 1)) return;
    const t = Date.UTC(+l.substr(4, 4), +l.substr(2, 2) - 1, +l.substr(0, 2), +l.substr(8, 2), +l.substr(10, 2), +l.substr(12, 2)) / 1000; if (t !== t) return;
    let e = pos.get(p[0]); if (!e) pos.set(p[0], e = []); e.push([t, lat, lon, alt, gs]);
  };
  for (let off = 0; off < file.size; off += CH) {
    const buf = await file.slice(off, off + CH).arrayBuffer(); const lines = (rest + dec.decode(buf, { stream: true })).split('\n'); rest = lines.pop();
    for (const l of lines) handle(l.charCodeAt(0) === 0xFEFF ? l.slice(1) : l); if (onProg) onProg(Math.min(1, (off + CH) / file.size)); await new Promise(r => setTimeout(r));
  }
  handle(rest);
  if (!pos.size) throw new Error('ما لقيت مواقع طيارين بالملف. تأكد إنه ملف التسجيل من Aurora (.rec) من مجلد C:\\Aurora\\Replay');
  const out = new Map(); let tmin = Infinity, tmax = -Infinity;
  for (const [cs, rows] of pos) { rows.sort((a, b) => a[0] - b[0]); const u = []; for (const r of rows) if (!u.length || r[0] > u[u.length - 1][0]) u.push(r); out.set(cs, u); tmin = Math.min(tmin, u[0][0]); tmax = Math.max(tmax, u[u.length - 1][0]); }
  return { pos: out, tmin, tmax };
}

// ---------- projection
function countryPolys(sel) {
  const out = [];
  for (const c of sel) {
    const rings = c.polys.map(p => p[0]); const areas = rings.map(r => { let s = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s / 2); });
    let big = 0; areas.forEach((a, i) => { if (a > areas[big]) big = i; });
    const cen = r => { let x = 0, y = 0; r.forEach(p => { x += p[0]; y += p[1]; }); return [x / r.length, y / r.length]; }; const cb = cen(rings[big]);
    rings.forEach((r, i) => { const m = cen(r); if (areas[i] >= 0.01 * areas[big] && Math.hypot(m[0] - cb[0], m[1] - cb[1]) < 25) out.push(r); });
  }
  return out;
}
class Proj {
  constructor(cfg) {
    const m = cfg.map; this.mode = m.mode;
    if (this.mode === 'airport') { this.lat0 = +m.lat; this.lon0 = +m.lon; this.radius = +m.radius_nm; this.PXN = RAD / this.radius; this.cl = Math.cos(this.lat0 * Math.PI / 180); }
    else {
      const want = m.countries.map(s => s.toLowerCase()); const sel = global.RASEED_COUNTRIES.filter(c => want.includes(c.name.toLowerCase()) || want.includes(c.name_ar.toLowerCase()) || want.includes(c.iso.toLowerCase()));
      if (!sel.length) throw new Error('اختر دولة وحدة على الأقل');
      this.rings = countryPolys(sel); let lo0 = 1e9, lo1 = -1e9, la0 = 1e9, la1 = -1e9;
      this.rings.forEach(r => r.forEach(p => { lo0 = Math.min(lo0, p[0]); lo1 = Math.max(lo1, p[0]); la0 = Math.min(la0, p[1]); la1 = Math.max(la1, p[1]); }));
      this.PXD = Math.min(940 / (lo1 - lo0), 900 / (merc(la1) - merc(la0))); this.LON0 = (lo0 + lo1) / 2; this.MERC0 = (merc(la0) + merc(la1)) / 2;
    }
  }
  px(lat, lon) { return this.mode === 'airport' ? [MX + (lon - this.lon0) * 60 * this.cl * this.PXN, MY - (lat - this.lat0) * 60 * this.PXN] : [MX + (lon - this.LON0) * this.PXD, MY - (merc(lat) - this.MERC0) * this.PXD]; }
  nm(lat, lon) { return [(lon - this.lon0) * 60 * this.cl, (lat - this.lat0) * 60]; }
  pxnm(x, y) { return [MX + x * this.PXN, MY - y * this.PXN]; }
}

// ---------- runway detection
function detectRunways(cfg, proj, pos) {
  const m = cfg.map;
  if (m.runways && m.runways.length) return { rws: m.runways.map(r => { const a = proj.nm(r.lat1, r.lon1), b = proj.nm(r.lat2, r.lon2); const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const D = [(b[0] - a[0]) / L, (b[1] - a[1]) / L]; return { c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L, D, name: r.name || '', appr: a }; }), elev: null };
  const gl = [];
  for (const rows of pos.values()) for (const r of rows) { const x = (r[2] - proj.lon0) * 60 * proj.cl, y = (r[1] - proj.lat0) * 60; if (Math.hypot(x, y) < 3 && r[4] < 5) gl.push(r[3]); }
  if (gl.length < 5) return { rws: [], elev: null };
  const elev = median(gl); const P = [];
  for (const rows of pos.values()) {
    const n = rows.length, xy = rows.map(r => [(r[2] - proj.lon0) * 60 * proj.cl, (r[1] - proj.lat0) * 60]);
    const ok = rows.map((r, i) => Math.hypot(xy[i][0], xy[i][1]) < 3.5 && r[3] <= elev + 150 && r[4] >= 40);
    for (let i = 0; i < n - 1; i++) if (ok[i] && ok[i + 1] && rows[i + 1][0] - rows[i][0] <= 10 && Math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1]) > 0.02) P.push([xy[i][0], xy[i][1], Math.atan2(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1])]);
  }
  if (P.length < 12) return { rws: [], elev };
  let s2 = 0, c2 = 0; P.forEach(p => { s2 += Math.sin(2 * p[2]); c2 += Math.cos(2 * p[2]); }); const ang2 = Math.atan2(s2, c2) / 2; const ax = [Math.sin(ang2), Math.cos(ang2)];
  let pos_ = 0, neg_ = 0; P.forEach(p => { const sg = Math.sin(p[2]) * ax[0] + Math.cos(p[2]) * ax[1]; if (sg > 0) pos_++; else if (sg < 0) neg_++; });
  const D = pos_ >= neg_ ? ax : [-ax[0], -ax[1]], pr = [D[1], -D[0]];
  const al = P.map(p => p[0] * D[0] + p[1] * D[1]), pe = P.map(p => p[0] * pr[0] + p[1] * pr[1]);
  const order = pe.map((_, i) => i).sort((a, b) => pe[a] - pe[b]); const groups = []; let cur = [order[0]];
  for (let i = 1; i < order.length; i++) { if (pe[order[i]] - pe[order[i - 1]] > 0.22) { groups.push(cur); cur = []; } cur.push(order[i]); } groups.push(cur);
  const rws = [];
  for (const g of groups) { if (g.length < 8) continue; const a0 = percentile(g.map(i => al[i]), 2), a1 = percentile(g.map(i => al[i]), 98), pc = median(g.map(i => pe[i])); const L = Math.max(a1 - a0 + 0.25, 1.0), ac = (a0 + a1) / 2; const c = [D[0] * ac + pr[0] * pc, D[1] * ac + pr[1] * pc]; rws.push({ c, L, D, pe: pc, appr: [c[0] - D[0] * L / 2, c[1] - D[1] * L / 2] }); }
  rws.sort((a, b) => a.pe - b.pe);
  const hdg = (Math.atan2(D[0], D[1]) * 180 / Math.PI + 360) % 360; const num = (Math.round(hdg / 10) % 36) || 36; const n = rws.length;
  rws.forEach((r, i) => { const suf = n === 1 ? '' : n === 2 ? (i === 0 ? 'L' : 'R') : (i === 0 ? 'L' : i === n - 1 ? 'R' : 'C'); r.name = String(num).padStart(2, '0') + suf; });
  return { rws, elev };
}

// ---------- tracks
function buildTracks(cfg, proj, pos, U0, U1, inside, elev) {
  const airport = proj.mode === 'airport', tracks = [], parked = [], events = [];
  const unit = airport ? proj.PXN : proj.PXD / 60;
  for (const [cs, all] of pos) {
    const r = all.filter(a => a[0] >= U0 - 1 && a[0] <= U1 + 1); if (r.length < 4) continue;
    const P = r.map(a => proj.px(a[1], a[2])); const ok = r.map((a, i) => {
      if (airport) { const q = proj.nm(a[1], a[2]); return Math.hypot(q[0], q[1]) < proj.radius * 1.45 + 1 && a[3] < 15000; } return a[4] >= 45; });
    const segs = []; let cur = [];
    for (let i = 0; i < r.length; i++) {
      if (!ok[i]) { if (cur.length) { segs.push(cur); cur = []; } continue; }
      if (cur.length) { const j = cur[cur.length - 1], dt = r[i][0] - r[j][0], jump = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]) / unit; if (dt > 60 || jump > (airport ? 1.0 + dt * 0.15 : Math.max(8, dt * 0.3))) { segs.push(cur); cur = []; } }
      cur.push(i);
    }
    if (cur.length) segs.push(cur);
    for (const s of segs) {
      if (s.length < (airport ? 5 : 8)) continue;
      const q = s.map(i => r[i]), z = s.map(i => P[i]);
      if (!airport) { let hit = false; for (let k = 0; k < z.length; k += 2) { const x = clamp(Math.round(z[k][0]), 0, W - 1), y = clamp(Math.round(z[k][1]), 0, H - 1); if (y >= R0 && y < R1 && inside[(y - R0) * W + x] > 127) { hit = true; break; } } if (!hit) continue; }
      const t0 = q[0][0], t1 = q[q.length - 1][0], n = Math.floor((t1 - t0) / 5 + 1e-6) + 1; const grid = new Float64Array(n); for (let i = 0; i < n; i++) grid[i] = t0 + i * 5;
      const qt = q.map(a => a[0]); const X = interpArr(grid, qt, z.map(p => p[0])), Y = interpArr(grid, qt, z.map(p => p[1])), alt = interpArr(grid, qt, q.map(a => a[3]));
      const range = a => { let lo = 1e18, hi = -1e18; a.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); }); return [lo, hi]; };
      if (airport) { const ex = Math.hypot(range(X)[1] - range(X)[0], range(Y)[1] - range(Y)[0]) / proj.PXN; if (ex < 0.12 && elev !== null && range(alt)[1] < elev + 140) { parked.push({ t0: t0 - U0, t1: t1 - U0, X: median(X), Y: median(Y) }); continue; } }
      if (n < 6) continue;
      const xs = gauss1d(X, 2), ys = gauss1d(Y, 2), w = airport ? 6 : 5, thr = airport ? 0.11 * proj.PXN : 0;
      let hd = new Float64Array(n).fill(NaN);
      for (let i = 0; i < n; i++) { const i0 = Math.max(0, i - w), i1 = Math.min(n - 1, i + w), dx = xs[i1] - xs[i0], dy = ys[i1] - ys[i0]; if (Math.hypot(dx, dy) > thr) hd[i] = Math.atan2(dy, dx); }
      const idx = []; for (let i = 0; i < n; i++) if (hd[i] === hd[i]) idx.push(i);
      if (!idx.length) hd.fill(0); else { const uw = unwrap(Float64Array.from(idx.map(i => hd[i]))); hd = interpArr(Float64Array.from({ length: n }, (_, i) => i), Float64Array.from(idx), uw); }
      hd = gauss1d(hd, 2);
      const gx = gauss1d(xs, 2), gy = gauss1d(ys, 2), grad = a => a.map((_, i) => i === 0 ? a[1] - a[0] : i === n - 1 ? a[n - 1] - a[n - 2] : (a[i + 1] - a[i - 1]) / 2);
      const ggx = grad(Array.from(gx)), ggy = grad(Array.from(gy)); const spd = new Float64Array(n); for (let i = 0; i < n; i++) spd[i] = Math.hypot(ggx[i], ggy[i]) / 5 / (airport ? proj.PXN : 1);
      let cat = 'oth';
      if (airport && elev !== null && n >= 8) {
        const gnd = Array.from(alt, v => v < elev + 150), anyAir = gnd.some(v => !v);
        if (gnd[0] && anyAir && (gnd[0] || gnd[1] || gnd[2])) { cat = 'dep'; events.push([grid[gnd.indexOf(false)] - U0, 'dep', cs]); }
        else if (gnd[n - 1] && anyAir) { cat = 'arr'; let k = n - 1; while (k >= 0 && gnd[k]) k--; events.push([grid[Math.min(k + 1, n - 1)] - U0, 'arr', cs]); }
      }
      tracks.push({ cs, t0: t0 - U0, n, X: xs, Y: ys, hd, alt, spd, cat, T0: t0 - U0, T1: t0 - U0 + (n - 1) * 5 });
    }
  }
  events.sort((a, b) => a[0] - b[0]);
  return { tracks, parked, events };
}

// ---------- text / static layers
function fitFont(ctx, text, size, weight, maxW) { ctx.font = `${weight} ${size}px ${fontStack()}`; const w = ctx.measureText(text).width; return w > maxW ? Math.max(16, Math.floor(size * maxW / w)) : size; }
function txt(ctx, s, x, y, o) {
  const size = o.size; ctx.font = `${o.weight || 400} ${size}px ${fontStack()}`; ctx.direction = o.dir || 'rtl'; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base ? 'alphabetic' : 'middle'; if (!o.base) y += size * 0.13;
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = o.strokeCol || 'rgba(4,18,36,.75)'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = o.color || '#fff'; ctx.fillText(s, x, y);
}
const niceStep = x => { for (const s of [1, 2, 5, 10, 20, 50, 100, 200]) if (x / s <= 3.5) return s; return 500; };
function fmtSpeed(sim, dur) { const v = sim / dur; if (v < 90) return Math.round(v) + ' ثانية'; const m = v / 60; if (m < 1.5) return 'دقيقة'; if (m < 2.5) return 'دقيقتين'; if (m <= 10.5) return Math.round(m) + ' دقائق'; return Math.round(m) + ' دقيقة'; }

const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return '#' + [0, 1, 2].map(i => Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0')).join(''); };

function winPath(ctx, proj, T) { // map window path in absolute coords
  ctx.beginPath();
  if (proj.mode === 'airport') { if (T.shape === 'square') ctx.roundRect(MX - SQH, MY - SQH, 2 * SQH, 2 * SQH, 60); else ctx.arc(MX, MY, RAD, 0, 7); }
  else proj.rings.forEach(r => { r.forEach((p, i) => { const q = proj.px(p[1], p[0]); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); });
}
function makeMask(proj, T) { // alpha canvas RHxW + Uint8 array
  const c = mk(W, RH), x = c.getContext('2d');
  if (proj.mode === 'airport') {
    const sq = T && T.shape === 'square', cr = 60, img = x.createImageData(W, RH), d = img.data;
    for (let y = 0; y < RH; y++) for (let xx = 0; xx < W; xx++) {
      let dd; if (sq) { const qx = Math.abs(xx - MX) - (SQH - cr), qy = Math.abs(y + R0 - MY) - (SQH - cr); dd = -(Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - cr); } else dd = RAD - Math.hypot(xx - MX, y + R0 - MY);
      let v = clamp((dd - 6) / 46, 0, 1); v = v * v * (3 - 2 * v); const i = (y * W + xx) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(v * 255);
    }
    x.putImageData(img, 0, 0);
  } else { x.translate(0, -R0); x.fillStyle = '#fff'; winPath(x, proj, T || DEFAULT_THEME); x.fill(); }
  const a = new Uint8Array(W * RH), id = c.getContext('2d').getImageData(0, 0, W, RH).data; for (let i = 0; i < a.length; i++) a[i] = id[i * 4 + 3];
  return { canvas: c, alpha: a };
}

function ringStep(proj) { return proj.radius >= 6 ? niceStep(proj.radius / 2.5) : Math.max(0.5, Math.round(proj.radius / 3 * 10) / 10); }

function buildStatic(cfg, proj, rws, sim, dur, U0, U1, mask, T) {
  const A = mk(W, H), a = A.getContext('2d'), tz = cfg.tz, LS = T.labelSize, airport = proj.mode === 'airport', tw = T.titleWeight;
  const tcol = al => rgba(T.text, al), halo = rgba(T.bg2, .72);
  // background
  if (T.bgStyle === 'flat') a.fillStyle = T.bg1;
  else if (T.bgStyle === 'radial') { const g = a.createRadialGradient(MX, 900, 0, MX, 900, 1300); g.addColorStop(0, T.bg0); g.addColorStop(.5, T.bg1); g.addColorStop(1, T.bg2); a.fillStyle = g; }
  else { const g = a.createLinearGradient(0, 0, 0, H); g.addColorStop(0, T.bg0); g.addColorStop(.45, T.bg1); g.addColorStop(1, T.bg2); a.fillStyle = g; }
  a.fillRect(0, 0, W, H);
  // map fill
  if (T.fillStyle !== 'none') {
    winPath(a, proj, T);
    if (T.fillStyle === 'hatch') {
      const hp = mk(16, 16), hx = hp.getContext('2d'); hx.strokeStyle = rgba(T.mapFill, Math.min(.6, T.mapFillA * 3.2)); hx.lineWidth = 2;
      hx.beginPath(); [[0, 16, 16, 0], [-4, 4, 4, -4], [12, 20, 20, 12]].forEach(s => { hx.moveTo(s[0], s[1]); hx.lineTo(s[2], s[3]); }); hx.stroke();
      a.fillStyle = rgba(T.mapFill, T.mapFillA * .5); a.fill(); a.fillStyle = a.createPattern(hp, 'repeat'); a.fill();
    } else if (T.fillStyle === 'gradient') {
      const gg = a.createLinearGradient(0, R0, 0, R1); gg.addColorStop(0, rgba(T.mapFill, Math.min(1, T.mapFillA * 2.4))); gg.addColorStop(1, rgba(T.mapFill, T.mapFillA * .25)); a.fillStyle = gg; a.fill();
    } else { a.fillStyle = rgba(T.mapFill, T.mapFillA); a.fill(); }
  }
  // header
  if (cfg.handle) txt(a, cfg.handle, 990, 155, { size: 42, weight: 400, dir: 'ltr', align: 'right', color: T.text });
  if (T.showBadge) {
    const badge = cfg.badge || 'الطيران الافتراضي';
    a.fillStyle = T.accent; a.beginPath(); a.roundRect(90, 96, 400, 102, 51); a.fill(); txt(a, badge, 290, 147, { size: fitFont(a, badge, 44, 800, 350), weight: 800, color: T.badgeText });
  }
  const ts = fitFont(a, cfg.title, 72, tw, 940); txt(a, cfg.title, 540, 273, { size: ts, weight: tw, color: T.text });
  const d = new Date((U0 + tz * 3600) * 1000), dateTxt = cfg.date && cfg.date !== 'auto' ? cfg.date : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  txt(a, `${dateTxt} ▪ كل ثانية ≈ ${fmtSpeed(sim, dur)}`, 540, 346, { size: 36, weight: 300, color: tcol(.72) });
  if (T.showClock) txt(a, `بتوقيت ${cfg.tz_name || 'بغداد'}`, 540, 503, { size: 28, weight: 300, color: tcol(.55) });
  if (airport && T.showCounters) { txt(a, 'إقلاع', 70, 560, { size: 34, weight: 700, color: T.planeDep, align: 'left' }); txt(a, 'هبوط', 1010, 560, { size: 34, weight: 700, color: T.planeArr, align: 'right' }); }
  if (T.showProgress) {
    a.fillStyle = tcol(.14); a.beginPath(); a.roundRect(90, 1536, 900, 12, 6); a.fill();
    const spanH = (U1 - U0) / 3600, step = [1, 2, 3, 6, 12].find(s => spanH / s <= 5) || 24;
    for (let h = Math.ceil((U0 + tz * 3600) / 3600 / step) * step; h * 3600 - tz * 3600 <= U1; h += step) { const u = h * 3600 - tz * 3600; txt(a, String(((h % 24) + 24) % 24).padStart(2, '0') + ':00', 90 + 900 * (u - U0) / (U1 - U0), 1588, { size: 28, weight: 400, color: tcol(.65), dir: 'ltr' }); }
  }
  const cs = fitFont(a, cfg.caption || '', 36, 700, 940); if (cfg.caption) txt(a, cfg.caption, 540, 1672, { size: cs, weight: 700, color: T.text });
  if (cfg.note) { const ns = fitFont(a, cfg.note, 28, 300, 940); txt(a, cfg.note, 540, 1718, { size: ns, weight: 300, color: tcol(.6) }); }
  txt(a, 'المصدر: ' + (cfg.source || 'IVAO'), 540, 1802, { size: 32, weight: 400, color: tcol(.6) });

  // L layer (grid, rings, centrelines, labels, cities)
  const L = mk(W, RH), l = L.getContext('2d'); l.translate(0, -R0);
  const rstep = airport ? ringStep(proj) : 0, rings = []; if (airport) for (let k = 1; k < 20; k++) if (rstep * k < proj.radius * 0.92) rings.push(rstep * k);
  if (T.grid) {
    l.save(); l.lineWidth = 1.5; l.strokeStyle = rgba(T.ring, .10);
    if (airport) {
      winPath(l, proj, T); l.clip(); const gs = rstep * proj.PXN;
      for (let k = -24; k <= 24; k++) { const o = k * gs; if (Math.abs(o) > RAD + 2) continue; l.strokeStyle = rgba(T.ring, k === 0 ? .22 : .10); l.beginPath(); l.moveTo(MX + o, MY - RAD); l.lineTo(MX + o, MY + RAD); l.moveTo(MX - RAD, MY + o); l.lineTo(MX + RAD, MY + o); l.stroke(); }
    } else {
      const spanLon = 1080 / proj.PXD, step = [0.5, 1, 2, 5, 10, 15, 30].find(s => spanLon / s <= 9) || 30;
      for (let lo = Math.floor((proj.LON0 - 540 / proj.PXD) / step) * step; lo <= proj.LON0 + 540 / proj.PXD + step; lo += step) { const x = proj.px(0, lo)[0]; l.beginPath(); l.moveTo(x, R0); l.lineTo(x, R1); l.stroke(); }
      for (let la = -80; la <= 80; la += step) { const y = proj.px(la, proj.LON0)[1]; if (y < R0 || y > R1) continue; l.beginPath(); l.moveTo(0, y); l.lineTo(W, y); l.stroke(); }
    }
    l.restore();
  }
  if (airport) {
    if (T.rings) {
      l.save(); winPath(l, proj, T); l.clip();
      l.strokeStyle = rgba(T.ring, .26); l.lineWidth = 2; l.setLineDash([7, 11]); rings.forEach(rn => { l.beginPath(); l.arc(MX, MY, rn * proj.PXN, 0, 7); l.stroke(); }); l.restore(); l.setLineDash([]);
      rings.forEach(rn => txt(l, (Math.round(rn * 100) / 100) + ' nm', MX, MY - rn * proj.PXN - 9, { size: Math.round(26 * LS), weight: 400, color: rgba(T.ring, .62), dir: 'ltr', base: 1 }));
    }
    l.save(); winPath(l, proj, T); l.clip(); l.strokeStyle = rgba(T.outline, .34); l.lineWidth = 1.6; l.setLineDash([3, 9]);
    rws.forEach(r => { const a0 = proj.pxnm(r.c[0] - r.D[0] * proj.radius * 1.5, r.c[1] - r.D[1] * proj.radius * 1.5), b0 = proj.pxnm(r.c[0] + r.D[0] * proj.radius * 1.5, r.c[1] + r.D[1] * proj.radius * 1.5); l.beginPath(); l.moveTo(...a0); l.lineTo(...b0); l.stroke(); });
    l.restore(); l.setLineDash([]);
    if (T.showLabels) {
      rws.forEach(r => { if (!r.name) return; const p = proj.pxnm(r.appr[0], r.appr[1]), left = r.name.endsWith('L'); txt(l, r.name, p[0] + (left ? -16 : 16), p[1] + 28, { size: Math.round(28 * LS), weight: 700, stroke: true, strokeCol: halo, align: left ? 'right' : 'left', dir: 'ltr', base: 1, color: T.text }); });
      if (cfg.map.label) { const cc = rws.length ? [rws.reduce((s, r) => s + r.c[0], 0) / rws.length, rws.reduce((s, r) => s + r.c[1], 0) / rws.length] : [0, 0]; const p = proj.pxnm(cc[0], cc[1]); txt(l, cfg.map.label, p[0] - 150, p[1] - 100, { size: Math.round(30 * LS), weight: 700, stroke: true, strokeCol: halo, align: 'right', base: 1, color: T.text }); }
    }
  }
  if (T.showLabels) (cfg.map.labels || []).forEach(lb => {
    const p = proj.px(lb.lat, lb.lon); if (airport && Math.hypot(p[0] - MX, p[1] - MY) > RAD - 20) return; const left = (lb.side || (airport ? 'w' : 'e')) === 'w';
    l.fillStyle = T.text; l.strokeStyle = halo; l.lineWidth = 2; l.beginPath(); l.arc(p[0], p[1], 7 * Math.sqrt(LS), 0, 7); l.fill(); l.stroke();
    txt(l, lb.name, p[0] + (left ? -14 : 14), p[1] + 12, { size: Math.round(36 * LS), weight: 700, stroke: true, strokeCol: halo, align: left ? 'right' : 'left', base: 1, color: T.text });
  });
  // R layer (runways), masked
  const R = mk(W, RH), rr = R.getContext('2d'); rr.translate(0, -R0);
  if (airport) {
    const rw = Math.max(7, Math.min(14, 0.07 * proj.PXN)); rr.lineCap = 'round';
    rws.forEach(r => { const a0 = proj.pxnm(r.c[0] - r.D[0] * r.L / 2, r.c[1] - r.D[1] * r.L / 2), b0 = proj.pxnm(r.c[0] + r.D[0] * r.L / 2, r.c[1] + r.D[1] * r.L / 2);
      rr.strokeStyle = rgba(T.outline, .42); rr.lineWidth = rw * 1.2; rr.setLineDash([]); rr.beginPath(); rr.moveTo(...a0); rr.lineTo(...b0); rr.stroke();
      rr.lineCap = 'butt'; rr.strokeStyle = rgba(mix(T.outline, T.text, .6), .85); rr.lineWidth = 2.4; rr.setLineDash([9, 7]); rr.beginPath(); rr.moveTo(...a0); rr.lineTo(...b0); rr.stroke(); rr.lineCap = 'round'; });
    rr.setLineDash([]);
  }
  rr.setTransform(1, 0, 0, 1, 0, 0); rr.globalCompositeOperation = 'destination-in'; rr.drawImage(mask.canvas, 0, 0);
  // B layer (outline)
  const B = mk(W, RH), b = B.getContext('2d'); b.translate(0, -R0); b.lineJoin = 'round';
  const path = () => winPath(b, proj, T), oc = T.outline, gl = T.glow, gl2 = mix(T.glow, '#ffffff', .35);
  if (T.outlineStyle === 'thin') { b.strokeStyle = rgba(oc, .92); b.lineWidth = 2; path(); b.stroke(); }
  else if (T.outlineStyle === 'thick') { b.shadowColor = rgba(gl, .6); b.shadowBlur = 14; b.strokeStyle = rgba(oc, .95); b.lineWidth = 7; path(); b.stroke(); }
  else if (T.outlineStyle === 'dashed') { b.setLineDash([16, 11]); b.shadowColor = rgba(gl, .5); b.shadowBlur = 8; b.strokeStyle = rgba(oc, .95); b.lineWidth = 3.4; path(); b.stroke(); }
  else if (T.outlineStyle !== 'none') {
    b.shadowColor = rgba(gl, .95); b.shadowBlur = 22; b.strokeStyle = rgba(gl2, .5); b.lineWidth = 3; path(); b.stroke(); path(); b.stroke();
    b.shadowBlur = 8; b.shadowColor = rgba(gl2, .9); path(); b.stroke();
    b.shadowBlur = 0; b.strokeStyle = rgba(oc, .95); b.lineWidth = 3.6; path(); b.stroke();
  }
  return { A, L, R, B };
}

// ---------- sprites
function makeSprite(col, style, light) {
  const SZ = 160, c = mk(SZ, SZ), x = c.getContext('2d'), s = 30; x.translate(SZ / 2, SZ / 2);
  const rgb = `rgb(${col[0]},${col[1]},${col[2]})`, ga = light ? .5 : .75; x.shadowColor = `rgba(${col[0]},${col[1]},${col[2]},${ga})`; x.fillStyle = rgb; x.strokeStyle = rgb;
  let path;
  if (style === 'dot') path = () => { x.beginPath(); x.arc(0, 0, 10, 0, 7); };
  else if (style === 'arrow') { const pts = [[0, -1.05], [0.62, 0.85], [0, 0.45], [-0.62, 0.85]]; path = () => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0] * s, p[1] * s) : x.moveTo(p[0] * s, p[1] * s)); x.closePath(); }; }
  else if (style === 'blip') { path = () => { x.beginPath(); x.arc(0, 0, 6, 0, 7); }; }
  else {
    const right = [[0, -1], [0.07, -0.86], [0.095, -0.45], [0.12, -0.13], [0.98, 0.34], [0.98, 0.47], [0.12, 0.2], [0.10, 0.62], [0.38, 0.90], [0.38, 1.0], [0.06, 0.93], [0, 1.02]];
    const pts = right.concat(right.slice().reverse().map(p => [-p[0], p[1]]));
    path = () => { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0] * s, p[1] * s) : x.moveTo(p[0] * s, p[1] * s)); x.closePath(); };
  }
  x.shadowBlur = 16; path(); x.fill(); x.shadowBlur = 8; path(); x.fill(); x.shadowBlur = 0; path(); x.fill();
  if (style === 'blip') { x.lineWidth = 2; x.globalAlpha = .75; x.beginPath(); x.arc(0, 0, 15, 0, 7); x.stroke(); }
  return c;
}

// ---------- renderer
async function renderVideo(ctxd, dur, opts) {
  const { cfg, proj, rws, elev, tracks, parked, events, U0, U1 } = ctxd; const T = themeOf(cfg); FONT = T.font || 'Cairo';
  const airport = proj.mode === 'airport', sim = U1 - U0, fps = 60, N = Math.round(dur * fps), SPEED = sim / dur, LIGHT = isLight(T);
  const mask = makeMask(proj, T);
  const st = buildStatic(cfg, proj, rws, sim, dur, U0, U1, mask, T);
  const cDep = hex2rgb(T.planeDep), cArr = hex2rgb(T.planeArr);
  const COL = airport ? { dep: cDep, arr: cArr, oth: cDep } : { dep: cDep, arr: cDep, oth: cDep };
  const sprites = {}; for (const k in COL) sprites[k] = makeSprite(COL[k], T.planeStyle, LIGHT);
  const PS = +T.planeSize || 1, countrySc = (airport ? 0 : clamp(0.9 * Math.pow(proj.PXD / 96, 0.6), 0.38, 0.9)) * PS;
  const main = mk(W, H), mx = main.getContext('2d'); const D1 = mk(W, RH), d1 = D1.getContext('2d'); const S1c = mk(W, RH), s1 = S1c.getContext('2d');
  const netCan = mk(W, RH), nx = netCan.getContext('2d'); if (!LIGHT) { nx.fillStyle = '#000'; nx.fillRect(0, 0, W, RH); }
  const net = new Float32Array(W * RH), tmp = mk(W, RH), tx = tmp.getContext('2d', { willReadFrequently: true });
  const netCol = hex2rgb(T.net), NA = Math.max(0, +T.netAmt), NETK = airport ? 4.5 : 3.5, NETA = Math.min(.95, (airport ? 0.5 : 0.62) * NA * (LIGHT ? 1.25 : 1));
  const lut = new Float32Array(2001); for (let i = 0; i <= 2000; i++) lut[i] = (1 - Math.exp(-(i / 20) / NETK)) * NETA;
  const added = new Uint8Array(tracks.length); const TL = Math.max(0, +T.trailLen), TRL = (airport ? 70 : 1.8 * SPEED) * TL, NT = 14, FADE = SPEED;
  const EVD = events.filter(e => e[1] === 'dep').map(e => e[0]), EVA = events.filter(e => e[1] === 'arr').map(e => e[0]);
  const at = (t, arr, s) => { const f = (s - t.T0) / 5, i = Math.min(t.n - 2, Math.max(0, Math.floor(f))), u = clamp(f - i, 0, 1); return arr[i] + (arr[i + 1] - arr[i]) * u; };
  const pathOf = (cx, t, from, to) => {
    const i0 = Math.max(0, Math.ceil((from - t.T0) / 5)), i1 = Math.min(t.n - 1, Math.floor((to - t.T0) / 5)); cx.beginPath();
    const pt = s => [at(t, t.X, s), at(t, t.Y, s) - R0];
    let p = pt(clamp(from, t.T0, t.T1)); cx.moveTo(p[0], p[1]);
    for (let i = i0; i <= i1; i++) cx.lineTo(t.X[i], t.Y[i] - R0); p = pt(clamp(to, t.T0, t.T1)); cx.lineTo(p[0], p[1]);
  };
  const addNet = t => {
    tx.clearRect(0, 0, W, RH); tx.strokeStyle = '#fff'; tx.lineWidth = 2; tx.lineJoin = 'round'; pathOf(tx, t, t.T0, t.T1); tx.stroke();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let i = 0; i < t.n; i++) { x0 = Math.min(x0, t.X[i]); x1 = Math.max(x1, t.X[i]); y0 = Math.min(y0, t.Y[i] - R0); y1 = Math.max(y1, t.Y[i] - R0); }
    x0 = clamp(Math.floor(x0) - 3, 0, W - 1); y0 = clamp(Math.floor(y0) - 3, 0, RH - 1); x1 = clamp(Math.ceil(x1) + 3, 1, W); y1 = clamp(Math.ceil(y1) + 3, 1, RH);
    if (x1 <= x0 || y1 <= y0) return;
    const id = tx.getImageData(x0, y0, x1 - x0, y1 - y0).data, w = x1 - x0; for (let y = 0; y < y1 - y0; y++) for (let x = 0; x < w; x++) net[(y + y0) * W + x + x0] += id[(y * w + x) * 4 + 3] / 255;
  };
  const rebuildNet = () => {
    const img = nx.createImageData(W, RH), d = img.data;
    if (LIGHT) for (let i = 0; i < net.length; i++) { const v = lut[Math.min(2000, Math.round(net[i] * 20))]; d[i * 4] = netCol[0]; d[i * 4 + 1] = netCol[1]; d[i * 4 + 2] = netCol[2]; d[i * 4 + 3] = Math.round(v * 255); }
    else for (let i = 0; i < net.length; i++) { const v = lut[Math.min(2000, Math.round(net[i] * 20))]; d[i * 4] = netCol[0] * v; d[i * 4 + 1] = netCol[1] * v; d[i * 4 + 2] = netCol[2] * v; d[i * 4 + 3] = 255; }
    nx.putImageData(img, 0, 0);
  };
  // encoder
  let muxer = null, enc = null, codecUsed = '';
  if (!opts.frames) {
    const cands = [['avc', 'avc1.64002A'], ['avc', 'avc1.4D002A'], ['vp9', 'vp09.00.40.08']];
    for (const [mc, c] of cands) { try { const sp = await VideoEncoder.isConfigSupported({ codec: c, width: W, height: H, bitrate: 10e6, framerate: fps }); if (sp.supported) { codecUsed = c; muxer = new Mp4Muxer.Muxer({ target: new Mp4Muxer.ArrayBufferTarget(), video: { codec: mc, width: W, height: H, frameRate: fps }, fastStart: 'in-memory' }); break; } } catch (e) {} }
    if (!muxer) throw new Error('المتصفح ما يدعم ترميز الفيديو (WebCodecs). استخدم Chrome أو Edge حديث.');
    let encErr = null; enc = new VideoEncoder({ output: (ch, meta) => muxer.addVideoChunk(ch, meta), error: e => { encErr = e; } });
    enc.configure({ codec: codecUsed, width: W, height: H, bitrate: 10e6, framerate: fps, latencyMode: 'quality' }); enc._err = () => encErr;
  }
  const frames = opts.frames || Array.from({ length: N }, (_, i) => i), outImgs = [];
  const parkedCol = mix(T.text, T.bg1, .35), clockW = Math.max(700, T.titleWeight);
  for (let fi = 0; fi < frames.length; fi++) {
    const f = frames[fi]; if (opts.cancel && opts.cancel()) throw new Error('تم الإلغاء');
    const s = sim * f / Math.max(N - 1, 1), utc = U0 + s;
    if (NA > 0) { let dirty = false; for (let k = 0; k < tracks.length; k++) if (!added[k] && tracks[k].T1 < s) { addNet(tracks[k]); added[k] = 1; dirty = true; } if (dirty) rebuildNet(); }
    mx.globalCompositeOperation = 'source-over'; mx.globalAlpha = 1; mx.drawImage(st.A, 0, 0); mx.drawImage(st.L, 0, R0);
    if (airport && T.sweep && mx.createConicGradient) { mx.save(); winPath(mx, proj, T); mx.clip(); const gr = mx.createConicGradient((f / fps) / 5 * 2 * Math.PI, MX, MY); gr.addColorStop(0, rgba(T.ring, 0)); gr.addColorStop(.8, rgba(T.ring, 0)); gr.addColorStop(1, rgba(T.ring, .26)); mx.fillStyle = gr; mx.fillRect(0, R0, W, RH); mx.restore(); }
    d1.globalCompositeOperation = 'source-over'; d1.globalAlpha = 1;
    if (LIGHT) { d1.clearRect(0, 0, W, RH); if (NA > 0) d1.drawImage(netCan, 0, 0); }
    else { d1.fillStyle = '#000'; d1.fillRect(0, 0, W, RH); d1.globalCompositeOperation = 'lighter'; if (NA > 0) d1.drawImage(netCan, 0, 0); }
    s1.clearRect(0, 0, W, RH); const inst = [];
    for (const t of tracks) {
      if (t.T0 > s || t.T1 < s) continue;
      const x = at(t, t.X, s), y = at(t, t.Y, s), hd = at(t, t.hd, s), aIn = t.T0 <= 15 ? 1 : Math.min(1, (s - t.T0) / FADE), aOut = t.T1 >= sim - 15 ? 1 : Math.min(1, (t.T1 - s) / FADE); let al = Math.max(0, Math.min(aIn, aOut)), stt = 0, sc = countrySc;
      if (airport) { const alt = at(t, t.alt, s), sp = at(t, t.spd, s), gnd = alt < (elev || 0) + 150; stt = gnd ? clamp((0.0025 - sp) / 0.0012, 0, 1) : 0; sc = (0.56 + 0.26 * clamp((alt - ((elev || 0) + 40)) / 1200, 0, 1)) * PS; if (stt > 0) sc = Math.min(sc, 0.6 * PS); }
      if (NA > 0) { d1.strokeStyle = LIGHT ? rgba(T.net, Math.min(1, .1 * NA)) : `rgb(${netCol[0] * 0.0996 * NA | 0},${netCol[1] * 0.0996 * NA | 0},${netCol[2] * 0.0996 * NA | 0})`; d1.lineWidth = 2; d1.lineJoin = 'round'; pathOf(d1, t, t.T0, s); d1.stroke(); }
      if (TL > 0) {
        const tc = airport ? COL[t.cat] : cDep, t0 = Math.max(s - TRL, t.T0), pts = []; for (let i = 0; i < NT; i++) { const ss = s + (t0 - s) * i / (NT - 1); pts.push([at(t, t.X, ss), at(t, t.Y, ss) - R0]); }
        d1.lineCap = 'round'; for (let i = NT - 1; i > 0; i--) { const q = 1 - i / NT, w = 1 + 3.2 * q, a = Math.min(1, 0.95 * Math.pow(q, 1.6) * 0.85 * al); d1.strokeStyle = `rgba(${tc[0]},${tc[1]},${tc[2]},${a})`; d1.lineWidth = Math.max(1, Math.round(w)); d1.beginPath(); d1.moveTo(pts[i][0], pts[i][1]); d1.lineTo(pts[i - 1][0], pts[i - 1][1]); d1.stroke(); }
      }
      if (stt > 0.01) { d1.fillStyle = `rgba(${COL[t.cat][0]},${COL[t.cat][1]},${COL[t.cat][2]},${0.8 * al * stt})`; d1.beginPath(); d1.arc(x, y - R0, 5.5 * PS, 0, 7); d1.fill(); }
      if (al * (1 - stt) > 0.01) inst.push([x, y, hd, al * (1 - stt), t.cat, sc]);
    }
    d1.globalCompositeOperation = 'destination-in'; d1.drawImage(mask.canvas, 0, 0); mx.globalCompositeOperation = LIGHT ? 'source-over' : 'lighter'; mx.drawImage(D1, 0, R0); mx.globalCompositeOperation = 'source-over'; mx.drawImage(st.R, 0, R0);
    s1.globalCompositeOperation = 'source-over';
    for (const p of parked) if (p.t0 <= s && s <= p.t1) { s1.fillStyle = parkedCol; s1.beginPath(); s1.arc(p.X, p.Y - R0, 5 * PS, 0, 7); s1.fill(); }
    for (const [x, y, hd, al, cat, sc] of inst) { s1.save(); s1.translate(x, y - R0); s1.rotate(hd + Math.PI / 2); s1.scale(sc, sc); s1.globalAlpha = al; s1.drawImage(sprites[cat], -80, -80); s1.restore(); }
    s1.globalAlpha = 1; s1.globalCompositeOperation = 'destination-in'; s1.drawImage(mask.canvas, 0, 0); mx.drawImage(S1c, 0, R0); mx.drawImage(st.B, 0, R0);
    // progress + clock + counters
    if (T.showProgress) { const px = 90 + 900 * f / Math.max(N - 1, 1); mx.fillStyle = T.accent; mx.beginPath(); mx.roundRect(90, 1536, Math.max(1, px - 90), 12, 6); mx.fill();
      mx.fillStyle = T.bg2; mx.beginPath(); mx.arc(px, 1542, 19, 0, 7); mx.fill(); mx.fillStyle = T.clock; mx.beginPath(); mx.arc(px, 1542, 15, 0, 7); mx.fill(); }
    if (T.showClock) { const loc = utc + cfg.tz * 3600, hh = Math.floor(loc / 3600) % 24, mmn = Math.floor(loc / 60) % 60, cl = String(hh).padStart(2, '0') + ':' + String(mmn).padStart(2, '0'); let cx = 360;
      for (const ch of cl) { const w = ch === ':' ? 40 : 80; txt(mx, ch, cx + w / 2, 336 + 85 - 2, { size: 128, weight: clockW, color: T.clock, dir: 'ltr' }); cx += w; } }
    if (airport && T.showCounters) { const nd = EVD.filter(e => e <= s).length, na = EVA.filter(e => e <= s).length; txt(mx, String(nd), 70, 566 + 45 - 3, { size: 68, weight: 900, color: T.planeDep, dir: 'ltr', align: 'left' }); txt(mx, String(na), 1010, 566 + 45 - 3, { size: 68, weight: 900, color: T.planeArr, dir: 'ltr', align: 'right' }); }
    if (opts.frames) { outImgs.push(await new Promise(r => main.toBlob(r, 'image/png'))); }
    else {
      while (enc.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 4)); if (enc._err()) throw enc._err();
      const vf = new VideoFrame(main, { timestamp: Math.round(fi * 1e6 / fps), duration: Math.round(1e6 / fps) }); enc.encode(vf, { keyFrame: fi % 120 === 0 }); vf.close();
      if (fi % 12 === 0) { if (opts.onProgress) opts.onProgress(fi / N); await new Promise(r => setTimeout(r)); }
    }
  }
  if (opts.frames) return { images: outImgs };
  await enc.flush(); muxer.finalize(); const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' }); return { blob, codec: codecUsed };
}

// ---------- prepare
const normCfg = cfg => Object.assign({ tz: 3, tz_name: 'بغداد', type: 'virtual', source: 'IVAO', caption: '', note: '', handle: '', date: 'auto', time: {}, title: '' }, cfg);
function prepare(cfg, parsed) {
  cfg = normCfg(cfg);
  const { pos, tmin, tmax } = parsed; const base = Math.floor(tmin / 86400) * 86400;
  const hm = (s, d) => { if (!s) return d; const [h, m] = s.split(':').map(Number); let v = base + h * 3600 + m * 60; if (v < tmin - 43200) v += 86400; return v; };
  const U0 = hm(cfg.time && cfg.time.start, tmin), U1 = hm(cfg.time && cfg.time.end, tmax); let u1 = U1; if (u1 <= U0) u1 += 86400;
  const proj = new Proj(cfg); const det = proj.mode === 'airport' ? detectRunways(cfg, proj, pos) : { rws: [], elev: null };
  const mask = makeMask(proj, DEFAULT_THEME);
  const tb = buildTracks(cfg, proj, pos, U0, u1, mask.alpha, det.elev);
  if (!tb.tracks.length) throw new Error('ما كو طيارات داخل المنطقة/الوقت المحدد');
  return { cfg, proj, rws: det.rws, elev: det.elev, tracks: tb.tracks, parked: tb.parked, events: tb.events, U0, U1: u1, mask, info: { runways: det.rws.map(r => [r.name, +r.L.toFixed(2)]), tracks: tb.tracks.length, departures: tb.events.filter(e => e[1] === 'dep').length, arrivals: tb.events.filter(e => e[1] === 'arr').length, spanH: (u1 - U0) / 3600 } };
}

// ---------- demo data (live theme preview before a log is loaded)
function demo(cfg) {
  cfg = normCfg(cfg); const proj = new Proj(cfg), airport = proj.mode === 'airport', sim = 3 * 3600;
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tracks = [], parked = [], events = []; let rws = []; const mask = makeMask(proj, DEFAULT_THEME);
  const poly = (k, t0, pts, step, altF, cat) => { // polyline in px -> uniformly resampled track
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = cum[cum.length - 1], n = Math.max(10, Math.floor(tot / step) + 1); let X = new Float64Array(n), Y = new Float64Array(n), j = 0;
    for (let i = 0; i < n; i++) { const d = Math.min(tot, i * tot / (n - 1)); while (j < pts.length - 2 && cum[j + 1] < d) j++; const u = (d - cum[j]) / ((cum[j + 1] - cum[j]) || 1); X[i] = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u; Y[i] = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u; }
    X = gauss1d(X, 4); Y = gauss1d(Y, 4); let hd = new Float64Array(n); for (let i = 0; i < n; i++) { const a = Math.max(0, i - 3), b = Math.min(n - 1, i + 3); hd[i] = Math.atan2(Y[b] - Y[a], X[b] - X[a]); } hd = gauss1d(unwrap(hd), 2);
    const alt = new Float64Array(n), spd = new Float64Array(n).fill(0.04); for (let i = 0; i < n; i++) alt[i] = altF(i / (n - 1));
    const tr = { cs: 'DEMO' + k, t0, n, X, Y, hd, alt, spd, cat, T0: t0, T1: t0 + (n - 1) * 5 }; tracks.push(tr); return tr;
  };
  if (airport) {
    const det = detectRunways(cfg, proj, new Map()); rws = det.rws;
    if (!rws.length) { const h = 330 * Math.PI / 180, D = [Math.sin(h), Math.cos(h)], pr = [D[1], -D[0]], L = Math.min(1.8, proj.radius * 0.35); rws = [-0.2, 0.2].map((pe, i) => { const c = [pr[0] * pe, pr[1] * pe]; return { c, L, D, pe, appr: [c[0] - D[0] * L / 2, c[1] - D[1] * L / 2], name: i ? '33R' : '33L' }; }); }
    const D0 = rws[0].D, rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)], R = proj.radius * 0.97, step = RAD / 140, P = (q) => proj.pxnm(q[0], q[1]);
    for (let k = 0; k < 90; k++) {
      const r = rws[k % rws.length], arr = k % 2 === 0, c = r.c, DD = r.D, t0 = Math.floor(rnd() * (sim - 1500)), sg = rnd() < .5 ? -1 : 1, ang = sg * (0.15 + rnd() * 0.9);
      let pts;
      if (arr) { const fin = Math.min(R * 0.55, 7), I = [c[0] - DD[0] * fin, c[1] - DD[1] * fin], rd = rot(DD, ang), S = [I[0] - rd[0] * (R - fin * 0.6), I[1] - rd[1] * (R - fin * 0.6)]; pts = [S, [(S[0] + I[0]) / 2 + rd[1] * sg * 0.8, (S[1] + I[1]) / 2 - rd[0] * sg * 0.8], I, [c[0] + DD[0] * r.L * .3, c[1] + DD[1] * r.L * .3]]; }
      else { const o = [c[0] - DD[0] * r.L * .45, c[1] - DD[1] * r.L * .45], m = [c[0] + DD[0] * R * .3, c[1] + DD[1] * R * .3], rd = rot(DD, ang), E = [m[0] + rd[0] * R * .8, m[1] + rd[1] * R * .8]; pts = [o, m, E]; }
      const tr = poly(k, t0, pts.map(P), step * (arr ? 1 : 1.15), u => arr ? (u < .92 ? 3000 * (1 - u / .92) : 0) : (u < .1 ? 0 : 3500 * Math.min(1, (u - .1) / .6)), arr ? 'arr' : 'dep');
      if (arr) { const k2 = Array.from(tr.alt).findIndex(v => v < 150); events.push([t0 + 5 * k2, 'arr', tr.cs]); } else { const gi = Array.from(tr.alt).findIndex(v => v >= 150); events.push([t0 + 5 * gi, 'dep', tr.cs]); }
    }
    const pr = [D0[1], -D0[0]]; for (let k = 0; k < 8; k++) { const o = (rnd() - .5) * 1.4, sg = k % 2 ? 1 : -1, q = P([pr[0] * (0.9 + rnd() * 0.5) * sg + D0[0] * o, pr[1] * (0.9 + rnd() * 0.5) * sg + D0[1] * o]); parked.push({ t0: 0, t1: sim, X: q[0], Y: q[1] }); }
  } else {
    const ins = []; for (let k = 0; k < 8000 && ins.length < 80; k++) { const x = Math.floor(rnd() * W), y = R0 + Math.floor(rnd() * RH); if (mask.alpha[(y - R0) * W + x] > 200) ins.push([x, y]); }
    for (let k = 0, g = 0; k < 90 && ins.length > 3 && g < 600; g++) { const A = ins[Math.floor(rnd() * ins.length)], B = ins[Math.floor(rnd() * ins.length)], dist = Math.hypot(B[0] - A[0], B[1] - A[1]); if (dist < 140) continue; const sg = rnd() < .5 ? -1 : 1, bend = sg * dist * 0.1 * rnd(), C = [(A[0] + B[0]) / 2 + (B[1] - A[1]) / dist * bend, (A[1] + B[1]) / 2 - (B[0] - A[0]) / dist * bend];
      const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([(1 - t) * (1 - t) * A[0] + 2 * (1 - t) * t * C[0] + t * t * B[0], (1 - t) * (1 - t) * A[1] + 2 * (1 - t) * t * C[1] + t * t * B[1]]); }
      poly(k, Math.floor(rnd() * (sim - 1500)), pts, 0.8, () => 10000, 'oth'); k++; }
  }
  events.sort((a, b) => a[0] - b[0]);
  return { cfg, proj, rws, elev: airport ? 0 : null, tracks, parked, events, U0: 0, U1: sim, mask, info: { runways: [], tracks: tracks.length, departures: 0, arrivals: 0, spanH: 3 } };
}

async function loadFonts(fonts) { for (const f of fonts) { const ff = new FontFace('Cairo', f.buf, { weight: '200 1000', unicodeRange: f.range }); await ff.load(); document.fonts.add(ff); } }
async function registerFont(name, buf) { const ff = new FontFace(name, buf); await ff.load(); document.fonts.add(ff); return name; }
global.Raseed = { parseLog, prepare, demo, renderVideo, loadFonts, registerFont, THEMES, DEFAULT_THEME, MONTHS };
})(window);
