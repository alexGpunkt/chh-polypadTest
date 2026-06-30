/*
  Polypad API – Vollversion Test

  Ziel dieser Version:
  1. Die komplette Polypad-Oberfläche freischalten: Sidebar, Toolbar, Settings.
     In PolypadData.options bleiben toolbar/settings/sidebar leer bzw. undefiniert,
     denn laut Dokumentation bedeutet ein leeres Optionsfeld: alles anzeigen.
  2. Zusätzlich möglichst viele API-Methoden über eigene Buttons testbar machen.
  3. JSON weiterhin direkt anzeigen, kopieren, herunterladen, eingeben und laden.
*/

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const apiStatus = $('#apiStatus');
const jsonBox = $('#jsonBox');
const previewImg = $('#previewImg');
const changeCounter = $('#changeCounter');
const selectionInfo = $('#selectionInfo');
const viewportInfo = $('#viewportInfo');
const exportsInfo = $('#exportsInfo');
const lastActionInfo = $('#lastActionInfo');

let pad = null;
let changes = 0;
let highContrast = false;
let customButtonCount = 0;

function setStatus(text, type = '') {
  apiStatus.textContent = text;
  apiStatus.className = `status ${type}`.trim();
}

function setLastAction(text) {
  lastActionInfo.textContent = `Letzte Aktion: ${text}`;
}

function requirePad() {
  if (!pad) {
    setLastAction('Polypad ist noch nicht bereit');
    return false;
  }
  return true;
}

function fullInitialData() {
  return {
    title: 'Polypad API Vollversion Test',
    version: 5,
    options: {
      // Absichtlich KEIN toolbar/settings/sidebar-String:
      // Wenn diese Werte leer sind, zeigt Polypad laut Doku alle UI-Elemente.
      grid: 'square-dots',
      canvas: 'infinite',
      background: '#ffffff',
      mergeTiles: true,
      altColors: false,
      highContrast: false
    },
    tiles: {
      start_text: {
        name: 'text',
        x: -340,
        y: -220,
        width: 680,
        fontSize: 22,
        html: '<b>Vollständiges Polypad</b><br>Die linke Polypad-Seitenleiste, Werkzeugleiste und Einstellungen sind freigeschaltet. Du kannst alle Polypad-Materialien direkt im Canvas verwenden. Rechts/links in dieser Test-App kannst du zusätzlich API-Funktionen auslösen und den Zustand als JSON speichern oder laden.'
      }
    },
    strokes: {}
  };
}

function createPad() {
  const container = $('#polypad');
  if (pad) {
    try { pad.destroy(); } catch (err) { console.warn('destroy fehlgeschlagen', err); }
    pad = null;
    container.innerHTML = '';
  }

  // Die öffentliche Doku beschreibt Polypad.create(options). In den funktionierenden
  // Minimalversionen wird praktisch Polypad.create(container, options) genutzt.
  pad = Polypad.create(container, {
    initial: fullInitialData(),
    sidebarTiles: true,
    sidebarSettings: true,
    toolbar: true,
    settings: true,
    exportToCL: true,
    canvasMargin: 40,
    themeColours: {
      orange: '#ff8a00',
      blue: '#0b7cff',
      green: '#18a843',
      purple: '#6f42c1'
    },
    imageUpload: async (file) => {
      // Lokale Demo-Lösung: Bild wird als Data-URL eingebettet.
      // Für echte Nutzung sollte hier ein Upload zu eigenem Speicher erfolgen.
      return await fileToDataUrl(file);
    }
  });

  // Sicherheitsnetz, falls initial im verwendeten Build nicht verarbeitet wird.
  pad.unSerialize(fullInitialData());
  bindPadEvents();
  pad.bindKeyboardEvents();
  setStatus('API aktiv', 'ok');
  changes = 0;
  updateFooter();
  setLastAction('Polypad vollständig geladen');
}

function init() {
  if (!window.Polypad) {
    setStatus('API nicht geladen', 'bad');
    setLastAction('Polypad-Skript konnte nicht geladen werden');
    return;
  }
  createPad();
}

function bindPadEvents() {
  pad.on('change', (delta) => {
    changes += 1;
    changeCounter.textContent = `Änderungen: ${changes}`;
    if (delta && typeof delta === 'object') {
      const ids = Object.keys(delta);
      setLastAction(ids.length === 1 ? describeDelta(ids[0], delta[ids[0]]) : `${ids.length} Elemente geändert`);
    }
  });

  pad.on('selection', (event) => {
    const count = event?.tiles?.length ?? 0;
    selectionInfo.textContent = count ? `Auswahl: ${count} Element(e)` : 'Auswahl: –';
  });

  pad.on('viewport', (event) => {
    updateViewportInfo(event);
  });

  pad.on('move', (event) => {
    const count = event?.tiles?.length ?? 0;
    if (count) setLastAction(`${count} Element(e) werden bewegt`);
  });

  pad.on('export', (event) => {
    exportsInfo.textContent = `Exports: ${Object.keys(event || {}).length}`;
  });

  pad.on('undo', () => setLastAction('Rückgängig'));
  pad.on('redo', () => setLastAction('Wiederholt'));
  pad.on('options', (event) => setLastAction(`Optionen geändert: ${Object.keys(event || {}).join(', ') || 'unbekannt'}`));
}

function describeDelta(id, value) {
  const [before, after] = value || [];
  if (before === undefined && after) return `Hinzugefügt: ${after.name || id}`;
  if (after === undefined && before) return `Gelöscht: ${before.name || id}`;
  return `Geändert: ${after?.name || before?.name || id}`;
}

function updateFooter() {
  changeCounter.textContent = `Änderungen: ${changes}`;
  const selection = pad?.getSelection?.() || [];
  selectionInfo.textContent = selection.length ? `Auswahl: ${selection.length} Element(e)` : 'Auswahl: –';
  if (pad?.getViewport) updateViewportInfo(pad.getViewport());
  try {
    const exports = pad?.getExports?.() || {};
    exportsInfo.textContent = `Exports: ${Object.keys(exports).length}`;
  } catch {
    exportsInfo.textContent = 'Exports: –';
  }
}

function updateViewportInfo(v) {
  if (!v) return;
  viewportInfo.textContent = `Viewport: x ${Math.round(v.x)}, y ${Math.round(v.y)}, ${Math.round((v.zoom || 1) * 100)}%`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function randomPos() {
  return {
    x: Math.round(-180 + Math.random() * 360),
    y: Math.round(-120 + Math.random() * 240)
  };
}

function addTile(data) {
  if (!requirePad()) return;
  const id = pad.add(data);
  pad.select(id);
  return id;
}

function selectionIds() {
  if (!requirePad()) return [];
  return pad.getSelection();
}

function updateSelected(propertiesOrFn) {
  const ids = selectionIds();
  if (!ids.length) {
    setLastAction('Keine Auswahl vorhanden');
    return;
  }
  const data = pad.serialize();
  for (const id of ids) {
    const tile = data.tiles?.[id];
    if (!tile) continue;
    const props = typeof propertiesOrFn === 'function' ? propertiesOrFn(tile) : propertiesOrFn;
    pad.update(id, props);
  }
  setLastAction(`${ids.length} ausgewählte Element(e) aktualisiert`);
}

function showJson() {
  if (!requirePad()) return;
  jsonBox.value = JSON.stringify(pad.serialize(5000, 5000, 20000), null, 2);
  setLastAction('JSON angezeigt');
}

async function copyJsonToClipboard() {
  showJson();
  try {
    await navigator.clipboard.writeText(jsonBox.value);
    setLastAction('JSON in die Zwischenablage kopiert');
  } catch {
    jsonBox.select();
    document.execCommand('copy');
    setLastAction('JSON markiert/kopiert');
  }
}

function loadJson() {
  if (!requirePad()) return;
  try {
    const data = JSON.parse(jsonBox.value);
    pad.unSerialize(data);
    pad.resetViewport();
    changes = 0;
    updateFooter();
    setLastAction('JSON geladen');
  } catch (err) {
    setLastAction(`JSON-Fehler: ${err.message}`);
    alert(`JSON konnte nicht geladen werden:\n${err.message}`);
  }
}

function download(filename, textOrDataUrl, mime = 'text/plain') {
  const a = document.createElement('a');
  if (String(textOrDataUrl).startsWith('data:')) {
    a.href = textOrDataUrl;
  } else {
    const blob = new Blob([textOrDataUrl], { type: mime });
    a.href = URL.createObjectURL(blob);
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  a.download = filename;
  a.click();
}

function downloadJson() {
  if (!requirePad()) return;
  const data = JSON.stringify(pad.serialize(5000, 5000, 20000), null, 2);
  download('polypad-zustand.json', data, 'application/json');
  setLastAction('JSON heruntergeladen');
}

function previewJson() {
  if (!window.Polypad) return;
  try {
    const data = JSON.parse(jsonBox.value);
    previewImg.src = Polypad.toImage(data, 'png', 900, 520);
    previewImg.hidden = false;
    setLastAction('Vorschau aus JSON erzeugt');
  } catch (err) {
    setLastAction(`Vorschau-Fehler: ${err.message}`);
    alert(`Vorschau fehlgeschlagen:\n${err.message}`);
  }
}

async function downloadImage() {
  if (!requirePad()) return;
  try {
    const dataUrl = await pad.image(1400, 900, 'png');
    download('polypad-bild.png', dataUrl);
    setLastAction('PNG heruntergeladen');
  } catch (err) {
    setLastAction(`PNG-Export fehlgeschlagen: ${err.message}`);
  }
}

// --- Event-Bindings ----------------------------------------------------

window.addEventListener('load', init);

$('#fullscreenAppBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

$('#resetFullBtn').addEventListener('click', createPad);
$('#clearBtn').addEventListener('click', () => requirePad() && pad.clear());
$('#toggleSidebarBtn').addEventListener('click', () => requirePad() && pad.toggleSidebar());
$('#focusCanvasBtn').addEventListener('click', () => $('#polypad').focus());

$$('[data-tool]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!requirePad()) return;
    const tool = btn.dataset.tool;
    const option = btn.dataset.option;
    pad.setTool(tool, option);
    setLastAction(option ? `Werkzeug: ${tool}/${option}` : `Werkzeug: ${tool}`);
  });
});

$('#addTextBtn').addEventListener('click', () => addTile({
  name: 'text',
  ...randomPos(),
  width: 360,
  fontSize: 22,
  html: '<b>Neues Textfeld</b><br>Doppelklick zum Bearbeiten.'
}));

$('#addEquationBtn').addEventListener('click', () => addTile({
  name: 'equation',
  ...randomPos(),
  expr: '3x+5=8'
}));

$('#addNumberCardBtn').addEventListener('click', () => {
  const value = Number(prompt('Wert der Zahlenkarte:', '5') || '5');
  addTile({ name: 'number-card', ...randomPos(), value, valueStr: String(value) });
});

$('#addAlgebraBtn').addEventListener('click', () => addTile({
  name: 'algebra',
  ...randomPos(),
  expr: 'x',
  splitH: 1,
  splitV: 1
}));

$('#addBalanceBtn').addEventListener('click', () => addTile({
  name: 'balance',
  ...randomPos(),
  size: 2.1,
  level: 0
}));

$('#pasteDemoBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  pad.paste({
    demo_text: { name: 'text', x: -230, y: 120, width: 260, fontSize: 20, html: '<b>Paste-Demo</b><br>Diese Gruppe wurde per <code>pad.paste()</code> eingefügt.' },
    demo_card: { name: 'number-card', x: 80, y: 130, value: 10, valueStr: '10' },
    demo_x: { name: 'algebra', x: 170, y: 130, expr: 'x', color: '#0b7cff' }
  });
  setLastAction('Demo-Gruppe eingefügt');
});

$('#selectAllBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  const ids = Object.keys(pad.serialize().tiles || {});
  pad.select(...ids);
  updateFooter();
});
$('#clearSelectionBtn').addEventListener('click', () => requirePad() && pad.select());
$('#deleteSelectionBtn').addEventListener('click', () => {
  const ids = selectionIds();
  if (ids.length) pad.delete(...ids);
});
$('#lockSelectionBtn').addEventListener('click', () => updateSelected({ status: 'locked' }));
$('#fixSelectionBtn').addEventListener('click', () => updateSelected({ status: 'fixed' }));
$('#unlockSelectionBtn').addEventListener('click', () => updateSelected({ status: undefined }));
$('#frontSelectionBtn').addEventListener('click', () => updateSelected({ layer: 'front' }));
$('#backSelectionBtn').addEventListener('click', () => updateSelected({ layer: 'back' }));
$('#rotateSelectionBtn').addEventListener('click', () => updateSelected(tile => ({ rot: ((tile.rot || 0) + 15) % 360 })));
$('#applyColorBtn').addEventListener('click', () => updateSelected({ color: $('#colorPicker').value }));

$('#undoBtn').addEventListener('click', () => requirePad() && pad.undo());
$('#redoBtn').addEventListener('click', () => requirePad() && pad.redo());
$('#resetViewBtn').addEventListener('click', () => requirePad() && pad.resetViewport());
$('#readViewportBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  const v = pad.getViewport();
  updateViewportInfo(v);
  setLastAction(`Viewport: ${JSON.stringify(v)}`);
});
$('#zoomInBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  const v = pad.getViewport();
  pad.setViewport(v.x, v.y, Math.min(4, v.zoom * 1.2));
});
$('#zoomOutBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  const v = pad.getViewport();
  pad.setViewport(v.x, v.y, Math.max(0.15, v.zoom / 1.2));
});

$('#applyOptionsBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  pad.setOptions({
    grid: $('#gridSelect').value,
    canvas: $('#canvasSelect').value,
    canvasX: 1200,
    canvasY: 800
  });
  setLastAction('Canvas-Optionen angewendet');
});
$('#highContrastBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  highContrast = !highContrast;
  pad.setOptions({ highContrast });
  setLastAction(`High Contrast: ${highContrast ? 'an' : 'aus'}`);
});

$('#getExportsBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  const exports = pad.getExports();
  exportsInfo.textContent = `Exports: ${Object.keys(exports || {}).length}`;
  jsonBox.value = JSON.stringify(exports, null, 2);
  setLastAction('Exports ins JSON-Feld geschrieben');
});
$('#customButtonBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  customButtonCount += 1;
  const btn = pad.addCustomButton('toolbar', `API ${customButtonCount}`);
  btn.addEventListener('click', () => {
    addTile({ name: 'text', ...randomPos(), width: 280, html: `Custom Button ${customButtonCount} wurde geklickt.` });
  });
  setLastAction('Custom-Button zur Polypad-Toolbar hinzugefügt');
});
$('#gestureBtn').addEventListener('click', () => {
  if (!requirePad()) return;
  pad.showGesture('#polypad', { x: 120, y: 0 });
  setLastAction('Hand-Geste gezeigt');
});
$('#resizeBtn').addEventListener('click', () => requirePad() && pad.resize());

$('#showJsonBtn').addEventListener('click', showJson);
$('#copyClipboardBtn').addEventListener('click', copyJsonToClipboard);
$('#loadJsonBtn').addEventListener('click', loadJson);
$('#downloadJsonBtn').addEventListener('click', downloadJson);
$('#previewJsonBtn').addEventListener('click', previewJson);
$('#downloadImageBtn').addEventListener('click', downloadImage);
