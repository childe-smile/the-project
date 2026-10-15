import { emptyWorldPreview } from "../data/seed.js";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const typeColors = {
  Character: "#a98f61",
  Event: "#7899b7",
  City: "#527f82",
  Location: "#718d9e",
  Kingdom: "#75444e",
  Faction: "#8a6d8f",
  Item: "#ad9369",
  Creature: "#536b50",
  Magic: "#6f7f9f",
  Religion: "#9b8db1",
  Legend: "#6f91aa",
  "Magic System": "#7186b5",
  Organization: "#876548"
};


const graphPanState = {
  viewBoxX: 0,
  viewBoxY: 0,
  width: 900,
  height: 480,
  isDragging: false,
  startX: 0,
  startY: 0,
  startViewBoxX: 0,
  startViewBoxY: 0
};

const typeIconPaths = {
  Character: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  City: "M3 21V9l5-3v15M8 11l6-4v14m0-10 7-3v13M5 13h1m4 1h1m5-1h2M5 17h1m4 1h1m5-1h2",
  Kingdom: "m3 7 4 4 5-7 5 7 4-4-2 12H5L3 7Zm2 12h14",
  Creature: "M5 18c2-6 1-10 7-13 1 4 5 2 7 5-2 1-2 3-1 5-4 4-9 5-13 3Zm3-3 3-2m4-4h.01",
  Magic: "m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z",
  Organization: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM10.5 7.7l-4 7.5m7-7.5 4 7.5M8 18h8",
  Location: "M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-8 2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
};

const graphNodePositions = new Map();
let graphMotionFrame = null;
let graphMotionPausedUntil = 0;

export function renderGraph(svg, cards, onNodeClick) {
  svg.replaceChildren();

  if (!cards.length) {
    renderEmptyGraph(svg);
    return;
  }

  svg.setAttribute("viewBox", `${graphPanState.viewBoxX} ${graphPanState.viewBoxY} ${graphPanState.width} ${graphPanState.height}`);
  svg.style.touchAction = "none";
  svg.classList.add("graph-pan-enabled");

  if (!svg.dataset.graphPanInitialized) {
    svg.addEventListener("pointerdown", startGraphPan);
    svg.addEventListener("pointermove", continueGraphPan);
    svg.addEventListener("pointerup", endGraphPan);
    svg.addEventListener("pointerleave", endGraphPan);
    svg.addEventListener("lostpointercapture", endGraphPan);
    svg.addEventListener("wheel", zoomGraph, { passive: false });
    svg.addEventListener("dblclick", resetGraphView);
    svg.dataset.graphPanInitialized = "true";
  }

  const centerX = 450;
  const centerY = 220;
  const radiusX = 300;
  const radiusY = 160;

  const nodes = cards.map((card, index) => {
    const angle = (Math.PI * 2 * index) / cards.length - Math.PI / 2;
    const defaultPosition = {
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY
    };
    const savedPosition = graphNodePositions.get(card.id) || defaultPosition;

    return {
      card,
      x: savedPosition.x,
      y: savedPosition.y,
      renderX: savedPosition.x,
      renderY: savedPosition.y,
      ambientX: 0,
      ambientY: 0,
      angle
    };
  });

  const nodeByName = new Map(nodes.map((node) => [node.card.name, node]));

  svg.append(createDefs());

  const edgeGroups = cards.flatMap((card) => {
    const source = nodeByName.get(card.name);

    return card.relationships.map((relationship) => {
      const target = nodeByName.get(relationship.target);
      if (!target) {
        return null;
      }

      const path = createSvgElement("path", {
        d: createCurvePath(source, target),
        class: "graph-edge",
        markerEnd: "url(#graph-arrow)"
      });

      path.dataset.source = source.card.id;
      path.dataset.target = target.card.id;
      return path;
    }).filter(Boolean);
  });

  edgeGroups.forEach((edge) => svg.append(edge));

  nodes.forEach((node) => {
    const { card, x, y } = node;
    const group = createSvgElement("g", {
      class: "graph-node",
      "data-card-id": card.id
    });

    const nodeSize = 52;
    const nodeRadius = 13;
    const nodeImage = card.image || (card.type === "Character"
      ? "assets/images/characters/character-1.jpg"
      : "");

    const frame = createSvgElement("rect", {
      x: x - nodeSize / 2,
      y: y - nodeSize / 2,
      width: nodeSize,
      height: nodeSize,
      rx: nodeRadius,
      fill: typeColors[card.type] ?? "#4a8b82"
    });
    node.element = group;

    const visual = nodeImage
      ? createNodeImage(card.id, nodeImage, x, y, nodeSize, nodeRadius)
      : createNodeIcon(card.type, x, y);

    const label = createSvgElement("text", {
      x,
      y: y + 36,
      "text-anchor": "middle",
      class: "graph-node-label"
    });

    label.textContent = card.name;

    group.append(frame, visual, label);
    group.addEventListener("pointerdown", (event) => startNodeDrag(event, node, group, svg, nodes));
    group.addEventListener("click", () => {
      if (group.dataset.suppressClick === "true") {
        group.dataset.suppressClick = "false";
        return;
      }
      onNodeClick(card.id);
    });
    group.addEventListener("mouseenter", () => highlightNode(card.id, svg));
    group.addEventListener("mouseleave", () => clearHighlights(svg));

    svg.append(group);
  });

  startAmbientEdgeMotion(svg, nodes);
}

function startNodeDrag(event, node, group, svg, nodes) {
  if (event.button !== 0) return;

  event.stopPropagation();
  const startX = event.clientX;
  const startY = event.clientY;
  const nodeStartX = node.x;
  const nodeStartY = node.y;
  let moved = false;
  let lastX = startX;
  let lastY = startY;

  group.classList.add("dragging");
  node.ambientX = 0;
  node.ambientY = 0;
  graphMotionPausedUntil = Number.POSITIVE_INFINITY;
  group.setPointerCapture(event.pointerId);

  const move = (moveEvent) => {
    const scaleX = graphPanState.width / svg.clientWidth;
    const scaleY = graphPanState.height / svg.clientHeight;
    const dx = (moveEvent.clientX - startX) * scaleX;
    const dy = (moveEvent.clientY - startY) * scaleY;
    moved ||= Math.hypot(dx, dy) > 3;
    node.x = nodeStartX + dx;
    node.y = nodeStartY + dy;
    group.setAttribute("transform", `translate(${node.x - node.renderX} ${node.y - node.renderY})`);
    const velocity = Math.min(24, Math.hypot(moveEvent.clientX - lastX, moveEvent.clientY - lastY));
    const direction = (moveEvent.clientX - lastX) + (moveEvent.clientY - lastY) >= 0 ? 1 : -1;
    updateGraphEdges(svg, nodes, node.card.id, velocity * direction);
    lastX = moveEvent.clientX;
    lastY = moveEvent.clientY;
  };

  const end = (endEvent) => {
    group.removeEventListener("pointermove", move);
    group.removeEventListener("pointerup", end);
    group.removeEventListener("pointercancel", end);
    group.classList.remove("dragging");
    graphNodePositions.set(node.card.id, { x: node.x, y: node.y });
    graphMotionPausedUntil = performance.now() + 950;
    animateEdgeSpring(svg, nodes, node.card.id, moved ? 18 : 0);
    group.dataset.suppressClick = String(moved);
    try { group.releasePointerCapture(endEvent.pointerId); } catch { /* ignore */ }
  };

  group.addEventListener("pointermove", move);
  group.addEventListener("pointerup", end);
  group.addEventListener("pointercancel", end);
}

function startAmbientEdgeMotion(svg, nodes) {
  if (graphMotionFrame) cancelAnimationFrame(graphMotionFrame);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const nodeById = new Map(nodes.map((node) => [node.card.id, node]));
  const tick = (now) => {
    if (now >= graphMotionPausedUntil && svg.isConnected) {
      nodes.forEach((node, index) => {
        const group = node.element;
        if (!group || group.classList.contains("dragging")) return;
        node.ambientX = Math.sin(now / 1650 + index * 1.37) * 2.2;
        node.ambientY = Math.cos(now / 1380 + index * .91) * 2.8;
        group.setAttribute(
          "transform",
          `translate(${node.x - node.renderX + node.ambientX} ${node.y - node.renderY + node.ambientY})`
        );
      });
      svg.querySelectorAll(".graph-edge[data-source][data-target]").forEach((edge, index) => {
        const source = nodeById.get(edge.dataset.source);
        const target = nodeById.get(edge.dataset.target);
        if (!source || !target) return;
        const slowWave = Math.sin(now / 780 + index * 1.7) * 4.2;
        const secondWave = Math.sin(now / 1320 + index * .63) * 2.1;
        edge.setAttribute("d", createCurvePath(source, target, slowWave + secondWave));
      });
    }
    if (svg.isConnected) graphMotionFrame = requestAnimationFrame(tick);
  };
  graphMotionFrame = requestAnimationFrame(tick);
}

function updateGraphEdges(svg, nodes, activeNodeId = null, flex = 0) {
  const nodeById = new Map(nodes.map((node) => [node.card.id, node]));
  svg.querySelectorAll(".graph-edge[data-source][data-target]").forEach((edge) => {
    const source = nodeById.get(edge.dataset.source);
    const target = nodeById.get(edge.dataset.target);
    const isActive = edge.dataset.source === activeNodeId || edge.dataset.target === activeNodeId;
    if (source && target) edge.setAttribute("d", createCurvePath(source, target, isActive ? flex : 0));
  });
}

function animateEdgeSpring(svg, nodes, nodeId, amplitude) {
  if (!amplitude || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    updateGraphEdges(svg, nodes);
    return;
  }
  const startedAt = performance.now();
  const tick = (now) => {
    const elapsed = now - startedAt;
    const flex = amplitude * Math.exp(-elapsed / 280) * Math.cos(elapsed / 42);
    updateGraphEdges(svg, nodes, nodeId, flex);
    if (elapsed < 900) requestAnimationFrame(tick);
    else updateGraphEdges(svg, nodes);
  };
  requestAnimationFrame(tick);
}

function zoomGraph(event) {
  event.preventDefault();
  const svg = event.currentTarget;
  const rect = svg.getBoundingClientRect();
  const pointerX = graphPanState.viewBoxX + ((event.clientX - rect.left) / rect.width) * graphPanState.width;
  const pointerY = graphPanState.viewBoxY + ((event.clientY - rect.top) / rect.height) * graphPanState.height;
  const factor = event.deltaY > 0 ? 1.12 : 0.88;
  const newWidth = Math.min(Math.max(graphPanState.width * factor, 420), 1500);
  const newHeight = newWidth * (480 / 900);
  const ratioX = (pointerX - graphPanState.viewBoxX) / graphPanState.width;
  const ratioY = (pointerY - graphPanState.viewBoxY) / graphPanState.height;
  graphPanState.viewBoxX = pointerX - ratioX * newWidth;
  graphPanState.viewBoxY = pointerY - ratioY * newHeight;
  graphPanState.width = newWidth;
  graphPanState.height = newHeight;
  svg.setAttribute("viewBox", `${graphPanState.viewBoxX} ${graphPanState.viewBoxY} ${newWidth} ${newHeight}`);
}

function resetGraphView(event) {
  if (event.target.closest(".graph-node")) return;
  Object.assign(graphPanState, { viewBoxX: 0, viewBoxY: 0, width: 900, height: 480 });
  event.currentTarget.setAttribute("viewBox", "0 0 900 480");
}

function createNodeImage(cardId, imageUrl, x, y, size, radius) {
  const clipId = `graph-node-clip-${String(cardId).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const clipPath = createSvgElement("clipPath", { id: clipId });
  const clipRect = createSvgElement("rect", {
    x: x - size / 2,
    y: y - size / 2,
    width: size,
    height: size,
    rx: radius
  });
  clipPath.append(clipRect);

  const image = createSvgElement("image", {
    x: x - size / 2,
    y: y - size / 2,
    width: size,
    height: size,
    href: imageUrl,
    preserveAspectRatio: "xMidYMid slice",
    "clip-path": `url(#${clipId})`,
    "pointer-events": "none"
  });

  const wrapper = createSvgElement("g", { class: "graph-node-visual" });
  wrapper.append(clipPath, image);
  return wrapper;
}

function createNodeIcon(cardType, x, y) {
  const icon = createSvgElement("g", {
    class: "graph-node-icon",
    transform: `translate(${x - 10} ${y - 10}) scale(0.8333)`,
    "pointer-events": "none"
  });
  const path = createSvgElement("path", {
    d: typeIconPaths[cardType] || typeIconPaths.Location,
    fill: "none",
    stroke: "#fff",
    "stroke-width": "1.8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  });
  icon.append(path);
  return icon;
}

function createDefs() {
  const defs = createSvgElement("defs", {});
  const marker = createSvgElement("marker", {
    id: "graph-arrow",
    markerWidth: 8,
    markerHeight: 8,
    refX: 8,
    refY: 4,
    orient: "auto",
    markerUnits: "strokeWidth"
  });

  const arrow = createSvgElement("path", {
    d: "M0,0 L8,4 L0,8 Z",
    fill: "rgba(207, 171, 93, 0.85)"
  });

  marker.append(arrow);
  defs.append(marker);
  return defs;
}

function createCurvePath(source, target, flex = 0) {
  const sourceX = source.x + (source.ambientX || 0);
  const sourceY = source.y + (source.ambientY || 0);
  const targetX = target.x + (target.ambientX || 0);
  const targetY = target.y + (target.ambientY || 0);
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dr = Math.sqrt(dx * dx + dy * dy) * 0.75;
  const sweepFlag = source.x < target.x ? 1 : 0;
  const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
  const controlX = sourceX + dx / 2 + (-dy / length) * flex;
  const controlY = sourceY + dy / 2 - dr * 0.15 + (dx / length) * flex;
  return `M ${sourceX} ${sourceY} Q ${controlX} ${controlY}, ${targetX} ${targetY}`;
}

function highlightNode(cardId, svg) {
  svg.querySelectorAll(".graph-edge").forEach((edge) => {
    const isConnected = edge.dataset.source === cardId || edge.dataset.target === cardId;
    edge.classList.toggle("highlighted", isConnected);
    edge.classList.toggle("dimmed", !isConnected);
  });

  svg.querySelectorAll(".graph-node").forEach((node) => {
    node.classList.toggle("connected", node.dataset.cardId === cardId);
  });
}

function clearHighlights(svg) {
  svg.querySelectorAll(".graph-edge").forEach((edge) => {
    edge.classList.remove("highlighted", "dimmed");
  });
  svg.querySelectorAll(".graph-node").forEach((node) => {
    node.classList.remove("connected");
  });
}

function startGraphPan(event) {
  if (event.button !== 0 || event.target.closest(".graph-node")) {
    return;
  }

  event.preventDefault();
  graphPanState.isDragging = true;
  graphPanState.startX = event.clientX;
  graphPanState.startY = event.clientY;
  graphPanState.startViewBoxX = graphPanState.viewBoxX;
  graphPanState.startViewBoxY = graphPanState.viewBoxY;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function continueGraphPan(event) {
  if (!graphPanState.isDragging) {
    return;
  }

  const dx = event.clientX - graphPanState.startX;
  const dy = event.clientY - graphPanState.startY;
  graphPanState.viewBoxX = graphPanState.startViewBoxX - dx * (graphPanState.width / event.currentTarget.clientWidth);
  graphPanState.viewBoxY = graphPanState.startViewBoxY - dy * (graphPanState.height / event.currentTarget.clientHeight);
  event.currentTarget.setAttribute("viewBox", `${graphPanState.viewBoxX} ${graphPanState.viewBoxY} ${graphPanState.width} ${graphPanState.height}`);
}

function endGraphPan(event) {
  if (!graphPanState.isDragging) {
    return;
  }

  graphPanState.isDragging = false;
  try {
    event.currentTarget.releasePointerCapture(event.pointerId);
  } catch (error) {
    // ignore if pointer capture is unavailable
  }
}

function createSvgElement(tagName, attributes) {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, String(value));
  });
  return element;
}

function renderEmptyGraph(svg) {
  svg.setAttribute("viewBox", "0 0 900 480");

  const group = createSvgElement("g", { class: "graph-empty" });

  const title = createSvgElement("text", {
    x: 450,
    y: 200,
    "text-anchor": "middle",
    class: "graph-node-label",
    "font-size": "16"
  });
  title.textContent = "Your world graph is empty";

  const hint = createSvgElement("text", {
    x: 450,
    y: 230,
    "text-anchor": "middle",
    class: "graph-node-label",
    "font-size": "12",
    fill: "var(--muted)"
  });
  hint.textContent = emptyWorldPreview.graphHint;

  const sampleNodes = [
    { x: 320, y: 320, label: "Hero" },
    { x: 450, y: 360, label: "City" },
    { x: 580, y: 320, label: "Faction" }
  ];

  sampleNodes.forEach((node, index) => {
    if (index > 0) {
      const edge = createSvgElement("line", {
        class: "graph-edge",
        x1: sampleNodes[index - 1].x,
        y1: sampleNodes[index - 1].y,
        x2: node.x,
        y2: node.y,
        opacity: "0.25"
      });
      group.append(edge);
    }

    const circle = createSvgElement("circle", {
      cx: node.x,
      cy: node.y,
      r: 14,
      fill: "var(--surface-3)",
      stroke: "var(--line)",
      opacity: "0.5"
    });

    const label = createSvgElement("text", {
      x: node.x,
      y: node.y + 34,
      "text-anchor": "middle",
      class: "graph-node-label",
      opacity: "0.45"
    });
    label.textContent = node.label;

    group.append(circle, label);
  });

  group.append(title, hint);
  svg.append(group);
}
