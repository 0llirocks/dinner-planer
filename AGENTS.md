# AGENTS.md

Hinweise für Coding-Agents und Mitwirkende an diesem Repo.

## Zweck

Abendbrot-Planer: PWA, mit der man das Abendbrot für die kommende Woche plant. Nur dafür, nichts darüber hinaus.

## Harte Vorgaben

- Reines HTML/CSS/JS, **kein Build-Schritt**, keine Frameworks, keine npm-Abhängigkeiten.
- **Keine Server- oder Netzwerkaufrufe.** Daten nur lokal im `localStorage`.
- Hosting über GitHub Pages (Unterpfad `/<repo>/`): alle Pfade **relativ** (`app.js`, nicht `/app.js`).
- Wochenstart ist **Dienstag** (Funktion `weekStart` in `app.js`).
- iPhone zuerst: Safe-Area-Insets beachten, Eingabefelder mind. 16 px (sonst zoomt iOS), Touch-Ziele mind. 44 px.
- Schlicht bleiben: kein Zusatzfeature ohne Auftrag (keine Rezepte, Einkaufslisten, Konten, Sync).
- Hell- und Dunkelmodus laufen über CSS-Variablen und `prefers-color-scheme`.
- Sichtbare Texte auf Deutsch.

## Struktur

| Datei | Inhalt |
|---|---|
| `index.html` | Gerüst und iOS-Meta-Tags |
| `style.css` | Styles (iOS-nahe Listenoptik) |
| `app.js` | Wochenlogik, Rendering, Vorschläge, Speicherung |
| `sw.js` | Service Worker (Offline, Stale-while-revalidate) |
| `manifest.webmanifest` | PWA-Manifest |
| `icons/` | `icon-180.png`, `icon-192.png`, `icon-512.png` |

## Datenmodell

`localStorage["abendbrot.v1"]` = `{ "YYYY-MM-DD": "Gericht" }`, Schlüssel ist das lokale Datum des Tages.
Leere Einträge werden gelöscht. Bei inkompatiblen Änderungen neuen Schlüssel (`abendbrot.v2`) einführen und migrieren, nie Daten verwerfen.

## Vorschläge

Vorschläge erscheinen **ausschließlich als Dropdown beim Eintippen** unter dem Feld (`.menu`). Bei leerem Feld gibt es keine Vorschläge,
und es gibt keine Chips/Pills mit bestehenden Gerichten. `suggest()` in `app.js` liefert bisherige Gerichte (ohne den Eintrag des eigenen Tages),
die zur Eingabe passen: Treffer am Wortanfang zuerst, dann Gerichte der Vorwoche, dann die zuletzt verwendeten (max. 6).
Bei wenig Platz unter dem Feld (Tastatur) klappt das Dropdown nach oben auf.

## Lokal testen

`python3 -m http.server 8080` im Repo-Root, dann `http://localhost:8080`. Optional Syntaxcheck: `node --check app.js sw.js`.

## Service Worker

Wird eine Datei hinzugefügt oder umbenannt, `ASSETS` in `sw.js` anpassen und `CACHE` hochzählen (`abendbrot-v2`, ...).

## Commits

Kleine, thematisch getrennte Commits mit knapper deutscher Beschreibung.
