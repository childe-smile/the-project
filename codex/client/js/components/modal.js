const backdrop = document.querySelector("#modal-backdrop");
const form = document.querySelector("#card-form");
const title = document.querySelector("#modal-title");
const submitButton = document.querySelector("#card-submit-button");

const idInput = document.querySelector("#card-id");
const nameInput = document.querySelector("#card-name");
const typeInput = document.querySelector("#card-type");
const aliasInput = document.querySelector("#card-alias");
const iconInput = document.querySelector("#card-icon");
const imageInput = document.querySelector("#card-image");
const descriptionInput = document.querySelector("#card-description");
const textInput = document.querySelector("#card-text");

const portraitPicker = document.querySelector("#portrait-picker");
const portraitUpload = document.querySelector("#portrait-upload");
const portraitCustomSlot = document.querySelector("#portrait-custom-slot");
const portraitCustomImg = document.querySelector("#portrait-custom-img");
const portraitPickerGrid = document.querySelector("#portrait-picker-grid");
const portraitOptions = portraitPickerGrid.querySelectorAll(".portrait-option:not(.portrait-custom)");
const locationPicker = document.querySelector("#location-picker");
const locationPickerGrid = document.querySelector("#location-picker-grid");
const locationOptions = locationPickerGrid.querySelectorAll(".portrait-option");
const emblemOptions = document.querySelectorAll(".emblem-option");
const typeIconPicker = document.querySelector("#type-icon-picker");
const typeIconPickerGrid = document.querySelector("#type-icon-picker-grid");
const detailGrid = document.querySelector("#card-detail-grid");

const detailSchemas = {
  Character: [["Role", "e.g. Regent"], ["Origin", "Birthplace"], ["Age", "Years or era"], ["Affiliation", "Faction or court"]],
  Event: [["Date", "When it occurred"], ["Era", "Historical era"], ["Location", "Where it happened"], ["Outcome", "Lasting consequence"]],
  City: [["Region", "Kingdom or coast"], ["Population", "Approximate size"], ["Ruler", "Current authority"], ["Known for", "Trade, craft, or landmark"]],
  Location: [["Region", "Geographic region"], ["Terrain", "Coast, forest, ruins..."], ["Climate", "Weather and season"], ["Danger", "Primary threat"]],
  Kingdom: [["Capital", "Seat of power"], ["Ruler", "Current sovereign"], ["Government", "Political structure"], ["Motto", "Realm motto"]],
  Faction: [["Leader", "Current leader"], ["Headquarters", "Base of operations"], ["Goal", "Primary objective"], ["Reputation", "How others see them"]],
  Item: [["Owner", "Current bearer"], ["Origin", "Where it was made"], ["Material", "Primary materials"], ["Power", "Ability or purpose"]],
  Creature: [["Habitat", "Where it lives"], ["Temperament", "Behavior"], ["Diet", "What it consumes"], ["Weakness", "Known vulnerability"]],
  Magic: [["Source", "Origin of power"], ["Cost", "Price of use"], ["Practitioners", "Who can wield it"], ["Limit", "Primary restriction"]],
  Religion: [["Deity", "God or sacred force"], ["Followers", "Faithful groups"], ["Sacred place", "Temple or pilgrimage"], ["Core belief", "Central doctrine"]],
  Legend: [["Origin era", "When the tale began"], ["Key figure", "Hero or subject"], ["Region", "Where it is told"], ["Truth status", "Myth, disputed, confirmed"]],
  "Magic System": [["Source", "Where power comes from"], ["Rules", "Core governing principle"], ["Cost", "Consequence of use"], ["Schools", "Known branches"]],
  Organization: [["Leader", "Current leader"], ["Headquarters", "Primary base"], ["Purpose", "Reason for existing"], ["Reach", "Local, regional, global"]]
};

const typeIconSets = {
  Character: [
    ["Profile", "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0"],
    ["Helm", "M5 18V9a7 7 0 0 1 14 0v9M5 12h14M9 12v7m6-7v7M3 19h18"],
    ["Blade", "m14 4 6-2-2 6-9 9-3-3 9-9ZM5 15l4 4m-6 2 4-4"],
    ["Hood", "M6 19c-1-6 0-13 6-16 6 3 7 10 6 16M8 13c1 4 7 4 8 0M5 21h14"]
  ],
  City: [
    ["Tower", "M7 21V8l2-3 3 3 3-3 2 3v13M7 11h10M11 21v-5h2v5"],
    ["Gate", "M4 21V9l4-4 4 4 4-4 4 4v12M8 21v-6a4 4 0 0 1 8 0v6"],
    ["Houses", "M3 21V11l5-4 5 4v10M13 21V8l4-3 4 3v13M6 14h4m6-3h2"],
    ["Harbor", "M3 18c3-2 6 2 9 0s6 2 9 0M12 4v12m0-10 6 5h-6M7 20h10"]
  ],
  Location: [
    ["Pin", "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"],
    ["Peak", "M3 20 10 7l3 5 2-3 6 11H3Zm5-4 2-3 2 3"],
    ["Grove", "M12 3 6 12h4l-5 6h6v3h2v-3h6l-5-6h4L12 3Z"],
    ["Compass", "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm3 6-2 5-5 2 2-5 5-2Z"]
  ],
  Kingdom: [
    ["Crown", "m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Zm2 12h14"],
    ["Banner", "M6 21V4m1 1h11l-3 4 3 4H7"],
    ["Castle", "M4 21V8h4V4h3v4h3V4h3v4h3v13M9 21v-5a3 3 0 0 1 6 0v5"],
    ["Shield", "M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Zm0 4v10"]
  ],
  Creature: [
    ["Dragon", "M4 18c3-8 2-11 8-14 1 4 5 2 8 6-3 1-3 4-2 6-5 4-10 5-14 2Zm5-3 3-2"],
    ["Paw", "M8 13c-5 3-2 8 4 7 6 1 9-4 4-7-3-3-5-3-8 0ZM6 9a2 3 0 1 0 0-6 2 3 0 0 0 0 6Zm6-2a2 3 0 1 0 0-6 2 3 0 0 0 0 6Zm6 2a2 3 0 1 0 0-6 2 3 0 0 0 0 6Z"],
    ["Horns", "M5 4c0 5 2 8 7 9 5-1 7-4 7-9M8 10c-2 5 0 10 4 11 4-1 6-6 4-11"],
    ["Eye", "M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"]
  ],
  Magic: [
    ["Star", "m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"],
    ["Flame", "M12 21c-5 0-8-4-6-9 1 3 3 3 4 1-2-5 2-8 4-10 0 4 5 6 4 11 2-2 3-4 3-6 4 5 2 13-5 13Z"],
    ["Crystal", "m12 3 6 5-2 11H8L6 8l6-5Zm-6 5h12M8 19l4-11 4 11"],
    ["Orbit", "M12 12a4 4 0 1 0 0 .01M4 8c3-5 13-5 16 0s-3 10-8 12M20 16c-3 5-13 5-16 0S7 6 12 4"]
  ],
  Organization: [
    ["Network", "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10 8l-4 7m8-7 4 7M8 18h8"],
    ["Seal", "M12 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm-3 13-1 5 4-2 4 2-1-5"],
    ["Scales", "M12 4v17M5 7h14M7 7l-4 7h8L7 7Zm10 0-4 7h8l-4-7ZM8 21h8"],
    ["Alliance", "M4 13 9 8l3 3 3-3 5 5M3 14l5 5 4-4 4 4 5-5"]
  ]
};

typeIconSets.Event = typeIconSets.Magic;
typeIconSets.Faction = typeIconSets.Organization;
typeIconSets.Item = typeIconSets.Kingdom;
typeIconSets.Religion = typeIconSets.Magic;
typeIconSets.Legend = typeIconSets.Location;
typeIconSets["Magic System"] = typeIconSets.Magic;

let submitHandler = null;
let customPortraitDataUrl = null; // holds base64 of uploaded image

/* ------------------------------------------------------------------ */
/*  Portrait selection helpers                                          */
/* ------------------------------------------------------------------ */
function getAllPortraitOptions() {
  return portraitPickerGrid.querySelectorAll(".portrait-option");
}

function clearPortraitSelection() {
  getAllPortraitOptions().forEach((b) => b.classList.remove("selected"));
}

function clearLocationSelection() {
  locationOptions.forEach((b) => b.classList.remove("selected"));
}

function clearEmblemSelection() {
  emblemOptions.forEach((b) => b.classList.remove("selected"));
}

function clearTypeIconSelection() {
  typeIconPickerGrid.querySelectorAll(".type-icon-option").forEach((b) => b.classList.remove("selected"));
}

function createTypeIconDataUrl(path, accent) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#182426"/><rect x="2" y="2" width="60" height="60" rx="13" fill="none" stroke="#887a61"/><path d="${path}" transform="translate(8 8) scale(2)" fill="none" stroke="${accent}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function renderTypeIconOptions(type, selectedValue = imageInput.value) {
  const options = typeIconSets[type] || typeIconSets.Location;
  const accents = ["#9eb8c5", "#c7b58e", "#6f9895", "#98616a"];
  typeIconPickerGrid.replaceChildren();
  options.forEach(([label, path], index) => {
    const value = createTypeIconDataUrl(path, accents[index]);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "portrait-option type-icon-option";
    button.dataset.typeIcon = value;
    button.innerHTML = `<img alt="" draggable="false"><span></span>`;
    button.querySelector("img").src = value;
    button.querySelector("span").textContent = label;
    button.classList.toggle("selected", value === selectedValue);
    button.addEventListener("click", () => {
      clearPortraitSelection();
      clearLocationSelection();
      clearEmblemSelection();
      clearTypeIconSelection();
      button.classList.add("selected");
      imageInput.value = value;
    });
    typeIconPickerGrid.append(button);
  });
}

function renderDetailFields(type, properties = []) {
  const values = new Map(properties.map((property) => [property.name, property.value]));
  const schema = detailSchemas[type] || detailSchemas.Location;
  detailGrid.replaceChildren();
  schema.forEach(([name, placeholder]) => {
    const label = document.createElement("label");
    label.className = "form-field card-detail-field";
    const caption = document.createElement("span");
    caption.textContent = name;
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 120;
    input.placeholder = placeholder;
    input.dataset.detailName = name;
    input.value = values.get(name) || "";
    label.append(caption, input);
    detailGrid.append(label);
  });
}

function selectPortrait(btn) {
  clearPortraitSelection();
  clearLocationSelection();
  clearEmblemSelection();
  clearTypeIconSelection();
  btn.classList.add("selected");
  imageInput.value = btn.dataset.portrait;
}

function selectLocationImage(btn) {
  clearPortraitSelection();
  clearLocationSelection();
  clearEmblemSelection();
  clearTypeIconSelection();
  btn.classList.add("selected");
  imageInput.value = btn.dataset.locationImage;
}

function selectEmblem(btn) {
  clearPortraitSelection();
  clearLocationSelection();
  clearEmblemSelection();
  clearTypeIconSelection();
  btn.classList.add("selected");
  imageInput.value = btn.dataset.emblem;
}

/* Sync gold ring to whichever option matches the current imageInput value */
function syncSelectionToValue(val) {
  clearPortraitSelection();
  clearLocationSelection();
  clearEmblemSelection();
  clearTypeIconSelection();
  getAllPortraitOptions().forEach((btn) => {
    if (btn.dataset.portrait === val) btn.classList.add("selected");
  });
  locationOptions.forEach((btn) => {
    if (btn.dataset.locationImage === val) btn.classList.add("selected");
  });
  emblemOptions.forEach((btn) => {
    if (btn.dataset.emblem === val) btn.classList.add("selected");
  });
  typeIconPickerGrid.querySelectorAll(".type-icon-option").forEach((btn) => {
    if (btn.dataset.typeIcon === val) btn.classList.add("selected");
  });
}

/* ------------------------------------------------------------------ */
/*  Upload handler (FileReader → base64 data URL)                      */
/* ------------------------------------------------------------------ */
function handleImageFile(file) {
  if (!file || !file.type.startsWith("image/")) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    customPortraitDataUrl = dataUrl;

    // Show custom slot with the uploaded image
    portraitCustomImg.src = dataUrl;
    portraitCustomSlot.dataset.portrait = dataUrl;
    portraitCustomSlot.hidden = false;

    // Auto-select the custom slot
    selectPortrait(portraitCustomSlot);
  };
  reader.readAsDataURL(file);
}

/* File input change */
portraitUpload.addEventListener("change", (e) => {
  handleImageFile(e.target.files[0]);
  // reset so the same file can be re-selected
  e.target.value = "";
});

/* Drag-and-drop onto the picker */
portraitPickerGrid.addEventListener("dragover", (e) => {
  e.preventDefault();
  portraitPickerGrid.classList.add("drag-over");
});
portraitPickerGrid.addEventListener("dragleave", () => {
  portraitPickerGrid.classList.remove("drag-over");
});
portraitPickerGrid.addEventListener("drop", (e) => {
  e.preventDefault();
  portraitPickerGrid.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  handleImageFile(file);
});

/* Built-in portrait clicks */
portraitOptions.forEach((btn) => {
  btn.addEventListener("click", () => selectPortrait(btn));
});

locationOptions.forEach((btn) => {
  btn.addEventListener("click", () => selectLocationImage(btn));
});

emblemOptions.forEach((btn) => {
  btn.addEventListener("click", () => selectEmblem(btn));
});

/* Keep picker in sync if user somehow edits the hidden URL field */
imageInput.addEventListener("input", () => {
  syncSelectionToValue(imageInput.value.trim());
});

/* ------------------------------------------------------------------ */
/*  Show/hide picker based on card type                                */
/* ------------------------------------------------------------------ */
function syncPickerVisibility() {
  const isCharacter = typeInput.value === "Character";
  const isLocation = ["City", "Location", "Kingdom"].includes(typeInput.value);
  portraitPicker.hidden = !isCharacter;
  locationPicker.hidden = !isLocation;
  typeIconPicker.hidden = isCharacter;

  if (!isCharacter) {
    clearPortraitSelection();
  }
  if (!isLocation) {
    clearLocationSelection();
  }
}

typeInput.addEventListener("change", () => {
  syncPickerVisibility();
  renderTypeIconOptions(typeInput.value);
  renderDetailFields(typeInput.value);
  if (typeInput.value === "Character") {
    selectPortrait(portraitOptions[0]);
  }
  if (["City", "Location", "Kingdom"].includes(typeInput.value)) {
    selectLocationImage(locationOptions[0]);
  }
  if (!["Character", "City", "Location", "Kingdom"].includes(typeInput.value)) {
    typeIconPickerGrid.querySelector(".type-icon-option")?.click();
  }
});

/* ------------------------------------------------------------------ */
/*  Modal open / close                                                  */
/* ------------------------------------------------------------------ */
export function openCardModal({
  card = null,
  onSubmit,
  heading = null,
  submitLabel = null,
  defaultType = null
}) {
  submitHandler = onSubmit;
  form.reset();
  if (!card && defaultType) typeInput.value = defaultType;
  clearPortraitSelection();
  clearLocationSelection();
  clearEmblemSelection();
  renderTypeIconOptions(typeInput.value);

  // Reset custom slot
  customPortraitDataUrl = null;
  portraitCustomSlot.hidden = true;
  portraitCustomImg.src = "";
  portraitCustomSlot.dataset.portrait = "";

  if (card) {
    title.textContent = heading || "Edit card";
    submitButton.textContent = submitLabel || "Save changes";

    idInput.value = card.id;
    nameInput.value = card.name;
    typeInput.value = card.type;
    aliasInput.value = card.alias ?? "";
    iconInput.value = card.icon ?? "✦";
    imageInput.value = card.image ?? "";
    descriptionInput.value = card.description;
    textInput.value = card.text ?? "";

    // If editing a character with a custom (base64) image, restore the custom slot
    if (card.type === "Character" && card.image) {
      const isBuiltIn = card.image.startsWith("assets/images/characters/");
      if (!isBuiltIn && card.image.startsWith("data:image/")) {
        portraitCustomImg.src = card.image;
        portraitCustomSlot.dataset.portrait = card.image;
        portraitCustomSlot.hidden = false;
        customPortraitDataUrl = card.image;
      }
      syncSelectionToValue(card.image);
    }
    if (["City", "Location", "Kingdom"].includes(card.type) && card.image) {
      syncSelectionToValue(card.image);
    }
    if (card.image?.startsWith("assets/images/emblems/")) {
      syncSelectionToValue(card.image);
    }
  } else {
    title.textContent = heading || "New card";
    submitButton.textContent = submitLabel || "Save Card";
    idInput.value = "";
  }

  syncPickerVisibility();
  renderTypeIconOptions(typeInput.value, imageInput.value);
  renderDetailFields(typeInput.value, card?.properties || []);

  // Auto-select first portrait for fresh Character cards
  if (!card && typeInput.value === "Character" && !imageInput.value) {
    selectPortrait(portraitOptions[0]);
  }
  if (!card && ["City", "Location", "Kingdom"].includes(typeInput.value) && !imageInput.value) {
    selectLocationImage(locationOptions[0]);
  }
  if (!card && !imageInput.value) {
    typeIconPickerGrid.querySelector(".type-icon-option")?.click();
  }

  backdrop.hidden = false;
  nameInput.focus();
}

export function closeCardModal() {
  backdrop.hidden = true;
  submitHandler = null;
}

/* ------------------------------------------------------------------ */
/*  Form submit                                                         */
/* ------------------------------------------------------------------ */
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = {
    id: idInput.value || null,
    name: nameInput.value.trim(),
    type: typeInput.value,
    alias: aliasInput.value.trim(),
    icon: iconInput.value,
    image: imageInput.value.trim(),
    description: descriptionInput.value.trim(),
    text: textInput.value.trim()
  };
  data.details = Array.from(detailGrid.querySelectorAll("[data-detail-name]"))
    .map((input) => ({ name: input.dataset.detailName, value: input.value.trim() }))
    .filter((detail) => detail.value);

  if (!data.name || !data.description) return;

  submitHandler?.(data);
  closeCardModal();
});

/* ------------------------------------------------------------------ */
/*  Close buttons & backdrop                                            */
/* ------------------------------------------------------------------ */
document
  .querySelector("#modal-close")
  .addEventListener("click", closeCardModal);

document
  .querySelector("#cancel-card-button")
  .addEventListener("click", closeCardModal);

backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeCardModal();
});
