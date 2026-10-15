import { loadFromStorage, saveToStorage } from "../services/storage.js";
import { getActiveWorld } from "../services/world-service.js";
import {
  getQuillDraftsForWorld,
  emptyWorldPreview
} from "../data/seed.js";

let drafts = [];
let activeDraftId = null;
let elements = {};
let saveTimer = null;
let loadedWorldId = null;

function getStorageKey(worldId) {
  return `quill:drafts:${worldId}`;
}

function createDraft(title = "New draft", content = "") {
  return {
    id:
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    content,
    updatedAt: new Date().toISOString()
  };
}

export function initializeQuillEditor() {
  if (!document.querySelector("#view-quill")) {
    return;
  }

  bindElements();
  loadDraftsForWorld();
  attachEvents();
  renderQuillEditor();
}

export function renderQuillEditor() {
  loadDraftsForWorld();

  if (!elements.editor) {
    bindElements();
  }

  if (!elements.editor) {
    return;
  }

  renderDraftList();
  renderEditor();
}

export function getQuillDrafts() {
  loadDraftsForWorld();
  return structuredClone(drafts);
}

function bindElements() {
  elements = {
    draftList: document.querySelector("#quill-drafts-list"),
    newDraftButton: document.querySelector("#new-quill-draft-button"),
    toolbar: document.querySelector(".editor-toolbar"),
    titleInput: document.querySelector("#quill-title"),
    editor: document.querySelector("#quill-editor"),
    meta: document.querySelector("#quill-meta"),
    exportButton: document.querySelector("#quill-export-button"),
    hint: document.querySelector(".editor-toolbar span")
  };
}

function attachEvents() {
  if (elements.newDraftButton?.dataset.quillBound) {
    return;
  }

  elements.newDraftButton?.addEventListener("click", createNewDraft);
  elements.toolbar?.addEventListener("click", handleToolbarAction);
  elements.titleInput?.addEventListener("input", handleEditorInput);
  elements.editor?.addEventListener("input", handleEditorInput);
  elements.editor?.addEventListener("blur", saveActiveDraft);
  elements.exportButton?.addEventListener("click", exportDraft);

  if (elements.newDraftButton) {
    elements.newDraftButton.dataset.quillBound = "true";
  }
}

function loadDraftsForWorld() {
  const world = getActiveWorld();

  if (loadedWorldId === world.id) {
    return;
  }

  const fallback = getQuillDraftsForWorld(world.id);
  drafts = loadFromStorage(getStorageKey(world.id), fallback);
  activeDraftId = drafts[0]?.id ?? null;
  loadedWorldId = world.id;
}

function saveDrafts() {
  const world = getActiveWorld();
  saveToStorage(getStorageKey(world.id), drafts);
}

function getActiveDraft() {
  return drafts.find((draft) => draft.id === activeDraftId);
}

function renderDraftList() {
  if (!elements.draftList) {
    return;
  }

  elements.draftList.replaceChildren();

  if (!drafts.length) {
    const message = document.createElement("p");
    message.className = "editor-outline-empty";
    message.textContent =
      "No drafts yet. Create one to begin shaping your narrative.";
    elements.draftList.append(message);
    return;
  }

  drafts.forEach((draft) => {
    const button = document.createElement("button");
    button.className = "editor-outline-item";
    button.type = "button";
    button.innerHTML = `<strong>${draft.title}</strong><small>${formatSavedDate(
      draft.updatedAt
    )}</small>`;
    button.classList.toggle("active", draft.id === activeDraftId);
    button.addEventListener("click", () => selectDraft(draft.id));
    elements.draftList.append(button);
  });
}

function renderEditor() {
  const draft = getActiveDraft();

  if (!draft || !elements.editor || !elements.titleInput) {
    if (elements.editor) {
      elements.editor.innerHTML =
        "<p>Choose or create a draft from the sidebar to begin writing.</p>";
    }
    return;
  }

  elements.titleInput.value = draft.title;
  elements.editor.innerHTML =
    draft.content ||
    `<p>${emptyWorldPreview.graphHint.replace("web", "story")}</p>`;
  elements.editor.dataset.placeholder =
    "Begin writing lore, history, or scene text for your world…";
  updateMeta();
}

function selectDraft(draftId) {
  saveActiveDraft();
  activeDraftId = draftId;
  renderQuillEditor();
  elements.editor?.focus();
}

function createNewDraft() {
  saveActiveDraft();
  const newDraft = createDraft(`New draft ${drafts.length + 1}`, "");
  drafts.unshift(newDraft);
  activeDraftId = newDraft.id;
  saveDrafts();
  renderQuillEditor();
  elements.editor?.focus();
}

function saveActiveDraft() {
  const draft = getActiveDraft();

  if (!draft || !elements.titleInput || !elements.editor) {
    return;
  }

  draft.title = elements.titleInput.value.trim() || "Untitled draft";
  draft.content = elements.editor.innerHTML;
  draft.updatedAt = new Date().toISOString();
  saveDrafts();
  updateMeta();
}

function handleEditorInput() {
  if (!getActiveDraft()) {
    return;
  }

  scheduleSave();
  updateMeta();
}

function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = window.setTimeout(() => {
    saveActiveDraft();
    flashHint("Draft saved");
  }, 420);
}

function handleToolbarAction(event) {
  const action = event.target.closest("[data-action]")?.dataset.action;

  if (!action) {
    return;
  }

  elements.editor?.focus();

  if (action === "formatBlock") {
    document.execCommand("formatBlock", false, "H2");
  } else if (action === "blockquote") {
    document.execCommand("formatBlock", false, "blockquote");
  } else if (action === "code") {
    document.execCommand("formatBlock", false, "pre");
  } else {
    document.execCommand(action, false, null);
  }
}

function exportDraft() {
  const draft = getActiveDraft();

  if (!draft) {
    return;
  }

  const plainText = `${draft.title}\n\n${elements.editor?.innerText.trim() || ""}`;

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(plainText).then(() => {
      flashButton(elements.exportButton, "Copied");
    });
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = plainText;
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
  flashButton(elements.exportButton, "Copied");
}

function updateMeta() {
  const draft = getActiveDraft();

  if (!draft || !elements.meta) {
    return;
  }

  elements.meta.textContent = `${wordCount(elements.editor?.innerHTML || draft.content)} words · updated ${formatSavedDate(
    draft.updatedAt
  )}`;
}

function flashHint(message) {
  if (!elements.hint) {
    return;
  }

  const original = elements.hint.textContent;
  elements.hint.textContent = message;

  window.setTimeout(() => {
    elements.hint.textContent = original;
  }, 1800);
}

function flashButton(button, label) {
  if (!button) {
    return;
  }

  const original = button.textContent;
  button.textContent = label;

  window.setTimeout(() => {
    button.textContent = original;
  }, 1400);
}

function wordCount(content = "") {
  return String(content)
    .replace(/<[^>]+>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function formatSavedDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

export function resetQuillForWorld() {
  loadedWorldId = null;
  renderQuillEditor();
}
