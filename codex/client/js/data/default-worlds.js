export const defaultWorlds = [
  {
    id: "valduna",
    name: "Ashes of Valduna",
    description:
      "A fractured kingdom where salt-stained cities cling to cliffside harbors, ancient flame-magic is tightly regulated, and the tides still whisper of Blackport's fall."
  }
];

export function getWorldDescription(worldId) {
  const world = defaultWorlds.find((item) => item.id === worldId);
  return world?.description ?? "A world of stories, characters, places, and histories—ready for you to shape.";
}
