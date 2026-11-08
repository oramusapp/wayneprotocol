/* Wypełnia wall.html (źródło sciana.png) zasadami i przysięgą z code-data.js. */
(function () {
  'use strict';
  var D = window.CODE_DATA, ol = document.getElementById('wallRules'), ob = document.getElementById('oathWall');
  D.wallRules.forEach(function (r) {
    var li = document.createElement('li'), b = document.createElement('b'), s = document.createElement('span');
    b.textContent = r[0]; s.textContent = r[1]; li.appendChild(b); li.appendChild(s); ol.appendChild(li);
  });
  D.oath.forEach(function (l) { var p = document.createElement('p'); p.textContent = l; ob.appendChild(p); });
})();
