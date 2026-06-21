# Polypad API Test – Gleichungen mit Waage

Dies ist eine erste Testversion einer eigenen HTML/CSS/JS-Anwendung mit Polypad-API-Einbindung.

## Start

1. ZIP entpacken.
2. `index.html` im Browser öffnen.
3. Internetverbindung ist notwendig, weil die Polypad-API von `https://static.mathigon.org/api/polypad-en-v5.0.5.js` geladen wird.

Falls der Browser lokale Dateien blockiert, starte im Ordner einen kleinen lokalen Server:

```bash
python -m http.server 8000
```

Dann öffnen:

```text
http://localhost:8000
```

## Enthaltene Funktionen

- Polypad Canvas per API erzeugen
- Startzustand per JSON setzen
- Aufgaben wie `3x + 5 = 8` zufällig erzeugen
- x-Kacheln und Zahlenkarten per eigener Button-Leiste hinzufügen
- Beispiel automatisch ins Polypad legen
- einfache automatische Prüfung
- Polypad-Zustand als JSON exportieren/importieren
- Change- und Selection-Events anzeigen

## Grenzen der Testversion

Die automatische Prüfung ist noch einfach. Sie zählt nur, ob links der Waage die passenden x-Kacheln und Zahlenkarten liegen und rechts die Ergebniszahl. Für eine echte Unterrichtsanwendung sollte die Prüf-Logik robuster werden, z. B. mit Drop-Zones, gesperrten Bereichen oder eigenen Polypad-Actions.
