// - Primitive components -

var btnBase = {
  borderRadius: 10, fontWeight: 600, fontSize: 14,
  transition: "all .15s", border: "none",
  display: "inline-flex", alignItems: "center",
  justifyContent: "center", gap: 6,
  fontFamily: "'DM Sans', sans-serif"
};
function Btn(p) {
  var thm = useLang().thm || THEMES.dark;
  var btnVariants = {
    primary:   { background: thm.accentGrad, color: thm.onAccent },
    secondary: { background: thm.inv(.08), color: thm.inv(.9), border: thm.bdr(1.5,.12) },
    ghost:     { background: "none", color: thm.inv(.5) }
  };
  var v = p.v || "primary";
  var s = Object.assign({}, btnBase, btnVariants[v], {
    padding:  (p.sx && p.sx.padding)  || "10px 20px",
    fontSize: (p.sx && p.sx.fontSize) || 14,
    flex:     (p.sx && p.sx.flex),
    width:    p.full ? "100%" : "auto",
    cursor:   p.disabled ? "not-allowed" : "pointer",
    opacity:  p.disabled ? 0.45 : 1
  }, p.sx || {});
  return html`<button onClick=${p.disabled ? undefined : p.onClick} style=${s}>${p.children}</button>`;
}

function Card(p) {
  var thm = useLang().thm || THEMES.dark;
  return html`<div style=${{ background:thm.inv(.04), border:thm.bdr(1.5,.08), borderRadius:16, padding:20, ...(p.sx||{}) }}>${p.children}</div>`;
}

function Field(p) {
  var thm = useLang().thm || THEMES.dark;
  return html`<div style=${{ marginBottom:16 }}>
    <label style=${{ fontSize:13, color:thm.inv(.6), display:"block", marginBottom:6 }}>${p.label}</label>
    ${p.children}
  </div>`;
}

function PBar(p) {
  var thm = useLang().thm || THEMES.dark;
  return html`<div style=${{ background:thm.inv(.08), borderRadius:99, height:5, overflow:"hidden" }}>
    <div style=${{ height:5, borderRadius:99, background:thm.accentGrad, transition:"width .3s", width: Math.min(100, (p.v/p.max)*100) + "%" }}/>
  </div>`;
}

function SI(p) {
  return html`<input
    type="number" min="0" max="20" className="si"
    value=${p.val || ""}
    onChange=${function(e){ p.onChange(e.target.value.replace(/\D/g,"").slice(0,2)); }}
    placeholder="?"/>`;
}

// - Match score row -
function MRow(p) {
  var _lc=useLang();var lang=_lc.lang;var thm=_lc.thm||THEMES.dark;
  var res = p.res, hv = p.hv || "", av = p.av || "";
  var st  = (res && res.h !== "") ? mSt({ h:hv, a:av }, res) : null;
  var bg  = st==="exact"  ? "rgba(34,197,94,.12)"  :
            st==="result" ? thm.a(.1)  :
            st==="partial"? "rgba(59,130,246,.08)" : thm.inv(.04);
  var bd  = st==="exact"  ? "rgba(34,197,94,.35)"  :
            st==="result" ? thm.a(.25) :
            st==="partial"? "rgba(59,130,246,.2)"  : thm.inv(.09);
  var pts = st ? scoreMatch({ h:hv, a:av }, res) : null;

  return html`<div style=${{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:12, border:"1.5px solid "+bd, marginBottom:5, background:bg, transition:"all .15s" }}>
    <div style=${{ flex:1, display:"flex", alignItems:"center", justifyContent:"flex-end", gap:5, overflow:"hidden" }}>
      <span style=${{ fontSize:12, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>${teamName(p.match.home,lang)}</span>
      <${FlagImg} team=${p.match.home}/>
    </div>
    <div style=${{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
      <${SI} val=${hv} onChange=${p.onH}/>
      <span style=${{ color:thm.inv(.2), fontSize:10 }}>-</span>
      <${SI} val=${av} onChange=${p.onA}/>
    </div>
    <div style=${{ flex:1, display:"flex", alignItems:"center", gap:5, overflow:"hidden" }}>
      <${FlagImg} team=${p.match.away}/>
      <span style=${{ fontSize:12, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>${teamName(p.match.away,lang)}</span>
    </div>
    ${pts !== null && html`<span style=${{ fontSize:11, fontWeight:700, flexShrink:0, minWidth:28, textAlign:"right",
      color: pts>=6?("#4ade80"):pts>=3?thm.accent:pts>0?"#60a5fa":thm.inv(.2) }}>
      ${pts > 0 ? "+" + pts : (pts === 0 && hv !== "" ? "0" : "")}
    </span>`}
  </div>`;
}

// - Live group standings table -
function StandingsTable(p) {
  var _lc=useLang();var lang=_lc.lang;var thm=_lc.thm||THEMES.dark;
  var t    = useLang().t;
  var st   = calcStandings(p.preds || {}, p.group);
  var done = groupDone(p.preds || {}, p.group);

  // Work out which 3rd-place teams qualify across all groups
  // allPreds = full groups predictions object (needed to rank all thirds)
  var qualifiedThirds = [];
  if (p.allPreds) {
    var r32info = getR32(p.allPreds);
    qualifiedThirds = r32info.best8.map(function(x){ return x.team; });
  }
  var third = st[2] && st[2].team;
  var thirdQualifies = qualifiedThirds.length > 0
    ? qualifiedThirds.indexOf(third) >= 0
    : null; // null = unknown (not enough groups filled)

  return html`<div style=${{ marginTop:12, padding:"10px 12px", background:thm.inv(.03), borderRadius:12, border:thm.bdr(1,.07) }}>
    <div style=${{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
      <span style=${{ fontSize:10, fontWeight:700, color:thm.inv(.3), letterSpacing:".08em" }}>${t.standingsLabel} ${p.group}</span>
      <span style=${{ fontSize:10, color: done ? ("rgba(74,222,128,.7)") : thm.a(.6) }}>${done ? "\u2713 " + t.qualifyDirect : "* proyectado"}</span>
    </div>
    <div style=${{ display:"grid", gridTemplateColumns:"14px 1fr 22px 22px 22px 22px 42px 26px 28px", gap:2, fontSize:10, color:thm.inv(.25), marginBottom:4, padding:"0 2px" }}>
      <span/><span/>
      <span style=${{ textAlign:"center" }}>P</span>
      <span style=${{ textAlign:"center" }}>W</span>
      <span style=${{ textAlign:"center" }}>D</span>
      <span style=${{ textAlign:"center" }}>L</span>
      <span style=${{ textAlign:"center" }}>GF:GC</span>
      <span style=${{ textAlign:"center" }}>GD</span>
      <span style=${{ textAlign:"center", fontWeight:700 }}>Pts</span>
    </div>
    ${st.map(function(r, i) {
      // Determine row highlight:
      // pos 1,2 (i=0,1): always green - qualify directly
      // pos 3 (i=2): green if in best8, yellow if unknown, red/dim if not qualifying
      // pos 4 (i=3): never qualifies
      var isTop2   = i < 2;
      var isThird  = i === 2;
      var thirdIn  = isThird && thirdQualifies === true;
      var thirdOut = isThird && thirdQualifies === false;
      var thirdMaybe = isThird && thirdQualifies === null;

      var bg  = isTop2    ? thm.id==="estadio"?"rgba(22,101,52,.08)":"rgba(74,222,128,.07)"  :
                thirdIn   ? thm.id==="estadio"?"rgba(22,101,52,.08)":"rgba(74,222,128,.07)"  :
                thirdMaybe? thm.a(.05)  :
                thirdOut  ? "rgba(255,100,100,.04)" : "transparent";
      var bd  = isTop2    ? thm.id==="estadio"?"1px solid rgba(22,101,52,.2)":"1px solid rgba(74,222,128,.1)"   :
                thirdIn   ? thm.id==="estadio"?"1px solid rgba(22,101,52,.2)":"1px solid rgba(74,222,128,.1)"   :
                thirdMaybe? thm.bdra(1,.08)  :
                thirdOut  ? "1px solid rgba(255,100,100,.1)"  : "1px solid transparent";
      var nameCol = isTop2||thirdIn ? thm.inv(.85) :
                   thirdMaybe       ? thm.inv(.55) : thm.inv(.3);
      var ptsCol  = isTop2||thirdIn ? ("#4ade80")    :
                   thirdMaybe       ? thm.accent    :
                   thirdOut         ? ("#f87171") : thm.inv(.3);

      return html`<div key=${r.team} style=${{
        display:"grid", gridTemplateColumns:"14px 1fr 22px 22px 22px 22px 42px 26px 28px",
        gap:2, padding:"3px 2px", borderRadius:6, marginBottom:2,
        background:bg, border:bd
      }}>
        <span style=${{ fontSize:9, color:thm.inv(.28), alignSelf:"center" }}>${i+1}</span>
        <span style=${{ fontSize:11, fontWeight:i<2?600:400, color:nameCol, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}><${FlagImg} team=${r.team}/> ${teamName(r.team,lang)}</span>
        ${[r.mp, r.w, r.d, r.l].map(function(v, k) {
          return html`<span key=${k} style=${{ textAlign:"center", color:thm.inv(.35), fontSize:11 }}>${v}</span>`;
        })}
        <span style=${{ textAlign:"center", color:thm.inv(.35), fontSize:11 }}>${r.gf}:${r.ga}</span>
        <span style=${{ textAlign:"center", fontSize:11, color: r.gd>0?("#4ade80"):r.gd<0?("#f87171"):thm.inv(.35) }}>${r.gd > 0 ? "+" : ""}${r.gd}</span>
        <span style=${{ textAlign:"center", fontWeight:700, fontSize:12, color:ptsCol }}>${r.pts}</span>
      </div>`;
    })}
    <div style=${{ marginTop:5, fontSize:9, color:thm.inv(.2) }}>
      \ud83d\udfe2 Mejores 2 clasifican  \u00b7
      \ud83d\udfe1 Mejores 8 terceros clasifican \u00b7
      \ud83d\udd34 Tercero eliminado
    </div>
  </div>`;
}

// - Group tab row -
function GroupTabs(p) {
  var thm = useLang().thm || THEMES.dark;
  return html`<div style=${{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:12 }}>
    ${GROUPS.map(function(g) {
      var done = groupDone(p.isResult ? (p.preds && p.preds.groups || {}) : (p.preds || {}), g);
      return html`<button key=${g} onClick=${function(){ p.onChange(g); }} style=${{
        padding:"4px 9px", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer",
        border: "1.5px solid " + (p.active===g ? thm.accent : done ? ("rgba(74,222,128,.3)") : thm.inv(.1)),
        background: p.active===g ? thm.accent : done ? ("rgba(74,222,128,.08)") : "transparent",
        color: p.active===g ? thm.onAccent : done ? ("#4ade80") : thm.inv(.5),
        fontFamily:"'DM Sans',sans-serif"
      }}>${g}${done && p.active !== g ? " \u2713" : ""}</button>`;
    })}
  </div>`;
}

// - Multi-team chip picker -
function MultiPick(p) {
  var _lc=useLang();var lang=_lc.lang;var thm=_lc.thm||THEMES.dark;
  var t = useLang().t;
  var options = p.options, selected = p.selected, pick = p.pick, results = p.results;
  var hasR = results && results.length > 0;

  function toggle(team) {
    if (selected.indexOf(team) >= 0) p.onChange(selected.filter(function(x){ return x !== team; }));
    else if (selected.length < pick) p.onChange(selected.concat([team]));
  }

  // Group the available options by group
  var grouped = GROUPS.reduce(function(acc, g) {
    var inn = TBG[g].filter(function(t2){ return options.indexOf(t2) >= 0; });
    if (inn.length) acc[g] = inn;
    return acc;
  }, {});

  return html`<div>
    <div style=${{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
      <span style=${{ fontSize:13, color:thm.inv(.4) }}>${t.select} ${pick} ${t.teams}</span>
      <span style=${{ fontSize:13, fontWeight:700, color: selected.length===pick ? "#4ade80" : selected.length>0 ? thm.accent : thm.inv(.3) }}>
        ${selected.length}/${pick}${selected.length === pick ? " \u2713" : ""}
      </span>
    </div>
    ${Object.entries(grouped).map(function(kv) {
      var g = kv[0], ts = kv[1];
      return html`<div key=${g} style=${{ marginBottom:10 }}>
        <div style=${{ fontSize:10, fontWeight:700, color:thm.inv(.22), marginBottom:5, letterSpacing:".08em" }}>GROUP ${g}</div>
        <div style=${{ display:"flex", flexWrap:"wrap", gap:5 }}>
          ${ts.map(function(team) {
            var isOn = selected.indexOf(team) >= 0;
            var cls  = "chip " + (hasR ? (isOn && results.indexOf(team)>=0 ? "c-hit" : isOn ? "c-miss" : "c-off") : (isOn ? "c-on" : "c-off"));
            return html`<span key=${team} className=${cls} onClick=${function(){ toggle(team); }} style=${{display:'inline-flex',alignItems:'center',gap:4}}><${FlagImg} team=${team}/> ${teamName(team,lang)}</span>`;
          })}
        </div>
      </div>`;
    })}
  </div>`;
}

// - Single-team chip picker -
function SinglePick(p) {
  var _lc=useLang();var lang=_lc.lang;var thm=_lc.thm||THEMES.dark;
  var options = p.options, selected = p.selected, results = p.results;
  var hasR = results !== undefined && results !== "";

  var grouped = GROUPS.reduce(function(acc, g) {
    var inn = TBG[g].filter(function(t){ return options.indexOf(t) >= 0; });
    if (inn.length) acc[g] = inn;
    return acc;
  }, {});

  return html`<div>
    ${Object.entries(grouped).map(function(kv) {
      var g = kv[0], ts = kv[1];
      return html`<div key=${g} style=${{ marginBottom:10 }}>
        <div style=${{ fontSize:10, fontWeight:700, color:thm.inv(.22), marginBottom:5, letterSpacing:".08em" }}>GROUP ${g}</div>
        <div style=${{ display:"flex", flexWrap:"wrap", gap:5 }}>
          ${ts.map(function(team) {
            var isOn = selected === team;
            var cls  = "chip " + (hasR ? (isOn && results===team ? "c-hit" : isOn ? "c-miss" : "c-off") : (isOn ? "c-on" : "c-off"));
            return html`<span key=${team} className=${cls} onClick=${function(){ p.onChange(isOn ? "" : team); }} style=${{display:'inline-flex',alignItems:'center',gap:4}}><${FlagImg} team=${team}/> ${teamName(team,lang)}</span>`;
          })}
        </div>
      </div>`;
    })}
  </div>`;
}



// - Build properly ordered bracket halves -

// - KO Match Row (score entry for knockout matches) -
function KOMatchRow(p) {
  var lctx=useLang(); var t=lctx.t; var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var match=p.match; // { id, home, away, score, winner, loser }
  var sc=p.sc||{}; // current prediction score object { h, a, winner }
  var onChange=p.onChange;
  var isResult=p.isResult; // admin mode
  var resMatch=p.resMatch; // actual result match object (for highlighting)

  var homeTeam=match.home, awayTeam=match.away;
  var h=sc.h!==undefined?sc.h:'', a=sc.a!==undefined?sc.a:'';
  var isDraw=(h!==''&&a!==''&&+h===+a);
  var predictedWinner=koWinner(sc);
  var actualWinner=resMatch?resMatch.winner:null;

  // Status for highlighting
  var status=null;
  if(actualWinner&&predictedWinner) {
    status=(predictedWinner===actualWinner)?'correct':'wrong';
  }

  var borderCol = status==='correct'?thm.id==="estadio"?'rgba(22,101,52,.5)':'rgba(74,222,128,.4)':status==='wrong'?'rgba(248,113,113,.3)':thm.inv(.1);
  var bgCol     = status==='correct'?thm.id==="estadio"?'rgba(22,101,52,.08)':'rgba(74,222,128,.06)':status==='wrong'?'rgba(248,113,113,.04)':thm.inv(.04);

  function setH(v){ onChange(Object.assign({},sc,{h:v.replace(/\D/g,'').slice(0,2)})); }
  function setA(v){ onChange(Object.assign({},sc,{a:v.replace(/\D/g,'').slice(0,2)})); }
  function setW(v){ onChange(Object.assign({},sc,{winner:v})); }

  return html`<div style=${{
    display:'flex',alignItems:'center',gap:6,padding:'8px 10px',
    borderRadius:10,marginBottom:5,
    background:bgCol,border:'1.5px solid '+borderCol,transition:'all .15s'
  }}>
    <div style=${{flex:1,display:'flex',alignItems:'center',justifyContent:'flex-end',gap:5,overflow:'hidden'}}>
      ${homeTeam
        ? html`<span style=${{fontSize:11,fontWeight:predictedWinner===homeTeam?600:400,
            color:predictedWinner===homeTeam?thm.inv(.9):thm.inv(.65),
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>${teamName(homeTeam,lang)}</span>
           <${FlagImg} team=${homeTeam}/>`
        : html`<span style=${{fontSize:10,color:thm.inv(.25),fontStyle:'italic'}}>TBD</span>`
      }
    </div>

    <div style=${{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
      <input type="number" min="0" max="20" className="si" value=${h}
        onChange=${function(e){setH(e.target.value);}} placeholder="?"/>
      <span style=${{color:thm.inv(.2),fontSize:10}}>-</span>
      <input type="number" min="0" max="20" className="si" value=${a}
        onChange=${function(e){setA(e.target.value);}} placeholder="?"/>
    </div>

    <div style=${{flex:1,display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
      ${awayTeam
        ? html`<${FlagImg} team=${awayTeam}/>
           <span style=${{fontSize:11,fontWeight:predictedWinner===awayTeam?600:400,
            color:predictedWinner===awayTeam?thm.inv(.9):thm.inv(.65),
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>${teamName(awayTeam,lang)}</span>`
        : html`<span style=${{fontSize:10,color:thm.inv(.25),fontStyle:'italic'}}>TBD</span>`
      }
    </div>

    ${isDraw&&homeTeam&&awayTeam&&html`<div style=${{display:'flex',gap:3,flexShrink:0}}>
      <button onClick=${function(){setW('home');}} style=${{
        padding:'2px 7px',borderRadius:5,fontSize:9,fontWeight:700,cursor:'pointer',
        border:'1px solid '+(sc.winner==='home'?thm.id==="estadio"?'rgba(22,101,52,.8)':'rgba(74,222,128,.6)':thm.inv(.15)),
        background:sc.winner==='home'?thm.id==="estadio"?'rgba(22,101,52,.15)':'rgba(74,222,128,.15)':'transparent',
        color:sc.winner==='home'?'#4ade80':thm.inv(.4),
        fontFamily:"'DM Sans',sans-serif"
      }}>H</button>
      <button onClick=${function(){setW('away');}} style=${{
        padding:'2px 7px',borderRadius:5,fontSize:9,fontWeight:700,cursor:'pointer',
        border:'1px solid '+(sc.winner==='away'?thm.id==="estadio"?'rgba(22,101,52,.8)':'rgba(74,222,128,.6)':thm.inv(.15)),
        background:sc.winner==='away'?thm.id==="estadio"?'rgba(22,101,52,.15)':'rgba(74,222,128,.15)':'transparent',
        color:sc.winner==='away'?'#4ade80':thm.inv(.4),
        fontFamily:"'DM Sans',sans-serif"
      }}>A</button>
    </div>`}
  </div>`;
}


function BCol(p) {
  var _lc=useLang();var lang=_lc.lang;var thm=_lc.thm||THEMES.dark;
  var teams=p.teams, next=p.next||[], H=p.H, PW=p.PW, PH=p.PH, scores=p.scores||{};
  var n=teams.length;
  var slotH=H/n;
  function isAdv(team){return team&&next.filter(Boolean).length>0&&next.indexOf(team)>=0;}
  function isElim(team){return team&&next.filter(Boolean).length>0&&next.indexOf(team)<0;}

  return html`<div style=${{position:'relative',width:PW+'px',height:H+'px',flexShrink:0}}>
    ${teams.map(function(team,i){
      var a=isAdv(team), e=isElim(team);
      var pairIdx=Math.floor(i/2);
      var score=a?scores[pairIdx]:null;
      var top=i*slotH+(slotH-PH)/2;
      return html`<div key=${i} style=${{
        position:'absolute',top:top+'px',left:0,right:0,height:PH+'px',
        display:'flex',alignItems:'center',gap:3,padding:'0 4px',borderRadius:5,
        background:a?'rgba(74,222,128,.12)':e?thm.inv(.02):thm.inv(.06),
        border:'1px solid '+(a?'rgba(74,222,128,.35)':e?thm.inv(.07):thm.inv(.12)),
      }}>
        ${team
          ? html`
            <${FlagImg} team=${team} dim=${e}/>
            <span style=${{fontSize:8,fontWeight:a?600:400,flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginLeft:2,
              color:a?'#4ade80':e?thm.inv(.35):thm.inv(.75)}}>${teamName(team,lang)}</span>
            ${score&&html`<span style=${{flexShrink:0,fontSize:8,fontWeight:800,background:thm.a(.3),
              border:thm.bdra(1,.6),borderRadius:3,padding:'0 3px',
              color:'#fde68a',whiteSpace:'nowrap'}}>${score}</span>`}
          `
          : html`<span style=${{fontSize:8,color:thm.inv(.18),fontStyle:'italic',flex:1}}>TBD</span>`
        }
      </div>`;
    })}
  </div>`;
}

// - Bracket connector SVG -
function BConn(p) {
  var thm = useLang().thm || THEMES.dark;
  var outer=p.outer,inner=p.inner,dir=p.dir,H=p.H,CW=p.CW;
  var stk=thm.inv(.15);
  function ctrO(i){return(i+0.5)*H/outer.length;}
  function ctrI(i){return(i+0.5)*H/inner.length;}
  return html`<svg style=${{width:CW+'px',height:H+'px',flexShrink:0,display:'block',overflow:'visible'}}
    viewBox=${'0 0 '+CW+' '+H}>
    ${Array.from({length:inner.length},function(_,i){
      var c1=ctrO(i*2),c2=ctrO(i*2+1),mid=(c1+c2)/2,ic=ctrI(i);
      if(dir==='lr')return html`<g key=${i}>
        <polyline points=${'0,'+c1+' 4,'+c1+' 4,'+c2+' 0,'+c2} fill="none" stroke=${stk} strokeWidth="1"/>
        <line x1="4" y1=${mid} x2=${CW} y2=${ic} stroke=${stk} strokeWidth="1"/>
      </g>`;
      return html`<g key=${i}>
        <polyline points=${CW+','+c1+' '+(CW-4)+','+c1+' '+(CW-4)+','+c2+' '+CW+','+c2} fill="none" stroke=${stk} strokeWidth="1"/>
        <line x1=${CW-4} y1=${mid} x2="0" y2=${ic} stroke=${stk} strokeWidth="1"/>
      </g>`;
    })}
  </svg>`;
}

function BFinalConn(p) {
  var thm = useLang().thm || THEMES.dark;
  var H=p.H,CW=p.CW,dir=p.dir,stk=thm.inv(.15);
  var c1=H/4,c2=3*H/4,mid=H/2;
  return html`<svg style=${{width:CW+'px',height:H+'px',flexShrink:0,display:'block'}} viewBox=${'0 0 '+CW+' '+H}>
    ${dir==='lr'
      ? html`<polyline points=${'0,'+c1+' 4,'+c1+' 4,'+c2+' 0,'+c2} fill="none" stroke=${stk} strokeWidth="1"/>
             <line x1="4" y1=${mid} x2=${CW} y2=${mid} stroke=${stk} strokeWidth="1"/>`
      : html`<polyline points=${CW+','+c1+' '+(CW-4)+','+c1+' '+(CW-4)+','+c2+' '+CW+','+c2} fill="none" stroke=${stk} strokeWidth="1"/>
             <line x1=${CW-4} y1=${mid} x2="0" y2=${mid} stroke=${stk} strokeWidth="1"/>`
    }
  </svg>`;
}

// - Full mirrored bracket (driven by cascadeKO) -
function BracketView(p) {
  var lctx=useLang(); var t=lctx.t; var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var preds=p.preds;
  if(!preds) return html`<div style=${{textAlign:'center',padding:'60px 20px',color:thm.inv(.3)}}>${t.bracketNoPreds}</div>`;

  var C = useMemo(function(){
    return cascadeKO(preds.groups, preds.ko||{});
  }, [preds]);

  var ch=C.champion, ru=null;
  if(C.finalTeams&&C.finalTeams.length>0) ru=C.finalTeams.find(function(x){return x!==ch;})||null;
  var thirds=C.thirdTeams||[];
  var thirdWin=C.thirdWin;

  var H=512, PH=20, PW=160, CW=20;

  // Build flat team arrays for each column half
  // Each round: pairs of [home,away] from fixtures in order
  // Left half = first 8 R32 fixtures, Right half = last 8
  function colFromFixtures(fixtures, resultMap, half) {
    var half8 = half==='left' ? fixtures.slice(0,8) : fixtures.slice(8);
    var out = [];
    half8.forEach(function(f){
      var r = resultMap[f.id];
      out.push(r&&r.home||null);
      out.push(r&&r.away||null);
    });
    return out;
  }

  function colFromKO(fixtures, resultMap, half) {
    var n=fixtures.length, h=n/2;
    var half_f = half==='left' ? fixtures.slice(0,h) : fixtures.slice(h);
    var out=[];
    half_f.forEach(function(f){
      var r=resultMap[f.id];
      out.push(r&&r.home||null);
      out.push(r&&r.away||null);
    });
    return out;
  }

  var lR32 = colFromFixtures(R32_FIXTURES, C.r32, 'left');
  var rR32 = colFromFixtures(R32_FIXTURES, C.r32, 'right');
  var lR16 = colFromKO(KO_BRACKET.r16, C.r16, 'left');
  var rR16 = colFromKO(KO_BRACKET.r16, C.r16, 'right');
  var lQF  = colFromKO(KO_BRACKET.qf,  C.qf,  'left');
  var rQF  = colFromKO(KO_BRACKET.qf,  C.qf,  'right');
  var lSF  = [C.sf['sf_0']&&C.sf['sf_0'].home||null, C.sf['sf_0']&&C.sf['sf_0'].away||null];
  var rSF  = [C.sf['sf_1']&&C.sf['sf_1'].home||null, C.sf['sf_1']&&C.sf['sf_1'].away||null];

  
  // r32teams = R32 winners (advance to R16), r16teams = R16 winners (advance to QF), etc.
  var lR32adv = C.r32teams.slice(0, 8);   // winners of fixtures 0-7
  var rR32adv = C.r32teams.slice(8);      // winners of fixtures 8-15
  var lR16adv = C.r16teams.slice(0, 4);   // winners of r16 0-3
  var rR16adv = C.r16teams.slice(4);      // winners of r16 4-7
  var lQFadv  = C.qfteams.slice(0, 2);
  var rQFadv  = C.qfteams.slice(2);
  // SF advancing: winner of each SF goes to the Final
  var lSFadv  = C.sf['sf_0']&&C.sf['sf_0'].winner ? [C.sf['sf_0'].winner] : [];
  var rSFadv  = C.sf['sf_1']&&C.sf['sf_1'].winner ? [C.sf['sf_1'].winner] : [];

  
  // e.g. lR32 pair 0 = r32_0, pair 1 = r32_1, ...
  function scoreMap(matchIds) {
    var out = {};
    matchIds.forEach(function(id, i) {
      var sc = preds.ko && preds.ko[id];
      if (sc && sc.h !== '' && sc.h !== undefined) {
        out[i] = sc.h + '-' + sc.a;
      }
    });
    return out;
  }

  var lR32ids = ['r32_0','r32_1','r32_2','r32_3','r32_4','r32_5','r32_6','r32_7'];
  var rR32ids = ['r32_8','r32_9','r32_10','r32_11','r32_12','r32_13','r32_14','r32_15'];
  var lR16ids = ['r16_0','r16_1','r16_2','r16_3'];
  var rR16ids = ['r16_4','r16_5','r16_6','r16_7'];
  var lQFids  = ['qf_0','qf_1'];
  var rQFids  = ['qf_2','qf_3'];
  var lSFids  = ['sf_0'];
  var rSFids  = ['sf_1'];

  function col(label, teams, adv, matchIds) {
    return html`<${BCol} label=${label} teams=${teams} next=${adv} H=${H} PW=${PW} PH=${PH} scores=${scoreMap(matchIds)}/>`;
  }
  function cn(outer, inner, dir) {
    return html`<${BConn} outer=${outer} inner=${inner} dir=${dir} H=${H} CW=${CW}/>`;
  }
  function fc(dir) {
    return html`<${BFinalConn} H=${H} CW=${CW} dir=${dir}/>`;
  }

  return html`<div>
    <div class="bscroll" style=${{paddingTop:4,paddingBottom:12}}>

      <div style=${{display:'flex',alignItems:'flex-end',gap:0,minWidth:'1700px',marginBottom:6}}>
        ${[
          {label:t.r32, w:PW},
          {label:'', w:CW},
          {label:t.r16, w:PW},
          {label:'', w:CW},
          {label:t.qf,  w:PW},
          {label:'', w:CW},
          {label:t.sf,  w:PW},
          {label:'', w:CW},
          {label:'\ud83c\udfc6', w:170},
          {label:'', w:CW},
          {label:t.sf,  w:PW},
          {label:'', w:CW},
          {label:t.qf,  w:PW},
          {label:'', w:CW},
          {label:t.r16, w:PW},
          {label:'', w:CW},
          {label:t.r32, w:PW},
        ].map(function(col,i){
          return html`<div key=${i} style=${{
            width:col.w+'px',flexShrink:0,textAlign:'center',
            fontSize:9,fontWeight:700,
            color:thm.inv(.35),letterSpacing:'.05em',
            whiteSpace:'nowrap',overflow:'hidden'
          }}>${col.label}</div>`;
        })}
      </div>

      <div style=${{display:'flex',alignItems:'flex-start',gap:0,minWidth:'1700px'}}>

        ${col(t.r32, lR32, lR32adv, lR32ids)}
        ${cn(lR32, lR16, 'lr')}
        ${col(t.r16, lR16, lR16adv, lR16ids)}
        ${cn(lR16, lQF, 'lr')}
        ${col(t.qf,  lQF,  lQFadv, lQFids)}
        ${cn(lQF, lSF, 'lr')}
        ${col(t.sf,  lSF,  lSFadv, lSFids)}
        ${fc('lr')}

        <div style=${{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
          height:H+'px',width:'170px',flexShrink:0,padding:'0 8px'}}>
          <div style=${{padding:'8px 10px',borderRadius:10,textAlign:'center',width:'100%',marginBottom:4,
            background:ch?thm.a(.15):thm.inv(.04),
            border:(ch?thm.bdra(2,.5):thm.bdr(2,.1))}}>
            ${ch
              ? html`<${FlagImg} team=${ch}/><div style=${{fontWeight:700,color:thm.accent,fontSize:12,marginTop:3}}>${teamName(ch,lang)}</div>`
              : html`<div style=${{fontSize:9,color:thm.inv(.25),fontStyle:'italic',padding:'4px 0'}}>TBD</div>`}
          </div>       

          ${C.final&&C.final.score&&html`<div style=${{display:'flex',alignItems:'center',gap:4,
            background:thm.a(.14),border:thm.bdra(1,.3),
            borderRadius:6,padding:'3px 10px',marginBottom:8,width:'100%',justifyContent:'center'}}>
            ${(function(){
              var champIsHome = C.final.home === ch;
              var cs = champIsHome ? C.final.score.h : C.final.score.a;
              var rs = champIsHome ? C.final.score.a : C.final.score.h;
              return html`
                <span style=${{fontSize:9,color:thm.inv(.5)}}>${ch?teamName(ch,lang):'?'}</span>
                <span style=${{fontWeight:800,fontSize:14,color:thm.accent,letterSpacing:2}}>${cs}-${rs}</span>
                <span style=${{fontSize:9,color:thm.inv(.5)}}>${ru?teamName(ru,lang):'?'}</span>
              `;
            })()}
          </div>`}
          
          ${thirds.filter(Boolean).length>0&&html`<div style=${{width:'100%'}}>
            <div style=${{fontSize:9,fontWeight:700,color:'rgba(180,83,9,.7)',textAlign:'center',marginBottom:4}}>${'\ud83e\udd49'} 3rd</div>
            ${thirds.slice(0,2).filter(Boolean).map(function(t3){
              var isW=t3===thirdWin;
              return html`<div key=${t3} style=${{display:'flex',alignItems:'center',gap:5,padding:'3px 6px',borderRadius:5,marginBottom:3,
                background:isW?'rgba(180,83,9,.15)':thm.inv(.04),
                border:'1px solid '+(isW?'rgba(180,83,9,.4)':thm.inv(.08))}}>
                <${FlagImg} team=${t3}/>
                <span style=${{fontSize:9,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                  color:isW?'#fb923c':thm.inv(.5)}}>${teamName(t3,lang)}</span>
                ${isW&&html`<span style=${{fontSize:8,color:'#fb923c'}}>-</span>`}
              </div>`;
            })}
          </div>`}
        </div>

        ${fc('rl')}
        ${col(t.sf,  rSF,  rSFadv, rSFids)}
        ${cn(rQF, rSF, 'rl')}
        ${col(t.qf,  rQF,  rQFadv, rQFids)}
        ${cn(rR16, rQF, 'rl')}
        ${col(t.r16, rR16, rR16adv, rR16ids)}
        ${cn(rR32, rR16, 'rl')}
        ${col(t.r32, rR32, rR32adv, rR32ids)}

      </div>
    </div>
    <p style=${{fontSize:10,color:thm.inv(.22),marginTop:6,textAlign:'center'}}>${t.bracketSub}</p>
  </div>`;
}

// - Bracket scores table below the bracket -
function BracketScoreTable(p) {
  var thm = useLang().thm || THEMES.dark;
  var C=p.C, ko=p.ko, lang=p.lang, t=p.t;
  if(!ko||Object.keys(ko).length===0) return null;

  // Build match rows for each round
  function mkRows(fixtures, resultMap) {
    return fixtures.map(function(f){
      var r=resultMap[f.id];
      var sc=ko[f.id];
      if(!sc||sc.h===undefined||sc.h==='') return null;
      var w=koWinner(sc);
      return {id:f.id,home:r&&r.home||null,away:r&&r.away||null,
              h:sc.h,a:sc.a,winner:w==='home'?r&&r.home:w==='away'?r&&r.away:null};
    }).filter(Boolean);
  }

  var rounds=[
    {label:t.r32,  rows:mkRows(R32_FIXTURES,C.r32)},
    {label:t.r16,  rows:mkRows(KO_BRACKET.r16,C.r16)},
    {label:t.qf,   rows:mkRows(KO_BRACKET.qf,C.qf)},
    {label:t.sf,   rows:mkRows(KO_BRACKET.sf,C.sf)},
  ];
  // Final and 3rd
  if(ko['s3rd']&&ko['s3rd'].h!==undefined&&ko['s3rd'].h!==''){
    var sc3=ko['s3rd'];
    var w3=koWinner(sc3);
    rounds.push({label:t.thirdMatch,rows:[{id:'s3rd',home:C.s3rd&&C.s3rd.home,away:C.s3rd&&C.s3rd.away,h:sc3.h,a:sc3.a,winner:w3==='home'?C.s3rd&&C.s3rd.home:w3==='away'?C.s3rd&&C.s3rd.away:null}]});
  }
  if(ko['final']&&ko['final'].h!==undefined&&ko['final'].h!==''){
    var scf=ko['final'];
    var wf=koWinner(scf);
    rounds.push({label:t.final,rows:[{id:'final',home:C.final&&C.final.home,away:C.final&&C.final.away,h:scf.h,a:scf.a,winner:wf==='home'?C.final&&C.final.home:wf==='away'?C.final&&C.final.away:null}]});
  }

  var hasAny=rounds.some(function(r){return r.rows.length>0;});
  if(!hasAny) return null;

  return html`<div style=${{marginTop:20,borderTop:thm.bdr(1,.07),paddingTop:16}}>
    <div style=${{fontSize:12,fontWeight:700,color:thm.inv(.4),marginBottom:12}}>
      Predicted scores
    </div>
    ${rounds.filter(function(r){return r.rows.length>0;}).map(function(rd){
      return html`<div key=${rd.label} style=${{marginBottom:14}}>
        <div style=${{fontSize:10,fontWeight:700,color:thm.inv(.3),marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>${rd.label}</div>
        <div style=${{display:'flex',flexDirection:'column',gap:4}}>
          ${rd.rows.map(function(m){
            var hw=m.winner===m.home, aw=m.winner===m.away;
            return html`<div key=${m.id} style=${{
              display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'center',gap:8,
              background:thm.inv(.04),border:thm.bdr(1,.07),
              borderRadius:8,padding:'6px 12px'
            }}>
              <div style=${{display:'flex',alignItems:'center',justifyContent:'flex-end',gap:5,overflow:'hidden'}}>
                <span style=${{fontSize:11,fontWeight:hw?600:400,color:hw?thm.inv(.9):thm.inv(.45),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>${m.home?teamName(m.home,lang):'TBD'}</span>
                ${m.home&&html`<${FlagImg} team=${m.home} dim=${!hw}/>`}
              </div>
              <div style=${{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                <span style=${{fontWeight:800,fontSize:15,minWidth:14,textAlign:'right',color:hw?'#fbbf24':thm.inv(.5)}}>${m.h}</span>
                <span style=${{color:thm.inv(.2),fontSize:11}}>-</span>
                <span style=${{fontWeight:800,fontSize:15,minWidth:14,textAlign:'left',color:aw?'#fbbf24':thm.inv(.5)}}>${m.a}</span>
              </div>
              <div style=${{display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
                ${m.away&&html`<${FlagImg} team=${m.away} dim=${!aw}/>`}
                <span style=${{fontSize:11,fontWeight:aw?600:400,color:aw?thm.inv(.9):thm.inv(.45),overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>${m.away?teamName(m.away,lang):'TBD'}</span>
              </div>
            </div>`;
          })}
        </div>
      </div>`;
    })}
  </div>`;
}
