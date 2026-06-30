# Polypad API – Vollversion Test

Diese Testversion erweitert die funktionsfähige Minimalversion so, dass die **komplette Polypad-Oberfläche** in der eigenen HTML/CSS/JS-Anwendung nutzbar ist.

## Start

1. ZIP entpacken.
2. `index.html` im Browser öffnen.
3. Internetverbindung ist notwendig, weil die Polypad-API von Mathigon geladen wird:
   `https://static.mathigon.org/api/polypad-en-v5.0.5.js`

Falls lokale Dateien im Browser Probleme machen, im entpackten Ordner starten:

```bash
python -m http.server 8000
```

Dann öffnen:

```text
http://localhost:8000
```

## Was wurde erweitert?

### Vollständiges Polypad

- Sidebar für Polypad-Kacheln eingeschaltet
- Settings-Sidebar eingeschaltet
- Toolbar eingeschaltet
- Settings-Bar eingeschaltet
- Keine Begrenzung auf einzelne Sidebar-Kategorien wie `numbers` oder `balance`
- Keine Begrenzung auf einzelne Toolbar-Elemente

In `fullInitialData()` werden `toolbar`, `settings` und `sidebar` absichtlich **nicht** begrenzt. Laut Polypad-Dokumentation werden alle Elemente angezeigt, wenn diese Optionen leer sind.

### API-Testfunktionen

Über die eigene Oberfläche links sind viele API-Funktionen direkt testbar:

- `Polypad.create(...)`
- `pad.serialize(...)`
- `pad.unSerialize(...)`
- `pad.image(...)`
- `Polypad.toImage(...)`
- `pad.add(...)`
- `pad.update(...)`
- `pad.delete(...)`
- `pad.paste(...)`
- `pad.getSelection(...)`
- `pad.select(...)`
- `pad.undo()`
- `pad.redo()`
- `pad.setOptions(...)`
- `pad.setTool(...)`
- `pad.clear()`
- `pad.getViewport()`
- `pad.setViewport(...)`
- `pad.resetViewport()`
- `pad.resize()`
- `pad.getExports()`
- `pad.showGesture(...)`
- `pad.bindKeyboardEvents()`
- `pad.destroy()` beim Neuaufbau
- `pad.toggleSidebar(...)`
- `pad.addCustomButton(...)`

### Events

Die App lauscht auf:

- `change`
- `selection`
- `viewport`
- `move`
- `export`
- `undo`
- `redo`
- `options`

Die Statuszeile unten zeigt Änderungen, Auswahl, Viewport, Exporte und letzte Aktion.

## JSON bleibt erhalten

Die Anwendung kann weiterhin:

- aktuellen Polypad-Stand als JSON im Textfeld anzeigen
- JSON in die Zwischenablage kopieren
- JSON herunterladen
- JSON aus dem Textfeld laden
- Vorschau aus JSON erzeugen, ohne es vorher ins Polypad zu laden
- aktuellen Polypad-Stand als PNG herunterladen

## Grenzen

Die Polypad-API stellt die eingebauten Polypad-Funktionen bereit, aber nicht jede interne UI-Funktion ist als eigene, dokumentierte JavaScript-Methode verfügbar. Deshalb ist der wichtigste Schritt für „alle Funktionen“: Die originale Polypad-UI vollständig einzublenden. Die zusätzlichen Buttons links dienen als API-Testpanel.

Für eine produktive Lernanwendung würde ich später wieder gezielt einschränken, welche Werkzeuge sichtbar sind, damit Schüler nicht versehentlich mit zu vielen Optionen arbeiten.
