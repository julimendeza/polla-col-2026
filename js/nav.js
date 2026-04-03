// -- Top navigation bar --
function Nav(p) {
  var ctx = useLang();
  var t = ctx.t, lang = ctx.lang, setLang = ctx.setLang;
  var view = p.view, setView = p.setView;

  // On mobile we show icon-only labels to save space
  var navItems = [
    { id:"predict",     full:t.predict,     icon:"\u26bd" },
    { id:"leaderboard", full:t.table,        icon:"\ud83c\udfc5" },
    { id:"bracket",     full:t.bracket,      icon:"\ud83c\udfc6" },
    { id:"admin",       full:t.adminShort||"Admin", icon:"\ud83d\udd10" }
  ];

  return html`<nav style=${{
    position:"sticky", top:0, zIndex:100,
    background:"rgba(8,15,28,.97)", backdropFilter:"blur(14px)",
    borderBottom:"1px solid rgba(255,255,255,.07)"
  }}>
    <div style=${{ maxWidth:780, margin:"0 auto", display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"0 12px", height:50 }}>

      <button onClick=${function(){ setView("home"); }} className="bb" style=${{
        background:"none", border:"none", color:"#f59e0b",
        fontSize:16, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0
      }}>\u26bd <span class="nav-label">${lang==="es"?"La Tribuna 2026":"WC 2026"}</span></button>

      <div style=${{ display:"flex", gap:2, alignItems:"center", flexShrink:0 }}>
        ${navItems.map(function(x) {
          var active = view === x.id;
          return html`<button key=${x.id} onClick=${function(){ setView(x.id); }} style=${{
            padding:"5px 8px", borderRadius:7, fontSize:12, fontWeight:600,
            cursor:"pointer", border:"none", transition:"all .15s",
            background: active ? "#f59e0b" : "transparent",
            color: active ? "#000" : "rgba(255,255,255,.6)",
            fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap"
          }}>
            <span class="nav-label">${x.full}</span>
            <span style=${{display:"none"}} class="nav-icon">${x.icon}</span>
          </button>`;
        })}


      </div>
    </div>
  </nav>`;
}
