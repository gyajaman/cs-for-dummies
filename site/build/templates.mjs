// HTML shell templates. Plain template-literal functions — no templating
// engine dependency, since the shells are small and static.

const ICONS = {
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  "zoom-in":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
  "zoom-out":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
  fit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
  contrast:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  "chevron-left":
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
};

export function icon(name) {
  return ICONS[name] || "";
}

function head({ title, description, assetPrefix }) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="stylesheet" href="${assetPrefix}assets/katex/katex.min.css">
<link rel="stylesheet" href="${assetPrefix}assets/fonts.css">
<link rel="stylesheet" href="${assetPrefix}assets/tokens.css">
<script>
(function () {
  try {
    var stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch (e) {}
})();
</script>`;
}

export function renderGraphPage({ dataJson, title, description }) {
  return `<!doctype html>
<html lang="en">
<head>
${head({ title, description, assetPrefix: "" })}
<link rel="stylesheet" href="assets/graph.css">
</head>
<body>
<div class="app-shell">
  <header class="toolbar">
    <div class="toolbar-brand">
      <span class="site-title">CS for Dummies</span>
      <span class="site-subtitle">a dependency graph of CS fundamentals</span>
    </div>
    <div class="search-box">
      ${icon("search")}
      <input id="search-input" type="text" placeholder="Find a topic…" autocomplete="off">
    </div>
    <span class="search-count" id="search-count"></span>
    <div class="toolbar-spacer"></div>
    <div class="toolbar-controls">
      <div class="zoom-group">
        <button class="icon-btn" id="zoom-out-btn" title="Zoom out" aria-label="Zoom out">${icon("zoom-out")}</button>
        <button class="icon-btn" id="fit-btn" title="Fit to screen" aria-label="Fit to screen">${icon("fit")}</button>
        <button class="icon-btn" id="zoom-in-btn" title="Zoom in" aria-label="Zoom in">${icon("zoom-in")}</button>
      </div>
      <button class="icon-btn" id="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">${icon("contrast")}</button>
    </div>
  </header>
  <div class="graph-viewport" id="graph-viewport">
    <svg id="graph-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--border-strong)"></path>
        </marker>
        <marker id="arrowhead-accent" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"></path>
        </marker>
      </defs>
      <g class="graph-canvas no-transition" id="graph-canvas">
        <g id="edges-layer"></g>
        <g id="nodes-layer"></g>
      </g>
    </svg>
  </div>
  <div class="legend" id="legend"></div>
  <div class="side-panel-backdrop" id="side-panel-backdrop"></div>
  <aside class="side-panel" id="side-panel">
    <div class="side-panel-header">
      <div id="panel-heading"></div>
      <button class="icon-btn close-btn" id="panel-close-btn" aria-label="Close">${icon("x")}</button>
    </div>
    <div class="side-panel-body" id="panel-body"></div>
  </aside>
</div>
<script type="application/json" id="graph-data">${dataJson}</script>
<script type="module" src="assets/graph-client.mjs"></script>
</body>
</html>
`;
}

export function renderArticlePage({ node, bodyHtml, prereqs }) {
  const prereqChips = prereqs.length
    ? `<div class="article-prereqs">Requires: ${prereqs
        .map((p) =>
          p.hasArticle
            ? `<a class="chip" href="../${p.id}/index.html">${escapeHtml(p.title)}</a>`
            : `<span class="chip chip-locked">${escapeHtml(p.title)}</span>`
        )
        .join("")}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
${head({ title: `${node.title} — CS for Dummies`, description: node.scope, assetPrefix: "../../" })}
<link rel="stylesheet" href="../../assets/article.css">
</head>
<body>
<div class="article-topbar">
  <a class="back-link" href="../../index.html">${icon("chevron-left")}Back to graph</a>
  <button class="icon-btn" id="theme-toggle-btn" title="Toggle theme" aria-label="Toggle theme">${icon("contrast")}</button>
</div>
<main class="article-shell">
  <div class="article-header">
    <span class="track-pill" style="background:var(--track-${node.track}-soft); color:var(--track-${node.track})">${escapeHtml(node.track)}</span>
    <h1>${escapeHtml(node.title)}</h1>
    <p class="article-scope">${escapeHtml(node.scope)}</p>
    ${prereqChips}
  </div>
  <article class="article-body">
${bodyHtml}
  </article>
</main>
<script type="module">
import { initThemeToggle } from "../../assets/theme.mjs";
initThemeToggle(document.getElementById("theme-toggle-btn"));
</script>
</body>
</html>
`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
