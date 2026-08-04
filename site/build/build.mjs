import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeLayout } from "./layout.mjs";
import { renderArticleBody } from "./markdown.mjs";
import { renderGraphPage, renderArticlePage } from "./templates.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRAPH_PATH = path.join(ROOT, "graph", "graph.json");
const CONTENT_DIR = path.join(ROOT, "content");
const ASSETS_DIR = path.join(ROOT, "site", "assets");
const DIST_DIR = path.join(ROOT, "dist");
const KATEX_DIST = path.join(ROOT, "node_modules", "katex", "dist");
const NODE_MODULES = path.join(ROOT, "node_modules");

const FONT_FILES = [
  ["@fontsource/special-elite", "special-elite-latin-400-normal.woff2"],
  ["@fontsource/vollkorn", "vollkorn-latin-400-normal.woff2"],
  ["@fontsource/vollkorn", "vollkorn-latin-400-italic.woff2"],
  ["@fontsource/vollkorn", "vollkorn-latin-600-normal.woff2"],
  ["@fontsource/vollkorn", "vollkorn-latin-700-normal.woff2"],
  ["@fontsource/courier-prime", "courier-prime-latin-400-normal.woff2"],
  ["@fontsource/courier-prime", "courier-prime-latin-400-italic.woff2"],
  ["@fontsource/courier-prime", "courier-prime-latin-700-normal.woff2"],
];

function main() {
  const graph = JSON.parse(fs.readFileSync(GRAPH_PATH, "utf8"));
  const nodes = graph.nodes;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const titleToId = new Map(nodes.map((n) => [n.title, n.id]));
  const writtenIds = new Set(
    nodes.filter((n) => fs.existsSync(path.join(CONTENT_DIR, n.id, "index.md"))).map((n) => n.id)
  );

  const layout = computeLayout(nodes);

  const dependents = new Map(nodes.map((n) => [n.id, []]));
  for (const n of nodes) {
    for (const p of n.prereqs) dependents.get(p).push(n.id);
  }

  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  fs.mkdirSync(DIST_DIR, { recursive: true });

  let articlesRendered = 0;
  const missing = [];

  const graphNodes = nodes.map((node) => {
    const pos = layout.positions.get(node.id);
    const articlePath = path.join(CONTENT_DIR, node.id, "index.md");
    const hasArticle = fs.existsSync(articlePath);

    if (hasArticle) {
      renderArticle(node, articlePath, byId, titleToId, writtenIds);
      articlesRendered++;
    } else {
      missing.push(node.id);
    }

    return {
      id: node.id,
      title: node.title,
      track: node.track,
      scope: node.scope,
      optional: !!node.optional,
      hasArticle,
      prereqs: node.prereqs,
      dependents: dependents.get(node.id),
      x: pos.x,
      y: pos.y,
    };
  });

  const edges = [];
  for (const node of nodes) {
    for (const p of node.prereqs) edges.push({ from: p, to: node.id });
  }

  const graphData = {
    tracks: ["math", "c", "ds", "algo"],
    fluencyFloor: graph.meta.fluency_floor,
    cardWidth: layout.cardWidth,
    cardHeight: layout.cardHeight,
    width: layout.width,
    height: layout.height,
    nodes: graphNodes,
    edges,
  };

  const graphHtml = renderGraphPage({
    dataJson: JSON.stringify(graphData),
    title: "CS for Dummies",
    description: "A pannable, zoomable dependency graph of CS fundamentals, taught in C.",
  });
  fs.writeFileSync(path.join(DIST_DIR, "index.html"), graphHtml);

  copyAssets();
  fs.writeFileSync(path.join(DIST_DIR, ".nojekyll"), "");

  console.log(`built ${nodes.length} nodes, ${articlesRendered} article(s) rendered`);
  if (missing.length) {
    console.log(`${missing.length} node(s) with no article yet (shown as locked graph nodes)`);
  }
}

function renderArticle(node, articlePath, byId, titleToId, writtenIds) {
  const raw = fs.readFileSync(articlePath, "utf8");
  const { frontmatter, html } = renderArticleBody(raw, { titleToId, writtenIds, currentId: node.id });
  if (frontmatter.id !== node.id) {
    throw new Error(`${node.id}: frontmatter id "${frontmatter.id}" does not match graph.json`);
  }
  if (frontmatter.title !== node.title) {
    throw new Error(`${node.id}: frontmatter title does not match graph.json`);
  }

  const prereqs = node.prereqs.map((id) => ({ id, title: byId.get(id).title }));
  const page = renderArticlePage({ node, bodyHtml: html, prereqs });

  const outDir = path.join(DIST_DIR, "articles", node.id);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), page);

  const figuresDir = path.join(CONTENT_DIR, node.id, "figures");
  if (fs.existsSync(figuresDir)) {
    fs.cpSync(figuresDir, path.join(outDir, "figures"), { recursive: true });
  }
}

function copyAssets() {
  const outAssets = path.join(DIST_DIR, "assets");
  fs.mkdirSync(outAssets, { recursive: true });
  fs.cpSync(ASSETS_DIR, outAssets, { recursive: true });

  const katexOut = path.join(outAssets, "katex");
  fs.mkdirSync(katexOut, { recursive: true });
  fs.copyFileSync(path.join(KATEX_DIST, "katex.min.css"), path.join(katexOut, "katex.min.css"));
  fs.cpSync(path.join(KATEX_DIST, "fonts"), path.join(katexOut, "fonts"), { recursive: true });

  const fontsOut = path.join(outAssets, "fonts");
  fs.mkdirSync(fontsOut, { recursive: true });
  for (const [pkg, file] of FONT_FILES) {
    fs.copyFileSync(path.join(NODE_MODULES, pkg, "files", file), path.join(fontsOut, file));
  }
}

main();
