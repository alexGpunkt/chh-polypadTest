/*
  Polypad API Testversion
  Thema: Gleichungen mit einer Waage, z. B. 3x + 5 = 8
*/

const $ = (selector) => document.querySelector(selector);

const apiStatus = $('#apiStatus');
const taskText = $('#taskText');
const feedback = $('#feedback');
const jsonBox = $('#jsonBox');
const changeCounter = $('#changeCounter');
const selectionInfo = $('#selectionInfo');

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

    // Die offizielle Minimalform ist Polypad.create(parentElement).
    pad = Polypad.create(container);

    pad.unSerialize(initialData());
    pad.bindKeyboardEvents();

    pad.on('change', () => {
      changes += 1;
      changeCounter.textContent = `Änderungen: ${changes}`;
    });

    pad.on('selection', (event) => {
      const selected = event?.tiles?.length ? event.tiles.join(', ') : '–';
      selectionInfo.textContent = `Auswahl: ${selected}`;
    });

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
  const left = { xTiles: 0, numberSum: 0 };
  const right = { xTiles: 0, numberSum: 0 };

  for (const tile of tiles) {
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
$('#exportBtn').addEventListener('click', exportJson);
$('#copyJsonBtn').addEventListener('click', copyJsonToTextArea);
$('#importBtn').addEventListener('click', importJsonFromTextArea);

window.addEventListener('load', initPolypad);
