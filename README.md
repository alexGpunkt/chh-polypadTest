# Polypad API Test – Gleichungen mit Waage

Testversion einer eigenen HTML/CSS/JS-Anwendung mit möglichst vollständiger Polypad-API-Einbindung
(siehe offizielle Doku: https://mathigon.io/polypad/ und https://mathigon.io/polypad/tiles.html).

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

## Enthaltene Funktionen (App → Polypad)

- Polypad-Canvas per `Polypad.create(container, options)` erzeugen, inkl. Startzustand über `initial`
- Startzustand zusätzlich per `unSerialize()` absichern (siehe Hinweis unten)
- Einzelne Kacheln hinzufügen (`add`), z. B. x-Kacheln, Zahlenkarten
- Beispielaufgabe automatisch ins Polypad legen
- Werkzeug wechseln (`setTool`: Verschieben, Stift, Text, Radierer)
- Verlauf steuern (`undo`, `redo`)
- Ansicht zentrieren (`resetViewport`) und Seitenleiste ein-/ausblenden (`toggleSidebar`)
- Auswahl steuern (`select`, `getSelection`, `delete` für die aktuelle Auswahl)
- Polypad-Zustand als JSON exportieren/importieren (`serialize` / `unSerialize`)
- Statisches Vorschaubild aus JSON-Text erzeugen, ohne es zu laden (`Polypad.toImage`, statische Methode)
- Schnappschuss des aktuellen Canvas als PNG exportieren (`pad.image()`)
- einfache automatische Prüfung der Gleichungs-Aufgabe

## Enthaltene Funktionen (Polypad → App)

- `change`-Event inkl. Auswertung des Delta-Objekts (hinzugefügt/geändert/gelöscht, statt es nur zu zählen)
- `selection`-Event für die aktuelle Auswahl
- `viewport`-Event für die Zoomstufe
- `undo` / `redo`-Events
- `options`-Event, wenn Lernende selbst UI-Einstellungen ändern

## Wichtiger Hinweis zur `Polypad.create()`-Signatur

Die Mathigon-Dokumentation zeigt im Quickstart-Beispiel `Polypad.create(containerElement)`,
im ausführlichen TypeScript-Interface aber nur ein Optionen-Objekt als Parameter. Beides
zusammen ergibt am plausibelsten die Signatur `Polypad.create(container, options)` – Element
zuerst, Optionen-Objekt optional als zweites Argument. Da deine ursprüngliche Version mit
`Polypad.create(container)` bereits funktionierte, wurde diese Variante hier beibehalten und um
das Optionen-Objekt ergänzt.

Damit der Startzustand garantiert geladen wird, auch falls die `initial`-Option vom konkreten
Build nicht unterstützt werden sollte, ruft `app.js` direkt nach `Polypad.create()` zusätzlich
`pad.unSerialize(initialData())` auf. Das ist redundant, aber ungefährlich, und macht die App
robuster gegenüber dieser einen offenen Frage in der Doku. Falls du das in der Praxis testest
und merkst, dass nur eines der beiden gebraucht wird, kann der jeweils andere Aufruf entfernt
werden.

## Grenzen der Testversion

- Die automatische Prüfung ist weiterhin bewusst einfach gehalten: Sie zählt nur, ob links der
  Waage die passenden x-Kacheln und Zahlenkarten liegen und rechts die Ergebniszahl. Für eine
  robustere Prüfung könnten z. B. Categorizer-Kacheln (`name: 'categorizer'`) mit eingebauter
  `validation`/`autoCheck`-Logik genutzt werden, statt die Positionen selbst auszuwerten.
- Das Kippverhalten der Waage richtet sich nach der internen Standard-Gewichtung von Polypad.
  Über `options.tileWeights` ließe sich das pro Kachelart manuell feintunen, falls nötig – das
  genaue String-Format ist in der öffentlichen Doku nicht spezifiziert.
- `splitH`/`splitV` bei Algebra-Kacheln (zusammengefasste Blöcke mehrerer x) werden von der
  Prüfung aktuell nicht gesondert behandelt; eine zusammengelegte "3x"-Kachel zählt wie eine
  einzelne Kachel.
