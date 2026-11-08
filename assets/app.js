/* THE CODE — Architektura Życia.
   Treść kodeksu jest w index.html (statyczna). Ten skrypt obsługuje zakładki, codzienny protokół,
   przegląd tygodnia, kopię zapasową i stronę do druku. Dane są tylko w tej przeglądarce
   (localStorage, klucz code.state). Dane poprzedniej aplikacji (wp.state) zostają nietknięte. */
(function () {
  'use strict';

  var KEY = 'code.state';
  var LEGACY_KEY = 'wp.state';

  var OATH = [
    'Wstaję, bo zdecydowałem, kim chcę być.',
    'Nie pytam, czy mam ochotę. Pytam, co jest właściwe.',
    'Oddaję ten dzień Bogu i biorę za niego pełną odpowiedzialność.',
    'Dotrzymam słowa. Zrobię jedną trudną rzecz. Stworzę coś, co zostanie.',
    'Będę strzegł czasu, ciała, umysłu i snu.',
    'Przyjmę to, co przyniesie dzień, i zrobię z tym, co najlepsze.',
    'Nie szukam łatwej drogi. Szukam właściwej.'
  ];

  /* Bloki protokołu do odhaczania (rozdz. II). */
  var BLOCKS = [
    ['wake', '04:00', 'Pobudka bez drzemki i bez telefonu, modlitwa, przysięga'],
    ['run', '04:00–05:00', 'Bieg lub marsz, zimny prysznic, plan dnia'],
    ['mob1', '05:00–05:30', 'Mobilność poranna'],
    ['dw1', '05:30–06:30', 'Deep Work I: najważniejsze zadanie'],
    ['hard', 'przed 12:00', 'Trudna rzecz dnia'],
    ['work', '06:30–14:30', 'Praca w blokach, bez rozpraszania'],
    ['create', '14:30–15:15', 'Jednostka twórcza'],
    ['train', '15:30–16:45', 'Trening według rotacji'],
    ['dw2', '17:30–19:00', 'Deep Work II, czytanie 45 min'],
    ['mob2', '19:00–20:30', 'Mobilność wieczorna, ekrany wyłączone od 20:00'],
    ['faith', '20:30–21:00', 'Pismo Święte, rachunek sumienia, dziennik'],
    ['sleep', '21:00', 'Światło zgaszone']
  ];

  /* Skrócone zasady na stronę do druku (rozdz. I). */
  var WALL_RULES = [
    ['Discipline over feelings', 'Wykonuję plan niezależnie od nastroju.'],
    ['Guard your time', 'Każda godzina ma przydział.'],
    ['Amor fati', 'Przyjmuję fakty i działam w ich granicach.'],
    ['Ignore the herd', 'Mierzę życie własną miarą.'],
    ['Question everything', 'Pytam o dowody, także siebie.'],
    ['Suffer on purpose', 'Trud z wyboru, z celem i granicą.'],
    ['Do hard things daily', 'Jedna trudna rzecz przed 12:00.'],
    ['Silence is power', 'Pracuję bez widowni.'],
    ['Build, don’t consume', 'Najpierw tworzę, potem konsumuję.'],
    ['Study great men', 'Zawsze jedna biografia w toku.'],
    ['Faith before ego', 'Ambicja służy czemuś większemu.'],
    ['Earn your confidence', 'Pewność z dotrzymanych obietnic.'],
    ['Stand alone', 'Moja wartość nie zależy od aprobaty.'],
    ['Choose your company', 'Wybieram ludzi, którzy podnoszą standard.'],
    ['Leave a legacy', 'Buduję to, co zostanie.'],
    ['Sleep is the foundation', '21:00–04:00. Ambicja nie odbiera snu.'],
    ['Keep your word', 'Robię to, co powiedziałem.'],
    ['Own everything', 'Odpowiadam za wszystko, na co mam wpływ.'],
    ['Train for life', 'Sprawny także w wieku siedemdziesięciu lat.'],
    ['Measure what matters', 'Mierzę zamiast zgadywać.'],
    ['Order your space', 'Porządek wokół mnie i w głowie.'],
    ['Master your money', 'Wydaję mniej, niż zarabiam.'],
    ['Serve others', 'Moja siła chroni i wspiera.'],
    ['Keep the sabbath', 'Niedziela dla Boga, rodziny i odpoczynku.'],
    ['Speak with precision', 'Mówię mniej i dokładniej.']
  ];

  var REVIEW_Q = [
    ['kept', 'Ile dni protokołu dotrzymałem (z wersją minimalną)?'],
    ['sleep', 'Sen: średnia, krótkie noce i ich przyczyny'],
    ['training', 'Trening: co wykonałem, wyniki, sygnały przeciążenia'],
    ['goal', 'Czy najważniejsze zadania przybliżyły cel kwartału? Co posunęło się naprzód?'],
    ['created', 'Jednostki twórcze i publikacje'],
    ['broken', 'Których zasad nie dotrzymałem? Przyczyna: system, otoczenie czy decyzja?'],
    ['faith', 'Wiara i relacje: modlitwa, Msza, rodzina, przyjaciele. Komu pomogłem?'],
    ['grateful', 'Za co jestem wdzięczny?'],
    ['change', 'Jedna zmiana na przyszły tydzień'],
    ['plan', 'Plan: najważniejsze zadania, tematy twórcze, trudne rzeczy, terminy']
  ];

  // ---------- stan ----------
  function blank() { return { v: 1, days: {}, reviews: {} }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.v === 1) { s.days = s.days || {}; s.reviews = s.reviews || {}; return s; }
    } catch (e) { /* uszkodzony zapis: zaczynamy od zera, nie blokujemy aplikacji */ }
    return blank();
  }
  var S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
  }

  // ---------- daty ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDay(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return dayStr(d); }
  function today() { return dayStr(new Date()); }
  function fmtLong(s) { return parseDay(s).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
  function fmtShort(s) { return parseDay(s).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }); }
  /* Tydzień od poniedziałku; klucz = data poniedziałku. */
  function weekStart(s) { var d = parseDay(s); var wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return dayStr(d); }

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }

  // ---------- przysięga ----------
  function fillOath(id) { var box = $(id); if (!box) return; box.textContent = ''; OATH.forEach(function (l) { box.appendChild(el('p', { text: l })); }); }

  // ---------- zakładki ----------
  var VIEWS = ['today', 'code', 'review', 'wall'];
  function show(v) {
    if (VIEWS.indexOf(v) < 0) v = 'code';
    VIEWS.forEach(function (x) { $('view-' + x).hidden = x !== v; });
    Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.classList.toggle('on', b.getAttribute('data-view') === v); });
    try { localStorage.setItem('code.view', v); } catch (e) { /* bez znaczenia */ }
    if (v === 'today') renderToday();
    if (v === 'review') renderReview();
    window.scrollTo(0, 0);
  }

  // ---------- dziś ----------
  function day(d) { return S.days[d] || (S.days[d] = { done: {}, mit: '', hard: '', made: '', sleep: '', note: '' }); }
  function pctOf(rec) { var n = 0; BLOCKS.forEach(function (b) { if (rec.done && rec.done[b[0]]) n++; }); return Math.round(n / BLOCKS.length * 100); }
  function renderToday() {
    var t = today(), rec = day(t);
    $('todayDate').textContent = fmtLong(t);
    var list = $('checklist'); list.textContent = '';
    BLOCKS.forEach(function (b) {
      var id = 'cb-' + b[0];
      var cb = el('input', { type: 'checkbox', id: id, onchange: function () { rec.done[b[0]] = cb.checked; save(); score(); renderHistory(); } });
      cb.checked = !!rec.done[b[0]];
      list.appendChild(el('li', null, [cb, el('label', { for: id }, [el('span', { class: 'time', text: b[1] }), el('span', { text: b[2] })])]));
    });
    function score() {
      var n = BLOCKS.filter(function (b) { return rec.done[b[0]]; }).length;
      $('todayScore').textContent = n; $('todayMax').textContent = BLOCKS.length;
      $('todayBar').style.width = Math.round(n / BLOCKS.length * 100) + '%';
    }
    score();
    [['fMit', 'mit'], ['fHard', 'hard'], ['fMade', 'made'], ['fSleep', 'sleep'], ['fNote', 'note']].forEach(function (p) {
      var f = $(p[0]); f.value = rec[p[1]] || '';
      f.oninput = function () { rec[p[1]] = f.value; save(); if (p[1] === 'sleep') sleepWarn(); };
    });
    function sleepWarn() { var h = parseFloat(String(rec.sleep || '').replace(',', '.')); $('sleepWarn').hidden = !(h > 0 && h < 6); }
    sleepWarn();
    renderHistory();
  }
  function renderHistory() {
    var box = $('history'); box.textContent = '';
    var t = today();
    for (var i = 27; i >= 0; i--) {
      var d = addDays(t, -i), rec = S.days[d];
      var has = rec && Object.keys(rec.done || {}).some(function (k) { return rec.done[k]; });
      var p = has ? pctOf(rec) : null;
      box.appendChild(el('div', { class: 'cell' + (p === null ? '' : p >= 80 ? ' hi' : p >= 50 ? ' mid' : ' lo') + (i === 0 ? ' now' : ''), title: fmtShort(d) + (p === null ? ': brak zapisu' : ': ' + p + '%') }, [el('span', { text: p === null ? parseDay(d).getDate() : p })]));
    }
  }

  // ---------- przegląd ----------
  function weekStats(ws) {
    var kept = 0, logged = 0, sleepSum = 0, sleepN = 0, shortN = 0, made = 0;
    for (var i = 0; i < 7; i++) {
      var rec = S.days[addDays(ws, i)]; if (!rec) continue;
      var p = pctOf(rec);
      if (Object.keys(rec.done || {}).some(function (k) { return rec.done[k]; })) logged++;
      if (p >= 80) kept++;
      var h = parseFloat(String(rec.sleep || '').replace(',', '.'));
      if (h > 0) { sleepSum += h; sleepN++; if (h < 6) shortN++; }
      if ((rec.made || '').trim()) made++;
    }
    return { kept: kept, logged: logged, sleep: sleepN ? (sleepSum / sleepN).toFixed(1) : '—', shortN: shortN, made: made };
  }
  function renderReview() {
    var ws = weekStart(today());
    $('reviewWeek').textContent = 'Tydzień od ' + fmtShort(ws) + ' do ' + fmtShort(addDays(ws, 6));
    var st = weekStats(ws), box = $('weekStats'); box.textContent = '';
    [[st.kept + '/7', 'dni ≥ 80%'], [st.sleep, 'średni sen (h)'], [st.shortN, 'nocy < 6 h'], [st.made, 'dni z twórczością']].forEach(function (s) {
      box.appendChild(el('div', { class: 'stat' }, [el('b', { text: String(s[0]) }), el('span', { text: s[1] })]));
    });
    var r = S.reviews[ws] || (S.reviews[ws] = { a: {} });
    var form = $('reviewForm'); form.textContent = '';
    REVIEW_Q.forEach(function (q, i) {
      var id = 'rq-' + q[0];
      var ta = el('textarea', { id: id, maxlength: '3000', oninput: function () { r.a[q[0]] = ta.value; r.t = Date.now(); save(); renderReviewList(); } });
      ta.value = r.a[q[0]] || '';
      form.appendChild(el('label', { for: id, text: (i + 1) + '. ' + q[1] }));
      form.appendChild(ta);
    });
    renderReviewList();
  }
  function renderReviewList() {
    var box = $('reviewList'), cur = weekStart(today());
    var keys = Object.keys(S.reviews).filter(function (k) {
      var a = S.reviews[k].a || {}; return k !== cur && Object.keys(a).some(function (x) { return (a[x] || '').trim(); });
    }).sort().reverse();
    box.textContent = '';
    if (!keys.length) { box.textContent = 'Brak zapisanych przeglądów.'; return; }
    keys.forEach(function (k) {
      var a = S.reviews[k].a, det = el('details', { class: 'past' }, [el('summary', { text: 'Tydzień od ' + fmtShort(k) })]);
      REVIEW_Q.forEach(function (q, i) { if ((a[q[0]] || '').trim()) { det.appendChild(el('h4', { text: (i + 1) + '. ' + q[1] })); det.appendChild(el('p', { text: a[q[0]] })); } });
      box.appendChild(det);
    });
  }

  // ---------- kopia zapasowa ----------
  function download(name, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var a = el('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function msg(t, bad) { var m = $('backupMsg'); m.textContent = t; m.className = 'small ' + (bad ? 'warn' : 'ok'); }
  $('btnExport').addEventListener('click', function () { download('the-code-' + today() + '.json', S); msg('Kopia zapisana.'); });
  $('fileImport').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () {
      try {
        var d = JSON.parse(rd.result);
        if (!d || d.v !== 1 || typeof d.days !== 'object') throw new Error('format');
        if (!confirm('Wczytać kopię? Obecne zapisy na tym urządzeniu zostaną zastąpione.')) return;
        S = { v: 1, days: d.days || {}, reviews: d.reviews || {} }; save(); msg('Kopia wczytana.'); renderReview();
      } catch (err) { msg('To nie jest plik kopii The Code.', true); }
      e.target.value = '';
    };
    rd.readAsText(f);
  });
  var legacy = null;
  try { legacy = localStorage.getItem(LEGACY_KEY); } catch (e) { legacy = null; }
  if (legacy) {
    $('legacyBox').hidden = false;
    $('btnLegacy').addEventListener('click', function () {
      try { download('wayne-protocol-' + today() + '.json', JSON.parse(legacy)); } catch (e) { download('wayne-protocol-' + today() + '.json', { raw: legacy }); }
    });
  }

  // ---------- ściana ----------
  var wr = $('wallRules');
  WALL_RULES.forEach(function (r) { wr.appendChild(el('li', null, [el('b', { text: r[0] }), el('span', { text: r[1] })])); });
  $('btnPrint').addEventListener('click', function () { document.body.classList.add('print-wall'); window.print(); });
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-wall'); });

  // ---------- start ----------
  fillOath('oathToday'); fillOath('oathMain'); fillOath('oathWall');
  Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) {
    b.addEventListener('click', function () { show(b.getAttribute('data-view')); });
  });
  // linki ze spisu treści i odsyłacze działają w widoku Kodeks
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#s-"]');
    if (!a) return;
    e.preventDefault();
    show('code');
    var t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  var start = 'code';
  try { start = localStorage.getItem('code.view') || 'code'; } catch (e) { /* zostaje Kodeks */ }
  show(start);
})();
