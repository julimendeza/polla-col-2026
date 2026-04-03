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
      border:"1px solid rgba(255,255,255,.08)"
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
  validate: async function(code, accessMode) {
    if (accessMode === "off") return { ok: true, pin: null };
    var list = await pins.get();
    var found = list.find(function(p) {
      return p.pin.trim().toUpperCase() === code.trim().toUpperCase();
    });
    if (!found) return { ok: false, err: "Invalid PIN." };
    if (found.used) return { ok: false, err: "This PIN has already been used." };
    return { ok: true, pin: found };
  },
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
