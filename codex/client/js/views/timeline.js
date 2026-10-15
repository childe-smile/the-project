import { emptyWorldPreview } from "../data/seed.js";

export function renderTimeline(container, events, handlers = {}) {
  container.replaceChildren();

  const toolbar = document.createElement("div");
  toolbar.className = "timeline-toolbar";
  toolbar.innerHTML = `<div><strong>Chronology</strong><span>Edit entries directly, then click Done.</span></div>`;
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "btn btn-gold";
  addButton.textContent = "+ Add event";
  addButton.addEventListener("click", () => handlers.onAdd?.());
  toolbar.append(addButton);
  container.append(toolbar);

  if (!events.length) {
    renderEmptyTimeline(container, handlers);
    return;
  }

  const track = document.createElement("div");
  track.className = "timeline-track";

  const eventsByEra = groupEventsByEra(events);

  eventsByEra.forEach((eraEvents, eraName) => {
    const eraHeading = document.createElement("h2");
    eraHeading.className = "timeline-era";
    eraHeading.textContent = eraName;

    track.append(eraHeading);

    eraEvents.forEach((event) => {
      track.append(createTimelineEvent(event, false, handlers));
    });
  });

  container.append(track);
}

function renderEmptyTimeline(container, handlers) {
  const panel = document.createElement("div");
  panel.className = "empty-panel";

  const heading = document.createElement("h2");
  heading.className = "empty-panel-title serif";
  heading.textContent = "No timeline events yet";

  const copy = document.createElement("p");
  copy.className = "empty-panel-copy";
  copy.textContent =
    "Chronicle your world's history here. The default world includes sample eras—create cards and add your own milestones.";

  panel.append(heading, copy);

  const track = document.createElement("div");
  track.className = "timeline-track timeline-track-preview";

  emptyWorldPreview.timeline.forEach((event) => {
    track.append(createTimelineEvent({ ...event, id: "preview" }, true, handlers));
  });

  container.append(panel, track);
}

function groupEventsByEra(events) {
  const groupedEvents = new Map();

  events.forEach((event) => {
    const eraName = event.era || "Uncategorized";

    if (!groupedEvents.has(eraName)) {
      groupedEvents.set(eraName, []);
    }

    groupedEvents.get(eraName).push(event);
  });

  return groupedEvents;
}

function createTimelineEvent(event, isPreview = false, handlers = {}) {
  const article = document.createElement("article");
  article.className = `timeline-event${isPreview ? " timeline-event-preview" : ""}`;
  article.dataset.eventId = event.id;

  const date = document.createElement("div");
  date.className = "timeline-date";
  date.textContent = event.date;

  const era = document.createElement("div");
  era.className = "timeline-event-era";
  era.textContent = event.era || "Uncategorized";

  const title = document.createElement("h3");
  title.className = "timeline-title";
  title.textContent = event.title;

  const description = document.createElement("p");
  description.className = "timeline-description";
  description.textContent = event.description;

  article.append(era, date, title, description);

  if (!isPreview) {
    const actions = document.createElement("div");
    actions.className = "timeline-event-actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Edit";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "timeline-delete";
    deleteButton.textContent = "Delete";
    actions.append(editButton, deleteButton);
    article.append(actions);

    editButton.addEventListener("click", () => {
      const editing = article.classList.toggle("is-editing");
      [era, date, title, description].forEach((field) => {
        field.contentEditable = String(editing);
      });
      if (editing) {
        editButton.textContent = "Done";
        title.focus();
      } else {
        editButton.textContent = "Edit";
        handlers.onUpdate?.(event.id, {
          era: era.textContent.trim() || "Uncategorized",
          date: date.textContent.trim(),
          title: title.textContent.trim() || "Untitled event",
          description: description.textContent.trim()
        });
      }
    });

    deleteButton.addEventListener("click", () => handlers.onDelete?.(event.id));
  }

  return article;
}
