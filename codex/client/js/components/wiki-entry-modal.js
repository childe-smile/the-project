const backdrop = document.querySelector("#wiki-entry-modal-backdrop");
const form = document.querySelector("#wiki-entry-form");
const titleInput = document.querySelector("#wiki-entry-title");
const sectionInput = document.querySelector("#wiki-entry-section");
const labelInput = document.querySelector("#wiki-entry-label");
const summaryInput = document.querySelector("#wiki-entry-summary");
const articleInput = document.querySelector("#wiki-entry-article");
const sourcesInput = document.querySelector("#wiki-entry-sources");
const coverInput = document.querySelector("#wiki-entry-cover");

const sectionTypes = {
  Chronicle: "Legend",
  Place: "Location",
  Person: "Character",
  Faction: "Faction",
  Artifact: "Item",
  Belief: "Religion"
};

let submitHandler = null;
let coverDataUrl = "";

export function openWikiEntryModal({ onSubmit } = {}) {
  submitHandler = onSubmit;
  coverDataUrl = "";
  form.reset();
  backdrop.hidden = false;
  titleInput.focus();
}

export function closeWikiEntryModal() {
  backdrop.hidden = true;
  submitHandler = null;
}

coverInput.addEventListener("change", () => {
  const file = coverInput.files?.[0];
  if (!file?.type.startsWith("image/")) {
    coverDataUrl = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => { coverDataUrl = String(reader.result || ""); });
  reader.readAsDataURL(file);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitHandler?.({
    name: titleInput.value.trim(),
    type: sectionTypes[sectionInput.value] || "Legend",
    alias: labelInput.value.trim() || sectionInput.options[sectionInput.selectedIndex].textContent,
    description: summaryInput.value.trim(),
    text: articleInput.value.trim(),
    image: coverDataUrl,
    properties: [
      { id: crypto.randomUUID(), name: "Archive section", value: sectionInput.options[sectionInput.selectedIndex].textContent },
      ...(sourcesInput.value.trim() ? [{ id: crypto.randomUUID(), name: "Source notes", value: sourcesInput.value.trim() }] : [])
    ],
    relationships: []
  });
  closeWikiEntryModal();
});

document.querySelector("#wiki-entry-modal-close")?.addEventListener("click", closeWikiEntryModal);
document.querySelector("#wiki-entry-cancel")?.addEventListener("click", closeWikiEntryModal);
backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeWikiEntryModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !backdrop.hidden) closeWikiEntryModal(); });
