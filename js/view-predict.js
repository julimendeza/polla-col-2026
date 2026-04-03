// - Prediction form -
function PredictView(p) {
  var lctx=useLang(); var t=lctx.t; var lang=lctx.lang;
  var thm=lctx.thm||THEMES.dark;
  var participants=p.participants, saveP=p.saveP, setView=p.setView, settings=p.settings;

  var s0=useState(0);     var step=s0[0],    setStep=s0[1];
  var s1=useState("");    var name=s1[0],    setName=s1[1];
  var s2=useState("");    var email=s2[0],   setEmail=s2[1];
  var s3=useState("");    var err=s3[0],     setErr=s3[1];
  var s4=useState(null);  var existId=s4[0], setExistId=s4[1];
  var s5=useState(Object.assign({},EP,{groups:{},ko:{}}));
  var preds=s5[0], setPreds=s5[1];
  var s6=useState("groups"); var section=s6[0], setSection=s6[1];
  var s7=useState("A");      var activeG=s7[0],  setActiveG=s7[1];
  var s8=useState("r32");    var activeKO=s8[0], setActiveKO=s8[1];
  var s9=useState(false);    var saving=s9[0],   setSaving=s9[1];
  var s10=useState(null);    var adminNotif=s10[0], setAdminNotif=s10[1];
  var s11=useState("");      var pinCode=s11[0],  setPinCode=s11[1];
  var s12=useState(false);   var pinLoading=s12[0],setPinLoading=s12[1];
  var s13=useState(null);    var validPin=s13[0], setValidPin=s13[1]; // the matched pin object

  var accessMode = settings.access || "off";
  var needsPin   = accessMode !== "off";
  var isRobust   = accessMode === "robust";

  // Deadline guard
  var deadline = settings.deadline ? new Date(settings.deadline) : null;
  var isPastDeadline = deadline && new Date() > deadline;
  if (isPastDeadline) return html`<div class="fade" style=${{maxWidth:440,margin:"0 auto",padding:"80px 16px",textAlign:"center"}}>
    <div style=${{fontSize:52,marginBottom:12}}>\ud83d\udd12</div>
    <h2 class="bb" style=${{fontSize:32,marginBottom:12}}>${lang==="es"?"PREDICCIONES CERRADAS":"PREDICTIONS CLOSED"}</h2>
    <p style=${{color:thm.inv(.4),fontSize:14,lineHeight:1.8}}>
      ${lang==="es"?"El plazo de registro cerr\u00f3 el":"The registration deadline was"}
      ${deadline.toLocaleDateString(lang==="es"?"es-CO":"en-CO",{day:"numeric",month:"long",year:"numeric"})}.<br/>
      ${lang==="es"?"Ya no es posible registrar o modificar predicciones.":"No new predictions can be registered or modified."}
    </p>
    <div style=${{marginTop:24,display:"flex",gap:10,justifyContent:"center"}}>
      <${Btn} onClick=${function(){setView("leaderboard");}} v="secondary">${t.table}</${Btn}>
      <${Btn} onClick=${function(){setView("bracket");}}>\ud83c\udfc6 ${t.bracket}</${Btn}>
    </div>
  </div>`;

  // Cascade from current predictions
  var C = useMemo(function(){
    return cascadeKO(preds.groups, preds.ko||{});
  }, [preds]);

  var r32info = useMemo(function(){ return getR32(preds.groups); }, [preds.groups]);

  var gFilled = GROUPS.reduce(function(s,g){
    return s+GMS[g].filter(function(m){
      var mp=preds.groups&&preds.groups[m.id];
      return mp&&mp.h!==''&&mp.h!==undefined;
    }).length;
  },0);

  var koFilled = Object.keys(preds.ko||{}).length;
  var koTotal  = 32; // 16+8+4+2+1+1

  async function handleStart(){
    setErr("");
    // PIN validation
    if(needsPin){
      if(!pinCode.trim()){setErr(lang==="es"?"Ingresa tu PIN de acceso.":"Enter your access PIN.");return;}
      setPinLoading(true);
      var result = await pins.validate(pinCode, accessMode);
      setPinLoading(false);
      if(!result.ok){setErr(result.err);return;}
      setValidPin(result.pin);
      // Robust: pre-fill name/email from pin record
      if(isRobust && result.pin){
        setName(result.pin.name||"");
        setEmail(result.pin.email||"");
      }
    }
    // Name/email validation (skip in robust — pre-filled)
    if(!isRobust || !needsPin){
      if(!name.trim()){setErr(t.nameL+"?");return;}
      if(!email.trim()||email.indexOf("@")<0){setErr(t.emailL+"?");return;}
    }
    var ex=participants.find(function(x){return x.email.toLowerCase()===email.toLowerCase();});
    if(ex){
      setExistId(ex.id);
      setPreds(Object.assign({},EP,{groups:{},ko:{}},ex.preds,{
        groups:Object.assign({},ex.preds&&ex.preds.groups||{}),
        ko:Object.assign({},ex.preds&&ex.preds.ko||{})
      }));
    }
    setStep(1);
  }

  function setGM(id, side, v){
    setPreds(function(prev){
      var ng=Object.assign({},prev.groups);
      ng[id]=Object.assign({},ng[id]||{});
      ng[id][side]=v;
      return Object.assign({},prev,{groups:ng});
    });
  }

  function setKOScore(matchId, val){
    setPreds(function(prev){
      var nk=Object.assign({},prev.ko||{});
      if(val===null||val===undefined){
        delete nk[matchId];
      } else {
        nk[matchId]=Object.assign({},nk[matchId]||{},val);
      }
      return Object.assign({},prev,{ko:nk});
    });
  }

  async function handleSave(){
    setSaving(true);
    var id=existId||("p_"+Date.now());
    var np=Object.assign({},preds);
    var upd=existId
      ? participants.map(function(x){return x.id===existId?Object.assign({},x,{name:name,email:email,preds:np}):x;})
      : participants.concat([{id:id,name:name,email:email,preds:np}]);
    await saveP(upd);
    // Mark PIN as used (only for new registrations, not updates)
    if(needsPin && !existId && validPin){
      await pins.markUsed(pinCode, name, email);
    }
    try{
      var sent=await notifyAdmin(np,name,email,settings,upd,!!existId);
      setAdminNotif(sent?"sent":(settings.ejs&&settings.ejs.tpl_admin&&settings.adminEmail?"fail":"skipped"));
    }catch(e){setAdminNotif("fail");}
    setSaving(false); setStep(2);
  }

  // - Step 0: Name + email (+ PIN if enabled) -
  if(step===0) return html`<div class="fade" style=${{maxWidth:420,margin:"0 auto",padding:"32px 16px"}}>
    <${Btn} v="ghost" onClick=${function(){setView("home");}}>${t.back}</${Btn}>
    <div style=${{textAlign:"center",margin:"20px 0 26px"}}>
      <div style=${{fontSize:40,marginBottom:8}}>${needsPin?"\ud83d\udd11":"\ud83d\udccb"}</div>
      <h2 class="bb" style=${{fontSize:34}}>${t.registerPreds}</h2>
      <p style=${{color:thm.inv(.4),fontSize:13,marginTop:6}}>${t.regSub}</p>
    </div>
    <${Card}>
      ${needsPin&&html`<${Field} label=${lang==="es"?"PIN de acceso":"Access PIN"}>
        <input type="text" value=${pinCode}
          onInput=${function(e){setPinCode(e.target.value.toUpperCase());}}
          onKeyDown=${function(e){if(e.key==="Enter")handleStart();}}
          placeholder=${lang==="es"?"Tu PIN personal":"Your personal PIN"}
          style=${{letterSpacing:3,fontWeight:700,textTransform:"uppercase"}}/>
      </${Field}>`}
      ${(!needsPin||!isRobust)&&html`
        <${Field} label=${t.nameL}><input type="text" value=${name}
          onInput=${function(e){setName(e.target.value);}}
          onKeyDown=${function(e){if(e.key==="Enter")handleStart();}}
          placeholder=${t.namePh}/></${Field}>
        <${Field} label=${t.emailL}><input type="email" value=${email}
          onInput=${function(e){setEmail(e.target.value);}}
          onKeyDown=${function(e){if(e.key==="Enter")handleStart();}}
          placeholder=${t.emailPh}/></${Field}>
        <p style=${{fontSize:11,color:thm.inv(.3),marginBottom:14}}>${t.sameEmail}</p>
      `}
      ${needsPin&&html`<div style=${{marginBottom:14,padding:"10px 12px",borderRadius:10,
        background:thm.a(.07),border:thm.bdra(1,.2),fontSize:12,
        color:thm.a(.8),lineHeight:1.7}}>
        ${lang==="es"
          ? "\ud83d\udcb0 Debes haber transferido la cuota de inscripci\u00f3n antes de recibir tu PIN. Contacta al organizador."
          : "\ud83d\udcb0 You must have paid the entry fee before receiving your PIN. Contact the organiser."}
      </div>`}
      ${err&&html`<p style=${{color:thm.id==="estadio"?"#991b1b":"#f87171",fontSize:13,marginBottom:12}}>${err}</p>`}
      <${Btn} onClick=${handleStart} full=${true} disabled=${pinLoading}
        sx=${{padding:"13px",fontSize:15}}>${pinLoading?(lang==="es"?"Verificando...":"Verifying..."):t.cont}</${Btn}>
    </${Card}>
  </div>`;

  // - Step 2: Confirmation -
  if(step===2) return html`<div class="fade" style=${{maxWidth:440,margin:"0 auto",padding:"60px 16px",textAlign:"center"}}>
    <div style=${{fontSize:56,marginBottom:12}}>\ud83c\udf89</div>
    <h2 class="bb" style=${{fontSize:38}}>${name.toUpperCase()}!</h2>
    <p style=${{color:thm.inv(.5),margin:"14px 0 20px",lineHeight:1.8}}>
      ${t.savedMsg}${existId?" "+t.updated:""}<br/>${t.goodluck}
    </p>
    ${adminNotif==="sent"&&html`<div style=${{display:"inline-flex",alignItems:"center",gap:6,background:thm.id==="estadio"?"rgba(22,101,52,.15)":"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.3)",borderRadius:10,padding:"7px 14px",fontSize:12,color:thm.id==="estadio"?"#166534":"#4ade80",marginBottom:16}}>${t.adminNotifSent}</div>`}
    ${adminNotif==="fail"&&html`<div style=${{display:"inline-flex",alignItems:"center",gap:6,background:thm.id==="estadio"?"rgba(153,27,27,.15)":"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.3)",borderRadius:10,padding:"7px 14px",fontSize:12,color:thm.id==="estadio"?"#991b1b":"#f87171",marginBottom:16}}>${t.adminNotifFail}</div>`}

    <div style=${{background:thm.inv(.04),border:thm.bdr(1,.08),borderRadius:14,padding:"16px",marginBottom:20}}>
      <div style=${{fontSize:12,fontWeight:700,color:thm.inv(.4),marginBottom:12,letterSpacing:".06em"}}>
        ${lang==="es"?"\ud83d\udcbe GUARDAR COPIA DE MIS PREDICCIONES":"\ud83d\udcbe SAVE A COPY OF MY PREDICTIONS"}
      </div>
      <div style=${{display:"flex",flexDirection:"column",gap:8}}>
        <${Btn} onClick=${function(){ generatePredsPDF(preds,name,email,lang); }}
          sx=${{padding:"10px",fontSize:13,width:"100%"}}>
          \ud83d\udcc4 ${lang==="es"?"Descargar PDF":"Download PDF"}
        </${Btn}>
        <${Btn} onClick=${function(){ downloadPredsJSON(preds,name,email); }}
          v="secondary" sx=${{padding:"10px",fontSize:13,width:"100%"}}>
          \ud83d\udcce ${lang==="es"?"Descargar JSON":"Download JSON"}
        </${Btn}>
        <${Btn} onClick=${function(){ generatePredsPDF(preds,name,email,lang); downloadPredsJSON(preds,name,email); }}
          v="secondary" sx=${{padding:"10px",fontSize:13,width:"100%"}}>
          \u2b07\ufe0f ${lang==="es"?"Descargar ambos":"Download both"}
        </${Btn}>
      </div>
    </div>

    <div style=${{display:"flex",gap:10,justifyContent:"center"}}>
      <${Btn} onClick=${function(){setView("bracket");}} v="secondary">\ud83c\udfc6 ${t.bracket}</${Btn}>
      <${Btn} onClick=${function(){setView("leaderboard");}} v="secondary">${t.table}</${Btn}>
    </div>
  </div>`;

  // - Step 1: Prediction form -
  var gIdx=GROUPS.indexOf(activeG);
  var koRoundDef=KO_ROUNDS.find(function(r){return r.id===activeKO;})||KO_ROUNDS[0];
  var koIdx=KO_ROUNDS.findIndex(function(r){return r.id===activeKO;});

  return html`<div class="fade" style=${{maxWidth:780,margin:"0 auto",padding:"16px 16px 60px"}}>

    <div style=${{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
      <${Btn} v="secondary" onClick=${function(){setStep(0);}} sx=${{padding:"7px 14px",fontSize:13}}>${t.back}</${Btn}>
      <div style=${{flex:1}}>
        <${PBar} v=${gFilled+koFilled*3} max=${72+koTotal*3}/>
        <div style=${{fontSize:11,color:thm.inv(.3),marginTop:3}}>${gFilled}/72 ${t.groupStage} - ${koFilled}/${koTotal} ${t.knockout}</div>
      </div>
    </div>

    <div style=${{display:"flex",gap:8,marginBottom:16}}>
      ${[
        {id:"groups",l:t.groupStage,sub:gFilled+"/72"},
        {id:"knockout",l:t.knockout,sub:koFilled+"/"+koTotal+" matches"}
      ].map(function(s){
        return html`<button key=${s.id} onClick=${function(){setSection(s.id);}} style=${{
          flex:1,padding:"12px 16px",borderRadius:12,cursor:"pointer",
          border:"2px solid "+(section===s.id?thm.accent:thm.inv(.1)),
          background:section===s.id?thm.a(.12):thm.inv(.03),
          fontFamily:"'DM Sans',sans-serif",transition:"all .15s",textAlign:"left"
        }}>
          <div style=${{fontWeight:700,fontSize:14,color:section===s.id?thm.accent:thm.inv(.7)}}>${s.l}</div>
          <div style=${{fontSize:12,marginTop:2,color:section===s.id?thm.a(.7):thm.inv(.4)}}>${s.sub}</div>
        </button>`;
      })}
    </div>

    ${section==="groups"&&html`<${Card}>
      <${GroupTabs} active=${activeG} onChange=${setActiveG} preds=${preds.groups}/>
      <div style=${{fontSize:11,color:thm.inv(.35),marginBottom:8}}>
        ${t.groupLabel} ${activeG}: ${TBG[activeG].map(function(tm){return teamName(tm,lang);}).join(" - ")}
      </div>
      ${[0,1,2].map(function(md){
        var mdMatches=GMS[activeG].slice(md*2,md*2+2);
        return html`<div key=${md}>
          <div style=${{fontSize:10,fontWeight:700,color:thm.inv(.25),letterSpacing:".08em",
            marginTop:md===0?0:14,marginBottom:5,textTransform:"uppercase"}}>Matchday ${md+1}</div>
          ${mdMatches.map(function(m){
            return html`<${MRow} key=${m.id} match=${m}
              hv=${preds.groups&&preds.groups[m.id]&&preds.groups[m.id].h||""}
              av=${preds.groups&&preds.groups[m.id]&&preds.groups[m.id].a||""}
              onH=${function(v){setGM(m.id,"h",v);}}
              onA=${function(v){setGM(m.id,"a",v);}}/>`;
          })}
        </div>`;
      })}
      <${StandingsTable} group=${activeG} preds=${preds.groups} allPreds=${preds.groups}/>
      <div style=${{display:"flex",justifyContent:"space-between",marginTop:14}}>
        <${Btn} v="secondary" disabled=${gIdx===0} onClick=${function(){setActiveG(GROUPS[gIdx-1]);}} sx=${{padding:"8px 14px",fontSize:13}}>- ${GROUPS[gIdx-1]||""}</${Btn}>
        ${gIdx<11
          ? html`<${Btn} onClick=${function(){setActiveG(GROUPS[gIdx+1]);}} sx=${{padding:"8px 14px",fontSize:13}}>${t.groupLabel} ${GROUPS[gIdx+1]} -</${Btn}>`
          : html`<${Btn} onClick=${function(){setSection("knockout");}} sx=${{padding:"8px 14px",fontSize:13}}>${t.knockout} -</${Btn}>`}
      </div>
    </${Card}>`}

    ${section==="knockout"&&html`<${Card}>
      <div style=${{marginBottom:12,padding:"10px 14px",borderRadius:10,
        background:r32info.complete?thm.id==="estadio"?"rgba(22,101,52,.1)":"rgba(74,222,128,.07)":thm.a(.07),
        border:"1px solid "+(r32info.complete?thm.id==="estadio"?"rgba(22,101,52,.25)":"rgba(74,222,128,.2)":thm.a(.2))}}>
        <div style=${{fontSize:11,fontWeight:700,color:r32info.complete?thm.id==="estadio"?"#166534":"#4ade80":thm.a(.8)}}>
          ${r32info.complete?"- "+t.r32ok:"- "+t.r32Incomplete+" ("+r32info.groupsDone+"/12)"}
        </div>
        ${!r32info.complete&&html`<div style=${{fontSize:11,color:thm.inv(.4),marginTop:4}}>
          Complete group stage predictions first - the R32 fixtures resolve automatically from your group results.
        </div>`}
      </div>

      <div style=${{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
        ${KO_ROUNDS.map(function(rd){
          var filled=Object.keys(preds.ko||{}).filter(function(k){
            return rd.fixtures.some(function(f){return f.id===k;});
          }).length;
          var total=rd.fixtures.length;
          var done=filled===total&&total>0;
          return html`<button key=${rd.id} onClick=${function(){setActiveKO(rd.id);}} style=${{
            padding:"5px 10px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",
            border:"1.5px solid "+(activeKO===rd.id?thm.accent:done?thm.id==="estadio"?"rgba(22,101,52,.5)":"rgba(74,222,128,.4)":thm.inv(.1)),
            background:activeKO===rd.id?thm.accent:done?thm.id==="estadio"?"rgba(22,101,52,.1)":"rgba(74,222,128,.08)":"transparent",
            color:activeKO===rd.id?"#000":done?thm.id==="estadio"?"#166534":"#4ade80":thm.inv(.5),
            fontFamily:"'DM Sans',sans-serif"
          }}>${done&&activeKO!==rd.id?"- ":""}${rd.label} (${filled}/${total})</button>`;
        })}
      </div>

      <div style=${{marginBottom:14,paddingBottom:12,borderBottom:thm.bdr(1,.08)}}>
        <h3 class="bb" style=${{fontSize:20}}>${koRoundDef.label}</h3>
        ${(koRoundDef.id==="r16"||koRoundDef.id==="qf"||koRoundDef.id==="sf"||koRoundDef.id==="final"||koRoundDef.id==="s3rd")&&html`
          <p style=${{fontSize:11,color:thm.inv(.4),marginTop:4}}>
            Teams shown are derived from your previous round predictions. Predict the score - winner advances automatically.
            For draws, select who wins (H = home / A = away).
          </p>`}
      </div>

      ${koRoundDef.fixtures.map(function(f){
        var matchResult = null;
        if(f.id==="final"){ matchResult={home:C.final&&C.final.home,away:C.final&&C.final.away}; }
        else if(f.id==="s3rd"){ matchResult={home:C.s3rd&&C.s3rd.home,away:C.s3rd&&C.s3rd.away}; }
        else if(C.r32&&C.r32[f.id]){ matchResult=C.r32[f.id]; }
        else if(C.r16&&C.r16[f.id]){ matchResult=C.r16[f.id]; }
        else if(C.qf &&C.qf[f.id] ){ matchResult=C.qf[f.id]; }
        else if(C.sf &&C.sf[f.id] ){ matchResult=C.sf[f.id]; }
        var sc=preds.ko&&preds.ko[f.id]||{};
        var displayMatch={id:f.id,home:matchResult&&matchResult.home||null,away:matchResult&&matchResult.away||null};
        return html`<${KOMatchRow} key=${f.id}
          match=${displayMatch}
          sc=${sc}
          onChange=${function(val){setKOScore(f.id,val);}}/>`;
      })}

      <div style=${{display:"flex",gap:10,marginTop:14}}>
        ${koIdx>0&&html`<${Btn} v="secondary" onClick=${function(){setActiveKO(KO_ROUNDS[koIdx-1].id);}} sx=${{padding:"9px 14px",fontSize:13}}>- ${KO_ROUNDS[koIdx-1].label}</${Btn}>`}
        ${koIdx<KO_ROUNDS.length-1
          ? html`<${Btn} onClick=${function(){setActiveKO(KO_ROUNDS[koIdx+1].id);}} sx=${{flex:"1",padding:"11px"}}>- ${KO_ROUNDS[koIdx+1].label}</${Btn}>`
          : html`<${Btn} onClick=${handleSave} disabled=${saving} sx=${{flex:"1",padding:"13px",fontSize:15}}>${saving?t.saving:t.savePreds}</${Btn}>`}
      </div>
    </${Card}>`}

    <div style=${{marginTop:14,textAlign:"center"}}>
      <${Btn} onClick=${handleSave} disabled=${saving} v="secondary" sx=${{padding:"11px 32px",fontSize:14}}>${saving?t.saving:t.saveNow}</${Btn}>
    </div>
  </div>`;
}
