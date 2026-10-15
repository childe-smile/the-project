import { getActiveWorld } from "../services/world-service.js";
import { getUploadedMapTemplates, saveUploadedMapTemplate } from "../services/map-template-service.js";

const layerDefinitions = {
  borders: "Kingdom borders",
  routes: "Travel routes",
  landmarks: "Landmarks"
};

const markerTypeColors = {
  City: "#5f9698",
  Landmark: "#b9a16e",
  Location: "#7f9faf",
  Port: "#6e9dad",
  Settlement: "#60785b",
  Kingdom: "#86505a"
};

let canvas = null;
let layerButtons = [];
let summaryTarget = null;
let markerInfoTarget = null;
let onMarkerSelect = null;
let resetButton = null;
let templateButtons = [];
let templateImage = null;
let mapContentLayer = null;
let pinColorInput = null;
let pinSizeInput = null;
let pinShapeInput = null;
let pinStyles = {};
let customPins = [];
let renderedCards = [];
let mapOverlay = null;
const activeLayers = new Set(["borders"]);
let currentMarkers = [];
let selectedMarkerId = null;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let zoomLevel = 100;
let zoomOutput = null;
const markerPositions = new Map();
let selectedPinPanel = null;
let pendingPinStyle = null;
let loadedWorldId = null;
let panMoved = false;
let uploadedTemplates = [];
let activeTemplateKey = null;

export function initializeMapView(options = {}) {
  canvas = options.canvas;
  layerButtons = Array.from(options.layerButtons || []);
  summaryTarget = options.summaryTarget;
  markerInfoTarget = options.markerInfoTarget;
  onMarkerSelect = options.onMarkerSelect;
  resetButton = options.resetButton;
  templateButtons = Array.from(options.templateButtons || []);
  templateImage = document.querySelector("#map-template-image");
  pinColorInput = document.querySelector("#map-pin-color");
  pinSizeInput = document.querySelector("#map-pin-size");
  pinShapeInput = document.querySelector("#map-pin-shape");
  zoomOutput = document.querySelector("#map-zoom-level");
  selectedPinPanel = document.querySelector("#pin-customizer");

  if (!canvas || !summaryTarget || !markerInfoTarget) {
    return;
  }

  mapContentLayer = document.createElement("div");
  mapContentLayer.className = "map-content-layer";
  if (templateImage) mapContentLayer.append(templateImage);
  mapOverlay = document.createElement("div");
  mapOverlay.className = "map-overlay";
  mapContentLayer.append(mapOverlay);
  canvas.prepend(mapContentLayer);

  canvas.style.touchAction = "none";
  canvas.classList.add("map-canvas-pannable");
  canvas.addEventListener("pointerdown", startCanvasPan);
  canvas.addEventListener("pointermove", continueCanvasPan);
  canvas.addEventListener("pointerup", endCanvasPan);
  canvas.addEventListener("pointerleave", endCanvasPan);
  canvas.addEventListener("lostpointercapture", endCanvasPan);
  canvas.addEventListener("click", event => {
    if (event.target.closest(".map-marker, .map-zoom-controls")) return;
    if (panMoved) { panMoved = false; return; }
    clearSelectedPin();
  });
  canvas.addEventListener("keydown", event => { if (event.key === "Escape") clearSelectedPin(); });
  selectedPinPanel?.addEventListener("keydown", event => { if (event.key === "Escape") clearSelectedPin(); });

  layerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      switchLayer(button.dataset.mapLayer);
    });
  });
  document.querySelector("#map-zoom-in")?.addEventListener("click", () => setZoom(zoomLevel + 15));
  document.querySelector("#map-zoom-out")?.addEventListener("click", () => setZoom(zoomLevel - 15));
  document.querySelector("#map-fit")?.addEventListener("click", fitMap);

  let savedTemplate = "assets/images/maps/world-map.png";
  try {
    savedTemplate = localStorage.getItem("codex-map-template") || savedTemplate;
  } catch {
    // Use the default template when storage is unavailable.
  }
  if (!savedTemplate.startsWith("upload:")) setMapTemplate(savedTemplate);
  getUploadedMapTemplates().then(templates => {
    uploadedTemplates = templates;
    renderUploadedTemplates();
    if (!activeTemplateKey) setMapTemplate(savedTemplate);
  }).catch(() => { if (!activeTemplateKey) setMapTemplate("assets/images/maps/world-map.png"); });
  templateButtons.forEach((button) => {
    button.addEventListener("click", () => setMapTemplate(button.dataset.mapTemplate));
  });
  try {
    pinStyles = JSON.parse(localStorage.getItem("codex-map-pin-styles") || "{}");
    customPins = JSON.parse(localStorage.getItem("codex-custom-map-pins") || "[]");
    const savedPositions = JSON.parse(localStorage.getItem("codex-map-marker-positions") || "{}");
    Object.entries(savedPositions).forEach(([id, position]) => markerPositions.set(id, position));
  } catch {
    pinStyles = {};
    customPins = [];
  }
  [pinColorInput, pinSizeInput, pinShapeInput].forEach((control) => {
    control?.addEventListener("input", updateSelectedPinStyle);
    control?.addEventListener("change", updateSelectedPinStyle);
  });
  document.querySelectorAll(".map-shape-picker button").forEach(button => {
    button.addEventListener("click", () => {
      pinShapeInput.value = button.dataset.pinShape;
      updateSelectedPinStyle();
    });
  });
  document.querySelector("#map-pin-confirm")?.addEventListener("click", confirmSelectedPinStyle);
  document.querySelector("#map-clear-selection")?.addEventListener("click", clearSelectedPin);
  document.querySelector("#map-previous-uploads")?.addEventListener("click", event => {
    const gallery = document.querySelector("#map-uploaded-templates");
    gallery.hidden = !gallery.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!gallery.hidden));
    renderUploadedTemplates();
  });
  document.querySelector("#map-uploaded-templates")?.addEventListener("click", event => {
    const button = event.target.closest("[data-map-template]");
    if (button) setMapTemplate(button.dataset.mapTemplate);
  });
  document.querySelector("#map-template-upload")?.addEventListener("change", uploadMapTemplate);
  document.querySelector("#map-new-pin-image")?.addEventListener("change", event => {
    document.querySelector("#map-pin-image-label").textContent = event.target.files[0]?.name || "Choose Pin Icon";
  });
  document.querySelector("#map-add-pin")?.addEventListener("click", createCustomPinFromControls);

  if (resetButton) {
    resetButton.addEventListener("click", resetMapView);
  }

  updateCanvasTransform();
}

function setMapTemplate(imagePath) {
  if (!canvas || !imagePath) return;
  const uploaded = uploadedTemplates.find(template => `upload:${template.id}` === imagePath);
  if (!uploaded && !templateButtons.some(button => button.dataset.mapTemplate === imagePath)) imagePath = "assets/images/maps/world-map.png";
  activeTemplateKey = imagePath;
  if (templateImage) templateImage.src = uploaded?.image || imagePath;
  panOffset = { x: 0, y: 0 };
  zoomLevel = 100;
  updateCanvasTransform();
  templateButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mapTemplate === imagePath);
    button.setAttribute("aria-pressed", String(button.dataset.mapTemplate === imagePath));
  });
  try {
    localStorage.setItem("codex-map-template", imagePath);
  } catch {
    // Switching remains available for the current session.
  }
}

function renderUploadedTemplates() {
  const gallery = document.querySelector("#map-uploaded-templates");
  gallery.replaceChildren();
  if (!uploadedTemplates.length) {
    const empty = document.createElement("p");
    empty.textContent = "No uploaded templates yet.";
    gallery.append(empty);
  } else {
    const grid = document.createElement("div");
    grid.className = "map-template-grid";
    uploadedTemplates.forEach(template => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-template";
      button.dataset.mapTemplate = `upload:${template.id}`;
      button.title = template.name;
      button.setAttribute("aria-label", `Use ${template.name}`);
      button.setAttribute("aria-pressed", String(button.dataset.mapTemplate === activeTemplateKey));
      button.classList.toggle("active", button.dataset.mapTemplate === activeTemplateKey);
      const image = document.createElement("img");
      image.src = template.image;
      image.alt = "";
      const caption = document.createElement("span");
      caption.textContent = template.name;
      button.append(image, caption);
      grid.append(button);
    });
    gallery.append(grid);
  }
  templateButtons = Array.from(document.querySelectorAll("#view-maps [data-map-template]"));
}

async function uploadMapTemplate(event) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;
  const status = document.querySelector("#map-upload-status");
  status.textContent = "Loading template…";
  try {
    if (!file.type.startsWith("image/")) throw new Error("Choose an image for your map template.");
    if (file.size > 12 * 1024 * 1024) throw new Error("Choose an image smaller than 12 MB.");
    const image = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("The image couldn't be read. Try another file."));
      reader.readAsDataURL(file);
    });
    await new Promise((resolve, reject) => {
      const preview = new Image();
      preview.onload = resolve;
      preview.onerror = () => reject(new Error("The image couldn't load. Try another file."));
      preview.src = image;
    });
    const template = { id: crypto.randomUUID(), name: file.name, image };
    let saved = true;
    try { await saveUploadedMapTemplate(template); } catch { saved = false; }
    uploadedTemplates.push(template);
    renderUploadedTemplates();
    setMapTemplate(`upload:${template.id}`);
    status.textContent = saved ? "Template uploaded and saved." : "Template loaded for this session. Browser storage is unavailable.";
  } catch (error) { status.textContent = error.message; }
  finally { input.value = ""; }
}

function updateSelectedPinStyle() {
  if (!selectedMarkerId) return;
  pendingPinStyle = {
    color: pinColorInput?.value || "#7fa8c3",
    size: pinSizeInput?.value || "medium",
    shape: pinShapeInput?.value || "rounded"
  };
  const marker = currentMarkers.find((item) => item.dataset.cardId === selectedMarkerId);
  if (marker) applyPinStyle(marker, selectedMarkerId, pendingPinStyle);
  syncShapeButtons();
  document.querySelector("#map-pin-style-status").textContent = "Preview · Confirm to save.";
}

function confirmSelectedPinStyle() {
  if (!selectedMarkerId || !pendingPinStyle) return;
  pinStyles[selectedMarkerId] = { ...pendingPinStyle };
  const marker = currentMarkers.find(item => item.dataset.cardId === selectedMarkerId);
  if (marker) applyPinStyle(marker, selectedMarkerId);
  let saved = true;
  try { localStorage.setItem("codex-map-pin-styles", JSON.stringify(pinStyles)); } catch { saved = false; }
  document.querySelector("#map-pin-style-status").textContent = saved ? "Pin style saved." : "Pin style applied for this session.";
}

function applyPinStyle(marker, cardId, preview) {
  const style = preview || pinStyles[cardId] || {};
  marker.style.setProperty("--marker-color", style.color || marker.dataset.defaultColor || "#7fa8c3");
  marker.dataset.pinSize = style.size || "medium";
  marker.dataset.pinShape = style.shape || "rounded";
}

function syncPinControls(cardId) {
  const style = pinStyles[cardId] || {};
  const marker = currentMarkers.find(item => item.dataset.cardId === cardId);
  if (marker) applyPinStyle(marker, cardId);
  [pinColorInput, pinSizeInput, pinShapeInput].forEach((control) => { if (control) control.disabled = cardId === "placeholder"; });
  if (pinColorInput) pinColorInput.value = style.color || currentMarkers.find(marker => marker.dataset.cardId === cardId)?.dataset.defaultColor || "#7fa8c3";
  if (pinSizeInput) pinSizeInput.value = style.size || "medium";
  if (pinShapeInput) pinShapeInput.value = style.shape || "rounded";
  pendingPinStyle = { color: pinColorInput.value, size: pinSizeInput.value, shape: pinShapeInput.value };
  syncShapeButtons();
  document.querySelector("#map-pin-style-status").textContent = "";
}

function syncShapeButtons() {
  document.querySelectorAll(".map-shape-picker button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.pinShape === pinShapeInput.value)));
}

function clearSelectedPin() {
  const restoreFocus = selectedPinPanel?.contains(document.activeElement);
  const previous = currentMarkers.find(marker => marker.dataset.cardId === selectedMarkerId);
  if (previous) applyPinStyle(previous, selectedMarkerId);
  selectedMarkerId = null;
  pendingPinStyle = null;
  currentMarkers.forEach(marker => { marker.classList.remove("selected"); marker.setAttribute("aria-pressed", "false"); });
  if (selectedPinPanel) selectedPinPanel.hidden = true;
  markerInfoTarget?.replaceChildren();
  if (restoreFocus) canvas?.focus({ preventScroll: true });
}

export function renderMap(cards) {
  if (!canvas) {
    return;
  }

  renderedCards = cards;
  const worldId = getActiveWorld().id;
  if (loadedWorldId !== worldId) { clearSelectedPin(); loadedWorldId = worldId; }
  const locationCards = cards.filter((card) => {
    const placeTypes = ["City", "Landmark", "Location", "Port", "Settlement", "Kingdom", "Ruins"];
    const normalizedType = String(card.type || "").toLowerCase();
    return (
      placeTypes.includes(card.type) ||
      normalizedType.includes("city") ||
      normalizedType.includes("landmark") ||
      normalizedType.includes("port") ||
      normalizedType.includes("location") ||
      normalizedType.includes("kingdom")
    );
  });

  const allPins = [...locationCards, ...customPins];
  updateSummary(allPins.length);
  updateCanvas(allPins);
  updateOverlay();

  const activeCard = allPins.find(pin => pin.id === selectedMarkerId);
  if (activeCard) { selectMarker(activeCard.id); renderMarkerDetails(activeCard); }
  else clearSelectedPin();
}

function createCustomPinFromControls() {
  const nameInput = document.querySelector("#map-new-pin-name");
  const typeInput = document.querySelector("#map-new-pin-type");
  const imageInput = document.querySelector("#map-new-pin-image");
  const name = nameInput?.value.trim();
  if (!name) { nameInput?.focus(); return; }

  const finish = (image = "") => {
    const pin = {
      id: `custom-pin-${crypto.randomUUID()}`,
      name,
      type: typeInput?.value || "Landmark",
      alias: "Custom map pin",
      description: "A custom location placed directly on the map.",
      image,
      relationships: [],
      isCustomPin: true
    };
    customPins.push(pin);
    const rect = canvas.getBoundingClientRect();
    markerPositions.set(pin.id, { top: `${Math.min(92, Math.max(8, 50 - panOffset.y / (zoomLevel / 100) / rect.height * 100))}%`, left: `${Math.min(92, Math.max(8, 50 - panOffset.x / (zoomLevel / 100) / rect.width * 100))}%` });
    persistCustomPins();
    persistMarkerPositions();
    nameInput.value = "";
    if (imageInput) imageInput.value = "";
    document.querySelector("#map-pin-image-label").textContent = "Choose Pin Icon";
    renderMap(renderedCards);
    selectMarker(pin.id);
    renderMarkerDetails(pin);
  };

  const file = imageInput?.files?.[0];
  if (!file?.type.startsWith("image/")) { finish(); return; }
  const reader = new FileReader();
  reader.addEventListener("load", () => finish(String(reader.result || "")));
  reader.readAsDataURL(file);
}

function persistCustomPins() {
  try { localStorage.setItem("codex-custom-map-pins", JSON.stringify(customPins)); } catch { /* session only */ }
}

function persistMarkerPositions() {
  try { localStorage.setItem("codex-map-marker-positions", JSON.stringify(Object.fromEntries(markerPositions))); } catch { /* session only */ }
}

function updateCanvas(locationCards) {
  cleanupMarkers();

  if (!locationCards.length) return;

  locationCards.forEach((card, index) => {
    const position = markerPositions.get(card.id) ?? getMarkerPosition(index, locationCards.length);
    const marker = createMarker(card, position);
    mapContentLayer.append(marker);
  });
}

function getMarkerPosition(index, total) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1);
  const x = 45 + Math.cos(angle) * 24;
  const y = 42 + Math.sin(angle) * 18;
  return {
    top: `${Math.min(Math.max(y, 10), 88)}%`,
    left: `${Math.min(Math.max(x, 8), 92)}%`
  };
}

function createMarker(card, position) {
  const marker = document.createElement("button");
  marker.type = "button";
  const normalizedType = String(card.type || "place").trim().toLowerCase().replace(/\s+/g, "-");
  marker.className = `map-marker map-marker-${normalizedType}`;
  marker.style.top = position.top;
  marker.style.left = position.left;
  marker.dataset.cardId = card.id;
  marker.setAttribute("aria-label", `Select ${card.name} pin`);
  marker.setAttribute("aria-pressed", String(card.id === selectedMarkerId));
  marker.classList.toggle("selected", card.id === selectedMarkerId);
  marker.dataset.defaultColor = markerTypeColors[card.type] ?? "#8ac2df";
  marker.style.setProperty("--marker-color", markerTypeColors[card.type] ?? "#8ac2df");
  applyPinStyle(marker, card.id);

  const visual = document.createElement("span");
  visual.className = "map-marker-visual";

  if (card.image) {
    const image = document.createElement("img");
    image.src = card.image;
    image.alt = "";
    image.draggable = false;
    image.addEventListener("error", () => {
      marker.classList.remove("has-image");
      visual.replaceChildren(createMarkerFallbackIcon());
    });
    visual.append(image);
    marker.classList.add("has-image");
  } else {
    visual.append(createMarkerFallbackIcon());
  }

  const content = document.createElement("span");
  content.className = "map-marker-content";
  const name = document.createElement("strong");
  name.textContent = card.name;
  const type = document.createElement("small");
  type.textContent = card.type || "Location";
  content.append(name, type);
  marker.append(visual, content);

  const dragState = {
    active: false,
    moved: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
  };

  marker.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.stopPropagation();
    dragState.active = true;
    dragState.moved = false;
    dragState.pointerId = event.pointerId;

    const rect = canvas.getBoundingClientRect();
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.startLeft = (parseFloat(marker.style.left) / 100) * rect.width;
    dragState.startTop = (parseFloat(marker.style.top) / 100) * rect.height;

    marker.setPointerCapture(event.pointerId);
    marker.classList.add("dragging");
  });

  marker.addEventListener("pointermove", (event) => {
    if (!dragState.active) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const dx = (event.clientX - dragState.startX) / scale;
    const dy = (event.clientY - dragState.startY) / scale;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 6) {
      dragState.moved = true;
    }

    const marginX = Math.min(marker.offsetWidth / 2 + 6, rect.width / 2);
    const marginY = Math.min(marker.offsetHeight / 2 + 6, rect.height / 2);
    const leftPx = Math.min(Math.max(dragState.startLeft + dx, marginX), rect.width - marginX);
    const topPx = Math.min(Math.max(dragState.startTop + dy, marginY), rect.height - marginY);
    const leftPercent = (leftPx / rect.width) * 100;
    const topPercent = (topPx / rect.height) * 100;

    marker.style.left = `${leftPercent.toFixed(2)}%`;
    marker.style.top = `${topPercent.toFixed(2)}%`;
    markerPositions.set(card.id, { top: `${topPercent.toFixed(2)}%`, left: `${leftPercent.toFixed(2)}%` });
    persistMarkerPositions();
  });

  marker.addEventListener("pointerup", (event) => {
    if (!dragState.active) {
      return;
    }

    dragState.active = false;
    marker.classList.remove("dragging");

    try {
      marker.releasePointerCapture(event.pointerId);
    } catch (error) {
      // ignore
    }
  });

  marker.addEventListener("pointercancel", () => {
    dragState.active = false;
    marker.classList.remove("dragging");
  });

  marker.addEventListener("click", (event) => {
    if (dragState.moved) {
      dragState.moved = false;
      return;
    }

    selectMarker(card.id);
    renderMarkerDetails(card);
  });

  currentMarkers.push(marker);
  return marker;
}

function createMarkerFallbackIcon() {
  const fallbackIcon = document.createElement("span");
  fallbackIcon.className = "map-marker-fallback-icon";
  fallbackIcon.setAttribute("aria-hidden", "true");
  return fallbackIcon;
}

function cleanupMarkers() {
  currentMarkers.forEach((marker) => marker.remove());
  currentMarkers = [];
}

function selectMarker(cardId) {
  if (selectedMarkerId !== cardId) {
    clearSelectedPin();
    document.querySelector(".map-inspector").scrollTop = 0;
  }
  selectedMarkerId = cardId;
  currentMarkers.forEach((marker) => {
    marker.classList.toggle("selected", marker.dataset.cardId === cardId);
    marker.setAttribute("aria-pressed", String(marker.dataset.cardId === cardId));
  });
  if (selectedPinPanel) selectedPinPanel.hidden = false;
  syncPinControls(cardId);
}

function renderMarkerDetails(card) {
  markerInfoTarget.replaceChildren();

  const heading = document.createElement("h3");
  heading.textContent = card.name;

  const subtitle = document.createElement("small");
  subtitle.textContent = `${card.type}${card.alias ? ` • ${card.alias}` : ""}`;

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "btn btn-secondary";
  openButton.textContent = "Open card";
  openButton.addEventListener("click", () => {
    if (typeof onMarkerSelect === "function") {
      onMarkerSelect(card.id);
    }
  });

  markerInfoTarget.append(heading, subtitle);
  if (!card.isCustomPin) markerInfoTarget.append(openButton);
  else {
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-secondary map-remove-pin";
    removeButton.textContent = "Remove pin";
    removeButton.addEventListener("click", () => {
      customPins = customPins.filter((pin) => pin.id !== card.id);
      markerPositions.delete(card.id);
      persistCustomPins();
      persistMarkerPositions();
      delete pinStyles[card.id];
      try { localStorage.setItem("codex-map-pin-styles", JSON.stringify(pinStyles)); } catch { /* session only */ }
      clearSelectedPin();
      renderMap(renderedCards);
    });
    markerInfoTarget.append(removeButton);
  }
}

function updateSummary(markerCount) {
  if (!summaryTarget) {
    return;
  }

  if (!markerCount) {
    summaryTarget.textContent = `No locations plotted yet. Add cards with place types to make the map come alive.`;
    return;
  }

  const visibleLayers = Array.from(activeLayers).map((layer) => layerDefinitions[layer]).join(", ") || "No overlays";
  summaryTarget.textContent = `${markerCount} ${markerCount === 1 ? "location" : "locations"} plotted · ${visibleLayers}.`;
}

function updateOverlay() {
  if (!mapOverlay) {
    return;
  }

  mapOverlay.replaceChildren();

  if (activeLayers.has("borders")) {
    const border = document.createElement("div");
    border.className = "map-border";
    mapOverlay.append(border);
  }

  if (activeLayers.has("routes")) {
    const route = document.createElement("div");
    route.className = "map-route";
    mapOverlay.append(route);
  }

  if (activeLayers.has("landmarks")) {
    const landmark = document.createElement("div");
    landmark.className = "map-route landmarks";
    mapOverlay.append(landmark);
  }
}

function switchLayer(layer) {
  if (!layer || !layerDefinitions[layer]) {
    return;
  }

  if (activeLayers.has(layer)) activeLayers.delete(layer);
  else activeLayers.add(layer);
  layerButtons.forEach((button) => {
    const active = activeLayers.has(button.dataset.mapLayer);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  updateSummary(currentMarkers.length);
  updateOverlay();
}

function startCanvasPan(event) {
  if (event.button !== 0 || event.target.closest(".map-marker, .map-zoom-controls")) {
    return;
  }

  event.preventDefault();
  isPanning = true;
  panMoved = false;
  panStart = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
  canvas.style.cursor = "grabbing";
}

function continueCanvasPan(event) {
  if (!isPanning) {
    return;
  }

  const dx = event.clientX - panStart.x;
  const dy = event.clientY - panStart.y;
  if (Math.hypot(dx, dy) > 4) panMoved = true;
  updateCanvasTransform({ x: panOffset.x + dx, y: panOffset.y + dy });
  event.preventDefault();
}

function endCanvasPan(event) {
  if (!isPanning) {
    return;
  }

  isPanning = false;
  panOffset.x += event.clientX - panStart.x;
  panOffset.y += event.clientY - panStart.y;
  updateCanvasTransform();
  canvas.style.cursor = "grab";

  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch (error) {
    // ignore if pointer capture is unavailable
  }
}

function updateCanvasTransform(previewOffset = panOffset) {
  if (!canvas) {
    return;
  }

  if (mapContentLayer) mapContentLayer.style.transform = `translate(${previewOffset.x}px, ${previewOffset.y}px) scale(${zoomLevel / 100})`;
  if (zoomOutput) zoomOutput.textContent = `${zoomLevel}%`;
}

function setZoom(value) {
  zoomLevel = Math.min(190, Math.max(70, value));
  updateCanvasTransform();
}

function fitMap() {
  zoomLevel = 100;
  panOffset = { x: 0, y: 0 };
  updateCanvasTransform();
}

function resetMapView() {
  panOffset.x = 0;
  panOffset.y = 0;
  zoomLevel = 100;
  markerPositions.clear();
  persistMarkerPositions();
  updateCanvasTransform();
  clearSelectedPin();
  renderMap(renderedCards);
}
