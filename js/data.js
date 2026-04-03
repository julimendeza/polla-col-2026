// ── Group / Team definitions ─────────────────────────────────────────
var TBG = {
  A: ["Mexico","South Africa","South Korea","Playoff D"],
  B: ["Canada","Playoff A","Qatar","Switzerland"],
  C: ["Brazil","Morocco","Haiti","Scotland"],
  D: ["USA","Paraguay","Australia","Playoff C"],
  E: ["Germany","Cura\u00e7ao","Ivory Coast","Ecuador"],
  F: ["Netherlands","Japan","Playoff B","Tunisia"],
  G: ["Belgium","Egypt","Iran","New Zealand"],
  H: ["Spain","Cape Verde","Saudi Arabia","Uruguay"],
  I: ["France","Senegal","Playoff 2","Norway"],
  J: ["Argentina","Algeria","Austria","Jordan"],
  K: ["Portugal","Playoff 1","Uzbekistan","Colombia"],
  L: ["England","Croatia","Ghana","Panama"]
};
var GROUPS = Object.keys(TBG);

// ── ISO country codes for flag images ────────────────────────────────
var CC = {
  Spain:"es",France:"fr",Brazil:"br",Argentina:"ar",Germany:"de",
  Portugal:"pt",Netherlands:"nl",England:"gb-eng",Scotland:"gb-sct",
  Morocco:"ma",Colombia:"co",USA:"us",Japan:"jp","South Korea":"kr",
  Norway:"no",Uruguay:"uy",Senegal:"sn",Mexico:"mx",Belgium:"be",
  Ecuador:"ec",Croatia:"hr",Switzerland:"ch",Australia:"au",
  "Ivory Coast":"ci",Tunisia:"tn",Austria:"at",Algeria:"dz",
  Uzbekistan:"uz",Jordan:"jo",Ghana:"gh",Canada:"ca",Qatar:"qa",
  "South Africa":"za",Haiti:"ht",Paraguay:"py","New Zealand":"nz",
  "Cape Verde":"cv","Saudi Arabia":"sa",Iran:"ir",Egypt:"eg",
  Panama:"pa","Cura\u00e7ao":"cw",
  // Playoff finalists
  Italy:"it",Sweden:"se",Poland:"pl",Turkey:"tr",Kosovo:"xk",
  Denmark:"dk",Czechia:"cz","Bosnia & Herz.":"ba",
  Jamaica:"jm","DR Congo":"cd",Bolivia:"bo",Iraq:"iq"
};
var FL = {
  Mexico:"\ud83c\uddf2\ud83c\uddfd","South Africa":"\ud83c\uddff\ud83c\udde6","South Korea":"\ud83c\uddf0\ud83c\uddf7",
  Canada:"\ud83c\udde8\ud83c\udde6",Qatar:"\ud83c\uddf6\ud83c\udde6",Switzerland:"\ud83c\udde8\ud83c\udded",
  Brazil:"\ud83c\udde7\ud83c\uddf7",Morocco:"\ud83c\uddf2\ud83c\udde6",Haiti:"\ud83c\udded\ud83c\uddf9",Scotland:"\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc73\udb40\udc63\udb40\udc74\udb40\udc7f",
  USA:"\ud83c\uddfa\ud83c\uddf8",Paraguay:"\ud83c\uddf5\ud83c\uddfe",Australia:"\ud83c\udde6\ud83c\uddfa",
  Germany:"\ud83c\udde9\ud83c\uddea","Ivory Coast":"\ud83c\udde8\ud83c\uddee",Ecuador:"\ud83c\uddea\ud83c\udde8",
  Netherlands:"\ud83c\uddf3\ud83c\uddf1",Japan:"\ud83c\uddef\ud83c\uddf5",Tunisia:"\ud83c\uddf9\ud83c\uddf3",
  Belgium:"\ud83c\udde7\ud83c\uddea",Egypt:"\ud83c\uddea\ud83c\uddec",Iran:"\ud83c\uddee\ud83c\uddf7","New Zealand":"\ud83c\uddf3\ud83c\uddff",
  Spain:"\ud83c\uddea\ud83c\uddf8","Cape Verde":"\ud83c\udde8\ud83c\uddfb","Saudi Arabia":"\ud83c\uddf8\ud83c\udde6",Uruguay:"\ud83c\uddfa\ud83c\uddfe",
  France:"\ud83c\uddeb\ud83c\uddf7",Senegal:"\ud83c\uddf8\ud83c\uddf3",Norway:"\ud83c\uddf3\ud83c\uddf4",
  Argentina:"\ud83c\udde6\ud83c\uddf7",Algeria:"\ud83c\udde9\ud83c\uddff",Austria:"\ud83c\udde6\ud83c\uddf9",Jordan:"\ud83c\uddef\ud83c\uddf4",
  Portugal:"\ud83c\uddf5\ud83c\uddf9",Uzbekistan:"\ud83c\uddfa\ud83c\uddff",Colombia:"\ud83c\udde8\ud83c\uddf4",
  England:"\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc65\udb40\udc6e\udb40\udc67\udb40\udc7f",Croatia:"\ud83c\udded\ud83c\uddf7",Ghana:"\ud83c\uddec\ud83c\udded",Panama:"\ud83c\uddf5\ud83c\udde6",
  "Cura\u00e7ao":"\ud83c\udde8\ud83c\uddfc",
  Italy:"\ud83c\uddee\ud83c\uddf9",Sweden:"\ud83c\uddf8\ud83c\uddea",Poland:"\ud83c\uddf5\ud83c\uddf1",Turkey:"\ud83c\uddf9\ud83c\uddf7",
  Kosovo:"\ud83c\uddfd\ud83c\uddf0",Denmark:"\ud83c\udde9\ud83c\uddf0",Czechia:"\ud83c\udde8\ud83c\uddff","Bosnia & Herz.":"\ud83c\udde7\ud83c\udde6",
  Jamaica:"\ud83c\uddef\ud83c\uddf2","DR Congo":"\ud83c\udde8\ud83c\udde9",Bolivia:"\ud83c\udde7\ud83c\uddf4",Iraq:"\ud83c\uddee\ud83c\uddf6"
};
function fl(t) { return FL[t] || "\ud83c\udff3\ufe0f"; }

// ── Generate all group matches (6 per group, 72 total) ───────────────
// Matchday order: MD1 = 1v2, 3v4 | MD2 = 1v3, 2v4 | MD3 = 1v4, 2v3
var GMS = {};
GROUPS.forEach(function(g) {
  var t = TBG[g];
  var pairs = [
    {i:0,j:1}, {i:2,j:3},  // Matchday 1
    {i:0,j:2}, {i:1,j:3},  // Matchday 2
    {i:0,j:3}, {i:1,j:2},  // Matchday 3
  ];
  var ms = pairs.map(function(p, idx) {
    return { id: g + (idx + 1), g: g, home: t[p.i], away: t[p.j] };
  });
  GMS[g] = ms;
});
var ALL_MATCHES = GROUPS.reduce(function(a, g) { return a.concat(GMS[g]); }, []);

// ── Knockout round definitions ───────────────────────────────────────
// ── R32 fixture definitions (FIFA matches 73-88) ─────────────────────
// Slot types: pos=1 winner, pos=2 runner-up, pos=3 best-3rd (slot key)
var R32_FIXTURES = [
  {id:"r32_0",  num:73,  home:{pos:2,g:"A"},       away:{pos:2,g:"B"}          },
  {id:"r32_1",  num:74,  home:{pos:1,g:"E"},        away:{pos:3,slot:"WE"}      },
  {id:"r32_2",  num:75,  home:{pos:1,g:"F"},        away:{pos:2,g:"C"}          },
  {id:"r32_3",  num:76,  home:{pos:1,g:"C"},        away:{pos:2,g:"F"}          },
  {id:"r32_4",  num:77,  home:{pos:1,g:"I"},        away:{pos:3,slot:"WI"}      },
  {id:"r32_5",  num:78,  home:{pos:2,g:"E"},        away:{pos:2,g:"I"}          },
  {id:"r32_6",  num:79,  home:{pos:1,g:"A"},        away:{pos:3,slot:"WA"}      },
  {id:"r32_7",  num:80,  home:{pos:1,g:"L"},        away:{pos:3,slot:"WL"}      },
  {id:"r32_8",  num:81,  home:{pos:1,g:"D"},        away:{pos:3,slot:"WD"}      },
  {id:"r32_9",  num:82,  home:{pos:1,g:"G"},        away:{pos:3,slot:"WG"}      },
  {id:"r32_10", num:83,  home:{pos:2,g:"K"},        away:{pos:2,g:"L"}          },
  {id:"r32_11", num:84,  home:{pos:1,g:"H"},        away:{pos:2,g:"J"}          },
  {id:"r32_12", num:85,  home:{pos:1,g:"B"},        away:{pos:3,slot:"WB"}      },
  {id:"r32_13", num:86,  home:{pos:1,g:"J"},        away:{pos:2,g:"H"}          },
  {id:"r32_14", num:87,  home:{pos:1,g:"K"},        away:{pos:3,slot:"WK"}      },
  {id:"r32_15", num:88,  home:{pos:2,g:"D"},        away:{pos:2,g:"G"}          },
];

// Which groups each best-3rd slot can draw from (Annex C constraints)
var BEST3_SLOTS = {
  WA:{validGroups:"CEFHI",  r32id:"r32_6" },
  WB:{validGroups:"EFGIJ",  r32id:"r32_12"},
  WD:{validGroups:"BEFIJ",  r32id:"r32_8" },
  WE:{validGroups:"ABCDF",  r32id:"r32_1" },
  WG:{validGroups:"AEHIJ",  r32id:"r32_9" },
  WI:{validGroups:"CDFGH",  r32id:"r32_4" },
  WK:{validGroups:"DEIJL",  r32id:"r32_14"},
  WL:{validGroups:"EHIJK",  r32id:"r32_7" },
};

// KO bracket cascade: which two R32/R16/QF winners meet in the next round
var KO_BRACKET = {
  r16:[
    {id:"r16_0",num:89, home:"r32_0", away:"r32_1"},
    {id:"r16_1",num:90, home:"r32_2", away:"r32_3"},
    {id:"r16_2",num:91, home:"r32_4", away:"r32_5"},
    {id:"r16_3",num:92, home:"r32_6", away:"r32_7"},
    {id:"r16_4",num:93, home:"r32_8", away:"r32_9"},
    {id:"r16_5",num:94, home:"r32_10",away:"r32_11"},
    {id:"r16_6",num:95, home:"r32_12",away:"r32_13"},
    {id:"r16_7",num:96, home:"r32_14",away:"r32_15"},
  ],
  qf:[
    {id:"qf_0",num:97,  home:"r16_0",away:"r16_1"},
    {id:"qf_1",num:98,  home:"r16_2",away:"r16_3"},
    {id:"qf_2",num:99,  home:"r16_4",away:"r16_5"},
    {id:"qf_3",num:100, home:"r16_6",away:"r16_7"},
  ],
  sf:[
    {id:"sf_0",num:101,home:"qf_0",away:"qf_1"},
    {id:"sf_1",num:102,home:"qf_2",away:"qf_3"},
  ],
  final:{id:"final",num:104,home:"sf_0",away:"sf_1"},
  s3rd: {id:"s3rd", num:103,homeLose:"sf_0",awayLose:"sf_1"},
};

// Round definitions for UI tabs (in order)
var KO_ROUNDS = [
  {id:"r32",label:"Round of 32",  count:16, fixtures:R32_FIXTURES},
  {id:"r16",label:"Round of 16",  count:8,  fixtures:KO_BRACKET.r16},
  {id:"qf", label:"Quarter-Finals",count:4, fixtures:KO_BRACKET.qf},
  {id:"sf", label:"Semi-Finals",  count:2,  fixtures:KO_BRACKET.sf},
  {id:"s3rd", label:"3rd Place",  count:1,  fixtures:[KO_BRACKET.s3rd]},
  {id:"final",label:"Final",      count:1,  fixtures:[KO_BRACKET.final]},
];

// ── App defaults ─────────────────────────────────────────────────────
var DEF = {
  adminPw:    "PuraFoda888!",
  entryFee:   40,
  currency:   "COP",
  adminEmail: "",
  firebase:   "https://polla-col-2026-default-rtdb.firebaseio.com",
  deadline:   "2026-06-10T23:59",
  tcUrl:      "",
  access:     "off",   // "off" | "simple" | "robust"
  // Playoff confirmations — set by admin after finals (March 31)
  // Each entry: { teamA, teamB, confirmed, winner }
  playoffs: {
    "Playoff A": { teamA:"Bosnia & Herz.", teamB:"Italy",    confirmed:false, winner:"" },
    "Playoff B": { teamA:"Sweden",         teamB:"Poland",   confirmed:false, winner:"" },
    "Playoff C": { teamA:"Kosovo",         teamB:"Turkey",   confirmed:false, winner:"" },
    "Playoff D": { teamA:"Denmark",        teamB:"Czechia",  confirmed:false, winner:"" },
    "Playoff 1": { teamA:"Jamaica",        teamB:"DR Congo", confirmed:false, winner:"" },
    "Playoff 2": { teamA:"Bolivia",        teamB:"Iraq",     confirmed:false, winner:"" }
  },
  scoring: {
    groupResult: 3,
    groupGoalA:  1,
    groupGoalB:  1,
    groupDiff:   2,
    r32:         1,
    r16:         2,
    qf:          4,
    sf:          6,
    final:       10,
    thirdMatch:  8,
    champion:    20,
    thirdWin:    15
  },
  ejs: { svc: "", tpl_invite: "", tpl_update: "", tpl_admin: "", key: "" }
};

// ── Empty prediction / result templates ─────────────────────────────
// ko: object of KO match scores, e.g. { "r32_0": {h:"2",a:"1"}, "r16_0": {h:"1",a:"1",winner:"home"} }
var EP = { groups: {}, ko: {} };
var ER = { groups: {}, ko: {} };

// ── Claude's pre-seeded predictions ─────────────────────────────────
var CLAUDE_ENTRY = {
  id: "claude_bot",
  name: "Claude \ud83e\udd16",
  email: "claude@anthropic.com",
  preds: {
    groups: {
      // Group A: Mexico, South Africa, South Korea, Czechia
      // Prediction: Mexico 1st, South Korea 2nd, Czechia 3rd, South Africa 4th
      A1:{h:"2",a:"0"},A2:{h:"2",a:"1"},A3:{h:"1",a:"1"},A4:{h:"2",a:"0"},A5:{h:"2",a:"1"},A6:{h:"1",a:"2"},
      // Group B: Canada, Bosnia & Herz., Qatar, Switzerland
      // Prediction: Switzerland 1st, Canada 2nd, Bosnia 3rd, Qatar 4th
      B1:{h:"1",a:"2"},B2:{h:"0",a:"2"},B3:{h:"2",a:"1"},B4:{h:"1",a:"2"},B5:{h:"0",a:"2"},B6:{h:"2",a:"1"},
      // Group C: Brazil, Morocco, Haiti, Scotland
      // Prediction: Brazil 1st, Morocco 2nd, Scotland 3rd, Haiti 4th
      C1:{h:"2",a:"1"},C2:{h:"0",a:"2"},C3:{h:"4",a:"0"},C4:{h:"1",a:"1"},C5:{h:"3",a:"0"},C6:{h:"2",a:"0"},
      // Group D: USA, Paraguay, Australia, Turkey
      // Prediction: USA 1st, Turkey 2nd, Paraguay 3rd, Australia 4th
      D1:{h:"2",a:"1"},D2:{h:"1",a:"2"},D3:{h:"2",a:"1"},D4:{h:"1",a:"2"},D5:{h:"2",a:"1"},D6:{h:"1",a:"1"},
      // Group E: Germany, Curaçao, Ivory Coast, Ecuador
      // Prediction: Germany 1st, Ivory Coast 2nd, Ecuador 3rd, Curaçao 4th
      E1:{h:"4",a:"0"},E2:{h:"1",a:"1"},E3:{h:"2",a:"1"},E4:{h:"0",a:"3"},E5:{h:"2",a:"0"},E6:{h:"0",a:"2"},
      // Group F: Netherlands, Japan, Sweden, Tunisia
      // Prediction: Netherlands 1st, Sweden 2nd, Japan 3rd, Tunisia 4th
      F1:{h:"2",a:"1"},F2:{h:"1",a:"0"},F3:{h:"1",a:"1"},F4:{h:"2",a:"1"},F5:{h:"3",a:"0"},F6:{h:"2",a:"1"},
      // Group G: Belgium, Egypt, Iran, New Zealand
      // Prediction: Belgium 1st, Egypt 2nd, Iran 3rd, New Zealand 4th
      G1:{h:"3",a:"1"},G2:{h:"1",a:"0"},G3:{h:"2",a:"0"},G4:{h:"2",a:"0"},G5:{h:"3",a:"0"},G6:{h:"1",a:"1"},
      // Group H: Spain, Cape Verde, Saudi Arabia, Uruguay
      // Prediction: Spain 1st, Uruguay 2nd, Cape Verde 3rd, Saudi Arabia 4th
      H1:{h:"4",a:"0"},H2:{h:"1",a:"2"},H3:{h:"2",a:"0"},H4:{h:"0",a:"2"},H5:{h:"1",a:"0"},H6:{h:"1",a:"1"},
      // Group I: France, Senegal, Iraq, Norway
      // Prediction: France 1st, Norway 2nd, Senegal 3rd, Iraq 4th
      I1:{h:"2",a:"1"},I2:{h:"0",a:"2"},I3:{h:"3",a:"0"},I4:{h:"1",a:"2"},I5:{h:"2",a:"1"},I6:{h:"2",a:"0"},
      // Group J: Argentina, Algeria, Austria, Jordan
      // Prediction: Argentina 1st, Austria 2nd, Algeria 3rd, Jordan 4th
      J1:{h:"2",a:"0"},J2:{h:"2",a:"1"},J3:{h:"2",a:"1"},J4:{h:"2",a:"0"},J5:{h:"3",a:"0"},J6:{h:"1",a:"1"},
      // Group K: Portugal, DR Congo, Uzbekistan, Colombia
      // Prediction: Portugal 1st, Colombia 2nd, Uzbekistan 3rd, DR Congo 4th
      K1:{h:"3",a:"0"},K2:{h:"0",a:"2"},K3:{h:"3",a:"0"},K4:{h:"0",a:"2"},K5:{h:"2",a:"1"},K6:{h:"0",a:"1"},
      // Group L: England, Croatia, Ghana, Panama
      // Prediction: England 1st, Croatia 2nd, Ghana 3rd, Panama 4th
      L1:{h:"2",a:"0"},L2:{h:"1",a:"1"},L3:{h:"3",a:"1"},L4:{h:"2",a:"0"},L5:{h:"4",a:"0"},L6:{h:"2",a:"1"}
    },
    champion: "Spain",
    thirdWin: "Brazil",
    ko: {
      // Round of 32 — using real playoff teams
      // r32_0: Switzerland vs Canada      r32_1: Germany vs Bosnia
      // r32_2: Netherlands vs Morocco     r32_3: Brazil vs Japan
      // r32_4: France vs Turkey           r32_5: Ivory Coast vs Norway
      // r32_6: Mexico vs Sweden           r32_7: England vs Senegal
      // r32_8: USA vs DR Congo            r32_9: Belgium vs Egypt
      // r32_10: Colombia vs Croatia       r32_11: Spain vs Austria
      // r32_12: Canada vs Iraq            r32_13: Argentina vs Uruguay
      // r32_14: Portugal vs Czechia       r32_15: Paraguay vs Turkey (wait - Turkey in r32_4)
      r32_0:{h:"2",a:"1"}, r32_1:{h:"3",a:"0"}, r32_2:{h:"2",a:"1"}, r32_3:{h:"3",a:"0"},
      r32_4:{h:"3",a:"0"}, r32_5:{h:"2",a:"1"}, r32_6:{h:"2",a:"1"}, r32_7:{h:"2",a:"0"},
      r32_8:{h:"2",a:"1"}, r32_9:{h:"2",a:"1"}, r32_10:{h:"2",a:"1"},r32_11:{h:"3",a:"0"},
      r32_12:{h:"2",a:"1"},r32_13:{h:"2",a:"1"},r32_14:{h:"2",a:"0"},r32_15:{h:"2",a:"1"},
      // Round of 16
      r16_0:{h:"1",a:"2"}, r16_1:{h:"1",a:"2"}, r16_2:{h:"2",a:"0"}, r16_3:{h:"1",a:"2"},
      r16_4:{h:"2",a:"1"}, r16_5:{h:"1",a:"2"}, r16_6:{h:"0",a:"2"}, r16_7:{h:"2",a:"0"},
      // Quarter-Finals
      qf_0:{h:"1",a:"2"}, qf_1:{h:"2",a:"0"}, qf_2:{h:"0",a:"2"}, qf_3:{h:"2",a:"1"},
      // Semi-Finals: Brazil vs France, Spain vs Argentina
      sf_0:{h:"1",a:"2"}, sf_1:{h:"2",a:"1"},
      // Final: France vs Spain → Spain wins 0-1
      // 3rd place: Brazil vs Argentina → Brazil wins 3-2
      final:{h:"0",a:"1"}, s3rd:{h:"3",a:"2"}
    }
  }
};
