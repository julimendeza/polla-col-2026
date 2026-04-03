// - Leaderboard / standings view -
function LeaderboardView(p) {
  var lctx=useLang();var t=lctx.t;var lang=lctx.lang;
  var participants = p.participants;
  var results      = p.results;
  var settings     = p.settings;

  var rC = useMemo(function(){ return cascadeKO(results.groups, results.ko||{}); }, [results]);
  var ranked = useMemo(function(){
    return participants
      .map(function(x){ return Object.assign({}, x, calcScore(x.preds, results, settings.scoring)); })
      .sort(function(a, b){ return cmpTb(a, b, rC); });
  }, [participants, results, settings, rC]);

  var expState = useState(null);
  var exp = expState[0], setExp = expState[1];

  var human = participants.filter(function(x){ return x.id !== "claude_bot"; });
  var total = human.length * settings.entryFee;

  var koLabels = {
    groups:     t.groupStage,
    r32:        t.r32,
    r16:        t.r16,
    qf:         t.qf,
    sf:         t.sf,
    thirdMatch: t.thirdMatch,
    final:      t.final,
    champion:   t.champion,
    thirdWin:   t.thirdWin
  };

  return html`<div className="fade" style=${{ maxWidth:780, margin:"0 auto", padding:"28px 16px 60px" }}>


    <div style=${{ display:"flex", alignItems:"center", gap:12, marginBottom:22 }}>
      <span style=${{ fontSize:36 }}>\ud83c\udfc5</span>
      <div>
        <h2 className="bb" style=${{ fontSize:30 }}>${t.table.replace("\ud83c\udfc5 ","")}</h2>
        <p style=${{ color:"rgba(255,255,255,.4)", fontSize:13 }}>
          ${human.length} ${t.participants} \u00b7 ${settings.currency} ${total}
        </p>
      </div>
    </div>


    ${ranked.length === 0
      ? html`<${Card} sx=${{ textAlign:"center", padding:"60px 20px", color:"rgba(255,255,255,.3)" }}>${t.noPart}</${Card}>`
      : html`<${Card} sx=${{ padding:0, overflow:"hidden" }}>


          <div class="lb-grid" style=${{ padding:"8px 18px",
            borderBottom:"1px solid rgba(255,255,255,.08)",
            fontSize:11, color:"rgba(255,255,255,.28)", fontWeight:700 }}>
            <span>#</span>
            <span>Name</span>
            <span style=${{ textAlign:"right" }}>PTS</span>
            <span class="lb-col-hide" style=${{ textAlign:"right", fontSize:10 }}>\ud83e\udd47</span>
            <span class="lb-col-hide" style=${{ textAlign:"right", fontSize:10 }}>Final</span>
            <span class="lb-col-hide" style=${{ textAlign:"right", fontSize:10 }}>SF</span>
          </div>


          ${ranked.map(function(px, i){
            var isOpen = exp === px.id;
            var pxC=cascadeKO(px.preds&&px.preds.groups,px.preds&&px.preds.ko||{}); var ch=pxC.champion;
            var chHit  = ch && results.champion && ch === results.champion;

            return html`<div key=${px.id}>

              <div onClick=${function(){ setExp(isOpen ? null : px.id); }} class="lb-grid" style=${{
                padding:"13px 18px", borderBottom:"1px solid rgba(255,255,255,.05)",
                alignItems:"center", cursor:"pointer", transition:"background .13s",
                background: isOpen ? "rgba(245,158,11,.07)" : i===0 ? "rgba(245,158,11,.05)" : "transparent"
              }}>
                <span style=${{ textAlign:"center", fontWeight:800, fontSize:i<3?20:14,
                  color: i===0?"#fbbf24":i===1?"#94a3b8":i===2?"#b45309":"rgba(255,255,255,.22)" }}>
                  ${i===0?"\ud83e\udd47":i===1?"\ud83e\udd48":i===2?"\ud83e\udd49":i+1}
                </span>
                <div>
                  <div style=${{ fontWeight:600, fontSize:14, display:"flex", alignItems:"center", gap:6 }}>
                    ${px.name}
                    ${px.id === "claude_bot" && html`<span style=${{ fontSize:10, background:"rgba(245,158,11,.2)", color:"#f59e0b", borderRadius:4, padding:"1px 5px", fontWeight:700 }}>BOT</span>`}
                  </div>
                  <div style=${{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:1 }}>
                    ${ch ? html`<${FlagImg} team=${ch}/> ${teamName(ch,lang)}${chHit?" \u2b50":""}` : " "}
                  </div>
                </div>
                <div style=${{ textAlign:"right", fontWeight:800, fontSize:20, color:"#f59e0b" }}>${px.pts}</div>
                <div class="lb-col-hide" style=${{ textAlign:"right", fontSize:13, color: chHit ? "#4ade80" : "rgba(255,255,255,.28)" }}>
                  ${px.detail && px.detail.champion && px.detail.champion.earned || 0}
                </div>
                <div class="lb-col-hide" style=${{ textAlign:"right", fontSize:13, color:"rgba(255,255,255,.45)" }}>
                  ${px.detail && px.detail.final && px.detail.final.hits || 0}/${results.final && results.final.length || 2}
                </div>
                <div class="lb-col-hide" style=${{ textAlign:"right", fontSize:13, color:"rgba(255,255,255,.45)" }}>
                  ${px.detail && px.detail.sf && px.detail.sf.hits || 0}/${results.sf && results.sf.length || 4}
                </div>
              </div>


              ${isOpen && html`<div style=${{ padding:"12px 18px 16px", background:"rgba(255,255,255,.02)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
                <div style=${{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:8 }}>
                  ${["groups","r32","r16","qf","sf","thirdMatch","final","champion","thirdWin"].map(function(rid){
                    var d = (px.detail && px.detail[rid]) || { hits:0, earned:0 };
                    return html`<div key=${rid} style=${{ background:"rgba(255,255,255,.04)", borderRadius:10, padding:"9px 12px" }}>
                      <div style=${{ fontSize:11, color:"rgba(255,255,255,.35)", marginBottom:3 }}>${koLabels[rid] || rid}</div>
                      <div style=${{ fontWeight:700, fontSize:15, color: d.earned>0 ? "#f59e0b" : "rgba(255,255,255,.28)" }}>
                        ${d.earned} pts
                      </div>
                    </div>`;
                  })}
                </div>
              </div>`}
            </div>`;
          })}
        </${Card}>`
    }


    <p style=${{ marginTop:12, fontSize:11, color:"rgba(255,255,255,.25)", textAlign:"center" }}>${t.tiebreak}</p>
  </div>`;
}
