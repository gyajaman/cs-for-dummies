import { initThemeToggle } from "./theme.mjs";

const LOCK_ICON =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

const MIN_SCALE = 0.15;
const MAX_SCALE = 2.5;
const TAP_THRESHOLD = 5;
const CARD_CHAMFER = 14;
const CARD_TEXT_INSET = 16;
const ELBOW_RADIUS = 14;

const data = JSON.parse(document.getElementById("graph-data").textContent);
const byId = new Map(data.nodes.map((n) => [n.id, n]));

const viewport = document.getElementById("graph-viewport");
const svg = document.getElementById("graph-svg");
const canvas = document.getElementById("graph-canvas");
const nodesLayer = document.getElementById("nodes-layer");
const edgesLayer = document.getElementById("edges-layer");
const legend = document.getElementById("legend");
const searchInput = document.getElementById("search-input");
const searchCount = document.getElementById("search-count");
const zoomInBtn = document.getElementById("zoom-in-btn");
const zoomOutBtn = document.getElementById("zoom-out-btn");
const fitBtn = document.getElementById("fit-btn");
const sidePanel = document.getElementById("side-panel");
const panelBackdrop = document.getElementById("side-panel-backdrop");
const panelHeading = document.getElementById("panel-heading");
const panelBody = document.getElementById("panel-body");
const panelCloseBtn = document.getElementById("panel-close-btn");

const view = { x: 0, y: 0, scale: 1 };
let activeNodeId = null;
const disabledTracks = new Set();

render();
// Deferred a frame: reading the viewport's rect synchronously here can race
// the initial layout pass (flexbox sizing, stylesheet application) and
// measure a zero-size viewport, which clamps the fitted scale to MIN_SCALE.
requestAnimationFrame(() => {
  fitToScreen();
  requestAnimationFrame(() => canvas.classList.remove("no-transition"));
});

initThemeToggle(document.getElementById("theme-toggle-btn"));
initPanZoom();
initSearch();
initPanel();
initHoverFocus();
initLegend();

function render() {
  nodesLayer.innerHTML = data.nodes.map(nodeMarkup).join("");
  edgesLayer.innerHTML = data.edges.map(edgeMarkup).join("");
  renderLegend();
}

function nodeMarkup(node) {
  const w = data.cardWidth;
  const h = data.cardHeight;
  const left = node.x - w / 2;
  const top = node.y - h / 2;
  const classes = ["node", `track-${node.track}`];
  if (!node.hasArticle) classes.push("no-article");
  if (node.optional) classes.push("optional");

  const isFloor = data.fluencyFloor.includes(node.id);
  const metaParts = [node.track];
  if (node.optional) metaParts.push("optional");
  if (isFloor) metaParts.push("baseline");

  const c = CARD_CHAMFER;
  const cardPath = `M ${c},0 L ${w},0 L ${w},${h} L 0,${h} L 0,${c} Z`;
  const holes = [0.42, 0.6, 0.78]
    .map((f) => `<circle class="punch-hole" cx="8" cy="${Math.round(h * f)}" r="1.5"></circle>`)
    .join("");

  // All the small per-node indicator dots line up in a single row, same
  // size, anchored to the bottom-right corner, closest (the track stamp)
  // to the corner.
  const cornerDots = [{ cls: "stamp" }];
  if (isFloor) cornerDots.push({ cls: "floor-dot" });
  const dots = cornerDots
    .map((d, i) => `<circle class="${d.cls}" cx="${w - 13 - i * 14}" cy="${h - 13}" r="4.5"></circle>`)
    .join("");

  return `<g class="${classes.join(" ")}" data-id="${node.id}" transform="translate(${left}, ${top})">
    <path class="card" d="${cardPath}"></path>
    ${holes}
    ${dots}
    <foreignObject x="${CARD_TEXT_INSET}" y="0" width="${w - CARD_TEXT_INSET}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" class="node-content">
        <div class="node-title">${escapeHtml(node.title)}</div>
        <div class="node-meta">${escapeHtml(metaParts.join(" · "))}</div>
      </div>
    </foreignObject>
    ${!node.hasArticle ? `<g class="lock-badge" transform="translate(${w - 22}, 6)">${LOCK_ICON}</g>` : ""}
  </g>`;
}

function edgeMarkup(edge) {
  const from = byId.get(edge.from);
  const to = byId.get(edge.to);
  const w = data.cardWidth;
  const x1 = from.x + w / 2;
  const y1 = from.y;
  const x2 = to.x - w / 2;
  const y2 = to.y;
  const d = elbowPath(x1, y1, x2, y2);
  return `<g class="edge" data-from="${edge.from}" data-to="${edge.to}"><path d="${d}" marker-end="url(#arrowhead)"></path></g>`;
}

// Orthogonal "schematic wire" routing: horizontal out of the source,
// a rounded bend, vertical run, another rounded bend, horizontal into the
// target. Reads far more traceably in a dense graph than a diagonal curve
// that cuts across unrelated edges at an angle.
function elbowPath(x1, y1, x2, y2) {
  if (Math.abs(y2 - y1) < 1) return `M ${x1},${y1} L ${x2},${y2}`;

  const midX = x1 + (x2 - x1) / 2;
  const dir = y2 > y1 ? 1 : -1;
  const r = Math.min(ELBOW_RADIUS, Math.abs(midX - x1), Math.abs(x2 - midX), Math.abs(y2 - y1) / 2);

  return [
    `M ${x1},${y1}`,
    `L ${midX - r},${y1}`,
    `Q ${midX},${y1} ${midX},${y1 + r * dir}`,
    `L ${midX},${y2 - r * dir}`,
    `Q ${midX},${y2} ${midX + r},${y2}`,
    `L ${x2},${y2}`,
  ].join(" ");
}

function renderLegend() {
  const tracks = [
    { id: "math", label: "Math" },
    { id: "c", label: "C" },
    { id: "ds", label: "Data structures" },
    { id: "algo", label: "Algorithms" },
  ];
  legend.innerHTML =
    tracks
      .map(
        (t) =>
          `<div class="legend-row legend-row-toggle" data-track="${t.id}" role="button" tabindex="0" aria-pressed="true"><span class="legend-swatch" style="background:var(--track-${t.id})"></span>${t.label}</div>`
      )
      .join("") +
    `<div class="legend-row"><span class="legend-swatch" style="background:var(--accent)"></span>Baseline fluency</div>` +
    `<div class="legend-row"><span class="legend-swatch outline"></span>No article yet</div>`;
}

// ---------- legend track filter ----------
// Clicking a track row in the legend hides every node in that track, plus
// any edge touching a hidden node, so a dense graph can be narrowed down to
// one or two tracks at a time.

function initLegend() {
  legend.addEventListener("click", (e) => {
    const row = e.target.closest(".legend-row-toggle");
    if (!row) return;
    toggleTrack(row.dataset.track);
  });

  legend.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = e.target.closest(".legend-row-toggle");
    if (!row) return;
    e.preventDefault();
    toggleTrack(row.dataset.track);
  });
}

function toggleTrack(track) {
  if (disabledTracks.has(track)) disabledTracks.delete(track);
  else disabledTracks.add(track);
  applyTrackFilter();
}

function applyTrackFilter() {
  nodesLayer.querySelectorAll(".node").forEach((el) => {
    const node = byId.get(el.dataset.id);
    el.classList.toggle("track-hidden", disabledTracks.has(node.track));
  });
  edgesLayer.querySelectorAll(".edge").forEach((el) => {
    const from = byId.get(el.dataset.from);
    const to = byId.get(el.dataset.to);
    el.classList.toggle("track-hidden", disabledTracks.has(from.track) || disabledTracks.has(to.track));
  });
  legend.querySelectorAll(".legend-row-toggle").forEach((row) => {
    const off = disabledTracks.has(row.dataset.track);
    row.classList.toggle("off", off);
    row.setAttribute("aria-pressed", String(!off));
  });
}

// ---------- pan / zoom ----------

function initPanZoom() {
  const pointers = new Map();
  let dragMoved = 0;
  let singleStart = null;
  let pinchStart = null;
  let wheelTimeout = null;
  let pointerDownNodeId = null;

  viewport.addEventListener("pointerdown", (e) => {
    // Read the target *before* setPointerCapture, which retargets e.target
    // to the capturing element (the viewport) on every subsequent event —
    // by pointerup, e.target.closest(".node") would always be null.
    const nodeEl = e.target.closest && e.target.closest(".node");
    pointerDownNodeId = nodeEl ? nodeEl.dataset.id : null;

    viewport.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.classList.add("no-transition");

    if (pointers.size === 1) {
      dragMoved = 0;
      singleStart = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y };
      pinchStart = null;
      viewport.classList.add("panning");
    } else if (pointers.size === 2) {
      singleStart = null;
      pinchStart = pinchStateFrom([...pointers.values()]);
    }
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1 && singleStart) {
      const dx = e.clientX - singleStart.x;
      const dy = e.clientY - singleStart.y;
      dragMoved = Math.max(dragMoved, Math.hypot(dx, dy));
      view.x = singleStart.viewX + dx;
      view.y = singleStart.viewY + dy;
      applyTransform();
    } else if (pointers.size === 2 && pinchStart) {
      const pts = [...pointers.values()];
      const rect = viewport.getBoundingClientRect();
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
      const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
      const ratio = dist / pinchStart.dist;
      const newScale = clamp(pinchStart.scale * ratio, MIN_SCALE, MAX_SCALE);
      const contentX = (pinchStart.midX - pinchStart.viewX) / pinchStart.scale;
      const contentY = (pinchStart.midY - pinchStart.viewY) / pinchStart.scale;
      view.scale = newScale;
      view.x = midX - contentX * newScale;
      view.y = midY - contentY * newScale;
      applyTransform();
    }
  });

  function pinchStateFrom(pts) {
    const rect = viewport.getBoundingClientRect();
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    return {
      dist,
      scale: view.scale,
      midX: (pts[0].x + pts[1].x) / 2 - rect.left,
      midY: (pts[0].y + pts[1].y) / 2 - rect.top,
      viewX: view.x,
      viewY: view.y,
    };
  }

  function endPointer(e) {
    const wasTap = pointers.size === 1 && singleStart && dragMoved < TAP_THRESHOLD;
    pointers.delete(e.pointerId);
    viewport.classList.remove("panning");

    if (pointers.size === 0) {
      canvas.classList.remove("no-transition");
      if (wasTap && pointerDownNodeId) {
        panToNode(pointerDownNodeId);
        openPanel(pointerDownNodeId);
      }
      pointerDownNodeId = null;
      singleStart = null;
      pinchStart = null;
    } else if (pointers.size === 1) {
      const [remaining] = pointers.values();
      singleStart = { x: remaining.x, y: remaining.y, viewX: view.x, viewY: view.y };
      pinchStart = null;
      dragMoved = TAP_THRESHOLD + 1;
    }
  }

  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      canvas.classList.add("no-transition");
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => canvas.classList.remove("no-transition"), 200);
      const rect = viewport.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const zoomFactor = Math.exp(-e.deltaY * 0.0015);
      zoomAt(px, py, view.scale * zoomFactor);
    },
    { passive: false }
  );

  zoomInBtn.addEventListener("click", () => {
    canvas.classList.remove("no-transition");
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, view.scale * 1.3);
  });
  zoomOutBtn.addEventListener("click", () => {
    canvas.classList.remove("no-transition");
    const rect = viewport.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, view.scale / 1.3);
  });
  fitBtn.addEventListener("click", () => {
    canvas.classList.remove("no-transition");
    fitToScreen();
  });
}

function zoomAt(px, py, newScale) {
  newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);
  const contentX = (px - view.x) / view.scale;
  const contentY = (py - view.y) / view.scale;
  view.scale = newScale;
  view.x = px - contentX * newScale;
  view.y = py - contentY * newScale;
  applyTransform();
}

function fitToScreen() {
  const rect = viewport.getBoundingClientRect();
  const pad = 96;
  const scale = clamp(
    Math.min((rect.width - pad * 2) / data.width, (rect.height - pad * 2) / data.height),
    MIN_SCALE,
    MAX_SCALE
  );
  view.scale = scale;
  view.x = (rect.width - data.width * scale) / 2;
  view.y = (rect.height - data.height * scale) / 2;
  applyTransform();
}

function panToNode(id) {
  const node = byId.get(id);
  if (!node) return;
  canvas.classList.remove("no-transition");
  const rect = viewport.getBoundingClientRect();
  // The side panel overlays the right edge of the viewport (and is about to
  // open, if it isn't already) — center within the space actually left
  // visible beside it, not the full viewport, so the focused card doesn't
  // land underneath it.
  const panelWidth = sidePanel.getBoundingClientRect().width;
  const visibleWidth = Math.max(rect.width - panelWidth, rect.width * 0.3);
  view.scale = clamp(Math.max(view.scale, 1.3), MIN_SCALE, MAX_SCALE);
  view.x = visibleWidth / 2 - node.x * view.scale;
  view.y = rect.height / 2 - node.y * view.scale;
  applyTransform();
}

function applyTransform() {
  canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// ---------- search ----------

function initSearch() {
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) {
      clearSearch();
      return;
    }
    const matches = data.nodes.filter((n) => n.title.toLowerCase().includes(q));
    const matchIds = new Set(matches.map((n) => n.id));
    nodesLayer.querySelectorAll(".node").forEach((el) => {
      el.classList.toggle("dimmed", !matchIds.has(el.dataset.id));
    });
    edgesLayer.querySelectorAll(".edge").forEach((el) => {
      el.classList.toggle("dimmed", !(matchIds.has(el.dataset.from) && matchIds.has(el.dataset.to)));
    });
    searchCount.textContent = matches.length ? `${matches.length} found` : "no matches";
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const q = searchInput.value.trim().toLowerCase();
    if (!q) return;
    const first = data.nodes.find((n) => n.title.toLowerCase().includes(q));
    if (first) {
      panToNode(first.id);
      openPanel(first.id);
    }
  });
}

function clearSearch() {
  nodesLayer.querySelectorAll(".node.dimmed").forEach((el) => el.classList.remove("dimmed"));
  edgesLayer.querySelectorAll(".edge.dimmed").forEach((el) => el.classList.remove("dimmed"));
  searchCount.textContent = "";
}

// ---------- hover focus ----------
// A dense DAG is unreadable all at once. Hovering a card isolates its
// direct prerequisites and dependents so a single chain can be traced.

function initHoverFocus() {
  nodesLayer.addEventListener("pointerover", (e) => {
    if (searchInput.value.trim()) return;
    const nodeEl = e.target.closest(".node");
    if (nodeEl) focusNode(nodeEl.dataset.id);
  });

  nodesLayer.addEventListener("pointerout", (e) => {
    const nodeEl = e.target.closest(".node");
    if (!nodeEl) return;
    const to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".node");
    if (to === nodeEl) return;
    clearHoverFocus();
  });
}

function focusNode(id) {
  const node = byId.get(id);
  if (!node) return;
  const connected = new Set([id, ...node.prereqs, ...node.dependents]);

  nodesLayer.querySelectorAll(".node").forEach((el) => {
    el.classList.toggle("dimmed", !connected.has(el.dataset.id));
  });
  edgesLayer.querySelectorAll(".edge").forEach((el) => {
    const active = el.dataset.from === id || el.dataset.to === id;
    el.classList.toggle("dimmed", !active);
    el.classList.toggle("highlight", active);
    el.querySelector("path").setAttribute("marker-end", active ? "url(#arrowhead-accent)" : "url(#arrowhead)");
  });
}

function clearHoverFocus() {
  nodesLayer.querySelectorAll(".node.dimmed").forEach((el) => el.classList.remove("dimmed"));
  edgesLayer.querySelectorAll(".edge").forEach((el) => {
    el.classList.remove("dimmed", "highlight");
    el.querySelector("path").setAttribute("marker-end", "url(#arrowhead)");
  });
}

// ---------- side panel ----------

function initPanel() {
  panelCloseBtn.addEventListener("click", closePanel);
  panelBackdrop.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePanel();
  });
  panelBody.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-jump]");
    if (!chip) return;
    const id = chip.dataset.jump;
    panToNode(id);
    openPanel(id);
  });
}

function openPanel(id) {
  const node = byId.get(id);
  if (!node) return;
  activeNodeId = id;
  updateActiveClasses();

  panelHeading.innerHTML = `<span class="track-pill" style="background:var(--track-${node.track}-soft);color:var(--track-${node.track})">${escapeHtml(node.track)}</span>`;

  const status = node.hasArticle
    ? `<a class="read-article-btn" href="articles/${node.id}/index.html">Read article →</a>`
    : `<div class="panel-status locked">${LOCK_ICON}<span>Article not written yet</span></div>`;

  const optionalNote = node.optional
    ? `<div class="panel-status optional-note">Optional — useful, but nothing later strictly requires it.</div>`
    : "";

  const prereqSection = node.prereqs.length
    ? `<div class="panel-section"><h3>Prerequisites</h3><div class="chip-list">${node.prereqs.map(chipHtml).join("")}</div></div>`
    : "";

  const dependentSection = node.dependents.length
    ? `<div class="panel-section"><h3>Unlocks</h3><div class="chip-list">${node.dependents.map(chipHtml).join("")}</div></div>`
    : "";

  panelBody.innerHTML = `
    <h2 class="panel-title">${escapeHtml(node.title)}</h2>
    <p class="panel-scope">${escapeHtml(node.scope)}</p>
    ${status}
    ${optionalNote}
    ${prereqSection}
    ${dependentSection}
  `;

  sidePanel.classList.add("open");
  panelBackdrop.style.pointerEvents = "auto";
}

function closePanel() {
  sidePanel.classList.remove("open");
  panelBackdrop.style.pointerEvents = "none";
  activeNodeId = null;
  updateActiveClasses();
}

function chipHtml(id) {
  const n = byId.get(id);
  if (!n) return "";
  return `<button type="button" class="chip" data-jump="${id}"><span class="chip-dot" style="background:var(--track-${n.track})"></span>${escapeHtml(n.title)}</button>`;
}

function updateActiveClasses() {
  nodesLayer.querySelectorAll(".node.active").forEach((el) => el.classList.remove("active"));
  if (!activeNodeId) return;
  const sel = window.CSS && CSS.escape ? CSS.escape(activeNodeId) : activeNodeId;
  const el = nodesLayer.querySelector(`.node[data-id="${sel}"]`);
  if (el) el.classList.add("active");
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
