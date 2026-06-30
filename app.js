/*
  Polypad API Testversion
  Thema: Gleichungen mit einer Waage, z. B. 3x + 5 = 8

  Diese Version nutzt einen deutlich größeren Teil der offiziellen Polypad-API
  (https://mathigon.io/polypad/), und zwar in beide Richtungen:

  HTML/App  -> Polypad : create()-Optionen, add/update/delete, select, setTool,
                         undo/redo, setOptions, toggleSidebar, getViewport/
                         setViewport/resetViewport, image(), Polypad.toImage()
  Polypad   -> HTML/App: change, selection, viewport, undo, redo, options
                         Events; getSelection(); serialize()

  Hinweis zur Signatur von Polypad.create(): Die Mathigon-Doku zeigt im
  Quickstart "Polypad.create(containerElement)", listet im TypeScript-Interface
  aber nur ein Optionen-Objekt. In der Praxis ist die Signatur
  Polypad.create(container, options) — also Element zuerst, Optionen optional
  als zweites Argument. Da deine bisherige Version mit Polypad.create(container)
  schon funktioniert hat, ist das hier die sicherste Annahme. Falls die
  "initial"-Option vom Build doch ignoriert werden sollte, fängt der Code das
  unten ab, indem er den Startzustand zusätzlich per unSerialize() nachlädt.
*/

const $ = (selector) => document.querySelector(selector);

const apiStatus = $('#apiStatus');
const taskText = $('#taskText');
const feedback = $('#feedback');
const jsonBox = $('#jsonBox');
const changeCounter = $('#changeCounter');
const selectionInfo = $('#selectionInfo');
const zoomInfo = $('#zoomInfo');
const lastActionInfo = $('#lastActionInfo');
const previewImg = $('#previewImg');

let pad = null;
let changes = 0;
let currentTask = { a: 3, b: 5, c: 8 };

function setStatus(text, type = '') {
  apiStatus.textContent = text;
  apiStatus.className = `status ${type}`.trim();
}

function setFeedback(text, kind = 'neutral') {
  feedback.textContent = text;
  feedback.className = `feedback ${kind}`;
}

function setLastAction(text) {
  if (lastActionInfo) lastActionInfo.textContent = `Letzte Aktion: ${text}`;
}

function taskToText(t) {
  return `Stelle die Gleichung ${t.a}x + ${t.b} = ${t.c} mit der Waage dar.`;
}

function randomTask() {
  const a = Math.floor(Math.random() * 4) + 1; // 1 bis 4
  const b = Math.floor(Math.random() * 7) + 1; // 1 bis 7
  const x = Math.floor(Math.random() * 4) + 1; // gedachte Lösung 1 bis 4
  return { a, b, c: a * x + b };
}

function initialData() {
  return {
    title: 'Gleichungen mit der Waage',
    version: 5,
    options: {
      canvas: 'fixed',
      canvasX: 1200,
      canvasY: 700,
      grid: 'square-dots',
      sidebar: 'numbers,number-cards,algebra,balance',
      toolbar: 'move,pen,text,eraser,color',
      settings: 'fullscreen,grid,download'
      // Tipp: "tileWeights" (PolypadOptions) kann genutzt werden, um das
      // Kippverhalten der Waage für bestimmte Kachelarten manuell zu steuern,
      // falls die Standard-Gewichtung (nach Zahlenwert) nicht passt.
    },
    tiles: {
      intro: {
        name: 'text',
        x: -500,
        y: -270,
        width: 460,
        fontSize: 20,
        html: '<b>Aufgabe:</b><br>Lege links die Terme mit x und Zahlenkarten.<br>Lege rechts die Ergebniszahl.'
      },
      balance1: { name: 'balance', x: 0, y: 60, size: 2.2, level: 0 }
    },
    strokes: {}
  };
}

function requirePad() {
  if (!pad) {
    setFeedback('Polypad ist noch nicht bereit.', 'bad');
    return false;
  }
  return true;
}

function initPolypad() {
  if (!window.Polypad) {
    setStatus('API nicht geladen', 'bad');
    setFeedback('Die Polypad-API konnte nicht geladen werden. Prüfe Internetverbindung oder Script-URL.', 'bad');
    return;
  }

  try {
    const container = $('#polypad');

    // Element zuerst, Konfigurationsobjekt als zweiter Parameter.
    // sidebarTiles/sidebarSettings/toolbar/settings schalten die jeweiligen
    // UI-Bereiche grundsätzlich frei; welche Inhalte darin sichtbar sind,
    // steuert weiterhin data.options (sidebar/toolbar/settings-Strings).
    pad = Polypad.create(container, {
      initial: initialData(),
      sidebarTiles: true,
      sidebarSettings: true,
      toolbar: true,
      settings: true,
      canvasMargin: 40
    });

    // Absicherung: Falls "initial" vom Build nicht unterstützt wird, sorgt
    // unSerialize() trotzdem für den korrekten Startzustand, bevor die Person
    // etwas anklicken kann.
    pad.unSerialize(initialData());
    pad.bindKeyboardEvents();

    // --- Polypad -> App: Events -------------------------------------------

    pad.on('change', (delta) => {
      changes += 1;
      changeCounter.textContent = `Änderungen: ${changes}`;

      // delta: Record<id, [vorher, nachher]> – wir werten das für eine kurze
      // Statusmeldung aus, statt es zu ignorieren.
      if (delta && typeof delta === 'object') {
        const ids = Object.keys(delta);
        if (ids.length === 1) {
          const [before, after] = delta[ids[0]];
          if (before === undefined) setLastAction(`Kachel hinzugefügt (${after?.name ?? '?'})`);
          else if (after === undefined) setLastAction(`Kachel gelöscht (${before?.name ?? '?'})`);
          else setLastAction(`Kachel geändert (${after?.name ?? before?.name ?? '?'})`);
        } else if (ids.length > 1) {
          setLastAction(`${ids.length} Kacheln/Strokes geändert`);
        }
      }
    });

    pad.on('selection', (event) => {
      const selected = event?.tiles?.length ? event.tiles.join(', ') : '–';
      selectionInfo.textContent = `Auswahl: ${selected}`;
    });

    pad.on('viewport', (event) => {
      if (zoomInfo && event) {
        const zoomPct = Math.round((event.zoom ?? 1) * 100);
        zoomInfo.textContent = `Zoom: ${zoomPct}%`;
      }
    });

    pad.on('undo', () => setLastAction('Rückgängig'));
    pad.on('redo', () => setLastAction('Wiederholt'));

    // Wird ausgelöst, wenn Lernende selbst UI-Optionen im Einstellungen-Tab
    // ändern (z. B. Raster ein/aus).
    pad.on('options', () => setLastAction('Ansichtsoptionen geändert'));

    setStatus('API aktiv', 'ok');
    currentTask = randomTask();
    taskText.textContent = taskToText(currentTask);
    setFeedback('Lege die Aufgabe im Polypad oder klicke auf „Beispiel automatisch legen“.', 'neutral');
  } catch (err) {
    console.error(err);
    setStatus('Fehler beim Start', 'bad');
    setFeedback(`Fehler beim Start der Polypad-API: ${err.message}`, 'bad');
  }
}

// --- App -> Polypad: einzelne Kacheln -----------------------------------

function addTile(data) {
  if (!requirePad()) return;
  return pad.add(data);
}

function addXTile(x = -280, y = -60) {
  return addTile({ name: 'algebra', expr: 'x', x, y, splitH: 1, splitV: 1 });
}

function addNumberCard(value, x = -120, y = -60) {
  return addTile({ name: 'number-card', value, valueStr: String(value), x, y });
}

function buildExample() {
  if (!requirePad()) return;
  pad.clear();
  pad.add({ name: 'balance', x: 0, y: 70, size: 2.2, level: 0 });
  pad.add({
    name: 'text',
    x: -500,
    y: -275,
    width: 520,
    fontSize: 20,
    html: `<b>${currentTask.a}x + ${currentTask.b} = ${currentTask.c}</b><br>Dies ist ein automatisch gelegtes Beispiel.`
  });

  for (let i = 0; i < currentTask.a; i++) {
    addXTile(-360 + i * 75, -40);
  }
  addNumberCard(currentTask.b, -80, -40);
  addNumberCard(currentTask.c, 285, -40);
  pad.resetViewport();
  setFeedback('Beispiel wurde in Polypad gelegt. Du kannst die Kacheln verschieben oder ändern.', 'neutral');
}

function getTiles() {
  if (!requirePad()) return {};
  return pad.serialize().tiles || {};
}

function checkWork() {
  if (!requirePad()) return;
  const tiles = Object.values(getTiles());

  // Einfache Testlogik: links ist x < 0, rechts ist x >= 0.
  // Versteckte/gesperrte Kacheln (z. B. Hinweistexte mit status: 'hidden')
  // werden nicht mitgezählt.
  const left = { xTiles: 0, numberSum: 0 };
  const right = { xTiles: 0, numberSum: 0 };

  for (const tile of tiles) {
    if (tile.status === 'hidden') continue;
    const side = (tile.x ?? 0) < 0 ? left : right;
    if (tile.name === 'algebra' && String(tile.expr).trim() === 'x') side.xTiles += 1;
    if (tile.name === 'number-card') side.numberSum += Number(tile.value ?? tile.valueStr ?? 0);
  }

  const ok = left.xTiles === currentTask.a &&
             left.numberSum === currentTask.b &&
             right.xTiles === 0 &&
             right.numberSum === currentTask.c;

  if (ok) {
    setFeedback(`Richtig: Links liegen ${left.xTiles}x + ${left.numberSum}, rechts liegt ${right.numberSum}.`, 'good');
  } else {
    setFeedback(`Noch nicht passend. Erkannt: links ${left.xTiles}x + ${left.numberSum}, rechts ${right.xTiles}x + ${right.numberSum}.`, 'bad');
  }
}

// --- App -> Polypad: Werkzeuge, Auswahl, Ansicht ------------------------

function selectAll() {
  if (!requirePad()) return;
  const ids = Object.keys(getTiles());
  pad.select(...ids);
  setFeedback(`${ids.length} Kachel(n) ausgewählt.`, 'neutral');
}

function deleteSelection() {
  if (!requirePad()) return;
  const ids = pad.getSelection();
  if (!ids.length) {
    setFeedback('Keine Kacheln ausgewählt.', 'neutral');
    return;
  }
  pad.delete(...ids);
  setFeedback(`${ids.length} Kachel(n) gelöscht.`, 'neutral');
}

function clearSelection() {
  if (!requirePad()) return;
  pad.select();
}

// --- Speichern / Laden / Exportieren ------------------------------------

function exportJson() {
  if (!requirePad()) return;
  const data = pad.serialize();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'polypad-zustand.json';
  a.click();
  URL.revokeObjectURL(url);
}

function copyJsonToTextArea() {
  if (!requirePad()) return;
  jsonBox.value = JSON.stringify(pad.serialize(), null, 2);
}

function importJsonFromTextArea() {
  if (!requirePad()) return;
  try {
    const data = JSON.parse(jsonBox.value);
    pad.unSerialize(data);
    pad.resetViewport();
    setFeedback('JSON wurde geladen.', 'good');
  } catch (err) {
    setFeedback(`JSON konnte nicht geladen werden: ${err.message}`, 'bad');
  }
}

// Statisches Bild aus dem JSON im Textfeld erzeugen, OHNE es ins Polypad zu
// laden. Nutzt die statische Methode Polypad.toImage(data, type, w, h).
function previewJson() {
  if (!window.Polypad) return;
  try {
    const data = JSON.parse(jsonBox.value);
    const src = Polypad.toImage(data, 'png', 600, 350);
    if (previewImg) {
      previewImg.src = src;
      previewImg.style.display = 'block';
    }
    setFeedback('Vorschau aus dem JSON-Text erzeugt (noch nicht geladen).', 'neutral');
  } catch (err) {
    setFeedback(`Vorschau fehlgeschlagen: ${err.message}`, 'bad');
  }
}

// Schnappschuss des aktuell sichtbaren Polypad-Zustands als PNG, über die
// asynchrone Instanzmethode .image(width, height, type).
async function exportImage() {
  if (!requirePad()) return;
  try {
    const dataUrl = await pad.image(1200, 700, 'png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'polypad-bild.png';
    a.click();
    setFeedback('Bild wurde exportiert.', 'good');
  } catch (err) {
    setFeedback(`Bildexport fehlgeschlagen: ${err.message}`, 'bad');
  }
}

// --- Event-Bindings -------------------------------------------------------

$('#newTaskBtn').addEventListener('click', () => {
  currentTask = randomTask();
  taskText.textContent = taskToText(currentTask);
  setFeedback('Neue Aufgabe erstellt. Lege sie mit Polypad-Kacheln nach.', 'neutral');
});

$('#buildExampleBtn').addEventListener('click', buildExample);
$('#checkBtn').addEventListener('click', checkWork);
$('#addXBtn').addEventListener('click', () => addXTile(-260 + Math.random() * 80, -100 + Math.random() * 140));
$('#addOneBtn').addEventListener('click', () => addNumberCard(1, -100 + Math.random() * 80, -100 + Math.random() * 140));
$('#addFiveBtn').addEventListener('click', () => addNumberCard(5, 250 + Math.random() * 80, -100 + Math.random() * 140));
$('#clearBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  pad.clear();
  setFeedback('Polypad wurde geleert.', 'neutral');
});

// Werkzeuge
$('#toolMoveBtn').addEventListener('click', () => requirePad() && pad.setTool('move'));
$('#toolPenBtn').addEventListener('click', () => requirePad() && pad.setTool('pen'));
$('#toolTextBtn').addEventListener('click', () => requirePad() && pad.setTool('text'));
$('#toolEraserBtn').addEventListener('click', () => requirePad() && pad.setTool('eraser'));

// Ansicht & Verlauf
$('#undoBtn').addEventListener('click', () => requirePad() && pad.undo());
$('#redoBtn').addEventListener('click', () => requirePad() && pad.redo());
$('#resetViewBtn').addEventListener('click', () => requirePad() && pad.resetViewport());
$('#toggleSidebarBtn').addEventListener('click', () => requirePad() && pad.toggleSidebar());

// Auswahl
$('#selectAllBtn').addEventListener('click', selectAll);
$('#deleteSelectionBtn').addEventListener('click', deleteSelection);
$('#clearSelectionBtn').addEventListener('click', clearSelection);

// Speichern / Laden / Export
$('#exportBtn').addEventListener('click', exportJson);
$('#copyJsonBtn').addEventListener('click', copyJsonToTextArea);
$('#importBtn').addEventListener('click', importJsonFromTextArea);
$('#previewJsonBtn').addEventListener('click', previewJson);
$('#exportImageBtn').addEventListener('click', exportImage);

window.addEventListener('load', initPolypad);
