import {
  getCards,
  getCardById,
  searchCards,
  createCard,
  updateCard,
  deleteCard
} from "../services/card-service.js";

import {
  renderCards,
  renderFilters
} from "../components/cards.js";

import {
  renderWikiEntries
} from "../components/wiki.js";

import {
  initializeQuillEditor,
  renderQuillEditor,
  getQuillDrafts,
  resetQuillForWorld
} from "../components/quill.js";

import { init as initCardsPage } from "../pages/cards.js";
import { init as initGraphPage } from "../pages/graph.js";
import { init as initMapsPage } from "../pages/maps.js";
import { init as initQuillPage } from "../pages/quill.js";
import { init as initWikiPage } from "../pages/wiki.js";
import { init as initTimelinePage } from "../pages/timeline.js";
import { init as initTreesPage } from "../pages/trees.js";
import { init as initCanvasPage, renderCanvas, resetCanvasForWorld } from "../pages/canvas.js";

import {
  openDrawer,
  closeDrawer,
  getSelectedCardId,
  setRelationshipClickHandler
} from "../components/drawer.js";

import {
  openCardModal
} from "../components/modal.js";

import {
  initializeNavigation
} from "../components/navigation.js";

import { initializeQuickActions } from "../components/quick-actions.js";
import { initializeCustomSelects } from "../components/custom-select.js";
import { initializeRadio } from "../components/radio.js";
import { countCardMentions } from "../services/card-mentions.js";
import { openWikiEntryModal } from "../components/wiki-entry-modal.js";
import { showToast } from "./notifications.js";
import { createAppState } from "./state.js";
import { initializeTheme, initializeThemeToggle } from "./theme.js";

import {
  initializeSearch
} from "../components/search.js";

import {
  renderGraph
} from "../views/graph.js";

import {
  renderTimeline
} from "../views/timeline.js";

import {
  renderRelationTree
} from "../views/relation-tree.js";

import {
  initializeMapView,
  renderMap as renderMapView
} from "../views/maps.js";

import {
  getTimeline,
  addTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent
} from "../services/timeline-service.js";

import { getWorldDescription } from "../data/default-worlds.js";

import {
  createWorld,
  getActiveWorld,
  getWorlds,
  setActiveWorld
} from "../services/world-service.js";

import {
  initializeWorldControls,
  renderWorlds
} from "../components/worlds.js";

const elements = {
  grid: document.querySelector("#card-grid"),
  filters: document.querySelector("#filter-row"),
  search: document.querySelector("#search-input"),
  emptyState: document.querySelector("#empty-state"),
  cardsCount: document.querySelector("#cards-count"),

  graph: document.querySelector("#graph-svg"),
  tree: document.querySelector("#tree-svg"),
  timeline: document.querySelector(
    "#timeline-container"
  ),
  cardsSummary: document.querySelector("#cards-summary"),
  worldOverviewButton: document.querySelector("#world-overview-button"),
  worldOverviewName: document.querySelector("#world-overview-title"),
  worldOverviewCardCount: document.querySelector("#world-overview-card-count"),
  worldOverviewRelationshipCount: document.querySelector("#world-overview-relationship-count"),
  worldOverviewTypeCount: document.querySelector("#world-overview-type-count"),
  worldOverviewNewWiki: document.querySelector("#world-overview-new-wiki"),
  worldOverviewLinks: document.querySelectorAll("[data-world-destination]"),
  worldDescription: document.querySelector("#world-description"),
  sortSelect: document.querySelector("#cards-sort"),
  treeRootSelect: document.querySelector("#tree-root-select"),
  treeEmptyHint: document.querySelector("#tree-empty-hint"),

  newCardButton: document.querySelector(
    "#new-card-button"
  ),

  wikiEntriesGrid: document.querySelector("#wiki-entry-grid"),
  wikiEmptyState: document.querySelector("#wiki-empty"),
  createWikiEntryButton: document.querySelector("#create-wiki-entry-button"),

  editCardButton: document.querySelector(
    "#edit-card-button"
  ),

  deleteCardButton: document.querySelector(
    "#delete-card-button"
  ),

  mapCanvas: document.querySelector(".map-canvas-visual"),
  mapLayers: document.querySelectorAll(".map-layer"),
  mapTemplates: document.querySelectorAll(".map-template"),
  mapSummary: document.querySelector("#map-summary"),
  mapMarkerInfo: document.querySelector("#map-marker-info")
};

const state = createAppState();

initializeTheme();
initializeThemeToggle();
initializeRadio();

function sortCards(cards) {
  const sorted = [...cards];

  if (state.sortBy === "name") {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.sortBy === "type") {
    sorted.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
  } else {
    sorted.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    );
  }

  return sorted;
}

function renderWorkspaceCards(allCards) {
  const visibleCards = sortCards(searchCards({ query: state.query, type: state.activeType }));
  renderFilters(elements.filters, allCards, state.activeType, handleFilterChange);
  renderCards(elements.grid, visibleCards, handleOpenCard, countCardMentions(allCards, getQuillDrafts()));
  elements.emptyState.hidden = visibleCards.length !== 0;
  elements.emptyState.innerHTML = visibleCards.length ? "" : buildEmptyCardsMessage(allCards.length, state.query, state.activeType);
  updateCardsSummary(visibleCards.length, allCards.length);
}

function refreshApplication() {
  const activeWorld = getActiveWorld();
  renderWorlds(getWorlds(), activeWorld);
  const allCards = sortCards(getCards());

  elements.worldOverviewName.textContent = activeWorld.name;
  document.querySelector("#world-slogan").textContent = activeWorld.slogan || "Your world, connected.";

  if (elements.worldDescription) {
    elements.worldDescription.textContent =
      activeWorld.description || getWorldDescription(activeWorld.id);
  }

  document.title = `${activeWorld.name} — Codex`;
  elements.worldOverviewCardCount.textContent = String(allCards.length);
  elements.worldOverviewRelationshipCount.textContent = String(
    allCards.reduce(
      (sum, card) => sum + (card.relationships?.length || 0),
      0
    )
  );
  elements.worldOverviewTypeCount.textContent = String(
    new Set(allCards.map((card) => card.type).filter(Boolean)).size
  );

  if (
    !state.selectedTreeRootId ||
    !allCards.some(
      (card) => card.id === state.selectedTreeRootId
    )
  ) {
    state.selectedTreeRootId = allCards[0]?.id ?? null;
  }

  renderWorkspaceCards(allCards);

  renderGraph(
    elements.graph,
    allCards,
    handleOpenCard
  );

  renderTimeline(
    elements.timeline,
    getTimeline(activeWorld.id),
    getTimelineHandlers()
  );

  renderRelationTree(
    elements.tree,
    allCards,
    state.selectedTreeRootId,
    handleOpenCard
  );

  renderTreeControls(allCards);
  renderMapView(allCards);
  renderCanvas();

  renderWiki(
    allCards,
    handleOpenCard
  );

  renderWorldOverviewStats(allCards);

  elements.cardsCount.textContent =
    String(allCards.length);

}

function renderWiki(cards, onOpen) {
  const visibleCards = cards.filter((card) => card.type);

  renderWikiEntries(
    elements.wikiEntriesGrid,
    visibleCards,
    onOpen
  );

  elements.wikiEmptyState.hidden = visibleCards.length !== 0;

  if (!visibleCards.length) {
    elements.wikiEmptyState.innerHTML =
      "No wiki entries yet. <strong>Ashes of Valduna</strong> ships with sample lore—or create a card to publish your own.";
  }
}

function renderWorldOverviewStats(allCards) {
  elements.worldOverviewCardCount.textContent = String(allCards.length);
  elements.worldOverviewRelationshipCount.textContent = String(allCards.reduce((total, card) => total + (card.relationships?.length || 0), 0));
  elements.worldOverviewTypeCount.textContent = String(new Set(allCards.map(card => card.type).filter(Boolean)).size);
}

function getTimelineHandlers() {
  return {
    onAdd: () => {
      addTimelineEvent(getActiveWorld().id, {
        era: "New era",
        date: "Undated",
        title: "New event",
        description: "Click Edit to add the details of this moment."
      });
      refreshApplication();
    },
    onUpdate: (eventId, changes) => {
      updateTimelineEvent(getActiveWorld().id, eventId, changes);
      refreshApplication();
    },
    onDelete: (eventId) => {
      deleteTimelineEvent(getActiveWorld().id, eventId);
      refreshApplication();
    }
  };
}


function updateCardsSummary(visible, total) {
  if (!elements.cardsSummary) {
    return;
  }

  elements.cardsSummary.textContent =
    `Showing ${visible} of ${total} cards`;
}

function resetWorldView() {
  state.query = "";
  state.activeType = "All";
  state.selectedTreeRootId = null;
  state.sortBy = "updated";
  elements.search.value = "";
  if (elements.sortSelect) {
    elements.sortSelect.value = "updated";
  }
  closeDrawer();
  resetQuillForWorld();
  resetCanvasForWorld();
}

function handleCreateWorld(name) {
  const world = createWorld(name);
  resetWorldView();
  refreshApplication();
  openWorldOverview();
  showToast(`World "${world.name}" created.`, "success");
}

function handleSelectWorld(worldId) {
  if (!setActiveWorld(worldId)) return;
  resetWorldView();
  refreshApplication();
  openWorldOverview();
}

function handleFilterChange(type) {
  state.activeType = type;
  refreshApplication();
}

function handleOpenCard(cardId) {
  const card = getCardById(cardId);

  if (!card) {
    return;
  }

  state.selectedTreeRootId = card.id;

  openDrawer(card);

  if (elements.treeRootSelect) {
    elements.treeRootSelect.value = card.id;
  }

  if (state.activeView === "trees") {
    renderRelationTree(
      elements.tree,
      getCards(),
      card.id,
      handleOpenCard
    );
  }
}

function handleOpenCardByName(name) {
  const card = getCards().find(
    (item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase()
  );

  if (card) {
    handleOpenCard(card.id);
  }
}

function buildEmptyCardsMessage(total, query, activeType) {
  if (total === 0) {
    return `<strong>Your workspace is empty.</strong> Create a card to begin building ${getActiveWorld().name}, or explore the sample world "Ashes of Valduna" for inspiration.`;
  }

  if (query) {
    return `No cards match "<strong>${query}</strong>". Try a different search term or clear filters.`;
  }

  if (activeType !== "All") {
    return `No <strong>${activeType}</strong> cards found. Create one or switch the type filter.`;
  }

  return "No cards found.";
}

function renderTreeControls(cards) {
  if (!elements.treeRootSelect) {
    return;
  }

  elements.treeRootSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = cards.length
    ? "Choose a root card…"
    : "No cards yet";
  elements.treeRootSelect.append(placeholder);

  cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.id;
    option.textContent = `${card.name} (${card.type})`;
    option.selected = card.id === state.selectedTreeRootId;
    elements.treeRootSelect.append(option);
  });

  if (elements.treeEmptyHint) {
    elements.treeEmptyHint.hidden = Boolean(state.selectedTreeRootId && cards.length);
  }
}


function changeView(viewName) {
  const navigationItem = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (navigationItem) { navigationItem.click(); return; }
  state.activeView = viewName;
  document.querySelectorAll(".nav-item[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });
  window.dispatchEvent(new CustomEvent("codex:view-change", { detail: { view: viewName } }));
}

function openWorldOverview() {
  changeView("world");
  closeDrawer();
}

function mergeStructuredDetails(existingProperties = [], details = []) {
  const detailNames = new Set(details.map((detail) => detail.name));
  const retained = existingProperties.filter((property) => !detailNames.has(property.name));
  const structured = details.map((detail) => {
    const existing = existingProperties.find((property) => property.name === detail.name);
    return { ...existing, id: existing?.id || crypto.randomUUID(), ...detail };
  });
  return [...retained, ...structured];
}

function handleCreateCard(formData) {
  createCard({
    ...formData,
    properties: formData.details || [],
    relationships: []
  });

  refreshApplication();
  showToast("Card created successfully.", "success");
}

function handleCreateWikiEntry(entryData) {
  createCard(entryData);
  refreshApplication();
  showToast("Wiki entry published.", "success");
}

function handleUpdateCard(formData) {
  const existingCard = getCardById(formData.id);

  if (!existingCard) {
    showToast("The card could not be found.", "error");
    return;
  }

  updateCard(formData.id, {
    type: formData.type,
    name: formData.name,
    alias: formData.alias,
    icon: formData.icon,
    image: formData.image,
    description: formData.description,
    text: formData.text,
    properties: mergeStructuredDetails(existingCard.properties, formData.details || []),
    relationships: existingCard.relationships
  });

  closeDrawer();
  refreshApplication();

  showToast("Card updated.", "success");
}

function handleDeleteCard() {
  const selectedCardId = getSelectedCardId();

  if (!selectedCardId) {
    return;
  }

  const card = getCardById(selectedCardId);

  if (!card) {
    return;
  }

  const confirmed = window.confirm(
    `Permanently delete the card "${card.name}"?`
  );

  if (!confirmed) {
    return;
  }

  deleteCard(selectedCardId);

  closeDrawer();
  refreshApplication();

  showToast("Card deleted.", "success");
}

initializeSearch({
  input: elements.search,

  onSearch(query) {
    state.query = query;
    refreshApplication();
    if (query.trim() && state.activeView === "world") changeView("cards");
  }
});

initializeWorldControls({
  onCreate: handleCreateWorld,
  onSelect: handleSelectWorld
});

initializeNavigation({
  onViewChange(viewName) {
    state.activeView = viewName;

    const cards = getCards();

    if (viewName === "cards") {
      renderWorkspaceCards(sortCards(cards));
    }

    if (viewName === "graph") {
      renderGraph(
        elements.graph,
        cards,
        handleOpenCard
      );
    }

    if (viewName === "trees") {
      renderRelationTree(
        elements.tree,
        cards,
        state.selectedTreeRootId,
        handleOpenCard
      );
    }

    if (viewName === "timeline") {
      renderTimeline(
        elements.timeline,
        getTimeline(getActiveWorld().id),
        getTimelineHandlers()
      );
    }

    if (viewName === "quill") {
      renderQuillEditor();
    }

    if (viewName === "canvas") {
      renderCanvas();
    }

    if (viewName === "maps") {
      renderMapView(cards);
    }
  }
});

initializeQuickActions();
initializeCustomSelects();

initializeMapView({
  canvas: elements.mapCanvas,
  layerButtons: elements.mapLayers,
  templateButtons: elements.mapTemplates,
  summaryTarget: elements.mapSummary,
  markerInfoTarget: elements.mapMarkerInfo,
  resetButton: document.querySelector(".map-reset-button"),
  onMarkerSelect: handleOpenCard
});

initializeQuillEditor();
setRelationshipClickHandler(handleOpenCardByName);

elements.sortSelect?.addEventListener("change", (event) => {
  state.sortBy = event.target.value;
  refreshApplication();
});

elements.treeRootSelect?.addEventListener("change", (event) => {
  state.selectedTreeRootId = event.target.value || null;
  renderRelationTree(
    elements.tree,
    getCards(),
    state.selectedTreeRootId,
    handleOpenCard
  );

  if (elements.treeEmptyHint) {
    elements.treeEmptyHint.hidden = Boolean(state.selectedTreeRootId);
  }
});

// Initialize page modules (lightweight wrappers)
initCardsPage({ elements, handlers: { handleOpenCard } });
initGraphPage({ elements, handlers: { handleOpenCard } });
initMapsPage({ elements, handlers: { handleOpenCard } });
initQuillPage({ elements, handlers: { /* reserved */ } });
initWikiPage({ elements, handlers: { handleOpenCard } });
initTimelinePage({ elements, handlers: { /* reserved */ } });
initTreesPage({ elements, handlers: { handleOpenCard } });
initCanvasPage({ elements, handlers: { /* reserved */ } });

// Sanity: ensure drawer/overlay are hidden on startup (prevents stuck overlays)
const _overlay = document.querySelector("#overlay");
const _drawer = document.querySelector("#drawer");
if (_overlay) {
  _overlay.classList.remove("show");
}
if (_drawer) {
  _drawer.classList.remove("show");
  _drawer.setAttribute("aria-hidden", "true");
}

elements.worldOverviewButton.addEventListener("click", openWorldOverview);
elements.worldOverviewNewWiki.addEventListener("click", () => {
  openWikiEntryModal({ onSubmit: handleCreateWikiEntry });
});
document.querySelector("#manage-card-types").addEventListener("click", () => {
  state.query = "";
  state.activeType = "All";
  elements.search.value = "";
  refreshApplication();
  changeView("cards");
  const filters = document.querySelector("#filter-row");
  filters.scrollIntoView({ block: "center" });
  filters.querySelector("button")?.focus({ preventScroll: true });
});
elements.worldOverviewLinks.forEach((link) => {
  link.addEventListener("click", () => changeView(link.dataset.worldDestination));
});

elements.newCardButton.addEventListener(
  "click",
  () => {
    openCardModal({
      onSubmit: handleCreateCard
    });
  }
);

elements.createWikiEntryButton.addEventListener("click", () => {
  openWikiEntryModal({ onSubmit: handleCreateWikiEntry });
});

elements.editCardButton.addEventListener(
  "click",
  () => {
    const selectedCardId = getSelectedCardId();

    if (!selectedCardId) {
      return;
    }

    const card = getCardById(selectedCardId);

    if (!card) {
      return;
    }

    openCardModal({
      card,
      onSubmit: handleUpdateCard
    });
  }
);

elements.deleteCardButton.addEventListener(
  "click",
  handleDeleteCard
);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer();
  }
});

refreshApplication();
