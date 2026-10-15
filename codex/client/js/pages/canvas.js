import { loadFromStorage, saveToStorage } from "../services/storage.js";
import { getActiveWorld } from "../services/world-service.js";
import { getCanvasNotesForWorld } from "../data/seed.js";

let board = null;
let notes = [];
let loadedWorldId = null;
let dragState = null;

function getStorageKey(worldId) {
  return `canvas:notes:${worldId}`;
}

export function init({ elements } = {}) {
  board = document.querySelector(".canvas-board");

  if (!board) {
    return;
  }

  loadNotesForWorld();
  renderCanvas();
  bindBoardEvents();
}

export function renderCanvas() {
  loadNotesForWorld();

  if (!board) {
    return;
  }

  board.querySelectorAll(".canvas-note, .canvas-connector").forEach((el) => el.remove());

  notes.forEach((note) => {
    board.append(createNoteElement(note));
  });

  if (notes.length >= 2) {
    board.append(createConnector(28, 204, 210, 21));
  }

  if (notes.length >= 3) {
    board.append(createConnector(56, 236, 190, -20));
  }
}

function loadNotesForWorld() {
  const world = getActiveWorld();

  if (loadedWorldId === world.id) {
    return;
  }

  notes = loadFromStorage(getStorageKey(world.id), getCanvasNotesForWorld(world.id));
  loadedWorldId = world.id;
}

function saveNotes() {
  const world = getActiveWorld();
  saveToStorage(getStorageKey(world.id), notes);
}

function createNoteElement(note) {
  const element = document.createElement("article");
  element.className = `canvas-note note-${note.color || "blue"}`;
  element.dataset.noteId = note.id;
  element.style.top = `${note.top}px`;
  element.style.left = `${note.left}%`;
  element.style.transform = `rotate(${note.rotate || 0}deg)`;

  element.innerHTML = `
    <span>${note.tag}</span>
    <strong>${note.title}</strong>
    <p>${note.body}</p>
  `;

  element.addEventListener("pointerdown", (event) => startDrag(event, note.id));
  element.addEventListener("codex:quick-edit", () => beginQuickEdit(element, note.id));
  element.addEventListener("codex:quick-delete", () => {
    notes = notes.filter((item) => item.id !== note.id);
    saveNotes();
    renderCanvas();
  });

  return element;
}

function beginQuickEdit(element, noteId) {
  if (element.classList.contains("is-editing")) {
    return;
  }

  const fields = element.querySelectorAll("span, strong, p");
  element.classList.add("is-editing");
  fields.forEach((field) => { field.contentEditable = "true"; });
  element.querySelector("strong")?.focus();

  const finish = (event) => {
    if (event.relatedTarget && element.contains(event.relatedTarget)) {
      return;
    }
    const note = notes.find((item) => item.id === noteId);
    if (note) {
      note.tag = element.querySelector("span")?.textContent.trim() || "Note";
      note.title = element.querySelector("strong")?.textContent.trim() || "Untitled";
      note.body = element.querySelector("p")?.textContent.trim() || "";
      saveNotes();
    }
    fields.forEach((field) => { field.contentEditable = "false"; });
    element.classList.remove("is-editing");
    element.removeEventListener("focusout", finish);
  };
  element.addEventListener("focusout", finish);
}

function createConnector(leftPct, top, width, rotate) {
  const connector = document.createElement("div");
  connector.className = "canvas-connector";
  connector.style.top = `${top}px`;
  connector.style.left = `${leftPct}%`;
  connector.style.width = `${width}px`;
  connector.style.transform = `rotate(${rotate}deg)`;
  return connector;
}

function bindBoardEvents() {
  if (board?.dataset.canvasBound) {
    return;
  }

  board.addEventListener("pointermove", continueDrag);
  board.addEventListener("pointerup", endDrag);
  board.addEventListener("pointerleave", endDrag);

  const addButton = document.querySelector("#canvas-add-note");

  addButton?.addEventListener("click", () => {
    const note = {
      id: crypto.randomUUID(),
      tag: "Note",
      title: "New idea",
      body: "Drag me anywhere on the board.",
      color: "blue",
      top: 120 + Math.random() * 80,
      left: 20 + Math.random() * 40,
      rotate: Math.round((Math.random() - 0.5) * 6)
    };

    notes.push(note);
    saveNotes();
    renderCanvas();
  });

  board.dataset.canvasBound = "true";
}

function startDrag(event, noteId) {
  if (event.button !== 0) {
    return;
  }

  const noteEl = event.currentTarget;
  const rect = board.getBoundingClientRect();
  const noteRect = noteEl.getBoundingClientRect();
  dragState = {
    noteId,
    element: noteEl,
    offsetX: event.clientX - noteRect.left,
    offsetY: event.clientY - noteRect.top,
    boardRect: rect
  };

  noteEl.setPointerCapture(event.pointerId);
  noteEl.classList.add("dragging");
  event.preventDefault();
}

function continueDrag(event) {
  if (!dragState) {
    return;
  }

  const boardRect = board.getBoundingClientRect();
  const left = event.clientX - boardRect.left - dragState.offsetX;
  const top = event.clientY - boardRect.top - dragState.offsetY;
  const leftPercent = (left / boardRect.width) * 100;
  const noteWidthPercent = (dragState.element.offsetWidth / boardRect.width) * 100;
  const maxTop = Math.max(0, boardRect.height - dragState.element.offsetHeight);

  dragState.element.style.left = `${Math.min(Math.max(leftPercent, 0), 100 - noteWidthPercent)}%`;
  dragState.element.style.top = `${Math.min(Math.max(top, 0), maxTop)}px`;

  event.preventDefault();
}

function endDrag(event) {
  if (!dragState) {
    return;
  }

  const note = notes.find((item) => item.id === dragState.noteId);

  if (note) {
    note.top = parseFloat(dragState.element.style.top);
    note.left = parseFloat(dragState.element.style.left);
    note.rotate = 0;
    dragState.element.style.transform = "rotate(0deg)";
    saveNotes();
  }

  dragState.element.classList.remove("dragging");

  try {
    dragState.element.releasePointerCapture(event.pointerId);
  } catch {
    // ignore
  }

  dragState = null;
}

export function resetCanvasForWorld() {
  loadedWorldId = null;
  renderCanvas();
}
