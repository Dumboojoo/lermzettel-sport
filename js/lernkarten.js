/* =========================================================
   Lernkarten – Abfragen mit Karteikasten (vereinfachtes Leitner-System)
   Alles wird nur lokal im Browser gespeichert (localStorage).

   Daten im HTML vor diesem Skript:
     window.LERNZETTEL     = { store: 'fach-thema' }            (wie auf den anderen Seiten)
     window.KARTEN_KAPITEL = [ { id:'kap-1', no:'I', t:'Kurztitel', c:'var(--c1)' }, … ]
     window.KARTEN_THEMEN  = { 'themen-id': { kap:'kap-1', t:'Thementitel', ka:true }, … }
     window.KARTEN         = [ ['themen-id', 'Vorderseite (Frage/Begriff)', 'Rückseite (Antwort, HTML erlaubt)'], … ]

   Fächer: 0 = neu · 1 = nochmal · 2 = einmal gewusst („fast“) · 3 = sitzt (zweimal gewusst)
   „Gewusst“: neu/nochmal → fast, fast → sitzt.  „Nochmal“: → Fach 1, Karte kommt in der Runde wieder.
   Die Karten-ID entsteht aus Thema + Vorderseite – Text der Vorderseite nach dem Veröffentlichen
   möglichst nicht mehr ändern, sonst gilt die Karte als neu.
   ========================================================= */
(function () {
  'use strict';

  var CFG = window.LERNZETTEL || {};
  var STORE = CFG.store || 'lernzettel';
  var KEY = STORE + '-karten';
  var THEME_KEY = STORE + '-theme';
  var KAP = window.KARTEN_KAPITEL || [];
  var THEMEN = window.KARTEN_THEMEN || {};
  var RAW = window.KARTEN || [];
  var PRIO = { 1: 0, 0: 1, 2: 2, 3: 3 };   // Reihenfolge in einer Runde: nochmal, neu, fast, sitzt
  var LABEL = ['neu', 'nochmal', 'fast', 'sitzt'];

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* privat / gesperrt */ } }
  };
  function $(id) { return document.getElementById(id); }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function strip(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }

  var kapById = {};
  KAP.forEach(function (k) { kapById[k.id] = k; });
  var cards = RAW.map(function (r, i) {
    var th = THEMEN[r[0]] || {};
    return { id: r[0] + '-' + hash(strip(r[1])), thema: r[0], kap: th.kap || '', tt: th.t || r[0], ka: !!th.ka, f: r[1], b: r[2], ord: i };
  });

  /* ---------- Zustand ---------- */
  var state = null;
  try { state = JSON.parse(store.get(KEY)); } catch (e) { state = null; }
  if (!state || typeof state !== 'object') state = {};
  if (!state.box || typeof state.box !== 'object') state.box = {};
  var opt = state.opt && typeof state.opt === 'object' ? state.opt : {};
  opt = { kap: opt.kap || 'alle', ka: !!opt.ka, mix: opt.mix !== false, rev: !!opt.rev, all: !!opt.all };
  state.opt = opt;
  if (location.hash && kapById[location.hash.slice(1)]) opt.kap = location.hash.slice(1);
  if (location.hash === '#ka') { opt.ka = true; opt.kap = 'alle'; }

  function box(c) { return state.box[c.id] || 0; }
  function save() {
    var sitzt = 0;
    cards.forEach(function (c) { if (box(c) === 3) sitzt++; });
    state.sum = { sitzt: sitzt, total: cards.length };
    store.set(KEY, JSON.stringify(state));
  }

  /* ---------- Hell / Dunkel ---------- */
  var root = document.documentElement;
  var themeBtn = $('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') ||
      (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set(THEME_KEY, next);
  });

  /* ---------- Filter ---------- */
  var chipBox = $('lkKap');
  function chip(id, label, color) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'lk-chip'; b.setAttribute('data-kap', id);
    if (color) b.style.setProperty('--cc', color);
    b.innerHTML = (color ? '<i aria-hidden="true"></i>' : '') + label;
    b.addEventListener('click', function () { opt.kap = id; save(); syncControls(); start(); });
    chipBox.appendChild(b);
  }
  if (chipBox) {
    chip('alle', 'Alle Kapitel');
    KAP.forEach(function (k) { chip(k.id, k.no + ' · ' + k.t, k.c); });
  }
  function bindToggle(id, key) {
    var i = $(id); if (!i) return;
    i.addEventListener('change', function () { opt[key] = i.checked; save(); start(); });
  }
  bindToggle('lkKa', 'ka'); bindToggle('lkMix', 'mix'); bindToggle('lkRev', 'rev'); bindToggle('lkAll', 'all');
  function syncControls() {
    [].forEach.call(document.querySelectorAll('.lk-chip'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-kap') === opt.kap ? 'true' : 'false');
    });
    if ($('lkKa')) $('lkKa').checked = opt.ka;
    if ($('lkMix')) $('lkMix').checked = opt.mix;
    if ($('lkRev')) $('lkRev').checked = opt.rev;
    if ($('lkAll')) $('lkAll').checked = opt.all;
  }

  function inFilter(c) { return (opt.kap === 'alle' || c.kap === opt.kap) && (!opt.ka || c.ka); }

  /* ---------- Statistik der Fächer ---------- */
  function stats() {
    var n = [0, 0, 0, 0], sel = cards.filter(inFilter);
    sel.forEach(function (c) { n[box(c)]++; });
    for (var i = 0; i < 4; i++) { var e = $('lkB' + i); if (e) e.textContent = n[i]; }
    var bar = $('lkBar');
    if (bar) {
      bar.innerHTML = '';
      var tot = sel.length || 1;
      [3, 2, 1, 0].forEach(function (i) {
        var s = document.createElement('span');
        s.className = 'f' + i; s.style.width = (n[i] / tot * 100) + '%';
        bar.appendChild(s);
      });
    }
    var t = $('lkSel'); if (t) t.textContent = sel.length + (sel.length === 1 ? ' Karte' : ' Karten') + ' in dieser Auswahl';
  }

  /* ---------- Runde ---------- */
  var queue = [], pos = 0, flipped = false, sess = { ok: 0, again: 0 };
  var cardEl = $('lkCard'), stage = $('lkStage'), done = $('lkDone');

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function start() {
    var pool = cards.filter(function (c) { return inFilter(c) && (opt.all || box(c) < 3); });
    if (opt.mix) {
      pool = shuffle(pool);
      pool.sort(function (a, b) { return PRIO[box(a)] - PRIO[box(b)]; });   // stabil: Zufall bleibt innerhalb eines Fachs
    } else {
      pool.sort(function (a, b) { return a.ord - b.ord; });
    }
    queue = pool; pos = 0; sess = { ok: 0, again: 0 };
    stats(); show();
  }

  function face(c, front) {
    var k = kapById[c.kap] || {};
    var meta = '<div class="lk-meta"><span>' + (k.no ? 'Kap. ' + k.no + ' · ' : '') + c.tt + '</span>' +
      (c.ka ? '<span class="ka">KA!</span>' : '') + '</div>';
    var q = opt.rev ? c.b : c.f, a = opt.rev ? c.f : c.b;
    if (front) {
      return meta + '<div class="lk-q' + (strip(q).length > 95 ? ' long' : '') + '">' + q + '</div><div class="lk-hint">Antippen oder Leertaste zum Umdrehen · Fach: ' + LABEL[box(c)] + '</div>';
    }
    return meta + '<div class="lk-qsmall">' + q + '</div><div class="lk-label">' + (opt.rev ? 'Begriff / Frage' : 'Antwort') + '</div><div class="lk-a">' + a + '</div>' +
      '<a class="lk-link" href="index.html#' + c.thema + '" target="_blank" rel="noopener">Thema im Lernzettel öffnen →</a>';
  }

  function show() {
    flipped = false;
    if (!cardEl) return;
    var c = queue[pos];
    if (!c) { finish(); return; }
    if (stage) stage.hidden = false;
    if (done) done.hidden = true;
    var k = kapById[c.kap];
    cardEl.style.setProperty('--cc', k && k.c ? k.c : 'var(--accent)');
    cardEl.classList.remove('flipped');
    $('lkFront').innerHTML = face(c, true);
    $('lkBack').innerHTML = face(c, false);
    $('lkFront').setAttribute('aria-hidden', 'false');
    $('lkBack').setAttribute('aria-hidden', 'true');
    setButtons();
    var left = queue.length - pos;
    $('lkCount').textContent = 'Noch ' + left + (left === 1 ? ' Karte' : ' Karten') + ' in dieser Runde · ' + sess.ok + ' gewusst · ' + sess.again + '× nochmal';
  }

  function setButtons() {
    $('lkOk').disabled = !flipped;
    $('lkAgain').disabled = !flipped;
    $('lkFlip').textContent = flipped ? 'Vorderseite zeigen' : 'Umdrehen';
  }

  function flip() {
    if (!queue[pos]) return;
    flipped = !flipped;
    cardEl.classList.toggle('flipped', flipped);
    $('lkFront').setAttribute('aria-hidden', flipped ? 'true' : 'false');
    $('lkBack').setAttribute('aria-hidden', flipped ? 'false' : 'true');
    setButtons();
  }

  function answer(ok) {
    var c = queue[pos];
    if (!c || !flipped) return;
    if (ok) {
      state.box[c.id] = box(c) >= 2 ? 3 : 2;
      sess.ok++;
    } else {
      state.box[c.id] = 1;
      sess.again++;
      queue.splice(Math.min(queue.length, pos + 4), 0, c);   // kommt in dieser Runde nach ein paar Karten wieder
    }
    save(); stats();
    pos++;
    show();
  }

  function finish() {
    if (stage) stage.hidden = true;
    if (!done) return;
    done.hidden = false;
    var sel = cards.filter(inFilter), sitzt = sel.filter(function (c) { return box(c) === 3; }).length;
    var h = $('lkDoneTitle'), p = $('lkDoneText');
    if (!sel.length) {
      h.textContent = 'Keine Karten in dieser Auswahl';
      p.textContent = 'Wähle ein anderes Kapitel oder schalte „nur KA!-Karten“ aus.';
    } else if (sess.ok + sess.again === 0) {
      h.textContent = 'Alles im Fach „sitzt“!';
      p.textContent = 'Alle ' + sel.length + ' Karten dieser Auswahl hast du schon zweimal gewusst. Zum Wiederholen „auch Karten, die sitzen“ einschalten.';
    } else {
      h.textContent = 'Runde geschafft!';
      p.textContent = sess.ok + ' gewusst, ' + sess.again + '× nochmal. Im Fach „sitzt“: ' + sitzt + ' von ' + sel.length + ' Karten.';
    }
  }

  if (cardEl) {
    cardEl.addEventListener('click', function (e) { if (e.target.closest('a')) return; flip(); });
    cardEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });
  }
  if ($('lkFlip')) $('lkFlip').addEventListener('click', flip);
  if ($('lkOk')) $('lkOk').addEventListener('click', function () { answer(true); });
  if ($('lkAgain')) $('lkAgain').addEventListener('click', function () { answer(false); });
  if ($('lkRestart')) $('lkRestart').addEventListener('click', start);
  if ($('lkRestart2')) $('lkRestart2').addEventListener('click', start);
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var free = !t || t === document || t === document.body || t === document.documentElement;
    if (e.key === ' ' && free) { e.preventDefault(); flip(); }
    else if (flipped && (e.key === 'ArrowRight' || e.key === 'j' || e.key === '2')) answer(true);
    else if (flipped && (e.key === 'ArrowLeft' || e.key === 'n' || e.key === '1')) answer(false);
  });
  if ($('lkReset')) $('lkReset').addEventListener('click', function () {
    if (!window.confirm('Alle Lernkarten wieder auf „neu“ setzen?')) return;
    state.box = {}; save(); start();
  });

  /* ---------- Alle Karten als Liste (zum Durchlesen / Drucken) ---------- */
  var list = $('lkList');
  if (list) {
    var html = '';
    KAP.forEach(function (k) {
      var cs = cards.filter(function (c) { return c.kap === k.id; });
      if (!cs.length) return;
      html += '<h3 style="--cc:' + (k.c || 'var(--accent)') + '"><span>' + k.no + '</span> ' + k.t + '</h3><dl>';
      cs.forEach(function (c) {
        html += '<dt>' + c.f + (c.ka ? ' <span class="ka">KA!</span>' : '') + '</dt><dd>' + c.b + '</dd>';
      });
      html += '</dl>';
    });
    list.innerHTML = html;
  }

  var det = $('lkDetails');
  if (det) window.addEventListener('beforeprint', function () { det.open = true; });

  syncControls();
  start();
})();
