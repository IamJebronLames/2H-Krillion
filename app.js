/* Deep Dive: a Krillion-style rare-answer trivia game that runs on your own questions.
   Scoring mirrors Krillion: six tiers, 1 point = 10 m, 7 questions x 100 pts = 7,000 m. */
"use strict";

var TIERS = [
  { name: "Plankton", pts: 10 },
  { name: "Too Clever", pts: 15 },
  { name: "Schooler", pts: 30 },
  { name: "Rare", pts: 60 },
  { name: "Deep Cut", pts: 85 },
  { name: "One in a Krillion", pts: 100 }
];
var STORE = "deepdive_v1";
var SAMPLE = [
  { q: "Name a web browser.", a: [
    { n: ["Chrome", "Google Chrome"], t: 1 }, { n: ["Firefox"], t: 1 }, { n: ["Safari"], t: 1 },
    { n: ["Opera"], t: 3 }, { n: ["Brave"], t: 3 }, { n: ["Vivaldi"], t: 4 },
    { n: ["Lynx"], t: 5 }, { n: ["WorldWideWeb"], t: 6 } ] },
  { q: "Name a country that borders Germany.", a: [
    { n: ["France"], t: 1 }, { n: ["Poland"], t: 1 }, { n: ["Austria"], t: 2 }, { n: ["Switzerland"], t: 2 },
    { n: ["Netherlands", "Holland"], t: 3 }, { n: ["Denmark"], t: 3 }, { n: ["Belgium"], t: 4 },
    { n: ["Czech Republic", "Czechia"], t: 4 }, { n: ["Luxembourg"], t: 5 } ] },
  { q: "Name a composer born in Russia.", a: [
    { n: ["Tchaikovsky"], t: 1 }, { n: ["Rachmaninoff", "Rachmaninov"], t: 2 }, { n: ["Stravinsky"], t: 2 },
    { n: ["Prokofiev"], t: 3 }, { n: ["Shostakovich"], t: 4 }, { n: ["Mussorgsky"], t: 5 }, { n: ["Scriabin"], t: 6 } ] }
];

var state = load();
var app = document.getElementById("app");
var G, timer;

function load() {
  try {
    var s = JSON.parse(localStorage.getItem(STORE));
    if (s && s.questions && s.settings) return s;
  } catch (e) {}
  return { settings: { n: 7, secs: 25, daily: false }, questions: JSON.parse(JSON.stringify(SAMPLE)) };
}
function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function tag(t) { return '<span class="tier t' + t + '">' + TIERS[t - 1].name + "</span>"; }
function scale(t) { return '<div class="scale">' + TIERS.map(function (_, i) { return '<i class="t' + (i + 1) + (i + 1 === t ? " on" : "") + '"></i>'; }).join("") + "</div>"; }

/* matching: ignore case, punctuation, leading articles; allow small typos */
function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/^(the|a|an) /, "").replace(/\s+/g, " ").trim(); }
function lev(a, b) {
  var d = [], i, j;
  for (i = 0; i <= a.length; i++) d[i] = [i];
  for (j = 0; j <= b.length; j++) d[0][j] = j;
  for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function match(q, input) {
  var n = norm(input);
  if (!n) return null;
  var tol = n.length > 8 ? 2 : n.length > 4 ? 1 : 0, best = null, bd = 99;
  q.a.forEach(function (ans, i) {
    ans.n.forEach(function (name) {
      var c = norm(name), d = c === n ? 0 : lev(c, n);
      if (d <= tol && d < bd) { bd = d; best = i; }
    });
  });
  return best;
}

/* depth gauge and background follow your total depth */
function depthMax() { return state.settings.n * 1000; }
function gauge(m) {
  var p = Math.min(m / depthMax(), 1), g = document.getElementById("gauge");
  document.getElementById("diver").style.top = p * (g.clientHeight - 16) + "px";
  document.body.style.backgroundPosition = "0 " + p * 100 + "%";
}

/* ---------- home ---------- */
function home() {
  var s = state.settings;
  gauge(0);
  app.innerHTML = '<h1>Deep Dive</h1><p class="sub">Name something that fits the question. Common answers are worth little, rare ones sink you deeper. Every point is 10 m.</p>' +
    '<div class="panel"><b>' + state.questions.length + " question" + (state.questions.length === 1 ? "" : "s") + " in your bank</b>" +
    '<div class="grid"><div><label for="sn">Questions per dive</label><input id="sn" type="number" min="1" max="50" value="' + s.n + '"></div>' +
    '<div><label for="ss">Seconds per question</label><input id="ss" type="number" min="5" max="300" value="' + s.secs + '"></div></div>' +
    '<label class="inline"><input id="sd" type="checkbox"' + (s.daily ? " checked" : "") + '> Daily set (same questions all day, like the Daily Dive)</label>' +
    '<div class="row"><button id="go">Start dive</button><button class="ghost" id="ed">Edit questions</button></div><div class="err" id="e"></div></div>' +
    '<div class="panel"><b>Rarity tiers</b><div class="legend">' + TIERS.map(function (t, i) { return tag(i + 1) + " " + t.pts + " pts (" + t.pts * 10 + " m)"; }).join("") + "</div></div>";
  document.getElementById("go").onclick = function () {
    readSettings();
    if (!state.questions.length) { document.getElementById("e").textContent = "Add at least one question first."; return; }
    start();
  };
  document.getElementById("ed").onclick = function () { readSettings(); edit(); };
}
function readSettings() {
  var n = parseInt(document.getElementById("sn").value, 10), t = parseInt(document.getElementById("ss").value, 10);
  state.settings.n = Math.max(1, Math.min(50, n || 7));
  state.settings.secs = Math.max(5, Math.min(300, t || 25));
  state.settings.daily = document.getElementById("sd").checked;
  save();
}

/* ---------- editor ---------- */
function fmt(q) { return q.a.map(function (r) { return r.n.join(", ") + " | " + r.t; }).join("\n"); }
function parse(text) {
  var out = [];
  text.split("\n").forEach(function (l) {
    if (!l.trim()) return;
    var i = l.lastIndexOf("|"), names = (i < 0 ? l : l.slice(0, i)).split(",").map(function (x) { return x.trim(); }).filter(Boolean);
    var t = i < 0 ? 1 : parseInt(l.slice(i + 1), 10);
    if (!(t >= 1 && t <= 6)) t = 1;
    if (names.length) out.push({ n: names, t: t });
  });
  return out;
}
function edit() {
  gauge(0);
  app.innerHTML = "<h2>Your questions</h2>" +
    '<p class="sub">One answer per line: <code>answer, alias, alias | tier</code>. Tier 1 is the most obvious answer, 6 is the rarest: ' +
    TIERS.map(function (t, i) { return (i + 1) + " " + t.name; }).join(", ") + '.</p><div id="list"></div>' +
    '<div class="row"><button class="ghost" id="add">Add question</button><button class="ghost" id="ex">Export JSON</button>' +
    '<button class="ghost" id="im">Import JSON</button><button class="ghost" id="rs">Load samples</button></div>' +
    '<input id="file" type="file" accept=".json,application/json" hidden>' +
    '<div class="row"><button id="sv">Save and go back</button></div><div class="err" id="e"></div>';
  var list = document.getElementById("list"), err = document.getElementById("e");
  function card(x) {
    var d = document.createElement("div");
    d.className = "qcard";
    d.innerHTML = '<label>Question</label><input class="qq" value="' + esc(x.q) + '"><label>Accepted answers</label><textarea class="aa">' + esc(fmt(x)) + '</textarea><div class="row"><button class="ghost rm">Remove</button></div>';
    d.querySelector(".rm").onclick = function () { d.remove(); };
    list.appendChild(d);
  }
  function collect() {
    var out = [], bad = false;
    list.querySelectorAll(".qcard").forEach(function (c) {
      var q = c.querySelector(".qq").value.trim(), a = parse(c.querySelector(".aa").value);
      if (q || a.length) { if (!q || !a.length) bad = true; else out.push({ q: q, a: a }); }
    });
    return bad ? null : out;
  }
  state.questions.forEach(card);
  document.getElementById("add").onclick = function () { card({ q: "", a: [] }); };
  document.getElementById("rs").onclick = function () { list.innerHTML = ""; SAMPLE.forEach(card); };
  document.getElementById("ex").onclick = function () {
    var qs = collect();
    if (!qs) { err.textContent = "Each question needs text and at least one answer."; return; }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ settings: state.settings, questions: qs }, null, 2)], { type: "application/json" }));
    a.download = "deep-dive-questions.json";
    a.click();
  };
  document.getElementById("im").onclick = function () { document.getElementById("file").click(); };
  document.getElementById("file").onchange = function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var j = JSON.parse(r.result), qs = Array.isArray(j) ? j : j.questions;
        if (!Array.isArray(qs)) throw 0;
        list.innerHTML = "";
        qs.forEach(function (x) { card({ q: x.q, a: x.a.map(function (r) { return { n: [].concat(r.n), t: r.t }; }) }); });
        err.textContent = "";
      } catch (x) { err.textContent = "That file isn’t in the Deep Dive format."; }
    };
    r.readAsText(f);
  };
  document.getElementById("sv").onclick = function () {
    var qs = collect();
    if (!qs) { err.textContent = "Each question needs text and at least one answer."; return; }
    state.questions = qs; save(); home();
  };
}

/* ---------- play ---------- */
function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
function pick() {
  var qs = state.questions.slice(), r = Math.random;
  if (state.settings.daily) {
    var d = new Date(), seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
    r = rng(seed);
  }
  for (var i = qs.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = qs[i]; qs[i] = qs[j]; qs[j] = t; }
  return qs.slice(0, state.settings.n);
}
function start() { G = { qs: pick(), i: 0, pts: 0, log: [] }; ask(); }

function ask() {
  var q = G.qs[G.i], secs = state.settings.secs, t0 = Date.now(), done = false;
  app.innerHTML = '<div class="meta"><span>Question ' + (G.i + 1) + " of " + G.qs.length + "</span><span>" + G.pts * 10 + ' m</span></div><div id="bar"><div id="fill"></div></div>' +
    '<div class="q">' + esc(q.q) + '</div><input id="in" autocomplete="off" autocapitalize="off" aria-label="Your answer"><div class="row"><button id="ok">Submit</button></div>';
  var inp = document.getElementById("in"), fill = document.getElementById("fill");
  inp.focus();
  function fin() { if (done) return; done = true; clearInterval(timer); reveal(q, inp.value); }
  timer = setInterval(function () {
    var left = Math.max(0, secs * 1000 - (Date.now() - t0));
    fill.style.width = left / (secs * 10) + "%";
    if (left <= 0) fin();
  }, 100);
  document.getElementById("ok").onclick = fin;
  inp.onkeydown = function (e) { if (e.key === "Enter") fin(); };
}

function reveal(q, txt) {
  var h = match(q, txt), last = G.i === G.qs.length - 1, pts = 0, t = 0, said = txt.trim();
  if (h !== null) { t = q.a[h].t; pts = TIERS[t - 1].pts; G.pts += pts; }
  G.log.push({ q: q, said: said, hit: h, t: t, pts: pts });
  gauge(G.pts * 10);
  var rows = q.a.slice().sort(function (a, b) { return b.t - a.t; }).map(function (r) {
    var me = q.a[h] === r;
    return '<div class="ans"><span class="' + (me ? "hit" : "") + '">' + esc(r.n[0]) + (me ? " (you)" : "") + "</span>" + tag(r.t) + "</div>";
  }).join("");
  var result = h !== null
    ? "<h2>" + esc(q.a[h].n[0]) + "</h2>" + tag(t) + " &nbsp; <b>+" + pts + " pts, +" + pts * 10 + " m</b>" + scale(t)
    : "<h2>" + (said ? "Not in the answer bank" : "Out of time") + '</h2><p class="sub" style="margin:0">' + (said ? "“" + esc(said) + "” scored 0." : "No answer submitted, 0 points.") + "</p>";
  app.innerHTML = '<div class="meta"><span>Question ' + (G.i + 1) + " of " + G.qs.length + "</span><span>" + G.pts * 10 + ' m</span></div>' +
    '<div class="panel">' + result + '</div><div class="panel"><b>All accepted answers</b><div style="margin-top:6px">' + rows + "</div></div>" +
    '<div class="row"><button id="nx">' + (last ? "See result" : "Next question") + "</button></div>";
  var nx = document.getElementById("nx");
  nx.focus();
  nx.onclick = function () { if (last) end(); else { G.i++; ask(); } };
}

function end() {
  var max = G.qs.length * 100, m = G.pts * 10;
  app.innerHTML = "<h1>" + (G.pts >= max ? "You reached the trench floor" : "Dive complete") + '</h1><div class="big">' + m + ' m</div>' +
    '<p class="sub">' + G.pts + " of " + max + " points. The floor is at " + max * 10 + " m.</p><div class=\"panel\">" +
    G.log.map(function (l) {
      return '<div class="ans"><span>' + esc(l.q.q) + "<br><small>" + (l.said ? esc(l.said) : "no answer") + "</small></span><span>" + (l.hit !== null ? tag(l.t) + " +" + l.pts : "0") + "</span></div>";
    }).join("") + '</div><div class="row"><button id="again">Dive again</button><button class="ghost" id="hm">Back to start</button></div>';
  document.getElementById("again").onclick = start;
  document.getElementById("hm").onclick = home;
}

home();
