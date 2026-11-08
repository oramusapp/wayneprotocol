# THE CODE — Architektura Życia

Osobisty kodeks życia w formie strony: motto, 25 zasad, protokół dnia, kodeksy fizyczny, żywieniowy (z piramidą i oznaczeniem, co jest udokumentowane, co jest hipotezą, a co preferencją), intelektualny, charakteru, wiary, dziedzictwa i strategii, a także przegląd tygodnia, konsekwencje i przysięga. Na dole strony jest przycisk „Pobierz ścianę (A4)”.

- `index.html` — kodeks (cała treść).
- `assets/code-data.js` — przysięga i skrócone zasady (wspólne dla kodeksu i ściany).
- `wall.html` — źródło strony na ścianę; `node scripts/make-wall.js` generuje z niego `sciana.png` (A4, 1588 × 2246 px). Po zmianie zasad lub przysięgi wygeneruj plik ponownie i zatwierdź go.

Czysty HTML/CSS/JS, bez builda. Aplikacja jest otwierana w Fortislly (tylko administrator) przez bramkę `api/wayne/`, która pobiera pliki z gałęzi `main` tego repozytorium.
