/* The Wayne Protocol — 30 dni jednego celu.
   Dane są tylko w tej przeglądarce (localStorage, klucz wp.state). Bez serwera, bez kont.
   Przebieg: odcięcie (ghosting, wyciszenie, social media) → skill główny i poboczny → zasady nienegocjowalne
   → alter ego (imię + 3 zasady) → strój → przysięga → 30 dni: codzienny raport, dziennik, Bat-Signal
   → po 30 dniach podsumowanie → miesiąc trafia do historii → od nowa. */
(function () {
  'use strict';

  var KEY = 'wp.state';
  var DAYS = 30;
  var SIGNAL_MIN = 10;   // Bat-Signal: tyle minut zwłoki, zanim w ogóle rozważysz ustępstwo

  // ---------- stan ----------
  function blank() { return { v: 1, current: null, draft: null, history: [] }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && s.v === 1) { s.history = s.history || []; return s; }
    } catch (e) { /* uszkodzony zapis — start od zera, nie wywracamy aplikacji */ }
    return blank();
  }
  var S = load();
  var saveFailed = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; }
    catch (e) { saveFailed = true; }
  }

  // ---------- daty (lokalne dni kalendarzowe) ----------
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDay(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return dayStr(d); }
  function diffDays(a, b) { return Math.round((parseDay(b) - parseDay(a)) / 86400000); }
  function today() { return dayStr(new Date()); }
  function fmtDay(s) { return parseDay(s).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function fmtTs(ts) { return new Date(ts).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // ---------- DOM ----------
  var app = document.getElementById('app');
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  function mount(nodes) { app.innerHTML = ''; add(app, nodes); window.scrollTo(0, 0); }
  var modalEl = null;
  function openModal(nodes) {
    closeModal();
    modalEl = h('div', { class: 'modal-bg', onclick: function (e) { if (e.target === modalEl) closeModal(); } }, h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' }, nodes));
    document.body.appendChild(modalEl);
  }
  function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; } if (signalTimer) { clearInterval(signalTimer); signalTimer = null; } }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  function brand(navItems) {
    return h('header', { class: 'brand' },
      h('div', { class: 'brand-mark', text: 'Wayne Protocol' }),
      navItems ? h('nav', null, navItems) : null);
  }
  function field(labelText, input, hint) { return h('div', null, h('label', { text: labelText }), input, hint ? h('div', { class: 'dim small mt', text: hint }) : null); }

  // ---------- wprowadzenie ----------
  var STEPS = ['detox', 'skills', 'rules', 'alter', 'suit', 'oath'];
  function draft() {
    if (!S.draft) {
      var last = S.history[S.history.length - 1];
      // nowy miesiąc: podpowiadamy poprzednie ustawienia — można je zmienić
      S.draft = last ? { step: 'intro', skill: last.skill, side: last.side, rules: last.rules.slice(), alter: { name: last.alter.name, principles: last.alter.principles.slice() }, suit: last.suit, suitWhen: last.suitWhen || '' }
        : { step: 'intro', skill: '', side: '', rules: ['', '', ''], alter: { name: '', principles: ['', '', ''] }, suit: '', suitWhen: '' };
    }
    return S.draft;
  }
  function go(step) { draft().step = step; save(); render(); }
  function stepBar(step) {
    var i = STEPS.indexOf(step);
    return h('div', { class: 'steps', 'aria-hidden': 'true' }, STEPS.map(function (_, j) { return h('i', { class: j <= i ? 'on' : '' }); }));
  }

  function viewIntro() {
    var d = draft();
    return [brand(S.history.length ? [h('button', { class: 'btn small ghost', text: 'Historia', onclick: viewHistoryList })] : null),
      h('section', { class: 'card gold' },
        h('div', { class: 'eyebrow', text: S.history.length ? 'Nowy miesiąc' : '30 dni. Jeden cel.' }),
        h('h1', { text: 'The Wayne Protocol' }),
        h('p', { text: 'Przez 30 dni znikasz dla świata, żeby wrócić jako ktoś inny. Jeden główny skill, jeden poboczny, zasady, których nie negocjujesz, i alter ego, w które wchodzisz za każdym razem, gdy zakładasz swój strój.' }),
        h('div', { class: 'quote', text: 'Świat zobaczy wynik. Nikt nie musi widzieć treningu.' }),
        h('p', { class: 'dim small', text: 'Wszystko, co ustalisz, będzie dostępne przez całe 30 dni. Po tym czasie zobaczysz podsumowanie, a miesiąc trafi do historii.' }),
        h('button', { class: 'btn gold', text: d.step === 'intro' ? 'Zaczynam' : 'Kontynuuj', onclick: function () { go(d.step === 'intro' || d.step === 'notyet' ? 'detox' : d.step); } }))];
  }

  function viewDetox() {
    return [brand(), stepBar('detox'),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Krok 1 · Odcięcie' }),
        h('h2', { text: 'Czy zghostowałeś wszystkich, wyciszyłeś grupy i usunąłeś social media?' }),
        h('p', { class: 'dim', text: 'Bruce Wayne nie tłumaczy się nikomu, gdzie znika. Zanim zaczniesz, każdy kanał, który kradnie twoją uwagę, musi zostać zamknięty.' }),
        h('div', { class: 'disclaimer', text: 'Jeśli używasz social mediów do pracy — zainstaluj aplikację tylko na czas zadania i od razu po nim ją usuń.' }),
        h('div', { class: 'row' },
          h('button', { class: 'btn red', text: 'Nie', onclick: function () { go('notyet'); } }),
          h('button', { class: 'btn gold', text: 'Tak', onclick: function () { draft().detoxAt = Date.now(); go('skills'); } })))];
  }

  function viewNotYet() {
    return [brand(),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Jeszcze nie' }),
        h('h2', { text: 'Wróć i powtórz, kiedy to zrobisz.' }),
        h('p', { class: 'dim', text: 'Protokół nie zaczyna się od połowy. Zghostuj, wycisz grupy, usuń social media — i dopiero wtedy wróć.' }),
        h('div', { class: 'disclaimer', text: 'Jeśli używasz social mediów do pracy — zainstaluj aplikację tylko na czas zadania i od razu po nim ją usuń.' }),
        h('button', { class: 'btn gold', text: 'Zrobione — wracam', onclick: function () { go('detox'); } }))];
  }

  function viewSkills() {
    var d = draft();
    var main = h('input', { type: 'text', maxlength: 80, value: d.skill, placeholder: 'np. programowanie, boks, sprzedaż', oninput: function (e) { d.skill = e.target.value; save(); upd(); } });
    var side = h('input', { type: 'text', maxlength: 80, value: d.side, placeholder: 'np. język angielski, czytanie', oninput: function (e) { d.side = e.target.value; save(); upd(); } });
    var next = h('button', { class: 'btn gold', text: 'Dalej', onclick: function () { go('rules'); } });
    function upd() { next.disabled = !(d.skill.trim() && d.side.trim()); }
    upd();
    return [brand(), stepBar('skills'),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Krok 2 · Skille' }),
        h('h2', { text: 'Jeden skill, któremu oddajesz się w 100%. I jeden poboczny.' }),
        field('Skill główny (100%)', main, 'Na nim stoi cały miesiąc. Codziennie, bez wyjątków.'),
        field('Skill poboczny', side, 'Wspiera główny — nigdy go nie wypiera.'),
        h('div', { class: 'row mt' }, h('button', { class: 'btn ghost', text: 'Wstecz', onclick: function () { go('detox'); } }), next))];
  }

  function listEditor(arr, opts) {
    var box = h('div', { class: 'list-edit' });
    function draw() {
      box.innerHTML = '';
      arr.forEach(function (v, i) {
        box.appendChild(h('div', { class: 'item' },
          h('span', { class: 'n', text: (i + 1) + '.' }),
          h('input', { type: 'text', maxlength: 140, value: v, placeholder: opts.ph(i), oninput: function (e) { arr[i] = e.target.value; save(); opts.change(); } }),
          opts.fixed ? null : h('button', { class: 'btn small ghost', 'aria-label': 'Usuń', text: '×', disabled: arr.length <= opts.min, onclick: function () { arr.splice(i, 1); save(); draw(); opts.change(); } })));
      });
      if (!opts.fixed && arr.length < opts.max) box.appendChild(h('button', { class: 'btn small ghost', text: '+ Dodaj zasadę', onclick: function () { arr.push(''); save(); draw(); opts.change(); } }));
    }
    draw();
    return box;
  }

  function viewRules() {
    var d = draft();
    var next = h('button', { class: 'btn gold', text: 'Dalej', onclick: function () { d.rules = d.rules.map(function (r) { return r.trim(); }).filter(Boolean); go('alter'); } });
    function upd() { next.disabled = !d.rules.some(function (r) { return r.trim(); }); }
    var ed = listEditor(d.rules, { min: 1, max: 7, change: upd, ph: function (i) { return ['np. Pobudka o 5:30', 'np. Zero alkoholu', 'np. 2 h skilla głównego, zanim sprawdzę telefon'][i] || 'Kolejna zasada'; } });
    upd();
    return [brand(), stepBar('rules'),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Krok 3 · Zasady nienegocjowalne' }),
        h('h2', { text: 'Czego nie negocjujesz przez 30 dni?' }),
        h('p', { class: 'dim', text: 'Konkretnie i sprawdzalnie — tak, żeby wieczorem dało się odpowiedzieć tylko „tak” albo „nie”. Najlepiej 3–5.' }),
        ed,
        h('div', { class: 'row mt' }, h('button', { class: 'btn ghost', text: 'Wstecz', onclick: function () { go('skills'); } }), next))];
  }

  function viewAlter() {
    var d = draft();
    var name = h('input', { type: 'text', maxlength: 60, value: d.alter.name, placeholder: 'Jak brzmi imię twojego alter ego?', oninput: function (e) { d.alter.name = e.target.value; save(); upd(); } });
    var next = h('button', { class: 'btn gold', text: 'Dalej', onclick: function () { go('suit'); } });
    function upd() { next.disabled = !(d.alter.name.trim() && d.alter.principles.every(function (p) { return p.trim(); })); }
    var ed = listEditor(d.alter.principles, { fixed: true, min: 3, max: 3, change: upd, ph: function (i) { return ['Zasada 1 — np. Nie tłumaczę się, działam', 'Zasada 2 — np. Dyscyplina ponad nastrój', 'Zasada 3 — np. Kończę to, co zaczynam'][i]; } });
    upd();
    return [brand(), stepBar('alter'),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Krok 4 · Alter ego' }),
        h('h2', { text: 'Stwórz alter ego. 3 zasady, według których żyje.' }),
        h('p', { class: 'dim', text: 'Bruce Wayne bywa zmęczony, rozproszony, wygodny. Jego alter ego — nie. To ono przejmuje stery, gdy robi się trudno.' }),
        field('Imię alter ego', name),
        h('label', { text: '3 zasady alter ego' }), ed,
        h('div', { class: 'row mt' }, h('button', { class: 'btn ghost', text: 'Wstecz', onclick: function () { go('rules'); } }), next))];
  }

  function viewSuit() {
    var d = draft();
    var suit = h('input', { type: 'text', maxlength: 100, value: d.suit, placeholder: 'np. czarna bluza, zegarek, słuchawki', oninput: function (e) { d.suit = e.target.value; save(); upd(); } });
    var when = h('input', { type: 'text', maxlength: 140, value: d.suitWhen, placeholder: 'np. zawsze przed treningiem i blokiem pracy', oninput: function (e) { d.suitWhen = e.target.value; save(); } });
    var next = h('button', { class: 'btn gold', text: 'Dalej', onclick: function () { go('oath'); } });
    function upd() { next.disabled = !d.suit.trim(); }
    upd();
    return [brand(), stepBar('suit'),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Krok 5 · Strój' }),
        h('h2', { text: 'Twój strój.' }),
        h('p', { class: 'dim', text: 'Coś, co zakładasz albo robisz — i w tym momencie wchodzisz w alter ego. Rzecz, rytuał, gest. Zawsze ten sam.' }),
        field('Strój / rytuał', suit),
        field('Kiedy go zakładasz (opcjonalnie)', when),
        h('div', { class: 'row mt' }, h('button', { class: 'btn ghost', text: 'Wstecz', onclick: function () { go('alter'); } }), next))];
  }

  function summaryKV(p) {
    return h('div', { class: 'kv' },
      kv('Skill główny (100%)', p.skill), kv('Skill poboczny', p.side),
      h('div', null, h('div', { class: 'k', text: 'Zasady nienegocjowalne' }), h('ol', { class: 'rules' }, p.rules.map(function (r) { return h('li', { text: r }); }))),
      h('div', null, h('div', { class: 'k', text: 'Alter ego' }), h('div', { class: 'v', text: p.alter.name }), h('ol', { class: 'rules' }, p.alter.principles.map(function (r) { return h('li', { text: r }); }))),
      kv('Strój', p.suit + (p.suitWhen ? ' — ' + p.suitWhen : '')));
  }
  function kv(k, v) { return h('div', null, h('div', { class: 'k', text: k }), h('div', { class: 'v', text: v })); }

  function viewOath() {
    var d = draft();
    var p = { skill: d.skill.trim(), side: d.side.trim(), rules: d.rules.map(function (r) { return r.trim(); }).filter(Boolean), alter: { name: d.alter.name.trim(), principles: d.alter.principles.map(function (r) { return r.trim(); }) }, suit: d.suit.trim(), suitWhen: (d.suitWhen || '').trim() };
    var start = h('button', { class: 'btn gold', text: 'Rozpocznij 30 dni', disabled: true, onclick: function () {
      S.current = { id: uid(), start: today(), startedAt: Date.now(), skill: p.skill, side: p.side, rules: p.rules, alter: p.alter, suit: p.suit, suitWhen: p.suitWhen, days: {}, journal: [] };
      S.draft = null; save(); render();
    } });
    return [brand(), stepBar('oath'),
      h('section', { class: 'card gold' },
        h('div', { class: 'eyebrow', text: 'Krok 6 · Przysięga' }),
        h('h2', { text: 'Od dziś przez 30 dni:' }),
        summaryKV(p),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', onchange: function (e) { start.disabled = !e.target.checked; } }),
          h('span', { text: 'Przyjmuję to. Bez wymówek, bez negocjacji, bez publiczności. Przez 30 dni.' })),
        h('div', { class: 'row' }, h('button', { class: 'btn ghost', text: 'Wstecz', onclick: function () { go('suit'); } }), start))];
  }

  // ---------- 30 dni ----------
  function dayIndex(c) { return diffDays(c.start, today()) + 1; }
  function statsOf(c, upTo) {
    var kept = 0, failed = 0, streak = 0, best = 0, run = 0;
    for (var i = 0; i < DAYS; i++) {
      var d = addDays(c.start, i);
      if (d > upTo) break;
      var m = c.days[d];
      if (m === 'kept') { kept++; run++; best = Math.max(best, run); } else { if (m === 'failed') failed++; run = 0; }
    }
    // seria liczona wstecz od dziś (dzisiejszy brak raportu jeszcze jej nie przerywa)
    for (var j = 0, dd = upTo; j < DAYS; j++, dd = addDays(dd, -1)) {
      if (dd < c.start) break;
      var mm = c.days[dd];
      if (mm === 'kept') streak++; else if (dd === upTo && !mm) continue; else break;
    }
    return { kept: kept, failed: failed, streak: streak, best: best };
  }

  function dayGrid(c, upTo) {
    var t = today();
    return h('div', { class: 'grid', role: 'img', 'aria-label': 'Siatka 30 dni' }, Array.from({ length: DAYS }, function (_, i) {
      var d = addDays(c.start, i), m = c.days[d];
      var cls = [m === 'kept' ? 'kept' : m === 'failed' ? 'failed' : '', d === t && upTo >= t ? 'today' : '', d > upTo ? 'future' : ''].join(' ');
      return h('div', { class: cls, title: fmtDay(d) + (m === 'kept' ? ' — utrzymany' : m === 'failed' ? ' — porażka' : ''), text: String(i + 1) });
    }));
  }

  function mark(day, val) {
    var c = S.current;
    if (val) c.days[day] = val; else delete c.days[day];
    save(); render();
    if (val === 'failed') openFailure(day);
  }

  function viewDashboard() {
    var c = S.current, t = today(), n = dayIndex(c), st = statsOf(c, t), yest = addDays(t, -1);
    var todayMark = c.days[t];
    function reportRow(day, labelTxt) {
      var m = c.days[day];
      return h('div', { class: 'mt' },
        h('div', { class: 'dim small', text: labelTxt + (m ? '' : ' — brak raportu') }),
        h('div', { class: 'row mt' },
          h('button', { class: 'btn ' + (m === 'kept' ? 'gold' : ''), text: 'Utrzymałem zasady', onclick: function () { mark(day, m === 'kept' ? null : 'kept'); } }),
          h('button', { class: 'btn red', text: m === 'failed' ? 'Porażka — zapisano' : 'Złamałem zasadę', onclick: function () { if (m === 'failed') mark(day, null); else mark(day, 'failed'); } })));
    }
    return [
      brand([h('button', { class: 'btn small ghost', text: 'Dziennik', onclick: function () { document.getElementById('journal').scrollIntoView({ behavior: 'smooth' }); } }),
        S.history.length ? h('button', { class: 'btn small ghost', text: 'Historia', onclick: viewHistoryList }) : null,
        h('button', { class: 'btn small ghost', text: '⋯', 'aria-label': 'Więcej', onclick: viewMenu })]),
      saveFailed ? h('div', { class: 'disclaimer', text: 'Nie udało się zapisać danych w przeglądarce (brak miejsca lub tryb prywatny). Zrób kopię zapasową.' }) : null,
      h('section', { class: 'card gold' },
        h('div', { class: 'day-head' },
          h('div', null, h('div', { class: 'eyebrow', text: c.alter.name + ' · w akcji' }), h('div', { class: 'day-num' }, 'Dzień ' + Math.min(n, DAYS), h('small', { text: ' / ' + DAYS }))),
          h('span', { class: 'status-pill ' + (todayMark || ''), text: todayMark === 'kept' ? 'Dziś: utrzymany' : todayMark === 'failed' ? 'Dziś: porażka' : 'Dziś: bez raportu' })),
        h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.round(Math.min(n, DAYS) / DAYS * 100) + '%' })),
        h('div', { class: 'dim small', text: 'Start ' + fmtDay(c.start) + ' · koniec ' + fmtDay(addDays(c.start, DAYS - 1)) }),
        dayGrid(c, t),
        h('div', { class: 'legend' }, h('span', null, h('b', { style: 'background:rgba(201,162,39,.85)' }), 'utrzymany'), h('span', null, h('b', { style: 'background:rgba(201,74,61,.8)' }), 'porażka'), h('span', null, h('b', { style: 'background:#0e1014;border:1px solid #2a2e36' }), 'bez raportu')),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('b', { text: String(st.streak) }), h('span', { text: 'seria dni' })),
          h('div', { class: 'stat' }, h('b', { text: String(st.kept) }), h('span', { text: 'utrzymane' })),
          h('div', { class: 'stat' }, h('b', { text: String(st.failed) }), h('span', { text: 'porażki' })))),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Raport dnia' }),
        h('h3', { text: 'Czy dziś utrzymałeś wszystkie zasady nienegocjowalne?' }),
        reportRow(t, 'Dziś, ' + fmtDay(t)),
        yest >= c.start && !c.days[yest] ? reportRow(yest, 'Wczoraj, ' + fmtDay(yest)) : null),
      h('button', { class: 'signal', text: 'Bat-Signal — pokusa', onclick: openSignal }),
      h('div', { class: 'dim small center mt', text: 'Gdy czujesz, że zaraz złamiesz zasadę — zanim cokolwiek zrobisz.' }),
      h('section', { class: 'card mt' }, h('div', { class: 'eyebrow', text: 'Protokół' }), summaryKV(c)),
      journalSection(c, true)
    ];
  }

  // ---------- Bat-Signal ----------
  var signalTimer = null;
  function openSignal() {
    var c = S.current, end = Date.now() + SIGNAL_MIN * 60000;
    var tm = h('div', { class: 'timer', text: SIGNAL_MIN + ':00' });
    openModal([
      h('div', { class: 'eyebrow', text: 'Bat-Signal' }),
      h('h2', { text: 'Stop. Teraz decyduje ' + c.alter.name + '.' }),
      h('p', { class: 'dim', text: 'Załóż strój: ' + c.suit + '. Odczekaj ' + SIGNAL_MIN + ' minut, zanim cokolwiek zrobisz. Pokusa jest najsilniejsza na początku — potem słabnie.' }),
      tm,
      h('div', { class: 'k', style: 'font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)', text: 'Zasady ' + c.alter.name }),
      h('ol', { class: 'rules' }, c.alter.principles.map(function (r) { return h('li', { text: r }); })),
      h('div', { class: 'k mt', style: 'font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)', text: 'Nie negocjujesz' }),
      h('ol', { class: 'rules' }, c.rules.map(function (r) { return h('li', { text: r }); })),
      h('div', { class: 'quote', text: 'Za 30 dni nie będzie liczyło się, jak się teraz czułeś — tylko co zrobiłeś.' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn gold', text: 'Wytrzymałem', onclick: function () { addEntry({ type: 'reflection', text: 'Bat-Signal: pokusa przetrwana.' }); closeModal(); } }),
        h('button', { class: 'btn ghost', text: 'Zamknij', onclick: closeModal }))
    ]);
    signalTimer = setInterval(function () {
      var left = Math.max(0, end - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000);
      tm.textContent = left > 0 ? m + ':' + pad(s) : 'Czas minął. Decyzja należy do ' + c.alter.name + '.';
      if (!left) { clearInterval(signalTimer); signalTimer = null; tm.style.fontSize = '1.1rem'; }
    }, 500);
  }

  // ---------- dziennik ----------
  var FAIL_FIELDS = [
    ['time', 'Kiedy (godzina)', 'np. 23:40'],
    ['place', 'Gdzie', 'np. łóżko, telefon w ręku'],
    ['feeling', 'Co czułem', 'np. zmęczenie, nuda, samotność'],
    ['sequence', 'Sekwencja działań', 'Krok po kroku: co zrobiłem od pierwszego impulsu do porażki'],
    ['relief', 'Jaką chwilową ulgę lub przyjemność dała mi porażka?', 'Uczciwie — co naprawdę z tego miałem'],
    ['lesson', 'Co zrobię następnym razem', 'Konkretny ruch, który przerwie ten łańcuch wcześniej']
  ];
  function addEntry(e) {
    var c = S.current; if (!c) return;
    e.id = uid(); e.ts = e.ts || Date.now();
    c.journal.unshift(e); save(); render();
  }
  function openFailure(day) {
    var d = { time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) };
    var inputs = FAIL_FIELDS.map(function (f) {
      var long = f[0] === 'sequence' || f[0] === 'relief' || f[0] === 'lesson';
      var el = h(long ? 'textarea' : 'input', { type: long ? null : 'text', maxlength: 2000, placeholder: f[2], value: d[f[0]] || '', oninput: function (e) { d[f[0]] = e.target.value; } });
      return field(f[1], el);
    });
    openModal([
      h('div', { class: 'eyebrow', text: 'Dziennik porażki' + (day ? ' · ' + fmtDay(day) : '') }),
      h('h2', { text: 'Porażka to dane. Zapisz je.' }),
      h('p', { class: 'dim', text: 'Tak jak w dzienniku Batmana: bez oceniania, same fakty. Wzorzec, który zobaczysz, jest ważniejszy niż ten jeden dzień.' }),
      inputs,
      h('div', { class: 'row mt' },
        h('button', { class: 'btn ghost', text: 'Później', onclick: closeModal }),
        h('button', { class: 'btn gold', text: 'Zapisz', onclick: function () {
          var any = FAIL_FIELDS.some(function (f) { return (d[f[0]] || '').trim(); });
          if (!any) { closeModal(); return; }
          var e = { type: 'failure', day: day || today() };
          FAIL_FIELDS.forEach(function (f) { e[f[0]] = (d[f[0]] || '').trim(); });
          closeModal(); addEntry(e);
        } }))
    ]);
  }
  function openReflection() {
    var txt = '';
    openModal([
      h('div', { class: 'eyebrow', text: 'Refleksja' }),
      h('h2', { text: 'Co dziś zobaczyłeś?' }),
      h('textarea', { maxlength: 4000, placeholder: 'Myśl, obserwacja, decyzja na jutro…', oninput: function (e) { txt = e.target.value; } }),
      h('div', { class: 'row mt' },
        h('button', { class: 'btn ghost', text: 'Anuluj', onclick: closeModal }),
        h('button', { class: 'btn gold', text: 'Zapisz', onclick: function () { if (txt.trim()) { closeModal(); addEntry({ type: 'reflection', text: txt.trim() }); } else closeModal(); } }))
    ]);
  }
  function entryView(e, editable) {
    var del = editable ? h('button', { class: 'btn small ghost', text: 'Usuń', onclick: function () {
      if (!confirm('Usunąć ten wpis z dziennika?')) return;
      S.current.journal = S.current.journal.filter(function (x) { return x.id !== e.id; }); save(); render();
    } }) : null;
    if (e.type === 'failure') {
      return h('div', { class: 'entry' },
        h('div', { class: 'meta' }, h('span', { class: 'tag', text: 'Porażka' }), h('span', { text: (e.day ? fmtDay(e.day) + ' · ' : '') + 'zapisano ' + fmtTs(e.ts) }), del),
        h('dl', null, FAIL_FIELDS.map(function (f) { return e[f[0]] ? [h('dt', { text: f[1] }), h('dd', { text: e[f[0]] })] : null; })));
    }
    return h('div', { class: 'entry' },
      h('div', { class: 'meta' }, h('span', { class: 'tag ref', text: 'Refleksja' }), h('span', { text: fmtTs(e.ts) }), del),
      h('p', { text: e.text }));
  }
  function journalSection(c, editable) {
    return h('section', { class: 'card', id: 'journal' },
      h('div', { class: 'eyebrow', text: 'Dziennik' }),
      h('h3', { text: 'Refleksje i porażki' }),
      editable ? h('div', { class: 'row' },
        h('button', { class: 'btn', text: '+ Refleksja', onclick: openReflection }),
        h('button', { class: 'btn red', text: '+ Wpis po porażce', onclick: function () { openFailure(today()); } })) : null,
      h('div', { class: 'mt' }, c.journal.length ? c.journal.map(function (e) { return entryView(e, editable); }) : h('div', { class: 'dim small', text: 'Brak wpisów.' })));
  }

  // ---------- koniec miesiąca ----------
  function viewSummary() {
    var c = S.current, last = addDays(c.start, DAYS - 1), st = statsOf(c, last);
    var reported = st.kept + st.failed, rate = Math.round(st.kept / DAYS * 100);
    var sys = st.kept >= Math.ceil(DAYS * 0.8);   // propozycja: ≥ 24 z 30 dni utrzymanych
    var verdict = null, notes = '';
    var fin = h('button', { class: 'btn gold', text: 'Zamknij miesiąc i zacznij od nowa', disabled: true, onclick: function () {
      S.history.push(Object.assign({}, c, { end: last, closedAt: Date.now(), status: 'completed', result: { success: verdict, kept: st.kept, failed: st.failed, unreported: DAYS - reported, best: st.best, notes: notes.trim() } }));
      S.current = null; S.draft = null; save(); render();
    } });
    function pick(v) { verdict = v; yes.className = 'btn ' + (v ? 'gold' : ''); no.className = 'btn red' + (v === false ? ' gold' : ''); fin.disabled = false; }
    var yes = h('button', { class: 'btn', text: 'Tak — osiągnąłem cel', onclick: function () { pick(true); } });
    var no = h('button', { class: 'btn red', text: 'Nie tym razem', onclick: function () { pick(false); } });
    return [brand(),
      h('section', { class: 'card gold' },
        h('div', { class: 'eyebrow', text: '30 dni minęło' }),
        h('h1', { text: 'Podsumowanie' }),
        h('div', { class: 'dim small', text: fmtDay(c.start) + ' — ' + fmtDay(last) + ' · ' + c.alter.name }),
        dayGrid(c, last),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('b', { text: st.kept + '/' + DAYS }), h('span', { text: 'utrzymane' })),
          h('div', { class: 'stat' }, h('b', { text: String(st.failed) }), h('span', { text: 'porażki' })),
          h('div', { class: 'stat' }, h('b', { text: String(st.best) }), h('span', { text: 'najdłuższa seria' }))),
        h('p', { class: 'mt', text: 'Utrzymałeś zasady przez ' + rate + '% dni' + (DAYS - reported ? ' (bez raportu: ' + (DAYS - reported) + ')' : '') + '. ' + (sys ? 'To wynik na poziomie sukcesu (co najmniej 24 z 30 dni).' : 'To poniżej progu sukcesu (24 z 30 dni) — ale ocena należy do ciebie.') }),
        h('div', { class: 'quote', text: 'Skill główny: ' + c.skill + ' · poboczny: ' + c.side }),
        h('h3', { class: 'mt', text: 'Czy osiągnąłeś sukces?' }),
        h('div', { class: 'row' }, yes, no),
        field('Wnioski na następny miesiąc', h('textarea', { maxlength: 4000, placeholder: 'Co działało, co zmienić, co zabierasz dalej', oninput: function (e) { notes = e.target.value; } })),
        h('div', { class: 'mt' }, fin)),
      journalSection(c, false)];
  }

  // ---------- historia ----------
  function viewHistoryList() {
    var items = S.history.slice().reverse();
    mount([brand([h('button', { class: 'btn small ghost', text: 'Wróć', onclick: render })]),
      h('section', { class: 'card' },
        h('div', { class: 'eyebrow', text: 'Historia' }),
        h('h2', { text: 'Zakończone miesiące' }),
        items.length ? items.map(function (p) {
          var r = p.result || {};
          return h('div', { class: 'history-item', role: 'button', tabindex: '0', onclick: function () { viewHistoryItem(p); }, onkeydown: function (e) { if (e.key === 'Enter') viewHistoryItem(p); } },
            h('div', null, h('div', { class: 'v', style: 'font-family:var(--serif)', text: fmtDay(p.start) + ' — ' + fmtDay(p.end || p.start) }),
              h('div', { class: 'dim small', text: p.alter.name + ' · ' + p.skill + ' · ' + (r.kept || 0) + '/' + DAYS + ' dni' + (p.status === 'aborted' ? ' · przerwany' : '') })),
            h('span', { class: 'status-pill ' + (r.success ? 'kept' : 'failed'), text: r.success ? 'Sukces' : p.status === 'aborted' ? 'Przerwany' : 'Bez sukcesu' }));
        }) : h('div', { class: 'dim small', text: 'Brak zakończonych miesięcy.' }))]);
  }
  function viewHistoryItem(p) {
    var r = p.result || {};
    mount([brand([h('button', { class: 'btn small ghost', text: 'Wróć', onclick: viewHistoryList })]),
      h('section', { class: 'card gold' },
        h('div', { class: 'eyebrow', text: p.status === 'aborted' ? 'Przerwany protokół' : 'Zakończony miesiąc' }),
        h('div', { class: 'verdict ' + (r.success ? 'ok' : 'no'), text: r.success ? 'Sukces' : p.status === 'aborted' ? 'Przerwany' : 'Bez sukcesu' }),
        h('div', { class: 'dim small', text: fmtDay(p.start) + ' — ' + fmtDay(p.end || p.start) }),
        dayGrid(p, p.end || p.start),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('b', { text: (r.kept || 0) + '/' + DAYS }), h('span', { text: 'utrzymane' })),
          h('div', { class: 'stat' }, h('b', { text: String(r.failed || 0) }), h('span', { text: 'porażki' })),
          h('div', { class: 'stat' }, h('b', { text: String(r.best || 0) }), h('span', { text: 'najdłuższa seria' }))),
        r.notes ? h('div', { class: 'quote', text: r.notes }) : null),
      h('section', { class: 'card' }, h('div', { class: 'eyebrow', text: 'Protokół' }), summaryKV(p)),
      journalSection(p, false)]);
  }

  // ---------- menu: kopia zapasowa, przerwanie ----------
  function viewMenu() {
    var file = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none', onchange: function (e) {
      var f = e.target.files && e.target.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var s = JSON.parse(String(rd.result));
          if (!s || s.v !== 1 || !Array.isArray(s.history)) throw new Error('format');
          if (!confirm('Zastąpić obecne dane danymi z kopii?')) return;
          S = s; save(); closeModal(); render();
        } catch (err) { alert('To nie jest kopia The Wayne Protocol.'); }
      };
      rd.readAsText(f);
    } });
    openModal([
      h('div', { class: 'eyebrow', text: 'Ustawienia' }),
      h('h2', { text: 'Dane protokołu' }),
      h('p', { class: 'dim small', text: 'Wszystko jest zapisane tylko w tej przeglądarce. Kopia zapasowa pozwala przenieść dane na inne urządzenie.' }),
      h('div', { class: 'row' },
        h('button', { class: 'btn', text: 'Pobierz kopię', onclick: function () {
          var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
          var a = h('a', { href: URL.createObjectURL(blob), download: 'wayne-protocol-' + today() + '.json' });
          document.body.appendChild(a); a.click(); a.remove();
        } }),
        h('button', { class: 'btn', text: 'Wczytaj kopię', onclick: function () { file.click(); } }), file),
      S.current ? h('div', { class: 'mt' },
        h('h3', { text: 'Przerwij protokół' }),
        h('p', { class: 'dim small', text: 'Miesiąc trafi do historii jako przerwany. Tego nie da się cofnąć.' }),
        h('button', { class: 'btn red', text: 'Przerwij', onclick: function () {
          if (!confirm('Na pewno przerwać protokół? Miesiąc trafi do historii jako przerwany.')) return;
          var c = S.current, st = statsOf(c, today() < addDays(c.start, DAYS - 1) ? today() : addDays(c.start, DAYS - 1));
          S.history.push(Object.assign({}, c, { end: today(), closedAt: Date.now(), status: 'aborted', result: { success: false, kept: st.kept, failed: st.failed, best: st.best, notes: '' } }));
          S.current = null; S.draft = null; save(); closeModal(); render();
        } })) : null,
      h('div', { class: 'row mt' }, h('button', { class: 'btn ghost', text: 'Zamknij', onclick: closeModal }))
    ]);
  }

  // ---------- render ----------
  function render() {
    closeModal();
    if (S.current) {
      mount(dayIndex(S.current) > DAYS ? viewSummary() : viewDashboard());
      return;
    }
    var d = draft();
    var views = { intro: viewIntro, detox: viewDetox, notyet: viewNotYet, skills: viewSkills, rules: viewRules, alter: viewAlter, suit: viewSuit, oath: viewOath };
    mount((views[d.step] || viewIntro)());
  }
  // nowy dzień przy otwartej aplikacji (np. po północy) — odśwież widok
  var lastDay = today();
  setInterval(function () { if (today() !== lastDay && !modalEl) { lastDay = today(); render(); } }, 60000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && today() !== lastDay && !modalEl) { lastDay = today(); render(); } });
  render();
})();
