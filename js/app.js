// ── Root application component ───────────────────────────────────────
function App() {
  var viewState  = useState("home");    var view = viewState[0],  setView = viewState[1];
  var pState     = useState([]);        var participants = pState[0], setP = pState[1];
  var rState     = useState(Object.assign({}, ER)); var results  = rState[0], setR = rState[1];
  var sState     = useState(Object.assign({}, DEF)); var settings = sState[0], setS = sState[1];
  var readyState = useState(false);     var ready = readyState[0], setReady = readyState[1];
  var langState  = useState("es"); // locked to Spanish      
  var lang  = langState[0],  setLangRaw = langState[1];
  var dbStatusState = useState("local"); var dbStatus = dbStatusState[0], setDbStatus = dbStatusState[1];

  // ── Load persisted data on mount ─────────────────────────────────
  useEffect(function(){
    var done = false;
    function finish() { if (!done) { done = true; setReady(true); } }
    // Safety net: always show app after 10s even if Firebase hangs
    var safetyTimer = setTimeout(finish, 10000);
    (async function(){
      try {
        // Auto-connect Firebase immediately using DEF.firebase (no settings needed)
        if (DEF.firebase) {
          db._url = DEF.firebase;
          setDbStatus("firebase");
        }

        // Load settings (may override firebase URL if admin changed it)
        var ss = await db.get("wc26_s");
        var mergedSettings = Object.assign({}, DEF, ss||{}, {
          scoring: Object.assign({}, DEF.scoring, (ss&&ss.scoring)||{})
        });
        setS(mergedSettings);

        // Apply confirmed playoff team names globally to TBG
        if (mergedSettings.playoffs) {
          Object.keys(mergedSettings.playoffs).forEach(function(placeholder) {
            var p = mergedSettings.playoffs[placeholder];
            if (p && p.confirmed && p.winner) {
              GROUPS.forEach(function(g) {
                TBG[g] = TBG[g].map(function(t) {
                  return t === placeholder ? p.winner : t;
                });
              });
            }
          });
          // Rebuild GMS with updated team names
          GROUPS.forEach(function(g) {
            var t = TBG[g], ms = [];
            var pairs = [{i:0,j:1},{i:2,j:3},{i:0,j:2},{i:1,j:3},{i:0,j:3},{i:1,j:2}];
            pairs.forEach(function(pr, idx) {
              ms.push({ id: g+(idx+1), g:g, home:t[pr.i], away:t[pr.j] });
            });
            GMS[g] = ms;
          });
        }

        // Re-wire Firebase if settings override the default URL
        if (mergedSettings.firebase && mergedSettings.firebase !== DEF.firebase) {
          db._url = mergedSettings.firebase;
        }

        // Now load remaining data (from Firebase or localStorage)
        var loaded = await Promise.all([
          db.get("wc26_p"),
          db.get("wc26_r"),
          Promise.resolve("es")
        ]);
        var pp = loaded[0], rr = loaded[1], ll = loaded[2];

        // Always replace Claude bot with latest CLAUDE_ENTRY
        var loadedP = pp || [];
        var otherP  = loadedP.filter(function(x){ return x.id !== "claude_bot"; });
        var finalP  = [CLAUDE_ENTRY].concat(otherP);
        await db.set("wc26_p", finalP);
        setP(finalP);

        if (rr) setR(Object.assign({}, ER, rr));
        if (ll) setLangRaw(ll.value || ll || "es");
      } catch(e) {
        console.error("Init error:", e);
      }
      finish();
      clearTimeout(safetyTimer);
    })();
  }, []);

  // ── Persist + set helpers ─────────────────────────────────────────
  function sv(key, setter) {
    return async function(data) { setter(data); await db.set(key, data); };
  }
  async function setLang(l) { setLangRaw("es"); } // locked to Spanish

  // ── Re-wire Firebase when settings change ────────────────────────
  async function saveSettings(newS) {
    setS(newS);
    await db.set("wc26_s", newS);
    if (newS.firebase) {
      db._url = newS.firebase;
      setDbStatus("firebase");
    } else {
      db._url = null;
      setDbStatus("local");
    }
  }

  // ── Loading screen ────────────────────────────────────────────────
  if (!ready) return html`<div style=${{
    minHeight:"100vh", background:"#080f1c", display:"flex",
    alignItems:"center", justifyContent:"center",
    fontFamily:"'DM Sans',sans-serif", color:"rgba(245,158,11,.4)",
    fontSize:18, letterSpacing:".1em"
  }}>&#x26BD; LOADING...</div>`;

  var lCtx = { lang: lang, t: T[lang], setLang: setLang };

  return html`<${LangCtx.Provider} value=${lCtx}>
    <div style=${{ minHeight:"100vh" }}>

      <${Nav} view=${view} setView=${setView}/>

      ${view === "home" && html`<${HomeView}
        participants=${participants} results=${results}
        settings=${settings} setView=${setView}/>`}

      ${view === "predict" && html`<${PredictView}
        participants=${participants}
        saveP=${sv("wc26_p", setP)}
        setView=${setView}
        settings=${settings}/>`}

      ${view === "leaderboard" && html`<${LeaderboardView}
        participants=${participants} results=${results} settings=${settings}/>`}

      ${view === "bracket" && html`<${BracketPage}
        participants=${participants}/>`}

      ${view === "admin" && html`<${AdminView}
        participants=${participants}
        results=${results}
        settings=${settings}
        dbStatus=${dbStatus}
        saveResults=${sv("wc26_r", setR)}
        saveSettings=${saveSettings}
        saveParticipants=${sv("wc26_p", setP)}/>`}

    </div>
  </${LangCtx.Provider}>`;
}

// ── Mount ─────────────────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(html`<${App}/>`);
