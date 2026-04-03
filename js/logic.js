// ── Build raw stats for a set of matches ────────────────────────────
function buildStats(matches, gp) {
  var s = {};
  matches.forEach(function(m) {
    s[m.home] = s[m.home] || { mp:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0 };
    s[m.away] = s[m.away] || { mp:0,w:0,d:0,l:0,gf:0,ga:0,gd:0,pts:0 };
  });
  matches.forEach(function(m) {
    var p = gp && gp[m.id];
    if (!p || p.h === '' || p.h === undefined) return;
    var h = +p.h, a = +p.a;
    s[m.home].mp++; s[m.away].mp++;
    s[m.home].gf += h; s[m.home].ga += a; s[m.home].gd += h - a;
    s[m.away].gf += a; s[m.away].ga += h; s[m.away].gd += a - h;
    if (h > a)      { s[m.home].pts += 3; s[m.home].w++; s[m.away].l++; }
    else if (h < a) { s[m.away].pts += 3; s[m.away].w++; s[m.home].l++; }
    else            { s[m.home].pts++;    s[m.away].pts++; s[m.home].d++; s[m.away].d++; }
  });
  return s;
}

// ── Calculate sorted group standings with FIFA tiebreaker ────────────
function calcStandings(gp, group) {
  var teams = TBG[group].slice();
  var ms    = GMS[group];
  var s     = buildStats(ms, gp);

  function cmp(a, b, subset) {
    var h2h = ms.filter(function(m) {
      return (m.home === a || m.home === b)
          && (m.away === a || m.away === b)
          && subset.indexOf(m.home) >= 0
          && subset.indexOf(m.away) >= 0;
    });
    var h = buildStats(h2h, gp);
    if (h[a] && h[b]) {
      if (h[b].pts !== h[a].pts) return h[b].pts - h[a].pts;
      if (h[b].gd  !== h[a].gd)  return h[b].gd  - h[a].gd;
      if (h[b].gf  !== h[a].gf)  return h[b].gf  - h[a].gf;
    }
    if (s[b].gd !== s[a].gd) return s[b].gd - s[a].gd;
    if (s[b].gf !== s[a].gf) return s[b].gf - s[a].gf;
    return a.localeCompare(b);
  }

  return teams.sort(function(a, b) {
    if (s[b].pts !== s[a].pts) return s[b].pts - s[a].pts;
    var tied = teams.filter(function(t) { return s[t].pts === s[a].pts; });
    if (tied.length > 1) return cmp(a, b, tied);
    return 0;
  }).map(function(t, i) {
    return Object.assign({ team: t, pos: i + 1 }, s[t]);
  });
}

// ── Check if all 6 matches in a group are filled ─────────────────────
function groupDone(gp, g) {
  return GMS[g].every(function(m) {
    var p = gp && gp[m.id];
    return p && p.h !== '' && p.h !== undefined && p.a !== '' && p.a !== undefined;
  });
}

// ── Determine the 32 qualifiers from group predictions ───────────────
function getR32(gp) {
  var top2 = [], thirds = [], done = 0;
  GROUPS.forEach(function(g) {
    var st = calcStandings(gp, g);
    if (groupDone(gp, g)) done++;
    top2.push(st[0].team, st[1].team);
    thirds.push(Object.assign({ group: g }, st[2]));
  });
  thirds.sort(function(a, b) {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd  !== a.gd)  return b.gd  - a.gd;
    if (b.gf  !== a.gf)  return b.gf  - a.gf;
    return a.team.localeCompare(b.team);
  });
  var best8 = thirds.slice(0, 8);
  return {
    teams:      top2.concat(best8.map(function(x) { return x.team; })),
    best8:      best8,
    complete:   done === 12,
    groupsDone: done
  };
}

// ── Assign qualifying thirds to FIFA best3 slots (Annex C) ────────────
// Uses backtracking. FIFA guarantees unique valid assignment for all 495 combos.
function assignBest3(best8) {
  var qualGroups = best8.map(function(x) { return x.group; });

  var slotOptions = {};
  Object.keys(BEST3_SLOTS).forEach(function(slot) {
    slotOptions[slot] = BEST3_SLOTS[slot].validGroups.split('').filter(function(g) {
      return qualGroups.indexOf(g) >= 0;
    });
  });

  // Most-constrained first
  var slots = Object.keys(slotOptions).sort(function(a, b) {
    return slotOptions[a].length - slotOptions[b].length;
  });

  var assignment = {};
  var used = {};

  function solve(idx) {
    if (idx >= slots.length) return true;
    var slot = slots[idx];
    for (var i = 0; i < slotOptions[slot].length; i++) {
      var g = slotOptions[slot][i];
      if (!used[g]) {
        assignment[slot] = g;
        used[g] = true;
        if (solve(idx + 1)) return true;
        delete assignment[slot];
        delete used[g];
      }
    }
    return false;
  }

  solve(0);
  return assignment; // { WA: "E", WB: "J", ... }
}

// ── Get winner of a KO match score ───────────────────────────────────
// Returns "home", "away", or null (unresolved / not entered)
function koWinner(score) {
  if (!score || score.h === '' || score.h === undefined) return null;
  var h = +score.h, a = +score.a;
  if (h > a) return 'home';
  if (a > h) return 'away';
  return score.winner || null; // draw: needs explicit winner (ET/pens)
}

// ── Cascade all KO results from group predictions + KO scores ─────────
function cascadeKO(groupPreds, koScores) {
  groupPreds = groupPreds || {};
  koScores   = koScores   || {};

  var standings = {};
  GROUPS.forEach(function(g) { standings[g] = calcStandings(groupPreds, g); });

  var r32info = getR32(groupPreds);
  var b3 = assignBest3(r32info.best8);

  function resolveSlot(slot) {
    if (!slot) return null;
    if (slot.pos === 1) {
      var st1 = standings[slot.g];
      return st1 && st1[0] ? st1[0].team : null;
    }
    if (slot.pos === 2) {
      var st2 = standings[slot.g];
      return st2 && st2[1] ? st2[1].team : null;
    }
    if (slot.pos === 3) {
      var grp = b3[slot.slot];
      if (!grp) return null;
      var st3 = standings[grp];
      return st3 && st3[2] ? st3[2].team : null;
    }
    return null;
  }

  function mkResult(id, homeTeam, awayTeam) {
    var sc = koScores[id];
    var w  = koWinner(sc);
    return {
      id: id, home: homeTeam || null, away: awayTeam || null, score: sc || null,
      winner: w === 'home' ? homeTeam : w === 'away' ? awayTeam : null,
      loser:  w === 'home' ? awayTeam : w === 'away' ? homeTeam : null,
    };
  }

  var r32 = {};
  R32_FIXTURES.forEach(function(f) {
    r32[f.id] = mkResult(f.id, resolveSlot(f.home), resolveSlot(f.away));
  });

  var r16 = {};
  KO_BRACKET.r16.forEach(function(f) {
    r16[f.id] = mkResult(f.id, r32[f.home]&&r32[f.home].winner, r32[f.away]&&r32[f.away].winner);
  });

  var qf = {};
  KO_BRACKET.qf.forEach(function(f) {
    qf[f.id] = mkResult(f.id, r16[f.home]&&r16[f.home].winner, r16[f.away]&&r16[f.away].winner);
  });

  var sf = {};
  KO_BRACKET.sf.forEach(function(f) {
    sf[f.id] = mkResult(f.id, qf[f.home]&&qf[f.home].winner, qf[f.away]&&qf[f.away].winner);
  });

  var finalR = mkResult('final', sf['sf_0']&&sf['sf_0'].winner, sf['sf_1']&&sf['sf_1'].winner);
  var s3rdR  = mkResult('s3rd',  sf['sf_0']&&sf['sf_0'].loser,  sf['sf_1']&&sf['sf_1'].loser);

  function winners(map, ids) {
    return ids.map(function(id){ return map[id]&&map[id].winner; }).filter(Boolean);
  }
  var r32teams   = winners(r32, R32_FIXTURES.map(function(f){return f.id;}));
  var r16teams   = winners(r16, KO_BRACKET.r16.map(function(f){return f.id;}));
  var qfteams    = winners(qf,  KO_BRACKET.qf.map(function(f){return f.id;}));
  var sfteams    = winners(sf,  KO_BRACKET.sf.map(function(f){return f.id;}));
  var finalTeams = [finalR.winner, finalR.loser].filter(Boolean);
  var thirdTeams = sfteams.filter(function(t){ return finalTeams.indexOf(t)<0; });

  return {
    r32:r32, r16:r16, qf:qf, sf:sf, final:finalR, s3rd:s3rdR,
    r32teams:r32teams, r16teams:r16teams, qfteams:qfteams, sfteams:sfteams,
    finalTeams:finalTeams, thirdTeams:thirdTeams,
    champion:finalR.winner, thirdWin:s3rdR.winner,
    r32fixtures: r32, // all R32 match objects with home/away resolved
  };
}

// ── Group stage match scoring ─────────────────────────────────────────
function oc(h, a) { return h > a ? "H" : h < a ? "A" : "D"; }

function scoreMatch(pred, res) {
  if (!pred || pred.h === '' || pred.h === undefined) return 0;
  if (!res  || res.h  === '' || res.h  === undefined) return 0;
  var ph = +pred.h, pa = +pred.a, rh = +res.h, ra = +res.a;
  var po = oc(ph, pa), ro = oc(rh, ra), p = 0;
  if (po === ro)                            p += 3;
  if (ph === rh)                            p += 1;
  if (pa === ra)                            p += 1;
  if (po === ro && (ph-pa) === (rh-ra))     p += 2;
  return p;
}

function mSt(pred, res) {
  if (!pred || pred.h === '' || pred.h === undefined) return null;
  if (!res  || res.h  === '' || res.h  === undefined) return null;
  var p = scoreMatch(pred, res);
  return p >= 6 ? "exact" : p >= 3 ? "result" : p > 0 ? "partial" : "wrong";
}

// ── Total score + breakdown ───────────────────────────────────────────
function calcScore(preds, results, sc) {
  if (!preds || !results) return { pts: 0, detail: {} };
  var pts = 0, detail = {};

  // Group stage
  var gPts = 0;
  ALL_MATCHES.forEach(function(m) {
    gPts += scoreMatch(preds.groups&&preds.groups[m.id], results.groups&&results.groups[m.id]);
  });
  detail.groups = { earned: gPts }; pts += gPts;

  // KO stage — only score when results exist
  var hasResults = Object.keys(results.groups||{}).some(function(k){
    var m=results.groups[k]; return m&&m.h!==''&&m.h!==undefined;
  }) || Object.keys(results.ko||{}).length > 0;

  if (hasResults) {
    var pC = cascadeKO(preds.groups,   preds.ko   || {});
    var rC = cascadeKO(results.groups, results.ko || {});

    function koHits(pT, rT, ppg) {
      var hits = pT.filter(function(t){return rT.indexOf(t)>=0;}).length;
      return { hits:hits, earned:hits*(ppg||0) };
    }
    detail.r32        = koHits(pC.r32teams,   rC.r32teams,   sc.r32       ||0);
    detail.r16        = koHits(pC.r16teams,   rC.r16teams,   sc.r16       ||0);
    detail.qf         = koHits(pC.qfteams,    rC.qfteams,    sc.qf        ||0);
    detail.sf         = koHits(pC.sfteams,    rC.sfteams,    sc.sf        ||0);
    detail.thirdMatch = koHits(pC.thirdTeams, rC.thirdTeams, sc.thirdMatch||0);
    detail.final      = koHits(pC.finalTeams, rC.finalTeams, sc.final     ||0);
    var chHit = pC.champion && rC.champion && pC.champion===rC.champion;
    detail.champion   = { hits:chHit?1:0, earned:chHit?(sc.champion||0):0 };
    var twHit = pC.thirdWin && rC.thirdWin && pC.thirdWin===rC.thirdWin;
    detail.thirdWin   = { hits:twHit?1:0, earned:twHit?(sc.thirdWin||0):0 };
    ['r32','r16','qf','sf','thirdMatch','final','champion','thirdWin'].forEach(function(k){ pts+=detail[k].earned; });
  } else {
    ['r32','r16','qf','sf','thirdMatch','final','champion','thirdWin'].forEach(function(k){ detail[k]={hits:0,earned:0}; });
  }
  return { pts:pts, detail:detail };
}

// ── Leaderboard tiebreak comparison ──────────────────────────────────
function cmpTb(a, b, rC) {
  // rC = pre-computed cascadeKO(results)
  function tb(p) {
    var pC   = cascadeKO(p.preds&&p.preds.groups, p.preds&&p.preds.ko);
    var ch   = (pC.champion && rC.champion && pC.champion===rC.champion) ? 1 : 0;
    var ru   = rC.finalTeams ? rC.finalTeams.find(function(t){return t!==rC.champion;})||'' : '';
    var pRu  = pC.finalTeams ? pC.finalTeams.find(function(t){return t!==pC.champion;})||'' : '';
    var s3   = (pC.thirdWin && rC.thirdWin && pC.thirdWin===rC.thirdWin) ? 1 : 0;
    var fPts = ((p.detail&&p.detail.final&&p.detail.final.earned)||0)
             + ((p.detail&&p.detail.thirdMatch&&p.detail.thirdMatch.earned)||0);
    var sPts = (p.detail&&p.detail.sf&&p.detail.sf.earned)||0;
    return [p.pts, ch, pRu===ru?1:0, s3, fPts, sPts];
  }
  var ta=tb(a), tb2=tb(b);
  for (var i=0;i<ta.length;i++) if(ta[i]!==tb2[i]) return tb2[i]-ta[i];
  return 0;
}
