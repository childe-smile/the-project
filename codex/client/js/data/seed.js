/* Fixed IDs keep relationships stable on first load. */
const ID = {
  valduna: "f1a10001-0001-4000-8000-000000000001",
  blackport: "f1a10001-0001-4000-8000-000000000002",
  thornhaven: "f1a10001-0001-4000-8000-000000000003",
  kingdom: "f1a10001-0001-4000-8000-000000000004",
  iren: "f1a10001-0001-4000-8000-000000000005",
  maelis: "f1a10001-0001-4000-8000-000000000006",
  council: "f1a10001-0001-4000-8000-000000000007",
  guild: "f1a10001-0001-4000-8000-000000000008",
  flame: "f1a10001-0001-4000-8000-000000000009",
  tideRelic: "f1a10001-0001-4000-8000-00000000000a",
  ashWyrm: "f1a10001-0001-4000-8000-00000000000b",
  tideCovenant: "f1a10001-0001-4000-8000-00000000000c",
  lyra: "f1a10001-0001-4000-8000-00000000000d",
  kaelen: "f1a10001-0001-4000-8000-00000000000e"
};

const now = "2026-01-15T10:00:00.000Z";

export const seedCards = [
  {
    id: ID.valduna,
    type: "City",
    name: "Valduna",
    alias: "the City of Salt Stairs",
    icon: "⚓",
    description: "Capital of the kingdom and seat of the Flame Council, built in terraced rings above the harbor.",
    properties: [
      { id: "p1", name: "Population", value: "41,200" },
      { id: "p2", name: "Language", value: "Old Valdan" },
      { id: "p3", name: "Climate", value: "Mild, salt-wind" }
    ],
    relationships: [
      { id: "r1", target: "Kingdom of Valduna", kind: "capital of" },
      { id: "r2", target: "The Flame Council", kind: "seat of" },
      { id: "r3", target: "Iren Vasth", kind: "home to" }
    ],
    text: "Valduna was born from the union of three rival clans after the Siege of Ithir. Its famous Salt Stairs—three hundred carved steps from harbor to palace—are washed nightly by tide and torchlight.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.blackport,
    type: "City",
    name: "Blackport",
    alias: "the Drowned Gate",
    icon: "🌊",
    description: "A ruined port city, half-swallowed by the western sea since the War of Tides.",
    properties: [
      { id: "p4", name: "Status", value: "Ruined" },
      { id: "p5", name: "Fallen", value: "Year 152" }
    ],
    relationships: [
      { id: "r4", target: "Kingdom of Valduna", kind: "former territory" },
      { id: "r5", target: "Iren Vasth", kind: "birthplace of" },
      { id: "r6", target: "The Tide Covenant", kind: "claimed by" }
    ],
    text: "Blackport's black basalt walls still rise from the surf at low tide. Pilgrims leave salt-candles on the outer breakwater, though none dare moor after dark.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.thornhaven,
    type: "City",
    name: "Thornhaven",
    alias: "Market of the Inner Road",
    icon: "🏰",
    description: "A fortified trade city on the amber plains, known for grain, mercenaries, and quiet espionage.",
    properties: [
      { id: "p6", name: "Population", value: "18,600" },
      { id: "p7", name: "Trade", value: "Grain, iron, salt" }
    ],
    relationships: [
      { id: "r7", target: "Kingdom of Valduna", kind: "vassal city of" },
      { id: "r8", target: "Salt Merchants Guild", kind: "headquarters of" },
      { id: "r9", target: "Captain Maelis Dreth", kind: "garrisoned by" }
    ],
    text: "Thornhaven's walls are hung with hawthorn wreaths each spring—a custom older than the kingdom itself. Beneath the market square runs a smugglers' gallery the council pretends not to know about.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.kingdom,
    type: "Kingdom",
    name: "Kingdom of Valduna",
    alias: "the Salt Crown Realms",
    icon: "👑",
    description: "A coastal realm bound by flame-law, merchant treaties, and the memory of civil war.",
    properties: [
      { id: "p8", name: "Ruler", value: "Regent Lyra Halden" },
      { id: "p9", name: "Founded", value: "Year 12" }
    ],
    relationships: [
      { id: "r10", target: "Valduna", kind: "ruled from" },
      { id: "r11", target: "The Flame Council", kind: "governed by" },
      { id: "r12", target: "Blackport", kind: "lost" }
    ],
    text: "The Salt Crown Realms stretch from Thornhaven's amber fields to the western cliffs. Their motto—'By flame, by tide, by law'—is carved above every courthouse door.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.iren,
    type: "Character",
    name: "Iren Vasth",
    alias: "the Tide Archmage",
    icon: "🔮",
    image: "assets/images/characters/character-3.jpg",
    description: "Archmage of Valduna, born in Blackport before its fall. Advisor to the Flame Council.",
    properties: [
      { id: "p10", name: "Class", value: "Archmage" },
      { id: "p11", name: "Age", value: "47" },
      { id: "p12", name: "Affiliation", value: "Flame Council" }
    ],
    relationships: [
      { id: "r13", target: "Valduna", kind: "resides in" },
      { id: "r14", target: "The Regulated Flame", kind: "practices" },
      { id: "r15", target: "Blackport", kind: "born in" },
      { id: "r16", target: "The Tide Relic", kind: "seeks" }
    ],
    text: "Known for her calculated coolness, Iren avoids speaking about her family who vanished when Blackport fell. She keeps a tide-glass in her tower that clouds before political unrest.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.maelis,
    type: "Character",
    name: "Captain Maelis Dreth",
    alias: "the Thorn Captain",
    icon: "⚔",
    image: "assets/images/characters/character-1.jpg",
    description: "Mercenary captain stationed at Thornhaven, rumored to hold maps of submerged Blackport districts.",
    properties: [
      { id: "p13", name: "Class", value: "Fighter" },
      { id: "p14", name: "Company", value: "Grey Hawthorn Band" }
    ],
    relationships: [
      { id: "r17", target: "Thornhaven", kind: "stationed at" },
      { id: "r18", target: "Salt Merchants Guild", kind: "contracted by" },
      { id: "r19", target: "Blackport", kind: "salvages from" }
    ],
    text: "Maelis lost an eye to an Ash Wyrm ember-strike during a harbor raid. She drinks only well water and distrusts anyone who speaks kindly of the Flame Council.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.lyra,
    type: "Character",
    name: "Regent Lyra Halden",
    alias: "the Gilded Sovereign",
    icon: "👑",
    image: "assets/images/characters/character-4.jpg",
    description: "Sole regent of the Salt Crown Realms, sworn protector of the kingdom's hearth and charter.",
    properties: [
      { id: "p26", name: "Title", value: "High Regent" },
      { id: "p27", name: "Domain", value: "Salt Crown Realms" }
    ],
    relationships: [
      { id: "r34", target: "Kingdom of Valduna", kind: "rules" },
      { id: "r35", target: "Valduna", kind: "seat at" },
      { id: "r36", target: "The Flame Council", kind: "oversees" }
    ],
    text: "Ascended to regency following the War of Tides, Lyra is celebrated for forging fragile truces between the Salt Merchants Guild and the Flame Council.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.kaelen,
    type: "Character",
    name: "Kaelen the Silent",
    alias: "Vanguard of the Amber Plains",
    icon: "🛡️",
    image: "assets/images/characters/character-2.jpg",
    description: "An enigmatic construct sentinel patrolling the borders of Thornhaven, bonded to ancient woodcraft.",
    properties: [
      { id: "p28", name: "Origin", value: "Elder Sylvan Grove" },
      { id: "p29", name: "Rank", value: "Vanguard Sentinel" }
    ],
    relationships: [
      { id: "r37", target: "Thornhaven", kind: "guards" },
      { id: "r38", target: "Captain Maelis Dreth", kind: "allied with" }
    ],
    text: "Constructed during the First Age of Craftsmen from petrified heartwood and amber core, Kaelen speaks seldom but remembers centuries of forgotten realm lore.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.council,
    type: "Organization",
    name: "The Flame Council",
    alias: "Keepers of the Regulated Flame",
    icon: "🔥",
    description: "The governing conclave that licenses, limits, and records all flame-magic in the kingdom.",
    properties: [
      { id: "p15", name: "Members", value: "Seven archmages" },
      { id: "p16", name: "Founded", value: "Year 28" }
    ],
    relationships: [
      { id: "r20", target: "Valduna", kind: "based in" },
      { id: "r21", target: "The Regulated Flame", kind: "controls" },
      { id: "r22", target: "Iren Vasth", kind: "advised by" }
    ],
    text: "The Council's chambers lie beneath Valduna's palace, warded by sigils that glow amber when unlicensed magic is cast within ten leagues.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.guild,
    type: "Organization",
    name: "Salt Merchants Guild",
    alias: "the White Ledger",
    icon: "📜",
    description: "A powerful trade consortium controlling salt routes between Thornhaven and the coastal cities.",
    properties: [
      { id: "p17", name: "Headquarters", value: "Thornhaven" },
      { id: "p18", name: "Influence", value: "High" }
    ],
    relationships: [
      { id: "r23", target: "Thornhaven", kind: "operates from" },
      { id: "r24", target: "Captain Maelis Dreth", kind: "employs" },
      { id: "r25", target: "Kingdom of Valduna", kind: "taxed by" }
    ],
    text: "The Guild's white ledgers are said to record debts owed in both coin and favors. Three regents in the last century rose from guild sponsorship.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.flame,
    type: "Magic",
    name: "The Regulated Flame",
    alias: "Amber Sigil Fire",
    icon: "✦",
    description: "The kingdom's sanctioned magical tradition—structured, catalogued, and taxed by the Flame Council.",
    properties: [
      { id: "p19", name: "School", value: "Evocation / Warding" },
      { id: "p20", name: "License required", value: "Yes" }
    ],
    relationships: [
      { id: "r26", target: "The Flame Council", kind: "regulated by" },
      { id: "r27", target: "Iren Vasth", kind: "mastered by" },
      { id: "r28", target: "The Tide Relic", kind: "opposed by" }
    ],
    text: "Practitioners inscribe amber sigils that burn without smoke. Unlicensed flame is punishable by exile to the ash flats—a sentence few survive.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.tideRelic,
    type: "Magic",
    name: "The Tide Relic",
    alias: "Heart of Blackport",
    icon: "💧",
    description: "A drowned artifact rumored to control sea currents and undo flame-wards.",
    properties: [
      { id: "p21", name: "Location", value: "Unknown (Blackport depths)" },
      { id: "p22", name: "Power", value: "Tidal manipulation" }
    ],
    relationships: [
      { id: "r29", target: "Blackport", kind: "hidden beneath" },
      { id: "r30", target: "The Tide Covenant", kind: "sought by" },
      { id: "r31", target: "Iren Vasth", kind: "studied by" }
    ],
    text: "Fishers near Blackport speak of a blue glow beneath the breakwater on moonless nights. The Council denies the relic exists; Iren's research suggests otherwise.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.ashWyrm,
    type: "Creature",
    name: "Ash Wyrm",
    alias: "Ember-Skein Serpent",
    icon: "🐉",
    description: "A rare serpentine creature born from uncontrolled flame-magic runoff in the ash flats.",
    properties: [
      { id: "p23", name: "Habitat", value: "Ash flats, volcanic vents" },
      { id: "p24", name: "Threat", value: "High" }
    ],
    relationships: [
      { id: "r32", target: "The Regulated Flame", kind: "spawned by" },
      { id: "r33", target: "Captain Maelis Dreth", kind: "scarred" }
    ],
    text: "Ash Wyrms leave trails of smoldering glass in their wake. Mercenary companies charge triple rates to escort caravans through wyrm country.",
    createdAt: now,
    updatedAt: now
  },
  {
    id: ID.tideCovenant,
    type: "Organization",
    name: "The Tide Covenant",
    alias: "Drowned Faith",
    icon: "🌀",
    description: "A secretive cult venerating the sea's reclaiming power, active in the ruins of Blackport.",
    properties: [
      { id: "p25", name: "Visibility", value: "Covert" },
      { id: "p26", name: "Symbol", value: "Spiral shell" }
    ],
    relationships: [
      { id: "r34", target: "Blackport", kind: "worships at" },
      { id: "r35", target: "The Tide Relic", kind: "seeks" },
      { id: "r36", target: "The Flame Council", kind: "opposes" }
    ],
    text: "Covenant members mark doorways with salt spirals. The Council classifies them as seditionists, though no public trial has ever been held.",
    createdAt: now,
    updatedAt: now
  }
];

export const seedTimeline = [
  {
    id: "t1",
    era: "Age of Foundation",
    date: "Year 12",
    title: "Founding of Valduna",
    description: "The valley's three clans unite beneath a single banner after the Siege of Ithir."
  },
  {
    id: "t2",
    era: "Age of Foundation",
    date: "Year 28",
    title: "The Flame Council Convenes",
    description: "Seven archmages establish the Regulated Flame, ending the era of wild pyromancy."
  },
  {
    id: "t3",
    era: "Age of Fracture",
    date: "Year 152",
    title: "Fall of Blackport",
    description: "A seaborne invasion and tidal surge swallow the western harbor. The War of Tides begins."
  },
  {
    id: "t4",
    era: "Age of Fracture",
    date: "Year 158",
    title: "Treaty of Thornhaven",
    description: "The Salt Merchants Guild brokers peace with coastal raiders, cementing Thornhaven's influence."
  },
  {
    id: "t5",
    era: "Age of Ashes",
    date: "Year 201",
    title: "First Ash Wyrm Sighting",
    description: "Caravan guards report serpent tracks near the ash flats—evidence of unlicensed magic's toll."
  },
  {
    id: "t6",
    era: "Age of Ashes",
    date: "Year 214",
    title: "Iren Vasth Appointed Tide Archmage",
    description: "The Council elevates a Blackport survivor to regulate maritime magic and investigate the Tide Relic."
  }
];

export const seedQuillDrafts = [
  {
    id: "q1",
    title: "Prologue — Salt and Ember",
    content: "<p>The harbor bells of Valduna rang twice that morning: once for the tide, once for the council's decree. Iren Vasth stood at the highest stair and watched the smoke from Thornhaven's grain fires drift inland like a warning.</p><p><em>\"By flame, by tide, by law,\"</em> she whispered—the kingdom's motto, and lately, its curse.</p>",
    updatedAt: now
  },
  {
    id: "q2",
    title: "Scene — The Drowned Gate",
    content: "<p>Blackport did not look ruined so much as <strong>paused</strong>. Barnacles gripped the archways. A market sign still swung from one chain. Captain Dreth pointed her torch at a stair descending into black water.</p><p>\"The maps stop here,\" she said. \"Your relic's down there, Archmage. And something else besides.\"</p>",
    updatedAt: now
  },
  {
    id: "q3",
    title: "Character notes — Iren Vasth",
    content: "<p><strong>Motivation:</strong> Prevent another Blackport; uncover the truth without handing power to the Covenant.</p><p><strong>Contradiction:</strong> Serves the Council she privately distrusts.</p><p><strong>Visual:</strong> Tide-glass pendant, ink-stained cuffs, never wears red.</p>",
    updatedAt: now
  }
];

export const seedCanvasNotes = [
  { id: "c1", tag: "Idea", title: "Iren's choice", body: "Reveal Tide Relic in Act II — she must choose Council or Covenant.", color: "blue", top: 86, left: 13, rotate: -2 },
  { id: "c2", tag: "Plot", title: "War of Tides", body: "Flashback chapter: Blackport's fall from three POVs.", color: "dark", top: 250, left: 41, rotate: 2 },
  { id: "c3", tag: "Journey", title: "Thornhaven arc", body: "Maelis betrays guild for maps — leads party to ash flats.", color: "light", top: 110, left: 68, rotate: -1 },
  { id: "c4", tag: "Lore", title: "Ash Wyrms", body: "Unlicensed flame runoff → ecological consequence. Tie to magic system.", color: "blue", top: 340, left: 22, rotate: 1 }
];

/** Placeholder lore shown when a world has no user content yet. */
export const emptyWorldPreview = {
  cards: [
    { type: "Character", name: "Example Hero", description: "Create your first character card to begin building your cast." },
    { type: "City", name: "Example City", description: "Anchor your geography with locations and kingdoms." }
  ],
  timeline: [
    { era: "Your Era", date: "Day 1", title: "The story begins", description: "Add cards and events to populate your world's chronology." }
  ],
  graphHint: "Cards and their relationships will appear here as a connected web.",
  treeHint: "Pick a root card below to visualize how your world connects.",
  mapHint: "Location cards (cities, landmarks, ports) appear as draggable markers on the map.",
  canvasNotes: [
    { tag: "Tip", title: "Start brainstorming", body: "Drag notes around the board to plan arcs, scenes, and connections.", color: "blue", top: 100, left: 20, rotate: -2 },
    { tag: "Tip", title: "Link to cards", body: "Create cards in Workspace, then reference them in your notes.", color: "dark", top: 240, left: 45, rotate: 1 }
  ]
};

export function getTimelineForWorld(worldId) {
  return worldId === "valduna" ? seedTimeline : [];
}

export function getQuillDraftsForWorld(worldId) {
  return worldId === "valduna" ? seedQuillDrafts : [];
}

export function getCanvasNotesForWorld(worldId) {
  return worldId === "valduna" ? seedCanvasNotes : emptyWorldPreview.canvasNotes;
}
