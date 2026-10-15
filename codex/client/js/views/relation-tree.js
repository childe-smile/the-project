import { emptyWorldPreview } from "../data/seed.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const typeColors = {
  Character: "#c7b58e",
  City: "#6f9895",
  Location: "#9eb8c5",
  Kingdom: "#98616a",
  Creature: "#71866c",
  Magic: "#8494b5",
  Organization: "#a47f5b"
};


const typeIconPaths = {
  Character: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0",
  City: "M3 21V9l5-3v15M8 11l6-4v14m0-10 7-3v13M5 13h1m4 1h1m5-1h2M5 17h1m4 1h1m5-1h2",
  Location: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0ZM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  Kingdom: "m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Zm2 12h14",
  Creature: "M5 18c2-6 1-10 7-13 1 4 5 2 7 5-2 1-2 3-1 5-4 4-9 5-13 3Zm3-3 3-2m4-4h.01",
  Magic: "m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z",
  Organization: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10 8l-4 7m8-7 4 7M8 18h8"
};

export function renderRelationTree(
  svg,
  cards,
  rootCardId,
  onNodeClick
) {
  svg.replaceChildren();

  const rootCard = cards.find(
    (card) => card.id === rootCardId
  );

  if (!rootCard) {
    renderEmptyTree(svg);
    return;
  }

  const cardByName = new Map(
    cards.map((card) => [card.name, card])
  );

  const tree = buildTree(rootCard, cardByName);
  const positionedNodes = positionTree(tree);

  const depthCount = Math.max(...positionedNodes.map((node) => node.depth), 0) + 1;
  svg.setAttribute("viewBox", `0 0 1000 ${Math.max(420, depthCount * 135)}`);

  renderEdges(svg, positionedNodes);
  renderNodes(svg, positionedNodes, onNodeClick);
}

function buildTree(rootCard, cardByName) {
  const visited = new Set();

  function visit(card, depth = 0) {
    if (!card || visited.has(card.id) || depth > 3) {
      return null;
    }

    visited.add(card.id);

    const children = card.relationships
      .map((relationship) => {
        const relatedCard = cardByName.get(
          relationship.target
        );

        if (!relatedCard) {
          return null;
        }

        const child = visit(relatedCard, depth + 1);

        if (!child) {
          return null;
        }

        return {
          ...child,
          relationshipKind: relationship.kind
        };
      })
      .filter(Boolean);

    return {
      card,
      children
    };
  }

  return visit(rootCard);
}

function positionTree(tree) {
  if (!tree) {
    return [];
  }

  const levels = [];

  function collect(node, depth = 0) {
    levels[depth] ??= [];
    levels[depth].push(node);

    node.children.forEach((child) => {
      collect(child, depth + 1);
    });
  }

  collect(tree);

  const positionedNodes = [];

  levels.forEach((nodes, depth) => {
    const horizontalGap = 900 / (nodes.length + 1);

    nodes.forEach((node, index) => {
      positionedNodes.push({
        ...node,
        x: horizontalGap * (index + 1) + 50,
        y: 64 + depth * 128,
        depth
      });
    });
  });

  return positionedNodes;
}

function renderEdges(svg, positionedNodes) {
  const nodeById = new Map(
    positionedNodes.map((node) => [
      node.card.id,
      node
    ])
  );

  positionedNodes.forEach((parent) => {
    parent.children.forEach((child) => {
      const childPosition = nodeById.get(child.card.id);

      if (!childPosition) {
        return;
      }

      const line = createSvgElement("path", {
        class: "tree-edge",
        d: `M ${parent.x} ${parent.y + 32} C ${parent.x} ${parent.y + 74}, ${childPosition.x} ${childPosition.y - 74}, ${childPosition.x} ${childPosition.y - 32}`
      });

      svg.append(line);

      if (child.relationshipKind) {
        const labelX = (parent.x + childPosition.x) / 2;
        const labelY = (parent.y + childPosition.y) / 2 - 2;
        const labelBackground = createSvgElement("rect", {
          class: "tree-edge-label-bg",
          x: labelX - 42,
          y: labelY - 11,
          width: 84,
          height: 20,
          rx: 10
        });
        const label = createSvgElement("text", {
          class: "tree-edge-label",
          x: labelX,
          y: labelY + 3,
          "text-anchor": "middle"
        });

        label.textContent = truncate(child.relationshipKind, 14);
        svg.append(labelBackground, label);
      }
    });
  });
}

function renderNodes(
  svg,
  positionedNodes,
  onNodeClick
) {
  positionedNodes.forEach((node) => {
    const group = createSvgElement("g", {
      class: `tree-node${node.depth === 0 ? " tree-node-root" : ""}`,
      "data-card-id": node.card.id,
      tabindex: "0",
      role: "button"
    });

    const rectangle = createSvgElement("rect", {
      x: node.x - 96,
      y: node.y - 32,
      width: 192,
      height: 64,
      rx: 16,
      fill:
        node.depth === 0
          ? "var(--surface-3)"
          : "var(--surface-2)",
      stroke:
        node.depth === 0
          ? "var(--gold)"
          : "var(--line)"
    });

    const icon = createSvgElement("g", {
      class: "tree-node-icon",
      transform: `translate(${node.x - 81} ${node.y - 12}) scale(.92)`,
      "pointer-events": "none"
    });
    const iconPath = createSvgElement("path", {
      d: typeIconPaths[node.card.type] || typeIconPaths.Location,
      fill: "none",
      stroke: typeColors[node.card.type] || typeColors.Location,
      "stroke-width": "1.75",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    });
    icon.append(iconPath);

    const label = createSvgElement("text", {
      class: "tree-node-title",
      x: node.x - 48,
      y: node.y - 3
    });

    label.textContent = truncate(node.card.name, 20);

    const type = createSvgElement("text", {
      class: "tree-node-type",
      x: node.x - 48,
      y: node.y + 16
    });
    type.textContent = node.card.type || "Card";

    group.append(rectangle, icon, label, type);

    group.addEventListener("click", () => {
      onNodeClick?.(node.card.id);
    });

    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        onNodeClick?.(node.card.id);
      }
    });

    svg.append(group);
  });
}

function renderEmptyTree(svg) {
  svg.setAttribute("viewBox", "0 0 900 380");

  const text = createSvgElement("text", {
    x: 450,
    y: 170,
    "text-anchor": "middle",
    class: "graph-node-label",
    "font-size": "15"
  });
  text.textContent = "No root card selected";

  const hint = createSvgElement("text", {
    x: 450,
    y: 200,
    "text-anchor": "middle",
    class: "graph-node-label",
    "font-size": "12",
    fill: "var(--muted)"
  });
  hint.textContent = emptyWorldPreview.treeHint;

  svg.append(text, hint);
}

function createSvgElement(tagName, attributes) {
  const element = document.createElementNS(
    SVG_NAMESPACE,
    tagName
  );

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });

  return element;
}

function truncate(value, maximumLength) {
  if (value.length <= maximumLength) {
    return value;
  }

  return `${value.slice(0, maximumLength - 1)}…`;
}
