// -- Top navigation bar --
function Nav(p) {
  var ctx = useLang();
  var t = ctx.t, lang = ctx.lang, setLang = ctx.setLang;
  var thm = ctx.thm || THEMES.dark;
  var setTheme = ctx.setTheme;
  var view = p.view, setView = p.setView;

  var navItems = [
    { id:"predict",     full:t.predict,           icon:"\u26bd\ufe0e" },
    { id:"leaderboard", full:t.table,              icon:"\ud83c\udfc5" },
    { id:"bracket",     full:t.bracket,            icon:"\ud83c\udfc6" },
    { id:"admin",       full:t.adminShort||"Admin",icon:"\ud83d\udd10" }
  ];

  return html`<nav style=${{
    position:"sticky", top:0, zIndex:100,
    background: thm.id==="estadio" ? "rgba(7,26,15,.97)" : "rgba(8,15,28,.97)",
    backdropFilter:"blur(14px)",
    borderBottom:thm.bdr(1,.07)
  }}>
    <div style=${{ maxWidth:780, margin:"0 auto", display:"flex", alignItems:"center",
      justifyContent:"space-between", padding:"0 12px", height:50 }}>

      <button onClick=${function(){ setView("home"); }} className="bb" style=${{
        background:"none", border:"none", color:thm.accent,
        fontSize:16, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0
      }}>\u26bd\ufe0e <span class="nav-label">${lang==="es"?"Polla Mundialista 2026":"WC 2026"}</span></button>

      <div style=${{ display:"flex", gap:2, alignItems:"center", flexShrink:0 }}>
        ${navItems.map(function(x) {
          var active = view === x.id;
          return html`<button key=${x.id} onClick=${function(){ setView(x.id); }} style=${{
            padding:"5px 8px", borderRadius:7, fontSize:12, fontWeight:600,
            cursor:"pointer", border:"none", transition:"all .15s",
            background: active ? thm.accent : "transparent",
            color: active ? thm.onAccent : thm.inv(.75),
            fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap"
          }}>
            <span class="nav-label">${x.full}</span>
            <span style=${{display:"none"}} class="nav-icon">${x.icon}</span>
          </button>`;
        })}

        <button onClick=${function(){
          setTheme(thm.id === 'dark' ? 'estadio' : 'dark');
        }} title=${thm.id==='dark'?'Cambiar a Estadio':'Cambiar a Noche'} style=${{
          padding:"4px 7px", borderRadius:7, fontSize:13,
          background: thm.inv(.07), border: thm.bdr(1,.1),
          cursor:"pointer", color: thm.inv(.7),
          fontFamily:"'DM Sans',sans-serif", lineHeight:1, marginLeft:2,
          transition:"all .15s"
        }}>${thm.id === 'dark' ? '🏟' : '🌙'}</button>

      </div>
    </div>
  </nav>`;
}
