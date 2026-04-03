// - Home / landing page -
function HomeView(p) {
  var lctx=useLang();var t=lctx.t;var lang=lctx.lang;
  var participants = p.participants, results = p.results, settings = p.settings, setView = p.setView;

  var rC = useMemo(function(){ return cascadeKO(results.groups, results.ko||{}); }, [results]);
  var ranked = useMemo(function(){
    return participants
      .map(function(x){ return Object.assign({}, x, calcScore(x.preds, results, settings.scoring)); })
      .sort(function(a, b){ return cmpTb(a, b, rC); });
  }, [participants, results, settings, rC]);

  var human = participants.filter(function(x){ return x.id !== "claude_bot"; });
  var total = human.length * settings.entryFee;

  var chCounts = useMemo(function(){
    var counts = {};
    participants.forEach(function(x){
      var xC=cascadeKO(x.preds&&x.preds.groups, x.preds&&x.preds.ko||{}, x.preds&&x.preds.tiebreaker);
      if(xC.champion) counts[xC.champion]=(counts[xC.champion]||0)+1;
    });
    return counts;
  }, [participants]);
  var topCh = Object.entries(chCounts).sort(function(a,b){ return b[1] - a[1]; });

  var gFilled = Object.keys(results.groups || {}).filter(function(k){
    return results.groups[k] && results.groups[k].h !== "";
  }).length;
  var koFilled = Object.keys(results.ko || {}).filter(function(k){
    return results.ko[k] && results.ko[k].h !== "";
  }).length;

  // Deadline logic
  var now = new Date();
  var deadline = settings.deadline ? new Date(settings.deadline) : null;
  var isPastDeadline = deadline && now > deadline;
  var deadlineStr = deadline ? deadline.toLocaleDateString(lang==="es"?"es-AU":"en-AU",
    {weekday:"short",day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}) : null;
  var msLeft = deadline ? deadline - now : null;
  var daysLeft = msLeft ? Math.ceil(msLeft / (1000*60*60*24)) : null;

  // First-visit tour
  var tourDone = false;
  try { tourDone = !!localStorage.getItem("wc26_tour_done"); } catch(e){}
  var tourState = useState(tourDone ? 0 : 1);
  var tourStep = tourState[0], setTourStep = tourState[1];

  function tourNext() {
    if (tourStep === 1) { setTourStep(2); }
    else { try{ localStorage.setItem("wc26_tour_done","1"); }catch(e){} setTourStep(0); }
  }
  function tourSkip() {
    try{ localStorage.setItem("wc26_tour_done","1"); }catch(e){}
    setTourStep(0);
  }

  var tourSteps = {
    1: {
      title: lang==="es" ? "\ud83c\uddea\ud83c\uddf8 Idioma / Language" : "\ud83c\uddea\ud83c\uddf8 Language",
      body: lang==="es"
        ? "La app est\u00e1 disponible en Espa\u00f1ol e Ingl\u00e9s. Usa el bot\u00f3n en la esquina superior derecha para cambiar el idioma."
        : "The app is available in English and Spanish. Use the button in the top-right corner to switch languages.",
      next: lang==="es" ? "Siguiente \u2192" : "Next \u2192"
    },
    2: {
      title: lang==="es" ? "\ud83d\udccc Reglas del Juego" : "\ud83d\udccc Game Rules",
      body: lang==="es"
        ? "Puedes ver y descargar las Reglas del Juego usando el enlace debajo de los botones principales."
        : "You can view and download the Game Rules using the link below the main buttons.",
      next: lang==="es" ? "\u2713 Entendido" : "\u2713 Got it"
    }
  };
  var currentStep = tourSteps[tourStep] || tourSteps[1];

  // Modal state
  var popupState = useState(null); var popup = popupState[0], setPopup = popupState[1];

  return html`<div className="fade" style=${{ maxWidth:780, margin:"0 auto", padding:"28px 16px 60px" }}>

    ${popup&&html`<div className="modal-overlay" onClick=${function(){setPopup(null);}}>
      <div className="modal-content" onClick=${function(e){e.stopPropagation();}}>

        ${popup==="scoring"&&html`<div>
          <h3 className="bb" style=${{fontSize:22,color:"#fbbf24",marginBottom:16}}>
            ${"\ud83d\udcca " + t.scoringTitle}
          </h3>
          <div style=${{marginBottom:14,textAlign:"left"}}>
            <div style=${{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.4)",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>${t.perMatch}</div>
            ${[[t.result,"3pts","#4ade80"],[t.goalsA,"1pt","#60a5fa"],[t.goalsB,"1pt","#60a5fa"],[t.gdiff,"2pts","#fbbf24"]].map(function(si){
              return html`<div key=${si[0]} style=${{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderRadius:8,marginBottom:4,background:"rgba(255,255,255,.05)"}}>
                <span style=${{fontSize:13,color:"rgba(255,255,255,.75)"}}>${si[0]}</span>
                <span style=${{fontWeight:800,color:si[2],fontSize:14}}>${si[1]}</span>
              </div>`;
            })}
          </div>
          <div style=${{marginBottom:16,textAlign:"left"}}>
            <div style=${{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.4)",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>${t.perTeam}</div>
            ${[[t.r32,"1pt","#a78bfa"],[t.r16,"2pts","#a78bfa"],[t.qf,"4pts","#f472b6"],[t.sf,"6pts","#f472b6"],[t.final,"10pts","#fbbf24"],[t.thirdMatch,"8pts","#fb923c"],[t.thirdWin,"15pts","#fb923c"],[t.champion,"20pts","#fbbf24"]].map(function(ki){
              return html`<div key=${ki[0]} style=${{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderRadius:8,marginBottom:4,background:"rgba(255,255,255,.05)"}}>
                <span style=${{fontSize:13,color:"rgba(255,255,255,.75)"}}>${ki[0]}</span>
                <span style=${{fontWeight:800,color:ki[2],fontSize:14}}>${ki[1]}</span>
              </div>`;
            })}
          </div>
          <p style=${{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:16,lineHeight:1.6}}>${t.tiebreak}</p>
        </div>`}

        ${popup==="prizes"&&html`<div>
          <h3 className="bb" style=${{fontSize:22,color:"#fbbf24",marginBottom:16}}>
            ${"\ud83c\udfc6 " + t.prizesTitle}
          </h3>
          <div style=${{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            ${[{pct:50,l:"\ud83e\udd47 1\u00ba lugar"},{pct:25,l:"\ud83e\udd48 2\u00ba lugar"},{pct:15,l:"\ud83e\udd49 3\u00ba lugar"}].map(function(pi){
              return html`<div key=${pi.l} style=${{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:12,background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)"}}>
                <span style=${{fontSize:14,fontWeight:600}}>${pi.l}</span>
                <div style=${{textAlign:"right"}}>
                  <div style=${{fontSize:18,fontWeight:800,color:"#fbbf24"}}>${settings.currency} ${Math.floor(total*pi.pct/100)}</div>
                  <div style=${{fontSize:11,color:"rgba(255,255,255,.4)"}}>${pi.pct}%</div>
                </div>
              </div>`;
            })}
          </div>
          <div style=${{padding:"12px 14px",borderRadius:12,background:"rgba(99,102,241,.1)",border:"1px solid rgba(99,102,241,.3)",marginBottom:16,textAlign:"left"}}>
            <div style=${{fontSize:12,fontWeight:700,color:"#818cf8",marginBottom:5}}>\ud83c\udfe6 ${lang==="es"?"M\u00e9todo de pago":"Payment method"}</div>
            <p style=${{fontSize:13,color:"rgba(255,255,255,.7)",lineHeight:1.7,margin:0}}>
              ${t.prizesBody}
            </p>
          </div>
          <p style=${{fontSize:11,color:"rgba(255,255,255,.3)",marginBottom:16}}>
            ${t.adminFee}: ${settings.currency} ${Math.floor(total*.1)} \u00b7 ${human.length}\u00d7${settings.currency}${settings.entryFee}
          </p>
        </div>`}

        <button onClick=${function(){setPopup(null);}} style=${{
          width:"100%",padding:"11px",borderRadius:10,border:"none",cursor:"pointer",
          background:"linear-gradient(135deg,#fbbf24,#f59e0b)",
          color:"#000",fontWeight:700,fontSize:14,fontFamily:"'DM Sans',sans-serif",
          boxShadow:"0 4px 14px rgba(245,158,11,.39)"
        }}>${t.close}</button>
      </div>
    </div>`}

    ${tourStep>0&&html`<div>
      <div onClick=${tourSkip} style=${{
        position:"fixed",top:0,left:0,right:0,bottom:0,
        background:"rgba(0,0,0,.55)",zIndex:998,cursor:"pointer"
      }}></div>
      <div style=${{
        position:"fixed",top:"50%",left:"50%",
        transform:"translate(-50%,-50%)",
        zIndex:999,background:"#1a2540",
        border:"2px solid rgba(245,158,11,.5)",
        borderRadius:18,padding:"24px 28px",
        maxWidth:340,width:"90vw",
        boxShadow:"0 20px 60px rgba(0,0,0,.6)"
      }}>
        <div style=${{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div style=${{fontSize:16,fontWeight:700,color:"#fbbf24"}}>${currentStep.title}</div>
          <div style=${{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:2}}>${tourStep}/2</div>
        </div>
        <p style=${{fontSize:14,color:"rgba(255,255,255,.75)",lineHeight:1.7,marginBottom:20}}>
          ${currentStep.body}
        </p>
        <div style=${{display:"flex",gap:8}}>
          <button onClick=${tourSkip} style=${{
            flex:1,padding:"9px",borderRadius:9,border:"1px solid rgba(255,255,255,.15)",
            background:"transparent",color:"rgba(255,255,255,.4)",
            cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"
          }}>${lang==="es"?"Saltar":"Skip"}</button>
          <button onClick=${tourNext} style=${{
            flex:2,padding:"9px",borderRadius:9,border:"none",
            background:"linear-gradient(135deg,#f59e0b,#d97706)",
            color:"#000",cursor:"pointer",fontSize:13,fontWeight:700,
            fontFamily:"'DM Sans',sans-serif"
          }}>${currentStep.next}</button>
        </div>
        <div style=${{display:"flex",gap:6,justifyContent:"center",marginTop:14}}>
          ${[1,2].map(function(i){
            return html`<div key=${i} style=${{
              width:i===tourStep?20:6,height:6,borderRadius:99,
              background:i===tourStep?"#f59e0b":"rgba(255,255,255,.2)",
              transition:"all .2s"
            }}></div>`;
          })}
        </div>
      </div>
    </div>`}

    ${isPastDeadline&&html`<div style=${{
      padding:"10px 16px",borderRadius:10,marginBottom:14,
      background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.25)",
      fontSize:13,color:"#f87171",textAlign:"center"
    }}>
      \ud83d\udd12 ${lang==="es"?"Las predicciones cerraron el":"Predictions closed on"} ${deadlineStr}
    </div>`}

    ${!isPastDeadline&&deadlineStr&&daysLeft<=14&&html`<div style=${{
      padding:"10px 16px",borderRadius:10,marginBottom:14,
      background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",
      fontSize:13,color:"rgba(245,158,11,.9)",textAlign:"center"
    }}>
      \u23f0 ${lang==="es"?"Cierre de predicciones en":"Predictions close in"} ${daysLeft} ${lang==="es"?"d\u00edas \u2014 ":"days \u2014 "}${deadlineStr}
    </div>`}

    <div style=${{ textAlign:"center", padding:"34px 20px",
      background:"linear-gradient(135deg,rgba(245,158,11,.1),rgba(217,119,6,.04))",
      borderRadius:22, border:"1.5px solid rgba(245,158,11,.18)", marginBottom:20 }}>
      <div style=${{ fontSize:52, marginBottom:10 }}>\u26bd</div>
      <h1 className="bb" style=${{ fontSize:42, lineHeight:1,
        background:"linear-gradient(135deg,#fbbf24,#f59e0b)",
        WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>${t.title}</h1>
      <p style=${{ color:"rgba(255,255,255,.42)", fontSize:13, marginTop:10, lineHeight:1.7 }}>${t.sub}</p>
      <div style=${{ marginTop:20, display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
        ${!isPastDeadline&&html`<${Btn} onClick=${function(){ setView("predict"); }} sx=${{ padding:"12px 28px", fontSize:15 }}>\u26bd ${t.predict}</${Btn}>`}
        ${isPastDeadline&&html`<${Btn} v="secondary" disabled=${true} sx=${{ padding:"12px 28px", fontSize:15 }}>\ud83d\udd12 ${lang==="es"?"Predicciones cerradas":"Predictions closed"}</${Btn}>`}
        <${Btn} v="secondary" onClick=${function(){ setView("bracket"); }} sx=${{ padding:"12px 20px", fontSize:15 }}>\ud83c\udfc6 ${t.bracket}</${Btn}>
        <${Btn} v="secondary" onClick=${function(){ setView("leaderboard"); }} sx=${{ padding:"12px 20px", fontSize:15 }}>${t.table}</${Btn}>
      </div>
      <div style=${{ marginTop:12 }}>
        <button onClick=${function(){ generateTCPDF(settings, lang); }} style=${{
          background:"none",border:"none",color:"rgba(255,255,255,.35)",
          fontSize:12,cursor:"pointer",textDecoration:"underline",
          fontFamily:"'DM Sans',sans-serif"
        }}>\ud83d\udccc ${lang==="es"?"Reglas del Juego (PDF)":"Game Rules (PDF)"}</button>
      </div>
    </div>


    <div style=${{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:18 }}>
      ${[
        { e:"\ud83d\udc65", v:human.length,              l:t.participants },
        { e:"\ud83d\udcb0", v:settings.currency+" "+total, l:t.inPlay       },
        { e:"\u26bd",       v:(gFilled+koFilled)+"/104",   l:t.loaded        }
      ].map(function(s){
        return html`<${Card} key=${s.l} sx=${{ textAlign:"center", padding:"15px 8px" }}>
          <div style=${{ fontSize:22, marginBottom:3 }}>${s.e}</div>
          <div className="bb" style=${{ fontSize:20, color:"#f59e0b", lineHeight:1.1 }}>${s.v}</div>
          <div style=${{ fontSize:11, color:"rgba(255,255,255,.38)", marginTop:3 }}>${s.l}</div>
        </${Card}>`;
      })}
    </div>


    <div style=${{display:"flex",gap:10,marginBottom:18}}>
      <button onClick=${function(){setPopup("prizes");}} style=${{
        flex:1,padding:"13px",borderRadius:12,cursor:"pointer",
        background:"rgba(251,191,36,.08)",border:"1.5px solid rgba(251,191,36,.25)",
        color:"#fbbf24",fontWeight:700,fontSize:14,fontFamily:"'DM Sans',sans-serif",
        transition:"all .15s"
      }}>\ud83c\udfc6 ${lang==="es"?"Ver Premios":"See Prizes"}</button>
      <button onClick=${function(){setPopup("scoring");}} style=${{
        flex:1,padding:"13px",borderRadius:12,cursor:"pointer",
        background:"rgba(99,102,241,.08)",border:"1.5px solid rgba(99,102,241,.25)",
        color:"#a5b4fc",fontWeight:700,fontSize:14,fontFamily:"'DM Sans',sans-serif",
        transition:"all .15s"
      }}>\ud83d\udcca ${lang==="es"?"Ver Puntaje":"See Scoring"}</button>
    </div>


    ${ranked.length > 0 && html`<${Card} sx=${{ padding:0, overflow:"hidden", marginBottom:18 }}>
      <div style=${{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,.07)",
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style=${{ fontWeight:700, fontSize:15 }}>${t.table}</span>
        <button onClick=${function(){ setView("leaderboard"); }} style=${{
          background:"none", border:"none", color:"#f59e0b", fontSize:13, cursor:"pointer", fontWeight:600 }}>\u2192</button>
      </div>
      ${ranked.slice(0,5).map(function(px, i){
        return html`<div key=${px.id} style=${{ display:"flex", alignItems:"center", gap:12, padding:"12px 20px",
          borderBottom:"1px solid rgba(255,255,255,.05)",
          background: i===0 ? "rgba(245,158,11,.06)" : "transparent" }}>
          <span style=${{ width:26, textAlign:"center", fontSize:i<3?18:13, fontWeight:800,
            color: i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#b45309":"rgba(255,255,255,.22)" }}>
            ${i===0?"\ud83e\udd47":i===1?"\ud83e\udd48":i===2?"\ud83e\udd49":i+1}
          </span>
          <span style=${{ flex:1, fontWeight:500, fontSize:14 }}>${px.name}</span>
          <span style=${{ fontWeight:800, color:"#f59e0b", fontSize:18 }}>${px.pts}</span>
          <span style=${{ color:"rgba(255,255,255,.3)", fontSize:12 }}>pts</span>
        </div>`;
      })}
    </${Card}>`}


    ${topCh.length > 0 && html`<${Card}>
      <div style=${{ fontWeight:700, fontSize:13, marginBottom:12, color:"rgba(255,255,255,.65)" }}>\ud83c\udfc6 ${lang==="es"?"Predicciones de Campeón de los Participantes":"Participant Champion Picks"}</div>
      <div style=${{ display:"flex", flexWrap:"wrap", gap:7 }}>
        ${topCh.map(function(tc){
          return html`<div key=${tc[0]} style=${{ display:"flex", alignItems:"center", gap:6,
            background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)",
            borderRadius:10, padding:"6px 11px" }}>
            <span style=${{ fontSize:16 }}><${FlagImg} team=${tc[0]}/></span>
            <span style=${{ fontSize:13, fontWeight:500 }}>${teamName(tc[0],lang)}</span>
            <span style=${{ fontSize:12, fontWeight:700, color:"#f59e0b" }}>${tc[1]}\u00d7</span>
          </div>`;
        })}
      </div>
    </${Card}>`}
  </div>`;
}

// - Bracket page -
function BracketPage(p) {
  var lctx=useLang();var t=lctx.t;var lang=lctx.lang;
  var participants = p.participants;
  var def = participants.find(function(x){ return x.id === "claude_bot"; }) || participants[0];
  var selState = useState(def ? def.id : "");
  var selId = selState[0], setSelId = selState[1];
  var tabState = useState("bracket");
  var activeTab = tabState[0], setActiveTab = tabState[1];
  var activeGState = useState("A");
  var activeG = activeGState[0], setActiveG = activeGState[1];

  var me = participants.find(function(x){ return x.id === selId; }) || participants[0];

  return html`<div className="fade" style=${{ maxWidth:780, margin:"0 auto", padding:"24px 16px 60px" }}>
    <div style=${{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <span style=${{ fontSize:32 }}>\ud83c\udfc6</span>
      <div>
        <h2 className="bb" style=${{ fontSize:28 }}>${t.bracketTitle}</h2>
        <p style=${{ color:"rgba(255,255,255,.4)", fontSize:13 }}>${t.bracketSub}</p>
      </div>
    </div>

    <div style=${{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
      ${participants.map(function(px){
        return html`<button key=${px.id} onClick=${function(){ setSelId(px.id); }} style=${{
          padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
          border:"1.5px solid " + (selId===px.id ? "#f59e0b" : "rgba(255,255,255,.1)"),
          background: selId===px.id ? "rgba(245,158,11,.12)" : "rgba(255,255,255,.04)",
          color: selId===px.id ? "#fbbf24" : "rgba(255,255,255,.6)",
          fontFamily:"'DM Sans',sans-serif"
        }}>${px.name}</button>`;
      })}
    </div>

    <div style=${{ display:"flex", gap:6, marginBottom:20 }}>
      ${[{id:"bracket",l:"\ud83c\udfc6 "+t.bracket},{id:"groups",l:"\ud83c\uddf3 "+t.groupStage}].map(function(tb){
        return html`<button key=${tb.id} onClick=${function(){ setActiveTab(tb.id); }} style=${{
          padding:"7px 16px", borderRadius:9, fontSize:13, fontWeight:600, cursor:"pointer",
          border:"none", transition:"all .15s",
          background: activeTab===tb.id ? "#f59e0b" : "rgba(255,255,255,.07)",
          color: activeTab===tb.id ? "#000" : "rgba(255,255,255,.6)",
          fontFamily:"'DM Sans',sans-serif"
        }}>${tb.l}</button>`;
      })}
    </div>

    ${activeTab === "bracket" && (me
      ? html`<${BracketView} preds=${me.preds}/>`
      : html`<div style=${{ textAlign:"center", padding:"60px", color:"rgba(255,255,255,.3)" }}>${t.bracketNoPreds}</div>`
    )}

    ${activeTab === "groups" && html`<div>
      <div style=${{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
        ${["A","B","C","D","E","F","G","H","I","J","K","L"].map(function(g){
          return html`<button key=${g} onClick=${function(){ setActiveG(g); }} style=${{
            padding:"5px 10px", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer",
            border:"1.5px solid "+(activeG===g?"#f59e0b":"rgba(255,255,255,.1)"),
            background:activeG===g?"rgba(245,158,11,.12)":"transparent",
            color:activeG===g?"#fbbf24":"rgba(255,255,255,.5)",
            fontFamily:"'DM Sans',sans-serif"
          }}>${g}</button>`;
        })}
      </div>
      ${me && html`<${StandingsTable}
        group=${activeG}
        preds=${me.preds&&me.preds.groups}
        allPreds=${me.preds&&me.preds.groups}
      />`}
    </div>`}
  </div>`;
}
