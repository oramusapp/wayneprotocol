# THE CODE — Architektura Życia

Osobisty kodeks życia w formie aplikacji: 25 zasad, protokół dnia, kodeksy fizyczny, żywieniowy (z piramidą i oznaczeniem, co jest udokumentowane, co jest hipotezą, a co preferencją), intelektualny, charakteru, wiary, dziedzictwa i strategii, a także przegląd tygodnia, konsekwencje i przysięga.

- **Dziś** — protokół dnia do odhaczania, najważniejsze zadanie, trudna rzecz, jednostka twórcza, sen, dziennik, siatka 28 dni.
- **Kodeks** — pełny dokument.
- **Przegląd** — formularz cotygodniowego przeglądu, kopia zapasowa (JSON), eksport danych poprzedniej aplikacji (The Wayne Protocol).
- **Ściana** — skrócona wersja (zasady, dzień, przysięga) do druku na A4.

Czysty HTML/CSS/JS, bez builda i bez zależności. Dane są tylko w przeglądarce (`localStorage`, klucz `code.state`).
Aplikacja jest otwierana w Fortislly (tylko administrator) przez bramkę `api/wayne/`, która pobiera pliki z gałęzi `main` tego repozytorium.
