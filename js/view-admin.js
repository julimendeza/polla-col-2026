// - Admin panel (password protected) -
function AdminView(p) {
  var lctx=useLang();var t=lctx.t;var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var authState = useState(false); var auth    = authState[0],  setAuth    = authState[1];
  var pwState   = useState("");    var pw      = pwState[0],    setPw      = pwState[1];
  var errState  = useState("");    var authErr = errState[0],   setAuthErr = errState[1];
  var tabState  = useState("results"); var tab = tabState[0],  setTab     = tabState[1];

  function tryAuth() {
    if (pw === p.settings.adminPw) { setAuth(true); setAuthErr(""); }
    else setAuthErr("\u274c Wrong password");
  }

  if (!auth) return html`<div className="fade" style=${{ maxWidth:360, margin:"0 auto", padding:"60px 16px", textAlign:"center" }}>
    <div style=${{ fontSize:44, marginBottom:10 }}>\ud83d\udd10</div>
    <h2 className="bb" style=${{ fontSize:30 }}>${t.adminTitle}</h2>
    <p style=${{ color:thm.inv(.4), fontSize:13, margin:"8px 0 22px" }}>Organizer only</p>
    <${Card}>
      <input type="password" value=${pw}
        onInput=${function(e){ setPw(e.target.value); }}
        onKeyDown=${function(e){ if(e.key==="Enter") tryAuth(); }}
        placeholder="Password" style=${{ marginBottom:12 }}/>
      ${authErr && React.createElement('p', {style:{color:'#f87171',fontSize:13,marginBottom:12}}, authErr)}
      <${Btn} onClick=${tryAuth} full=${true} sx=${{ padding:"13px", fontSize:15 }}>Enter</${Btn}>
    </${Card}>
  </div>`;

  var tabs = [
    { id:"results",  l:t.results   },
    { id:"parts",    l:t.partTab   },
    { id:"stats",    l:"\ud83d\udcca Estad\u00edsticas" },
    { id:"picks",    l:"\ud83c\udfaf Selecciones"    },
    { id:"email",    l:t.emailTab  },
    { id:"data",     l:"\ud83d\udcbe Datos"          },
    { id:"access",   l:"\ud83d\udd11 Acceso"         },
    { id:"settings", l:t.settingsTab }
  ];

  return html`<div className="fade" style=${{ maxWidth:780, margin:"0 auto", padding:"24px 16px 60px" }}>
    <div style=${{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
      <h2 className="bb" style=${{ fontSize:26, margin:0 }}>\ud83d\udee0 ${t.adminTitle}</h2>
      <div style=${{display:"flex",alignItems:"center",gap:6,fontSize:11,
        color:p.dbStatus==="firebase"?"#4ade80":thm.inv(.35)}}>
        <span style=${{width:7,height:7,borderRadius:"50%",background:p.dbStatus==="firebase"?"#4ade80":thm.inv(.25),display:"inline-block"}}></span>
        ${p.dbStatus==="firebase"?"Firebase":"Local only"}
      </div>
    </div>

    <div style=${{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:18 }}>
      ${tabs.map(function(tx){
        return html`<button key=${tx.id} onClick=${function(){ setTab(tx.id); }} style=${{
          padding:"7px 14px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer",
          border:"none", transition:"all .15s",
          background: tab===tx.id ? thm.accent : thm.inv(.07),
          color:      tab===tx.id ? "#000"    : thm.inv(.6),
          fontFamily:"'DM Sans',sans-serif"
        }}>${tx.l}</button>`;
      })}
    </div>

    ${tab==="results"  && html`<${AdminResults}  results=${p.results}       saveResults=${p.saveResults}/>`}
    ${tab==="parts"    && html`<${AdminParts}    participants=${p.participants} results=${p.results} settings=${p.settings} saveParticipants=${p.saveParticipants}/>`}
    ${tab==="playoffs" && html`<${AdminPlayoffs} settings=${p.settings} saveSettings=${p.saveSettings}/>`}
    ${tab==="stats"    && html`<${AdminStats}    participants=${p.participants} results=${p.results} settings=${p.settings}/>`}
    ${tab==="picks"    && html`<${AdminPicks}    participants=${p.participants} results=${p.results}/>`}
    ${tab==="email"    && html`<${AdminEmail}    participants=${p.participants} results=${p.results} settings=${p.settings} saveSettings=${p.saveSettings}/>`}
    ${tab==="data"     && html`<${AdminData}     participants=${p.participants} results=${p.results} settings=${p.settings} saveParticipants=${p.saveParticipants} saveResults=${p.saveResults} saveSettings=${p.saveSettings}/>`}
    ${tab==="access"   && html`<${AdminAccess}   settings=${p.settings} saveSettings=${p.saveSettings}/>`}
    ${tab==="settings" && html`<${AdminSettings} settings=${p.settings}     saveSettings=${p.saveSettings}/>`}
  </div>`;
}

// - Admin Results tab -
function AdminResults(p) {
  var lctx=useLang(); var t=lctx.t; var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var locState=useState({
    groups: Object.assign({}, p.results.groups||{}),
    ko:     Object.assign({}, p.results.ko||{})
  });
  var loc=locState[0], setLoc=locState[1];
  var secState=useState("groups"); var sec=secState[0],      setSec=secState[1];
  var gState  =useState("A");      var activeG=gState[0],    setActiveG=gState[1];
  var koState =useState("r32");    var activeKO=koState[0],  setActiveKO=koState[1];
  var msgState=useState("");       var msg=msgState[0],      setMsg=msgState[1];

  var r32info=useMemo(function(){return getR32(loc.groups);}, [loc.groups]);
  var C=useMemo(function(){return cascadeKO(loc.groups,loc.ko||{});}, [loc]);
  var gIdx=GROUPS.indexOf(activeG);
  var koRoundDef=KO_ROUNDS.find(function(r){return r.id===activeKO;})||KO_ROUNDS[0];
  var koIdx=KO_ROUNDS.findIndex(function(r){return r.id===activeKO;});

  async function save(){await p.saveResults(loc);setMsg(t.savedOk);setTimeout(function(){setMsg("");},2000);}

  function setGR(id,side,v){
    setLoc(function(prev){
      var ng=Object.assign({},prev.groups);
      ng[id]=Object.assign({},ng[id]||{});ng[id][side]=v;
      return Object.assign({},prev,{groups:ng});
    });
  }
  function setKOR(matchId,val){
    setLoc(function(prev){
      var nk=Object.assign({},prev.ko||{});
      if(val===null){delete nk[matchId];}
      else{nk[matchId]=Object.assign({},nk[matchId]||{},val);}
      return Object.assign({},prev,{ko:nk});
    });
  }

  return html`<div>
    <div style=${{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <p style=${{fontSize:13,color:thm.inv(.4)}}>${t.enterRes}</p>
      <div style=${{display:"flex",alignItems:"center",gap:10}}>
        ${msg&&html`<span style=${{color:"#4ade80",fontSize:13}}>${msg}</span>`}
        <${Btn} onClick=${save} sx=${{padding:"8px 18px",fontSize:14}}>${t.saveBtn}</${Btn}>
      </div>
    </div>

    <div style=${{display:"flex",gap:8,marginBottom:16}}>
      ${[{id:"groups",l:t.groupsS},{id:"knockout",l:t.knockoutS}].map(function(s){
        return html`<button key=${s.id} onClick=${function(){setSec(s.id);}} style=${{
          flex:1,padding:"10px 16px",borderRadius:10,cursor:"pointer",
          border:"2px solid "+(sec===s.id?thm.accent:thm.inv(.1)),
          background:sec===s.id?thm.a(.1):thm.inv(.03),
          fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,
          color:sec===s.id?thm.accent:thm.inv(.6)
        }}>${s.l}</button>`;
      })}
    </div>

    ${sec==="groups"&&html`<${Card}>
      <${GroupTabs} active=${activeG} onChange=${setActiveG} preds=${loc} isResult=${true}/>
      <div style=${{fontSize:11,color:thm.inv(.3),marginBottom:8}}>${t.groupLabel} ${activeG}: ${TBG[activeG].map(function(tm){return teamName(tm,lang);}).join(" - ")}</div>
      ${[0,1,2].map(function(md){
        var mdMatches=GMS[activeG].slice(md*2,md*2+2);
        return html`<div key=${md}>
          <div style=${{fontSize:10,fontWeight:700,color:thm.inv(.25),letterSpacing:".08em",
            marginTop:md===0?0:14,marginBottom:5,textTransform:"uppercase"}}>Matchday ${md+1}</div>
          ${mdMatches.map(function(m){
            return html`<${MRow} key=${m.id} match=${m}
              hv=${loc.groups&&loc.groups[m.id]&&loc.groups[m.id].h||""}
              av=${loc.groups&&loc.groups[m.id]&&loc.groups[m.id].a||""}
              onH=${function(v){setGR(m.id,"h",v);}} onA=${function(v){setGR(m.id,"a",v);}}/>`;
          })}
        </div>`;
      })}
      <${StandingsTable} group=${activeG} preds=${loc.groups} allPreds=${loc.groups}/>
      <div style=${{display:"flex",justifyContent:"space-between",marginTop:14}}>
        <${Btn} v="secondary" disabled=${gIdx===0} onClick=${function(){setActiveG(GROUPS[gIdx-1]);}} sx=${{padding:"7px 14px",fontSize:13}}>- ${GROUPS[gIdx-1]||""}</${Btn}>
        <${Btn} v="secondary" disabled=${gIdx===11} onClick=${function(){setActiveG(GROUPS[gIdx+1]);}} sx=${{padding:"7px 14px",fontSize:13}}>${GROUPS[gIdx+1]||""} -</${Btn}>
      </div>
    </${Card}>`}

    ${sec==="knockout"&&html`<${Card}>
      <div style=${{marginBottom:10,padding:"8px 12px",borderRadius:10,fontSize:11,
        background:r32info.complete?"rgba(74,222,128,.07)":thm.a(.07),
        border:"1px solid "+(r32info.complete?"rgba(74,222,128,.2)":thm.a(.2)),
        color:r32info.complete?"#4ade80":thm.a(.8)}}>
        ${r32info.complete?"- "+t.r32ok:"- "+t.r32missing+" ("+r32info.groupsDone+"/12)"}
      </div>
      <div style=${{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
        ${KO_ROUNDS.map(function(rd){
          var filled=Object.keys(loc.ko||{}).filter(function(k){
            return rd.fixtures.some(function(f){return f.id===k;});
          }).length;
          var total=rd.fixtures.length;
          var done=filled===total&&total>0;
          return html`<button key=${rd.id} onClick=${function(){setActiveKO(rd.id);}} style=${{
            padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",
            border:"1.5px solid "+(activeKO===rd.id?thm.accent:done?"rgba(74,222,128,.4)":thm.inv(.1)),
            background:activeKO===rd.id?thm.accent:done?"rgba(74,222,128,.08)":"transparent",
            color:activeKO===rd.id?"#000":done?"#4ade80":thm.inv(.5),
            fontFamily:"'DM Sans',sans-serif"
          }}>${done&&activeKO!==rd.id?"- ":""}${rd.label} (${filled}/${total})</button>`;
        })}
      </div>
      <div style=${{marginBottom:12,paddingBottom:10,borderBottom:thm.bdr(1,.08)}}>
        <h3 class="bb" style=${{fontSize:18}}>${koRoundDef.label}</h3>
      </div>
      ${koRoundDef.fixtures.map(function(f){
        var matchObj=null;
        if(f.id==="final")      matchObj=C.final;
        else if(f.id==="s3rd")  matchObj=C.s3rd;
        else if(C.r32&&C.r32[f.id]) matchObj=C.r32[f.id];
        else if(C.r16&&C.r16[f.id]) matchObj=C.r16[f.id];
        else if(C.qf&&C.qf[f.id])   matchObj=C.qf[f.id];
        else if(C.sf&&C.sf[f.id])   matchObj=C.sf[f.id];
        var sc=loc.ko&&loc.ko[f.id]||{};
        var disp={id:f.id,home:matchObj&&matchObj.home||null,away:matchObj&&matchObj.away||null};
        return html`<${KOMatchRow} key=${f.id} match=${disp} sc=${sc} isResult=${true}
          onChange=${function(val){setKOR(f.id,val);}}/>`;
      })}
      <div style=${{display:"flex",gap:10,marginTop:14}}>
        ${koIdx>0&&html`<${Btn} v="secondary" onClick=${function(){setActiveKO(KO_ROUNDS[koIdx-1].id);}} sx=${{padding:"9px 14px",fontSize:13}}>- ${KO_ROUNDS[koIdx-1].label}</${Btn}>`}
        ${koIdx<KO_ROUNDS.length-1&&html`<${Btn} onClick=${function(){setActiveKO(KO_ROUNDS[koIdx+1].id);}} sx=${{flex:"1",padding:"11px"}}>- ${KO_ROUNDS[koIdx+1].label}</${Btn}>`}
      </div>
    </${Card}>`}
  </div>`;
}


// - Admin Participants tab -
function AdminParts(p) {
  var lctx=useLang();var t=lctx.t;var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var ranked = useMemo(function(){
    return p.participants
      .map(function(x){ return Object.assign({}, x, calcScore(x.preds, p.results, p.settings.scoring)); })
      .sort(function(a,b){ return cmpTb(a,b,p.results); });
  }, [p.participants, p.results, p.settings]);

  async function del(id) {
    if (id === "claude_bot") { alert(t.noDelClaude); return; }
    if (!confirm(t.delConfirm)) return;
    await p.saveParticipants(p.participants.filter(function(x){ return x.id !== id; }));
  }

  return html`<div>
    <div style=${{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:8}}>
      <p style=${{ fontSize:13, color:thm.inv(.4) }}>
        ${p.participants.filter(function(x){ return x.id!=="claude_bot"; }).length} ${t.participants} (+Claude \ud83e\udd16)
      </p>
      <${Btn} v="secondary" onClick=${async function(){
        for(var i=0;i<ranked.length;i++){
          await generateReportPDF(ranked[i],p.results,p.settings,lang);
          await new Promise(function(r){setTimeout(r,400);});
        }
      }} sx=${{padding:"8px 14px",fontSize:12}}>
        \ud83d\udcca ${lang==="es"?"Generar todos los reportes":"Generate all reports"}
      </${Btn}>
    </div>
    ${ranked.map(function(px, i){
      return html`<${Card} key=${px.id} sx=${{
        marginBottom:8,
        background: px.id==="claude_bot" ? thm.a(.05) : thm.inv(.04),
        border: px.id==="claude_bot" ? thm.bdra(1.5,.15) : thm.bdr(1.5,.08)
      }}>
        <div style=${{display:"flex",alignItems:"center",gap:12}}>
          <span style=${{ width:28, textAlign:"center", fontWeight:800, fontSize:i<3?18:13,
            color: i===0?thm.accent:i===1?"#94a3b8":i===2?"#b45309":thm.inv(.28) }}>
            ${i===0?"\ud83e\udd47":i===1?"\ud83e\udd48":i===2?"\ud83e\udd49":i+1}
          </span>
          <div style=${{ flex:1 }}>
            <div style=${{ fontWeight:600, fontSize:14, display:"flex", alignItems:"center", gap:6 }}>
              ${px.name}
              ${px.id==="claude_bot" && html`<span style=${{ fontSize:10, background:thm.a(.2), color:thm.accent, borderRadius:4, padding:"1px 5px", fontWeight:700 }}>BOT</span>`}
            </div>
            <div style=${{ fontSize:12, color:thm.inv(.32) }}>${px.email}</div>
            <div style=${{ fontSize:11, color:thm.inv(.22), marginTop:2, display:"flex", alignItems:"center", gap:4 }}>
              \ud83c\udfc6
              ${px.preds && px.preds.champion
                ? html`<${FlagImg} team=${px.preds.champion}/> ${px.preds.champion}`
                : "\u2014"}
            </div>
          </div>
          <div style=${{display:"flex",alignItems:"center",gap:8}}>
            <div style=${{ fontWeight:800, color:thm.accent, fontSize:18 }}>${px.pts} pts</div>
            <button onClick=${function(){ generateReportPDF(px,p.results,p.settings,lang); }} style=${{
              background:"rgba(59,130,246,.12)",border:"1px solid rgba(59,130,246,.3)",
              color:"#93c5fd",borderRadius:8,padding:"6px 10px",cursor:"pointer",
              fontSize:11,fontWeight:600,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"
            }}>\ud83d\udcca PDF</button>
            <button onClick=${function(){ del(px.id); }} style=${{
              background:"none", border:"none", color:"#f87171", fontSize:20, cursor:"pointer", opacity:.55, padding:4
            }}>\u00d7</button>
          </div>
        </div>
      </${Card}>`;
    })}
    ${p.participants.length === 0 && html`<${Card} sx=${{ textAlign:"center", padding:"50px", color:thm.inv(.3) }}>${t.noPart}</${Card}>`}
  </div>`;
}

// - Admin Email tab -
function AdminEmail(p) {
  var lctx=useLang();var t=lctx.t;var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var cfgState    = useState(Object.assign({}, p.settings.ejs));
  var cfg = cfgState[0], setCfg = cfgState[1];
  var statusState = useState(""); var status  = statusState[0], setStatus  = statusState[1];
  var sendingState= useState(false); var sending = sendingState[0], setSending = sendingState[1];
  var etState     = useState("invite"); var emailType = etState[0], setEmailType = etState[1];

  var human = p.participants.filter(function(x){ return x.id !== "claude_bot"; });
  var total = human.length * p.settings.entryFee;

  var chC = {};
  human.forEach(function(x){ if(x.preds&&x.preds.champion) chC[x.preds.champion]=(chC[x.preds.champion]||0)+1; });
  var topCh = Object.entries(chC).sort(function(a,b){ return b[1]-a[1]; })[0];

  async function saveCfg() {
    await p.saveSettings(Object.assign({}, p.settings, { ejs: cfg }));
    setStatus("\u2705"); setTimeout(function(){ setStatus(""); }, 2000);
  }

  async function sendAll() {
    var tpl = emailType === "invite" ? cfg.tpl_invite : cfg.tpl_update;
    if (!cfg.svc || !tpl || !cfg.key) { setStatus("\u274c Fill in EmailJS config"); return; }
    if (!human.length) { setStatus("\u274c No participants"); return; }
    setSending(true);
    try {
      await loadEJS();
      window.emailjs.init(cfg.key);
      var ranked = human.map(function(x){ return Object.assign({},x,calcScore(x.preds,p.results,p.settings.scoring)); })
                        .sort(function(a,b){ return cmpTb(a,b,p.results); });
      var cs = Object.entries(chC).sort(function(a,b){return b[1]-a[1];}).map(function(e){return e[0]+" ("+e[1]+")";}).join(", ");
      var ok = 0;
      for (var i = 0; i < ranked.length; i++) {
        var px = ranked[i];
        setStatus("\ud83d\udce8 " + px.name + "... (" + (i+1) + "/" + ranked.length + ")");
        try {
          await window.emailjs.send(cfg.svc, tpl, {
            to_email: px.email, to_name: px.name, rank: i+1, total_p: ranked.length,
            points: px.pts, currency: p.settings.currency, entry_fee: p.settings.entryFee,
            prize_total: total, prize_1st: Math.floor(total*.5), prize_2nd: Math.floor(total*.25),
            prize_3rd: Math.floor(total*.15), admin_fee: Math.floor(total*.1),
            leader: ranked[0].name, leader_pts: ranked[0].pts,
            champion_summary: cs,
            top_champion: topCh ? topCh[1]+" people have "+topCh[0] : ""
          });
          ok++;
        } catch(e) { console.error(e); }
        if (i < ranked.length - 1) await new Promise(function(r){ setTimeout(r, 500); });
      }
      setStatus("\u2705 Sent " + ok + "/" + ranked.length);
    } catch(e) { setStatus("\u274c " + e.message); }
    setSending(false);
  }

  return html`<div>

    <div style=${{ background:thm.a(.08), border:thm.bdra(1.5,.25), borderRadius:14, padding:"16px", marginBottom:18 }}>
      <div style=${{ fontWeight:700, fontSize:14, marginBottom:12, color:thm.accent }}>\ud83d\udd14 ${t.adminNotifTitle}</div>
      <${Field} label=${t.adminEmailL}>
        <input type="email" value=${p.settings.adminEmail||""}
          onInput=${function(e){ p.saveSettings(Object.assign({},p.settings,{adminEmail:e.target.value})); }}
          placeholder=${t.adminEmailPh}/>
      </${Field}>
      <${Field} label=${t.tplAdmin}>
        <input value=${cfg.tpl_admin||""}
          onInput=${function(e){ setCfg(function(prev){ return Object.assign({},prev,{tpl_admin:e.target.value}); }); }}
          placeholder="template_xxxxxxx" style=${{ fontFamily:"monospace" }}/>
      </${Field}>
      <div style=${{ background:"rgba(0,0,0,.2)", borderRadius:10, padding:"12px", fontSize:12, color:thm.inv(.45) }}>
        <strong style=${{ color:thm.inv(.7), display:"block", marginBottom:5 }}>${t.ejsVars}</strong>
        <code style=${{ fontSize:10, color:thm.a(.8) }}>to_email, participant_name, participant_email, is_update, total_participants, group_predictions, knockout_predictions, submitted_at</code>
      </div>
    </div>


    <div style=${{ display:"flex", gap:8, marginBottom:18 }}>
      ${[{id:"invite",l:t.invEmail},{id:"update",l:t.updateEmail}].map(function(e){
        return html`<button key=${e.id} onClick=${function(){ setEmailType(e.id); }} style=${{
          flex:1, padding:"10px", borderRadius:10, cursor:"pointer",
          border:"2px solid " + (emailType===e.id?thm.accent:thm.inv(.1)),
          background: emailType===e.id?thm.a(.1):thm.inv(.03),
          fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:13,
          color: emailType===e.id?thm.accent:thm.inv(.6)
        }}>${e.l}</button>`;
      })}
    </div>


    <${Card} sx=${{ marginBottom:18, background:"rgba(0,0,0,.2)" }}>
      <div style=${{ fontSize:10, fontWeight:700, color:thm.inv(.3), marginBottom:10, letterSpacing:".08em" }}>${t.prevLabel}</div>
      <div style=${{ background:"#fff", borderRadius:10, padding:"18px", color:"#222", fontSize:13, lineHeight:1.85, fontFamily:"Arial,sans-serif" }}>
        ${emailType === "invite"
          ? html`<p><strong>Hey dear football friends,</strong></p>
              <p>The 2026 FIFA World Cup is just around the corner! Predict group stage scores (app auto-calculates who qualifies for the Round of 32), then pick teams advancing each knockout round.</p>
              <p>\ud83d\udc49 <strong>[SWEEPSTAKE WEBSITE LINK]</strong></p>
              <p>Register: <strong>${p.settings.currency} ${p.settings.entryFee}</strong> \u2014 Pay Julian Mendez (Nequi / Bancolombia \u00b7 *** pendiente ***) \u00b7 Deadline: <strong>${p.settings.deadline ? new Date(p.settings.deadline).toLocaleDateString("en-CO",{day:"numeric",month:"long",year:"numeric"}) : "June 10, 2026"}</strong>.</p>
              <p>More players = bigger prize! Please share with friends.</p>
              <p><strong>Good luck! \u26bd\ufe0e\ud83c\udfc6 - Julian</strong></p>`
          : html`<p><strong>Hello everyone!</strong></p>
              <p>Here are the WC 2026 Sweepstake predictions. Please save this email as a record.</p>
              <p>We are <strong>${human.length} participants</strong> - <strong>${p.settings.currency} ${total}</strong> raised.</p>
              <p>\ud83e\udd47 1st (50%): <strong>${p.settings.currency} ${Math.floor(total*.5)}</strong><br/>
                 \ud83e\udd48 2nd (25%): <strong>${p.settings.currency} ${Math.floor(total*.25)}</strong><br/>
                 \ud83e\udd49 3rd (15%): <strong>${p.settings.currency} ${Math.floor(total*.15)}</strong></p>
              ${topCh && html`<p><strong>${topCh[1]} people</strong> have <strong>${topCh[0]}</strong> as champion.</p>`}
              <p><strong>GOOD LUCK! \u26bd\ufe0e\ud83c\udfc6 - Julian</strong></p>`
        }
      </div>
    </${Card}>


    <div style=${{ background:"rgba(59,130,246,.09)", border:"1.5px solid rgba(59,130,246,.2)", borderRadius:12, padding:"14px 16px", marginBottom:18, fontSize:13 }}>
      <strong style=${{ display:"block", marginBottom:8, color:"rgba(147,197,253,.9)" }}>${t.ejsTitle}</strong>
      <ol style=${{ paddingLeft:18, lineHeight:1.9, fontSize:12, color:"rgba(147,197,253,.7)" }}>
        <li>${t.ejsS1}</li>
        <li>${t.ejsS2}</li>
        <li>${t.ejsVars} <code style=${{ fontSize:10, background:"rgba(0,0,0,.3)", padding:"1px 5px", borderRadius:4 }}>to_name, to_email, total_p, currency, entry_fee, prize_total, prize_1st, prize_2nd, prize_3rd, admin_fee, points, rank, leader, leader_pts, champion_summary, top_champion</code></li>
      </ol>
    </div>


    <div style=${{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
      ${[
        {k:"svc",       l:t.svcId,      ph:"service_xxxxxxx"},
        {k:"tpl_invite",l:t.tplInvite,  ph:"template_xxxxxxx"},
        {k:"tpl_update",l:t.tplUpdate,  ph:"template_xxxxxxx"},
        {k:"key",       l:t.pubKey,     ph:"xxxxxxxxxxxxxxxxxxxx"}
      ].map(function(f){
        return html`<${Field} key=${f.k} label=${f.l}>
          <input value=${cfg[f.k]||""}
            onInput=${function(e){ setCfg(function(prev){ var n=Object.assign({},prev); n[f.k]=e.target.value; return n; }); }}
            placeholder=${f.ph} style=${{ fontFamily:"monospace" }}/>
        </${Field}>`;
      })}
    </div>


    <div style=${{ display:"flex", gap:10, flexWrap:"wrap" }}>
      <${Btn} v="secondary" onClick=${saveCfg}>${t.saveCfg}</${Btn}>
      <${Btn} onClick=${sendAll} disabled=${sending||human.length===0}>
        ${sending ? t.sending : (emailType==="invite" ? t.sendInv : t.sendUpd) + " " + human.length}
      </${Btn}>
    </div>
    ${status && html`<p style=${{ marginTop:12, fontSize:13, color:thm.inv(.75) }}>${status}</p>`}
  </div>`;
}

// - Admin Playoffs tab — confirm playoff winners -
function AdminPlayoffs(p) {
  var lctx=useLang(); var lang=lctx.lang; var es=lang==="es";
  var thm=lctx.thm||THEMES.dark;
  var msgState=useState(""); var msg=msgState[0], setMsg=msgState[1];

  // Local copy of playoffs from settings
  var playoffs = Object.assign({}, DEF.playoffs, p.settings.playoffs||{});

  // Group mapping for context
  var groupMap = {
    "Playoff A":"B","Playoff B":"F","Playoff C":"D",
    "Playoff D":"A","Playoff 1":"K","Playoff 2":"I"
  };

  async function confirm(key, winner) {
    var updated = Object.assign({}, playoffs);
    updated[key] = Object.assign({}, updated[key], { winner:winner, confirmed:true });
    var newSettings = Object.assign({}, p.settings, { playoffs: updated });
    await p.saveSettings(newSettings);
    setMsg("\u2705 " + key + " \u2192 " + winner);
    setTimeout(function(){ setMsg(""); }, 3000);
  }

  async function unconfirm(key) {
    var updated = Object.assign({}, playoffs);
    updated[key] = Object.assign({}, updated[key], { winner:"", confirmed:false });
    var newSettings = Object.assign({}, p.settings, { playoffs: updated });
    await p.saveSettings(newSettings);
  }

  async function updateFinalists(key, field, value) {
    var updated = Object.assign({}, playoffs);
    updated[key] = Object.assign({}, updated[key]);
    updated[key][field] = value;
    var newSettings = Object.assign({}, p.settings, { playoffs: updated });
    await p.saveSettings(newSettings);
  }

  var confirmedCount = Object.values(playoffs).filter(function(v){ return v.confirmed; }).length;
  var total = Object.keys(playoffs).length;

  return html`<div style=${{maxWidth:560}}>

    <div style=${{marginBottom:18}}>
      <div style=${{fontWeight:700,fontSize:15,marginBottom:4}}>
        ${es?"Confirmaci\u00f3n de Equipos Playoff":"Playoff Team Confirmation"}
      </div>
      <div style=${{fontSize:13,color:thm.inv(.45),lineHeight:1.7,marginBottom:10}}>
        ${es
          ? "Los finalistas ya est\u00e1n pre-cargados. Despu\u00e9s de las finales del 31 de marzo, selecciona el ganador de cada partido para reemplazar el marcador de posici\u00f3n en toda la app."
          : "Finalists are pre-loaded from March 26 results. After the March 31 finals, select the winner of each match to replace the placeholder across the whole app."}
      </div>
      <div style=${{display:"flex",alignItems:"center",gap:8}}>
        <div style=${{height:6,flex:1,borderRadius:99,background:thm.inv(.08)}}>
          <div style=${{height:6,borderRadius:99,background:"linear-gradient(90deg,#f59e0b,#4ade80)",
            width:(confirmedCount/total*100)+"%",transition:"width .3s"}}></div>
        </div>
        <span style=${{fontSize:12,color:thm.inv(.4)}}>${confirmedCount}/${total} ${es?"confirmados":"confirmed"}</span>
      </div>
    </div>

    <div style=${{display:"flex",flexDirection:"column",gap:10}}>
      ${Object.entries(playoffs).map(function(entry){
        var key=entry[0], val=entry[1];
        var grp=groupMap[key];
        var confirmed=val.confirmed&&val.winner;

        return html`<div key=${key} style=${{
          borderRadius:14,padding:"14px 16px",
          background:confirmed?"rgba(74,222,128,.06)":thm.inv(.04),
          border:"1.5px solid "+(confirmed?"rgba(74,222,128,.25)":thm.inv(.09))
        }}>
          <div style=${{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div>
              <span style=${{fontWeight:700,fontSize:14,color:confirmed?"#4ade80":thm.accent}}>${key}</span>
              <span style=${{fontSize:11,color:thm.inv(.3),marginLeft:8}}>
                ${es?"Grupo":"Group"} ${grp}
              </span>
            </div>
            ${confirmed&&html`<div style=${{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
              <span style=${{color:"#4ade80"}}>\u2713 ${val.winner}</span>
              <button onClick=${function(){ unconfirm(key); }} style=${{
                background:"none",border:"none",color:thm.inv(.3),
                cursor:"pointer",fontSize:11,fontFamily:"'DM Sans',sans-serif",padding:"2px 6px",
                borderRadius:5,border:thm.bdr(1,.1)
              }}>${es?"Cambiar":"Change"}</button>
            </div>`}
          </div>

          ${!confirmed&&html`<div>
            <div style=${{fontSize:11,color:thm.inv(.35),marginBottom:8}}>
              ${es?"Final del 31 de marzo — \u00bfQui\u00e9n gan\u00f3?":"March 31 final — Who won?"}
            </div>
            <div style=${{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
              <input type="text" value=${val.teamA||""}
                onInput=${function(e){ updateFinalists(key,"teamA",e.target.value); }}
                style=${{flex:1,minWidth:100,padding:"8px 12px",fontSize:13,fontWeight:600}}
                placeholder="Team A"/>
              <span style=${{color:thm.inv(.3),alignSelf:"center",fontSize:13}}>vs</span>
              <input type="text" value=${val.teamB||""}
                onInput=${function(e){ updateFinalists(key,"teamB",e.target.value); }}
                style=${{flex:1,minWidth:100,padding:"8px 12px",fontSize:13,fontWeight:600}}
                placeholder="Team B"/>
            </div>
            <div style=${{display:"flex",gap:8}}>
              ${[val.teamA,val.teamB].filter(Boolean).map(function(team){
                return html`<button key=${team} onClick=${function(){ confirm(key,team); }} style=${{
                  flex:1,padding:"9px 12px",borderRadius:10,cursor:"pointer",
                  border:thm.bdra(2,.4),
                  background:thm.a(.1),
                  color:thm.accent,fontWeight:700,fontSize:13,
                  fontFamily:"'DM Sans',sans-serif",transition:"all .15s"
                }}>\ud83c\udfc6 ${team}</button>`;
              })}
            </div>
          </div>`}
        </div>`;
      })}
    </div>

    ${msg&&html`<div style=${{marginTop:14,padding:"10px 14px",borderRadius:10,
      background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",
      fontSize:13,color:"#4ade80"}}>${msg}</div>`}

    ${confirmedCount===total&&html`<div style=${{marginTop:16,padding:"14px",borderRadius:12,
      background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.25)",
      fontSize:13,color:"#4ade80",textAlign:"center",lineHeight:1.7}}>
      \u2705 ${es?"Todos los equipos confirmados. Los nombres se han actualizado en toda la app y todos los participantes pueden actualizar sus predicciones.":"All teams confirmed. Names are now live across the whole app — remind participants to update their predictions!"}
    </div>`}
  </div>`;
}

// - Admin Picks tab — team nomination matrix -
function AdminPicks(p) {
  var lctx=useLang(); var lang=lctx.lang; var es=lang==="es";
  var thm=lctx.thm||THEMES.dark;
  var filterState=useState(""); var filter=filterState[0], setFilter=filterState[1];
  var sortState=useState("r32"); var sortCol=sortState[0], setSortCol=sortState[1];

  // Check actual results for highlighting
  var rC = useMemo(function(){
    return cascadeKO(p.results.groups, p.results.ko||{});
  }, [p.results]);

  var cols=[
    {key:"r32teams",   label:"R32",   short:"R32"},
    {key:"r16teams",   label:"R16",   short:"R16"},
    {key:"qfteams",    label:es?"Cuartos":"QF",  short:"QF"},
    {key:"sfteams",    label:es?"Semis":"SF",     short:"SF"},
    {key:"finalTeams", label:"Final", short:"Fin"},
    {key:"champion",   label:es?"Camp.":"Champ",  short:"Ch"},
    {key:"thirdTeams", label:es?"3ro":"3rd",      short:"3rd"},
    {key:"thirdWin",   label:es?"3ro W":"3rd W",  short:"3W"},
  ];

  // Cascade each participant's predictions
  var human = useMemo(function(){
    return p.participants.filter(function(x){return x.id!=="claude_bot";});
  }, [p.participants]);
  var total = human.length || 1;

  var cascades = useMemo(function(){
    return human.map(function(px){
      return cascadeKO(px.preds&&px.preds.groups, px.preds&&px.preds.ko||{});
    });
  }, [human]);

  // Build pick counts: pickCounts[team][colKey] = count
  var pickCounts = useMemo(function(){
    var counts={};
    // Init all teams
    GROUPS.forEach(function(g){ TBG[g].forEach(function(t){ counts[t]={}; }); });

    cascades.forEach(function(C){
      cols.forEach(function(c){
        var teams=C[c.key];
        if(!teams) return;
        if(typeof teams==="string") teams=[teams]; // champion/thirdWin are strings
        teams.filter(Boolean).forEach(function(t){
          if(!counts[t]) counts[t]={};
          counts[t][c.key]=(counts[t][c.key]||0)+1;
        });
      });
    });
    return counts;
  }, [cascades]);

  // Sort teams by chosen column descending, then by name
  var allTeams = useMemo(function(){
    return Object.keys(pickCounts)
      .filter(function(t){ return !filter||t.toLowerCase().indexOf(filter.toLowerCase())>=0; })
      .sort(function(a,b){
        var av=pickCounts[a]&&pickCounts[a][sortCol]||0;
        var bv=pickCounts[b]&&pickCounts[b][sortCol]||0;
        return bv-av||a.localeCompare(b);
      });
  }, [pickCounts, sortCol, filter]);

  // Max per column for colour scaling
  var maxPer = useMemo(function(){
    var m={};
    cols.forEach(function(c){
      m[c.key]=Math.max.apply(null,Object.values(pickCounts).map(function(t){return t[c.key]||0;}).concat([1]));
    });
    return m;
  }, [pickCounts]);

  // Check if team actually reached this round in results
  function actuallyReached(team, colKey) {
    var arr=rC[colKey];
    if(!arr) return false;
    if(typeof arr==="string") return arr===team;
    return arr.indexOf(team)>=0;
  }

  var cellStyle = function(v, colKey, team) {
    var ratio = maxPer[colKey]>0 ? v/maxPer[colKey] : 0;
    var reached = actuallyReached(team, colKey);
    var bg = v===0 ? "transparent"
      : reached ? "rgba(74,222,128,"+(0.15+ratio*0.5)+")"
      : thm.a(0.1+ratio*0.5);
    var color = v===0 ? thm.inv(.12)
      : reached ? "#4ade80"
      : v===maxPer[colKey] ? "#fff" : thm.accent;
    return {padding:"6px 4px",textAlign:"center",background:bg,borderRadius:4,
      fontWeight:v>0?700:400,color:color,fontSize:12,cursor:"pointer"};
  };

  return html`<div>
    <div style=${{display:"flex",alignItems:"center",gap:10,marginBottom:14,flexWrap:"wrap"}}>
      <input type="text" value=${filter}
        onInput=${function(e){setFilter(e.target.value);}}
        placeholder=${es?"Buscar equipo...":"Filter team..."}
        style=${{maxWidth:200,padding:"7px 12px",fontSize:13}}/>
      <div style=${{fontSize:12,color:thm.inv(.35)}}>
        ${human.length} ${es?"participantes (sin Claude)":"participants (excl. Claude)"}
        \u00a0\u00b7\u00a0
        <span style=${{color:"#4ade80"}}>\u25a6</span> = ${es?"clasificado real":"actual result"}
        \u00a0
        <span style=${{color:thm.accent}}>\u25a6</span> = ${es?"prediccion":"prediction"}
      </div>
    </div>

    <div style=${{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style=${{width:"100%",borderCollapse:"collapse",minWidth:600,fontSize:12}}>
        <thead>
          <tr>
            <th style=${{padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700,
              color:thm.inv(.4),borderBottom:thm.bdr(1,.1),
              position:"sticky",left:0,background:thm.deep,minWidth:140}}>
              ${es?"Equipo":"Team"}
            </th>
            ${cols.map(function(c){
              var active=sortCol===c.key;
              return html`<th key=${c.key}
                onClick=${function(){setSortCol(c.key);}}
                style=${{padding:"8px 4px",textAlign:"center",fontSize:11,fontWeight:700,
                  color:active?thm.accent:thm.inv(.4),
                  borderBottom:thm.bdr(1,.1),
                  minWidth:48,cursor:"pointer",userSelect:"none",
                  borderBottom:active?"2px solid #f59e0b":thm.bdr(1,.1)}}>
                ${c.label}${active?" \u25bc":""}
              </th>`;
            })}
          </tr>
        </thead>
        <tbody>
          ${allTeams.map(function(team, ri){
            var hasAny=cols.some(function(c){return (pickCounts[team]&&pickCounts[team][c.key]||0)>0;});
            return html`<tr key=${team} style=${{
              borderBottom:thm.bdr(1,.04),
              background:ri%2===0?thm.inv(.015):"transparent",
              opacity:hasAny?1:0.45
            }}>
              <td style=${{padding:"7px 10px",position:"sticky",left:0,
                background:ri%2===0?thm.row1:thm.deep,
                display:"flex",alignItems:"center",gap:6}}>
                <${FlagImg} team=${team}/>
                <span style=${{fontWeight:hasAny?600:400,
                  color:hasAny?thm.inv(.85):thm.inv(.35),
                  fontSize:12}}>${teamName(team,lang)}</span>
              </td>
              ${cols.map(function(c){
                var v=pickCounts[team]&&pickCounts[team][c.key]||0;
                var pct=total>0?Math.round(v/total*100):0;
                return html`<td key=${c.key} style=${cellStyle(v,c.key,team)}
                  title=${v>0?(v+" / "+total+" ("+pct+"%)"):"0"}>
                  ${v>0?v:html`<span style=${{color:thm.inv(.1)}}>-</span>`}
                </td>`;
              })}
            </tr>`;
          })}
        </tbody>
      </table>
    </div>
    <p style=${{fontSize:11,color:thm.inv(.25),marginTop:10}}>
      ${es?"Click en columna para ordenar. Hover sobre celda para ver porcentaje.":"Click column header to sort. Hover a cell to see percentage."}
    </p>
  </div>`;
}

// - Admin Stats tab -
function AdminStats(p) {
  var lctx=useLang(); var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var sc = p.settings.scoring || DEF.scoring;

  var scored = useMemo(function(){
    return p.participants
      .map(function(px){ return Object.assign({}, px, calcScore(px.preds, p.results, sc)); })
      .sort(function(a,b){ return b.pts-a.pts; });
  }, [p.participants, p.results, sc]);

  var cols=[
    {key:"groups",    label:"Groups",  color:thm.accent},
    {key:"r32",       label:"R32",     color:"#60a5fa"},
    {key:"r16",       label:"R16",     color:"#34d399"},
    {key:"qf",        label:"QF",      color:"#a78bfa"},
    {key:"sf",        label:"SF",      color:"#fb923c"},
    {key:"thirdMatch",label:"3rd M",   color:"#f472b6"},
    {key:"final",     label:"Final",   color:thm.accent},
    {key:"thirdWin",  label:"3rd W",   color:"#e879f9"},
    {key:"champion",  label:"Champ",   color:"#4ade80"},
  ];

  // Find max per column for color intensity
  var maxVals={};
  cols.forEach(function(c){
    maxVals[c.key]=Math.max.apply(null,scored.map(function(px){
      return px.detail&&px.detail[c.key]?px.detail[c.key].earned||0:0;
    }).concat([1]));
  });

  return html`<div>
    <div style=${{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
      <div style=${{fontSize:13,color:thm.inv(.4)}}>
        ${scored.length} participantes \u00b7 ordenados por puntos totales
      </div>
      <${Btn} v="secondary" onClick=${function(){ generateSummaryPDF(p.participants,p.results,p.settings,lang); }}
        sx=${{padding:"8px 14px",fontSize:12}}>
        \ud83d\udcca ${lang==="es"?"Reporte PDF resumen":"Summary PDF Report"}
      </${Btn}>
    </div>

    <div style=${{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
      <table style=${{width:"100%",borderCollapse:"collapse",minWidth:700,fontSize:12}}>
        <thead>
          <tr>
            <th style=${{padding:"8px 10px",textAlign:"left",fontSize:11,fontWeight:700,
              color:thm.inv(.4),borderBottom:thm.bdr(1,.1),
              position:"sticky",left:0,background:thm.deep,minWidth:160}}>#  Name</th>
            ${cols.map(function(c){
              return html`<th key=${c.key} style=${{padding:"8px 6px",textAlign:"center",fontSize:11,
                fontWeight:700,color:c.color,borderBottom:thm.bdr(1,.1),
                minWidth:52}}>${c.label}</th>`;
            })}
            <th style=${{padding:"8px 10px",textAlign:"center",fontSize:12,fontWeight:800,
              color:thm.accent,borderBottom:thm.bdr(1,.1),minWidth:60}}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${scored.map(function(px,i){
            var isBot=px.id==="claude_bot";
            return html`<tr key=${px.id} style=${{
              background:i%2===0?thm.inv(.02):"transparent",
              borderBottom:thm.bdr(1,.04)
            }}>
              <td style=${{padding:"8px 10px",position:"sticky",left:0,
                background:i%2===0?thm.row1:thm.deep}}>
                <div style=${{display:"flex",alignItems:"center",gap:6}}>
                  <span style=${{fontSize:i<3?15:11,fontWeight:800,minWidth:20,
                    color:i===0?thm.accent:i===1?"#94a3b8":i===2?"#b45309":thm.inv(.3)}}>
                    ${i===0?"\ud83e\udd47":i===1?"\ud83e\udd48":i===2?"\ud83e\udd49":(i+1)}
                  </span>
                  <div>
                    <div style=${{fontWeight:600,color:thm.inv(.85),fontSize:12,
                      display:"flex",alignItems:"center",gap:4}}>
                      ${px.name}
                      ${isBot&&html`<span style=${{fontSize:9,background:thm.a(.2),
                        color:thm.accent,borderRadius:3,padding:"1px 4px"}}>BOT</span>`}
                    </div>
                  </div>
                </div>
              </td>
              ${cols.map(function(c){
                var v=px.detail&&px.detail[c.key]?px.detail[c.key].earned||0:0;
                var ratio=maxVals[c.key]>0?v/maxVals[c.key]:0;
                var alpha=ratio*0.7;
                return html`<td key=${c.key} style=${{
                  padding:"7px 6px",textAlign:"center",
                  background:v>0?"rgba("+hexToRgb(c.color)+","+alpha+")":"transparent",
                  borderRadius:4
                }}>
                  ${v>0
                    ? html`<span style=${{fontWeight:700,color:v===maxVals[c.key]?"#fff":c.color,fontSize:12}}>${v}</span>`
                    : html`<span style=${{color:thm.inv(.15),fontSize:11}}>-</span>`}
                </td>`;
              })}
              <td style=${{padding:"7px 10px",textAlign:"center"}}>
                <span style=${{fontWeight:800,fontSize:14,color:thm.accent}}>${px.pts}</span>
              </td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>
  </div>`;
}

// hex color to rgb string helper for Stats table
function hexToRgb(hex){
  var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return r+","+g+","+b;
}

// - Admin Access tab -
function AdminAccess(p) {
  var lctx=useLang(); var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var accessMode = p.settings.access || "off";

  var pinsState=useState([]); var pinList=pinsState[0], setPinList=pinsState[1];
  var loadingState=useState(true); var loading=loadingState[0], setLoading=loadingState[1];
  var newPinState=useState(""); var newPin=newPinState[0], setNewPin=newPinState[1];
  var newNameState=useState(""); var newName=newNameState[0], setNewName=newNameState[1];
  var newEmailState=useState(""); var newEmail=newEmailState[0], setNewEmail=newEmailState[1];
  var msgState=useState(""); var msg=msgState[0], setMsg=msgState[1];

  useEffect(function(){
    pins.get().then(function(list){ setPinList(list||[]); setLoading(false); });
  }, []);

  function flash(m){ setMsg(m); setTimeout(function(){ setMsg(""); }, 3000); }

  function genRandom(){
    var chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var out="";
    for(var i=0;i<6;i++) out+=chars[Math.floor(Math.random()*chars.length)];
    setNewPin(out);
  }

  async function addPin(){
    var code=(newPin||"").trim().toUpperCase();
    if(!code){ flash("\u274c Enter a PIN code."); return; }
    if(accessMode==="robust"&&(!newName.trim()||!newEmail.trim())){
      flash("\u274c Nombre y email requeridos en modo Robusto."); return;
    }
    if(pinList.find(function(x){ return x.pin===code; })){ flash("\u274c PIN already exists."); return; }
    var entry={ pin:code, name:newName.trim(), email:newEmail.trim(), used:false };
    var updated=pinList.concat([entry]);
    await pins.set(updated);
    setPinList(updated);
    setNewPin(""); setNewName(""); setNewEmail("");
    flash("\u2705 PIN added.");
  }

  async function removePin(code){
    var updated=pinList.filter(function(x){ return x.pin!==code; });
    await pins.set(updated);
    setPinList(updated);
    flash("Deleted.");
  }

  async function setMode(mode){
    await p.saveSettings(Object.assign({},p.settings,{access:mode}));
  }

  var used=pinList.filter(function(x){return x.used;}).length;
  var unused=pinList.length-used;

  var modeInfo={
    off:  lang==="es"?"Cualquier persona puede registrar predicciones sin restricci\u00f3n.":"Cualquier persona puede registrar predicciones sin restricci\u00f3n.",
    simple:lang==="es"?"El usuario ingresa un PIN v\u00e1lido, luego completa su nombre y email.":"User enters a valid PIN, then fills in their own name and email.",
    robust:lang==="es"?"El PIN est\u00e1 vinculado a nombre y email. Se precargan y bloquean para el usuario.":"PIN is pre-linked to a name and email. These are pre-filled and locked for the user."
  };

  return html`<div style=${{maxWidth:560}}>

    <div style=${{marginBottom:20}}>
      <div style=${{fontWeight:700,fontSize:14,marginBottom:12}}>Modo de acceso</div>
      <div style=${{display:"flex",flexDirection:"column",gap:8}}>
        ${["off","simple","robust"].map(function(m){
          var active=accessMode===m;
          var labels={off:"Sin PIN \u2014 Acceso abierto",simple:"Simple \u2014 PIN requerido",robust:"Robusto \u2014 PIN + identidad preconfigurada"};
          return html`<button key=${m} onClick=${function(){setMode(m);}} style=${{
            padding:"12px 16px",borderRadius:12,cursor:"pointer",textAlign:"left",
            border:"2px solid "+(active?thm.accent:thm.inv(.1)),
            background:active?thm.a(.1):thm.inv(.03),
            fontFamily:"'DM Sans',sans-serif",transition:"all .15s"
          }}>
            <div style=${{fontWeight:700,fontSize:13,color:active?thm.accent:thm.inv(.7)}}>${labels[m]}</div>
            <div style=${{fontSize:11,color:thm.inv(.4),marginTop:3}}>${modeInfo[m]}</div>
          </button>`;
        })}
      </div>
    </div>

    ${accessMode!=="off"&&html`<div>

      <div style=${{display:"flex",gap:10,marginBottom:16}}>
        <div style=${{flex:1,padding:"12px 16px",borderRadius:12,background:"rgba(74,222,128,.07)",
          border:"1px solid rgba(74,222,128,.2)",textAlign:"center"}}>
          <div style=${{fontWeight:800,fontSize:22,color:"#4ade80"}}>${unused}</div>
          <div style=${{fontSize:11,color:thm.inv(.4)}}>Unused PINs</div>
        </div>
        <div style=${{flex:1,padding:"12px 16px",borderRadius:12,background:thm.a(.07),
          border:thm.bdra(1,.2),textAlign:"center"}}>
          <div style=${{fontWeight:800,fontSize:22,color:thm.accent}}>${used}</div>
          <div style=${{fontSize:11,color:thm.inv(.4)}}>Used PINs</div>
        </div>
      </div>

      <div style=${{background:thm.inv(.04),border:thm.bdr(1,.09),
        borderRadius:14,padding:"14px 16px",marginBottom:16}}>
        <div style=${{fontWeight:700,fontSize:13,marginBottom:10}}>Add PIN</div>
        <div style=${{display:"flex",gap:8,marginBottom:accessMode==="robust"?10:0}}>
          <input type="text" value=${newPin}
            onInput=${function(e){setNewPin(e.target.value.toUpperCase());}}
            placeholder="e.g. JULI42"
            style=${{flex:1,letterSpacing:3,fontWeight:700,textTransform:"uppercase"}}/>
          <button onClick=${genRandom} style=${{
            padding:"10px 14px",borderRadius:9,border:thm.bdr(1,.15),
            background:thm.inv(.07),color:thm.inv(.7),
            cursor:"pointer",fontSize:12,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"
          }}>\ud83c\udfb2 Random</button>
        </div>
        ${accessMode==="robust"&&html`<div style=${{display:"flex",gap:8,marginBottom:0}}>
          <input type="text" value=${newName}
            onInput=${function(e){setNewName(e.target.value);}}
            placeholder="Full name"/>
          <input type="email" value=${newEmail}
            onInput=${function(e){setNewEmail(e.target.value);}}
            placeholder="Email"/>
        </div>`}
        <div style=${{marginTop:10}}>
          <${Btn} onClick=${addPin} sx=${{padding:"9px 20px"}}>Add PIN</${Btn}>
          ${msg&&html`<span style=${{marginLeft:12,fontSize:13,color:msg.startsWith("\u274c")?"#f87171":"#4ade80"}}>${msg}</span>`}
        </div>
      </div>

      ${loading?html`<p style=${{color:thm.inv(.3),fontSize:13}}>Loading...</p>`:html`
        <div style=${{display:"flex",flexDirection:"column",gap:6}}>
          ${pinList.length===0&&html`<p style=${{color:thm.inv(.3),fontSize:13}}>No PINs yet.</p>`}
          ${pinList.map(function(px){
            return html`<div key=${px.pin} style=${{
              display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
              borderRadius:10,background:px.used?"rgba(74,222,128,.05)":thm.inv(.04),
              border:"1px solid "+(px.used?"rgba(74,222,128,.2)":thm.inv(.08))
            }}>
              <span style=${{fontFamily:"monospace",fontWeight:700,fontSize:14,letterSpacing:2,
                color:px.used?"#4ade80":thm.accent,minWidth:70}}>${px.pin}</span>
              <div style=${{flex:1,fontSize:12,color:thm.inv(.5)}}>
                ${px.used
                  ? html`\u2705 Used by <strong style=${{color:thm.inv(.75)}}>${px.usedBy||px.name||"?"}</strong> ${px.usedEmail?" ("+px.usedEmail+")":""}`
                  : (px.name?html`Assigned to <strong style=${{color:thm.inv(.7)}}>${px.name}</strong>${px.email?" \u00b7 "+px.email:""}`:html`<span style=${{color:thm.inv(.3)}}>Unassigned</span>`)
                }
              </div>
              ${!px.used&&html`<button onClick=${function(){removePin(px.pin);}} style=${{
                background:"none",border:"none",color:"rgba(248,113,113,.6)",
                fontSize:18,cursor:"pointer",padding:"0 4px",lineHeight:1
              }}>\u00d7</button>`}
            </div>`;
          })}
        </div>
      `}
    </div>`}
  </div>`;
}

// - Admin Data tab -
function AdminData(p) {
  var lctx=useLang(); var t=lctx.t;
  var thm=lctx.thm||THEMES.dark;
  var msgState=useState(""); var msg=msgState[0], setMsg=msgState[1];
  var importErrState=useState(""); var importErr=importErrState[0], setImportErr=importErrState[1];

  function setStatus(m, isErr) {
    if(isErr) setImportErr(m); else setMsg(m);
    setTimeout(function(){ setMsg(""); setImportErr(""); }, 4000);
  }

  // ── Export ──────────────────────────────────────────────────────
  function exportData() {
    var snapshot = {
      exportedAt: new Date().toISOString(),
      version: 2,
      participants: p.participants,
      results:      p.results,
      settings:     p.settings
    };
    var blob = new Blob([JSON.stringify(snapshot, null, 2)], {type:"application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "quiniela2026_backup_" + new Date().toISOString().slice(0,10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded!");
  }

  // ── Import ──────────────────────────────────────────────────────
  async function importData(file, mode) {
    setImportErr("");
    try {
      var text = await file.text();
      var data = JSON.parse(text);
      if (!data.participants || !Array.isArray(data.participants)) {
        setStatus("Invalid file — missing participants array.", true); return;
      }
      if (mode === "merge") {
        // Merge: add new participants by email, skip existing ones
        var existing = p.participants;
        var existingEmails = existing.map(function(x){ return x.email.toLowerCase(); });
        var toAdd = data.participants.filter(function(x){
          return x.id !== "claude_bot" && existingEmails.indexOf(x.email.toLowerCase()) < 0;
        });
        var merged = existing.concat(toAdd);
        await p.saveParticipants(merged);
        setStatus("\u2705 Merged " + toAdd.length + " nuevos participantes (se conservaron " + (existing.length-1) + " existentes).");
      } else {
        // Replace: full overwrite
        if (data.participants) await p.saveParticipants(data.participants);
        if (data.results)      await p.saveResults(data.results);
        if (data.settings)     await p.saveSettings(data.settings);
        setStatus("\u2705 Replaced with " + data.participants.filter(function(x){return x.id!=="claude_bot";}).length + " participantes.");
      }
    } catch(e) {
      setStatus("Import failed: " + e.message, true);
    }
  }

  // ── Push to Firebase ────────────────────────────────────────────
  async function pushToFirebase() {
    if (!db._url) { setStatus("Firebase no configurado \u2014 agrega la URL en Ajustes primero.", true); return; }
    try {
      await Promise.all([
        db._fb("PUT", "wc26_p", p.participants),
        db._fb("PUT", "wc26_r", p.results),
        db._fb("PUT", "wc26_s", p.settings),
      ]);
      setStatus("All data pushed to Firebase!");
    } catch(e) {
      setStatus("Firebase push failed: " + e.message, true);
    }
  }

  var human = p.participants.filter(function(x){return x.id!=="claude_bot";});

  return html`<div style=${{maxWidth:520}}>

    <${Card} sx=${{marginBottom:16}}>
      <div style=${{fontWeight:700,fontSize:14,marginBottom:4}}>Datos actuales</div>
      <div style=${{fontSize:13,color:thm.inv(.45),lineHeight:1.9}}>
        ${human.length} participants \u00a0\u00b7\u00a0
        ${Object.keys(p.results.groups||{}).length} resultados de grupos ingresados \u00a0\u00b7\u00a0
        ${Object.keys(p.results.ko||{}).length} resultados eliminatorias ingresados
      </div>
    </${Card}>

    <div style=${{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>

      <div style=${{background:"rgba(74,222,128,.07)",border:"1px solid rgba(74,222,128,.2)",borderRadius:12,padding:"14px 16px"}}>
        <div style=${{fontWeight:700,fontSize:13,color:"#4ade80",marginBottom:6}}>Exportar copia de seguridad</div>
        <div style=${{fontSize:12,color:thm.inv(.4),marginBottom:10}}>
          Downloads all participants, results and settings as a JSON file.
          Hazlo antes de cualquier cambio importante.
        </div>
        <${Btn} onClick=${exportData} sx=${{padding:"9px 20px"}}>Descargar copia de seguridad</${Btn}>
      </div>

      <div style=${{background:"rgba(59,130,246,.07)",border:"1px solid rgba(59,130,246,.2)",borderRadius:12,padding:"14px 16px"}}>
        <div style=${{fontWeight:700,fontSize:13,color:"#93c5fd",marginBottom:6}}>Importar copia de seguridad</div>
        <div style=${{fontSize:12,color:thm.inv(.4),marginBottom:10}}>
          <strong style=${{color:"#4ade80"}}>Merge</strong> — agrega nuevos participantes del archivo, conserva los existentes (seguro).<br/>
          <strong style=${{color:"#f87171"}}>Replace</strong> — sobreescribe todo con el contenido del archivo (destructivo).
        </div>
        <div style=${{display:"flex",gap:8,flexWrap:"wrap"}}>
          <label style=${{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",
            padding:"9px 16px",borderRadius:10,background:"rgba(74,222,128,.12)",
            border:"1px solid rgba(74,222,128,.3)",fontSize:13,fontWeight:600,color:"#4ade80",
            fontFamily:"'DM Sans',sans-serif"}}>
            \u2795 Merge
            <input type="file" accept=".json" style=${{display:"none"}}
              onChange=${function(e){ if(e.target.files[0]) importData(e.target.files[0],"merge"); e.target.value=""; }}/>
          </label>
          <label style=${{display:"inline-flex",alignItems:"center",gap:6,cursor:"pointer",
            padding:"9px 16px",borderRadius:10,background:"rgba(248,113,113,.1)",
            border:"1px solid rgba(248,113,113,.3)",fontSize:13,fontWeight:600,color:"#f87171",
            fontFamily:"'DM Sans',sans-serif"}}>
            \u26a0\ufe0f Replace all
            <input type="file" accept=".json" style=${{display:"none"}}
              onChange=${function(e){ if(e.target.files[0]&&confirm("¿Esto sobreescribirá TODOS los datos actuales. ¿Estás seguro?")) importData(e.target.files[0],"replace"); e.target.value=""; }}/>
          </label>
        </div>
        ${importErr&&html`<div style=${{marginTop:8,fontSize:12,color:"#f87171"}}>${importErr}</div>`}
      </div>

      <div style=${{background:thm.a(.07),border:thm.bdra(1,.2),borderRadius:12,padding:"14px 16px"}}>
        <div style=${{fontWeight:700,fontSize:13,color:thm.accent,marginBottom:6}}>Sincronización Firebase</div>
        <div style=${{fontSize:12,color:thm.inv(.4),marginBottom:10}}>
          Sube todos los datos locales a Firebase. Úsalo después de migrar desde localStorage o tras una importación.
          Configure the Firebase URL in Settings first.
        </div>
        <${Btn} onClick=${pushToFirebase} v=${db._url?"primary":"secondary"} sx=${{padding:"9px 20px"}}>
          ${db._url?"Subir todos los datos a Firebase":"Firebase no configurado"}
        </${Btn}>
      </div>

    </div>

    ${msg&&html`<div style=${{padding:"10px 14px",borderRadius:10,background:"rgba(74,222,128,.1)",
      border:"1px solid rgba(74,222,128,.3)",fontSize:13,color:"#4ade80"}}>${msg}</div>`}
  </div>`;
}

// - Admin Settings tab -
function AdminSettings(p) {
  var lctx=useLang();var t=lctx.t;var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var locState = useState(Object.assign({}, p.settings, { scoring: Object.assign({}, p.settings.scoring) }));
  var loc = locState[0], setLoc = locState[1];
  var msgState = useState(""); var msg = msgState[0], setMsg = msgState[1];

  async function save() { await p.saveSettings(loc); setMsg("\u2705"); setTimeout(function(){ setMsg(""); }, 3000); }

  var scItems = [
    {k:"groupResult",l:t.result},   {k:"groupGoalA",l:t.goalsA},
    {k:"groupGoalB",l:t.goalsB},    {k:"groupDiff",l:t.gdiff},
    {k:"r32",l:t.r32},              {k:"r16",l:t.r16},
    {k:"qf",l:t.qf},                {k:"sf",l:t.sf},
    {k:"thirdMatch",l:t.thirdMatch},{k:"final",l:t.final},
    {k:"champion",l:t.champion},    {k:"thirdWin",l:t.thirdWin}
  ];

  return html`<div style=${{ maxWidth:520 }}>
    <div style=${{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
      <${Field} label=${t.entryFeeL}>
        <input type="number" value=${loc.entryFee}
          onInput=${function(e){ setLoc(function(prev){ return Object.assign({},prev,{entryFee:+e.target.value}); }); }}
          style=${{ textAlign:"center", fontWeight:700, fontSize:16, color:thm.accent }}/>
      </${Field}>
      <${Field} label=${t.currencyL}>
        <input type="text" value=${loc.currency}
          onInput=${function(e){ setLoc(function(prev){ return Object.assign({},prev,{currency:e.target.value}); }); }}
          style=${{ textAlign:"center", fontWeight:700 }}/>
      </${Field}>
    </div>
    <${Field} label=${t.adminPwL}>
      <input type="password" value=${loc.adminPw}
        onInput=${function(e){ setLoc(function(prev){ return Object.assign({},prev,{adminPw:e.target.value}); }); }}
        placeholder="New password"/>
    </${Field}>
    <${Field} label="Firebase Database URL">
      <input type="url" value=${loc.firebase||""}
        onInput=${function(e){ setLoc(function(prev){ return Object.assign({},prev,{firebase:e.target.value.trim()}); }); }}
        placeholder="https://your-project-default-rtdb.firebaseio.com"
        style=${{ fontFamily:"monospace", fontSize:12 }}/>
    </${Field}>
    <div style=${{fontSize:11,color:thm.inv(.3),marginBottom:16,lineHeight:1.7}}>
      Opcional. No Borrar.
    </div>
    <${Field} label="Registration deadline">
      <input type="datetime-local" value=${loc.deadline||""}
        onInput=${function(e){ setLoc(function(prev){ return Object.assign({},prev,{deadline:e.target.value}); }); }}
        style=${{ fontFamily:"monospace", fontSize:13 }}/>
    </${Field}>
    <div style=${{fontSize:11,color:thm.inv(.3),marginBottom:16,lineHeight:1.7}}>
      Despues de esta fecha el boton de predecir se oculta y las nuevas predicciones se bloquean.
    </div>
    <${Field} label=${t.adminEmailSettings}>
      <input type="email" value=${loc.adminEmail||""}
        onInput=${function(e){ setLoc(function(prev){ return Object.assign({},prev,{adminEmail:e.target.value}); }); }}
        placeholder=${t.adminEmailPh}/>
    </${Field}>

    <div style=${{ marginBottom:20 }}>
      <div style=${{ fontSize:13, fontWeight:600, color:thm.inv(.5), marginBottom:10 }}>${t.ptsConfig}</div>
      <div style=${{ display:"flex", flexDirection:"column", gap:6 }}>
        ${scItems.map(function(s){
          return html`<div key=${s.k} style=${{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
            background:thm.inv(.04), borderRadius:9, padding:"8px 12px", border:thm.bdr(1,.08) }}>
            <span style=${{ fontSize:13, color:thm.inv(.55), flex:1 }}>${s.l}</span>
            <input type="number" min="0" max="50"
              value=${loc.scoring && loc.scoring[s.k] !== undefined ? loc.scoring[s.k] : DEF.scoring[s.k]}
              onInput=${function(e){ setLoc(function(prev){ return Object.assign({},prev,{scoring:Object.assign({},prev.scoring,{[s.k]:+e.target.value})}); }); }}
              style=${{ width:60, textAlign:"center", fontWeight:800, fontSize:16, color:thm.accent, padding:"4px" }}/>
          </div>`;
        })}
      </div>
    </div>

    <${Btn} onClick=${save} sx=${{ padding:"12px 28px" }}>${t.saveBtn}</${Btn}>
    ${msg && html`<p style=${{ marginTop:12, fontSize:13, color:"#4ade80" }}>${msg}</p>`}
  </div>`;
}
