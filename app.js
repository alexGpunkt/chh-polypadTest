"use strict";

let pad = null;
let changeCount = 0;
let selectedCount = 0;

const $ = (id) => document.getElementById(id);

const statusBox = $("status");
const checkBox = $("checkResult");
const jsonBox = $("jsonBox");
const statsBox = $("stats");

function setStatus(text, type = "info") {
  if (!statusBox) return;
  statusBox.textContent = text;
  statusBox.className = type;
}

function setCheck(text, type = "info") {
  if (!checkBox) return;
  checkBox.textContent = text;
  checkBox.className = type;
}

function updateStats() {
  if (!statsBox) return;
  statsBox.textContent = `Änderungen: ${changeCount} Auswahl: ${selectedCount || "–"}`;
}

async function startPolypad() {
  try {
    setStatus("API lädt ...", "info");

    const container = $("polypad");
    if (!container) {
      throw new Error("Container #polypad wurde nicht gefunden.");
    }

    if (!window.Polypad) {
      throw new Error("Polypad-API wurde nicht geladen. Prüfe den script-Import in index.html.");
    }

    if (typeof window.Polypad.create === "function") {
      pad = await window.Polypad.create(container, {
        toolbar: true,
        settings: true
      });
    } else if (typeof window.Polypad === "function") {
      pad = new window.Polypad(container, {
        toolbar: true,
        settings: true
      });
    } else {
      throw new Error("Polypad ist geladen, aber die Startfunktion ist unbekannt.");
    }

    attachPadEvents();

    setStatus("Polypad bereit.", "success");
    setCheck("Noch nicht geprüft.", "info");
    updateStats();

  } catch (err) {
    console.error(err);
    setStatus("Fehler beim Start", "error");
    setCheck("Fehler beim Start der Polypad-API: " + err.message, "error");
  }
}

function attachPadEvents() {
  if (!pad) return;

  const possibleChangeEvents = ["change", "update", "tilesChanged"];
  const possibleSelectEvents = ["select", "selection", "selectionChanged"];

  if (typeof pad.on === "function") {
    possibleChangeEvents.forEach((eventName) => {
      try {
        pad.on(eventName, () => {
          changeCount++;
          updateStats();
        });
      } catch (e) {}
    });

    possibleSelectEvents.forEach((eventName) => {
      try {
        pad.on(eventName, () => {
          selectedCount = getSelectionCount();
          updateStats();
        });
      } catch (e) {}
    });
  }
}

function getSelectionCount() {
  if (!pad) return 0;

  if (Array.isArray pad.selection) {
    return pad.selection.length;
  }

  if (typeof pad.getSelection === "function") {
    const selection = pad.getSelection();
    return Array.isArray(selection) ? selection.length : 0;
  }

  if (Array.isArray(pad.selectedTiles)) {
    return pad.selectedTiles.length;
  }

  return 0;
}

function clearPad() {
  if (!pad) return setCheck("Polypad ist noch nicht bereit.", "error");

  try {
    if (typeof pad.clear === "function") {
      pad.clear();
    } else if (typeof pad.reset === "function") {
      pad.reset();
    } else if (typeof pad.setJSON === "function") {
      pad.setJSON({});
    } else {
      throw new Error("Keine passende Leer-Funktion gefunden.");
    }

    changeCount++;
    setCheck("Polypad wurde geleert.", "success");
    updateStats();

  } catch (err) {
    console.error(err);
    setCheck("Fehler beim Leeren: " + err.message, "error");
  }
}

function addTile(type) {
  if (!pad) return setCheck("Polypad ist noch nicht bereit.", "error");

  try {
    if (typeof pad.addTile === "function") {
      pad.addTile(type);
    } else if (typeof pad.add === "function") {
      pad.add(type);
    } else if (typeof pad.insert === "function") {
      pad.insert(type);
    } else {
      throw new Error("Diese Polypad-Version erlaubt kein direktes Hinzufügen per API.");
    }

    changeCount++;
    setCheck(`${type} wurde eingefügt.`, "success");
    updateStats();

  } catch (err) {
    console.error(err);
    setCheck("Fehler beim Einfügen: " + err.message, "error");
  }
}

function newTask() {
  clearPad();
  setCheck("Neue Aufgabe erstellt: Stelle die Gleichung dar.", "info");
}

function autoExample() {
  if (!pad) return setCheck("Polypad ist noch nicht bereit.", "error");

  clearPad();

  setTimeout(() => {
    addTile("variable");
    addTile("one");
    addTile("five");
    setCheck("Beispiel wurde automatisch gelegt, soweit die API dies unterstützt.", "success");
  }, 200);
}

function checkAnswer() {
  if (!pad) return setCheck("Polypad ist noch nicht bereit.", "error");

  selectedCount = getSelectionCount();
  updateStats();

  setCheck("Prüfung vorbereitet. Die konkrete mathematische Auswertung muss noch an die verwendeten Polypad-Objekte angepasst werden.", "info");
}

function getPadJSON() {
  if (!pad) throw new Error("Polypad ist noch nicht bereit.");

  if (typeof pad.serialize === "function") {
    return pad.serialize();
  }

  if (typeof pad.toJSON === "function") {
    return pad.toJSON();
  }

  if (typeof pad.getJSON === "function") {
    return pad.getJSON();
  }

  if (typeof pad.save === "function") {
    return pad.save();
  }

  throw new Error("Keine Export-Funktion gefunden.");
}

function loadPadJSON(data) {
  if (!pad) throw new Error("Polypad ist noch nicht bereit.");

  if (typeof pad.deserialize === "function") {
    return pad.deserialize(data);
  }

  if (typeof pad.fromJSON === "function") {
    return pad.fromJSON(data);
  }

  if (typeof pad.setJSON === "function") {
    return pad.setJSON(data);
  }

  if (typeof pad.load === "function") {
    return pad.load(data);
  }

  throw new Error("Keine Lade-Funktion gefunden.");
}

function exportJSON() {
  try {
    const data = getPadJSON();
    const text = JSON.stringify(data, null, 2);

    if (jsonBox) jsonBox.value = text;

    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "polypad-zustand.json";
    a.click();

    URL.revokeObjectURL(url);

    setCheck("JSON wurde exportiert.", "success");

  } catch (err) {
    console.error(err);
    setCheck("Fehler beim Exportieren: " + err.message, "error");
  }
}

function copyJSONToTextField() {
  try {
    const data = getPadJSON();
    if (jsonBox) {
      jsonBox.value = JSON.stringify(data, null, 2);
    }
    setCheck("JSON wurde in das Textfeld kopiert.", "success");

  } catch (err) {
    console.error(err);
    setCheck("Fehler beim Kopieren: " + err.message, "error");
  }
}

function loadJSONFromTextField() {
  try {
    if (!jsonBox || !jsonBox.value.trim()) {
      throw new Error("Das Textfeld ist leer.");
    }

    const data = JSON.parse(jsonBox.value);
    loadPadJSON(data);

    changeCount++;
    setCheck("JSON wurde geladen.", "success");
    updateStats();

  } catch (err) {
    console.error(err);
    setCheck("Fehler beim Laden: " + err.message, "error");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  $("btnNew")?.addEventListener("click", newTask);
  $("btnAuto")?.addEventListener("click", autoExample);
  $("btnCheck")?.addEventListener("click", checkAnswer);

  $("btnX")?.addEventListener("click", () => addTile("variable"));
  $("btnOne")?.addEventListener("click", () => addTile("one"));
  $("btnFive")?.addEventListener("click", () => addTile("five"));
  $("btnClear")?.addEventListener("click", clearPad);

  $("btnExport")?.addEventListener("click", exportJSON);
  $("btnCopy")?.addEventListener("click", copyJSONToTextField);
  $("btnLoad")?.addEventListener("click", loadJSONFromTextField);

  startPolypad();
});
