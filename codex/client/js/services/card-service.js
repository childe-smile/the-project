import {
  loadFromStorage,
  saveToStorage
} from "./storage.js";

import { seedCards } from "../data/seed.js";
import { getActiveWorld } from "./world-service.js";

const LEGACY_STORAGE_KEY = "cards";

let cards = [];
let loadedWorldId = null;

function getStorageKey(worldId) {
  return `cards:${worldId}`;
}

function loadCardsForActiveWorld() {
  const world = getActiveWorld();

  if (loadedWorldId === world.id) return;

  const fallbackCards = world.id === "valduna"
    ? loadFromStorage(LEGACY_STORAGE_KEY, seedCards)
    : [];

  const storedCards = loadFromStorage(getStorageKey(world.id), fallbackCards);

  if (world.id === "valduna") {
    const seedMap = new Map(seedCards.map((c) => [c.name, c]));
    storedCards.forEach((c) => {
      const seed = seedMap.get(c.name);
      if (seed && seed.image && (!c.image || c.image.startsWith("http"))) {
        c.image = seed.image;
      }
      if (seed && seed.icon && !c.icon) {
        c.icon = seed.icon;
      }
    });

    seedCards.forEach((seed) => {
      if (!storedCards.some((c) => c.name === seed.name || c.id === seed.id)) {
        storedCards.push(seed);
      }
    });

    cards = storedCards;
    saveToStorage(getStorageKey(world.id), cards);
  } else {
    cards = storedCards;
  }
  loadedWorldId = world.id;
}

function persist() {
  loadCardsForActiveWorld();
  saveToStorage(getStorageKey(loadedWorldId), cards);
}

export function getCards() {
  loadCardsForActiveWorld();
  return structuredClone(cards);
}

export function getCardById(cardId) {
  loadCardsForActiveWorld();
  const card = cards.find((item) => item.id === cardId);
  return card ? structuredClone(card) : null;
}

export function searchCards({
  query = "",
  type = "All"
} = {}) {
  loadCardsForActiveWorld();
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");

  return cards.filter((card) => {
    const matchesType =
      type === "All" || card.type === type;

    const searchableContent = [
      card.name,
      card.alias,
      card.description,
      card.text,
      ...card.properties.flatMap((property) => [
        property.name,
        property.value
      ]),
      ...card.relationships.flatMap((relationship) => [
        relationship.target,
        relationship.kind
      ])
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR");

    const matchesQuery =
      !normalizedQuery ||
      searchableContent.includes(normalizedQuery);

    return matchesType && matchesQuery;
  });
}

export function createCard(cardData) {
  loadCardsForActiveWorld();
  const timestamp = new Date().toISOString();
  
  let image = cardData.image?.trim() || "";
  if (!image && cardData.type === "Character") {
    const charPortraits = [
      "assets/images/characters/character-1.jpg",
      "assets/images/characters/character-2.jpg",
      "assets/images/characters/character-3.jpg",
      "assets/images/characters/character-4.jpg"
    ];
    const charCount = cards.filter((c) => c.type === "Character").length;
    image = charPortraits[charCount % charPortraits.length];
  }

  const newCard = {
    id: crypto.randomUUID(),
    type: cardData.type,
    name: cardData.name.trim(),
    alias: cardData.alias?.trim() || "",
    icon: cardData.icon?.trim() || (cardData.type === "Character" ? "👤" : "✦"),
    image,
    description: cardData.description.trim(),
    properties: cardData.properties ?? [],
    relationships: cardData.relationships ?? [],
    text: cardData.text?.trim() || "",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  cards.unshift(newCard);
  persist();

  return structuredClone(newCard);
}

export function updateCard(cardId, changes) {
  loadCardsForActiveWorld();
  const cardIndex = cards.findIndex(
    (card) => card.id === cardId
  );

  if (cardIndex === -1) {
    throw new Error("Card not found.");
  }

  cards[cardIndex] = {
    ...cards[cardIndex],
    ...changes,
    id: cardId,
    updatedAt: new Date().toISOString()
  };

  persist();

  return structuredClone(cards[cardIndex]);
}

export function deleteCard(cardId) {
  loadCardsForActiveWorld();
  const existingLength = cards.length;

  cards = cards.filter((card) => card.id !== cardId);

  if (cards.length === existingLength) {
    return false;
  }

  persist();
  return true;
}
