# Dinner Planner

Schlichte PWA für das iPhone, um das Abendbrot der Woche zu planen. Die Woche beginnt dienstags.
Alle Daten bleiben lokal im Browser (`localStorage`), es gibt keinen Server und keine Abhängigkeiten.

## Lokal testen

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen. Service Worker funktionieren auf `localhost` ohne HTTPS.
Zum Test auf dem iPhone ist HTTPS nötig (z. B. über GitHub Pages).

## Auf GitHub Pages veröffentlichen

1. Repo auf GitHub anlegen und pushen (`git push -u origin main`).
2. Settings → Pages → Source: Branch `main`, Ordner `/ (root)`.
3. Die Seite ist danach unter `https://<nutzer>.github.io/<repo>/` erreichbar.

## Auf dem iPhone installieren

Seite in Safari öffnen → Teilen → Zum Home-Bildschirm. Die installierte App hat einen eigenen Speicher,
bereits im Safari-Tab eingetragene Gerichte werden nicht übernommen.

## Hinweise

- Daten gelten pro Gerät und Browser; es gibt keine Synchronisierung.
- Wer die App deinstalliert oder die Website-Daten löscht, verliert die Einträge.
