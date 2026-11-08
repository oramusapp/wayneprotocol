/* THE CODE — Architektura Życia. Treść kodeksu jest w index.html; tu tylko przysięga i przewijanie spisu treści. */
(function () {
  'use strict';
  var box = document.getElementById('oathMain');
  (window.CODE_DATA ? window.CODE_DATA.oath : []).forEach(function (l) {
    var p = document.createElement('p'); p.textContent = l; box.appendChild(p);
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#s-"]');
    if (!a) return;
    var t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
