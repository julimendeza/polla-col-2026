// ── React hooks (globals) ───────────────────────────────────────────
var useState    = React.useState;
var useEffect   = React.useEffect;
var useMemo     = React.useMemo;
var useContext  = React.useContext;
var createContext = React.createContext;

// ── htm binding ─────────────────────────────────────────────────────
var html = htm.bind(React.createElement);

// ── Firebase + localStorage hybrid db ───────────────────────────────
// If window.FIREBASE_URL is set (from settings), uses Firebase.
// Falls back to localStorage for offline / unconfigured use.
var db = {
  _url: null, // set by app.js once settings load: db._url = settings.firebase

  _fb: async function(method, key, body) {
    if (!db._url) return null;
    var base = db._url.replace(/\/$/, '') + '/' + key + '.json';
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    try {
      var res = await fetch(base, opts);
      if (!res.ok) return null;
      return await res.json();
    } catch(e) { return null; }
  },

  get: async function(key) {
    // Try Firebase first
    if (db._url) {
      var val = await db._fb('GET', key);
      if (val !== null && val !== undefined) return val;
      // null from Firebase = key doesn't exist (not an error)
      return null;
    }
    // Fallback: localStorage
    try {
      var s = localStorage.getItem(key);
      return s ? JSON.parse(s) : null;
    } catch(e) { return null; }
  },

  set: async function(key, value) {
    // Write to Firebase if configured
    if (db._url) {
      await db._fb('PUT', key, value);
    }
    // Always also write localStorage as a local cache / fallback
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
  },

  // Lang stored locally only (per-browser preference)
  getLang: async function() {
    try { var s = localStorage.getItem('wc26_lang'); return s ? JSON.parse(s) : null; } catch(e) { return null; }
  },
  setLang: async function(v) {
    try { localStorage.setItem('wc26_lang', JSON.stringify(v)); } catch(e) {}
  }
};

// ── Language context ─────────────────────────────────────────────────
var LangCtx = createContext({ lang: 'es', t: {}, setLang: function(){} });
function useLang() { return useContext(LangCtx); }

// ── Flag image component ─────────────────────────────────────────────
function FlagImg(p) {
  var thm = (useLang().thm) || THEMES.dark;
  var code = CC && CC[p.team];
  if (!code) return html`<span style=${{fontSize:13}}>${fl(p.team)}</span>`;
  return html`<img
    src=${"https://flagcdn.com/20x15/" + code + ".png"}
    width="20" height="15"
    alt=${p.team}
    style=${{
      display:"inline-block", verticalAlign:"middle",
      borderRadius:2, flexShrink:0,
      opacity: p.dim ? 0.45 : 1,
      border:thm.bdr(1,.08)
    }}
    onError=${function(e){ e.target.style.display="none"; }}
  />`;
}

// ── PIN helpers ──────────────────────────────────────────────────────
var pins = {
  get: async function() {
    return await db.get("wc26_pins") || [];
  },
  set: async function(list) {
    await db.set("wc26_pins", list);
  },
  // Validate a PIN. Returns { ok, pin } or { ok:false, err }
  // Pass email to allow returning users to re-enter with their own PIN
  validate: async function(code, accessMode, email) {
    if (accessMode === "off") return { ok: true, pin: null };
    var list = await pins.get();
    var found = list.find(function(p) {
      return p.pin.trim().toUpperCase() === code.trim().toUpperCase();
    });
    if (!found) return { ok: false, err: "PIN inválido." };
    if (found.used) {
      // PIN is privately distributed — whoever has the PIN is the right person.
      // Always allow through so users can edit their predictions.
      return { ok: true, pin: found, returning: true };
    }
    return { ok: true, pin: found }; },
  // Mark a PIN as used
  markUsed: async function(code, name, email) {
    var list = await pins.get();
    var updated = list.map(function(p) {
      if (p.pin.trim().toUpperCase() === code.trim().toUpperCase()) {
        return Object.assign({}, p, { used: true, usedBy: name, usedEmail: email, usedAt: new Date().toISOString() });
      }
      return p;
    });
    await pins.set(updated);
  }
};

// ── Playoff team name resolver ───────────────────────────────────────
// If a team name is a playoff placeholder AND admin has confirmed the winner,
// returns the real team name. Otherwise returns the placeholder.
function resolvedTeamName(name, settings) {
  if (!name || !settings || !settings.playoffs) return name;
  var p = settings.playoffs[name];
  if (p && p.confirmed && p.winner) return p.winner;
  return name;
}

// Apply playoff resolutions to a TBG-style groups object
function resolveGroups(tbg, settings) {
  var out = {};
  Object.keys(tbg).forEach(function(g) {
    out[g] = tbg[g].map(function(t) { return resolvedTeamName(t, settings); });
  });
  return out;
}

// ── Themes ───────────────────────────────────────────────────────────
var THEMES = {
  dark: {
    id: 'dark', label: '🌙 Noche',
    accent:    '#FCD116',
    accentD:   '#e8b800',
    accentGrad:'linear-gradient(135deg,#FCD116,#e8b800)',
    onAccent:  '#000',
    deep:      '#080f1c',
    row1:      '#0d1520',
    tourBg:    '#1a2540',
    loadBg:    '#080f1c',
    loadColor: 'rgba(245,158,11,.4)',
    bodyBg:    '#0a1628',
    bodyGrad:  'radial-gradient(at 0% 0%, rgba(0,56,147,0.55) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(206,17,38,0.3) 0, transparent 50%), radial-gradient(at 50% 0%, rgba(252,209,22,0.12) 0, transparent 40%)',
    a:    function(x){ return 'rgba(245,158,11,'+x+')'; },
    inv:  function(x){ return 'rgba(255,255,255,'+x+')'; },
    bdr:  function(w,x){ return w+'px solid rgba(255,255,255,'+x+')'; },
    bdra: function(w,x){ return w+'px solid rgba(245,158,11,'+x+')'; }
  },
  estadio: {
    id: 'estadio', label: '🏟 Estadio',
    accent:    '#22c55e',
    accentD:   '#16a34a',
    accentGrad:'linear-gradient(135deg,#22c55e,#16a34a)',
    onAccent:  '#064e3b',
    deep:      '#071a0f',
    row1:      '#0c2318',
    tourBg:    '#0d1f14',
    loadBg:    '#071a0f',
    loadColor: '#22c55e',
    bodyBg:    '#0a1a10',
    bodyGrad:  'radial-gradient(at 0% 0%, rgba(20,83,45,0.6) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(5,46,22,0.5) 0, transparent 50%), radial-gradient(at 50% 50%, rgba(34,197,94,0.04) 0, transparent 60%)',
    // inv(x): white-bone text hierarchy on dark green bg
    // x < 0.12 = subtle backgrounds, x >= 0.12 = text (maps to #f1f5f9 at varying opacity)
    inv:  function(x){ return x<0.12 ? 'rgba(241,245,249,'+x+')' : 'rgba(241,245,249,'+Math.min(1,x+0.35).toFixed(2)+')'; },
    // muted: zinc gray for secondary text
    muted: '#94a3b8',
    a:    function(x){ return 'rgba(34,197,94,'+x+')'; },
    bdr:  function(w,x){ return w+'px solid rgba(20,83,45,'+(Math.min(1,x*1.5).toFixed(2))+')'; },
    bdra: function(w,x){ return w+'px solid rgba(34,197,94,'+x+')'; }
  }
};
