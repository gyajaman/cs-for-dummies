// Article Markdown -> HTML. Frontmatter parsing intentionally mirrors the
// "deliberately dumb" line-splitter in scripts/validate_graph.py rather than
// pulling in a YAML library, so the two parsers can never disagree about
// what a frontmatter block means.

import MarkdownIt from "markdown-it";
import markdownItContainer from "markdown-it-container";
import texmath from "markdown-it-texmath";
import katex from "katex";
import { highlightC } from "./highlight-c.mjs";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n/;

export function parseFrontmatter(rawMarkdown) {
  const match = FRONTMATTER_RE.exec(rawMarkdown);
  if (!match) throw new Error("markdown: article has no frontmatter");
  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    if (line.includes(":") && !line.startsWith(" ")) {
      const sep = line.indexOf(":");
      const key = line.slice(0, sep).trim();
      const value = line
        .slice(sep + 1)
        .trim()
        .replace(/^['"]/, "")
        .replace(/['"]$/, "");
      frontmatter[key] = value;
    }
  }
  return { frontmatter, body: rawMarkdown.slice(match[0].length) };
}

const md = new MarkdownIt({ html: true, linkify: false, typographer: false })
  .use(texmath, {
    engine: katex,
    delimiters: "dollars",
    katexOptions: { throwOnError: false },
  })
  .use(markdownItContainer, "misconception", {
    render(tokens, idx) {
      return tokens[idx].nesting === 1 ? '<div class="misconception">\n' : "</div>\n";
    },
  })
  .use(markdownItContainer, "answers", {
    render(tokens, idx) {
      return tokens[idx].nesting === 1
        ? '<details class="answers"><summary>Answers</summary>\n'
        : "</details>\n";
    },
  });

// Backtick spans that exactly match another node's title become a link to
// that node's article, but only if that article has actually been written —
// set per-call by renderArticleBody, read here since markdown-it's renderer
// rules are registered once but rendered per-call. A reference to a real but
// unwritten node falls back to plain code styling rather than a dead link,
// and starts linking itself the moment that article exists.
let linkContext = { titleToId: new Map(), writtenIds: new Set(), currentId: null };

md.renderer.rules.code_inline = (tokens, idx) => {
  const content = tokens[idx].content;
  const targetId = linkContext.titleToId.get(content);
  if (targetId && targetId !== linkContext.currentId && linkContext.writtenIds.has(targetId)) {
    return `<a href="../${targetId}/index.html">${escapeHtml(content)}</a>`;
  }
  return `<code>${escapeHtml(content)}</code>`;
};

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  const { lang, attrs } = parseFenceInfo(token.info || "");
  const code = token.content.replace(/\n$/, "");

  if (lang === "output") {
    return `<pre class="output-block"><code>${renderOutput(code)}</code></pre>\n`;
  }

  const highlighted = lang === "c" ? highlightC(code) : escapeHtml(code);
  const chips = badges(attrs);
  const hasLabel = attrs.file || chips;
  const label = hasLabel
    ? `<div class="code-label">${attrs.file ? `<span class="code-filename">${escapeHtml(attrs.file)}</span>` : ""}${chips}</div>\n`
    : "";
  return `<div class="code-block">${label}<pre><code class="language-${lang || "text"}">${highlighted}</code></pre></div>\n`;
};

md.core.ruler.push("standalone_image_figure", (state) => {
  const { tokens } = state;
  for (let i = 0; i < tokens.length - 2; i++) {
    const open = tokens[i];
    const inline = tokens[i + 1];
    const close = tokens[i + 2];
    if (
      open.type === "paragraph_open" &&
      inline.type === "inline" &&
      close.type === "paragraph_close" &&
      inline.children.length === 1 &&
      inline.children[0].type === "image"
    ) {
      open.type = "figure_open";
      open.tag = "figure";
      close.type = "figure_close";
      close.tag = "figure";
      const caption = inline.children[0].content;
      if (caption) {
        const figcaptionOpen = new state.Token("figcaption_open", "figcaption", 1);
        const text = new state.Token("text", "", 0);
        text.content = caption;
        const figcaptionClose = new state.Token("figcaption_close", "figcaption", -1);
        inline.children.push(figcaptionOpen, text, figcaptionClose);
      }
    }
  }
});

export function renderArticleBody(rawMarkdown, { titleToId, writtenIds, currentId } = {}) {
  linkContext = { titleToId: titleToId || new Map(), writtenIds: writtenIds || new Set(), currentId: currentId || null };
  const { frontmatter, body } = parseFrontmatter(rawMarkdown);
  const withMisconceptions = wrapMisconceptions(body);
  const withAnswers = wrapAnswers(withMisconceptions);
  return { frontmatter, html: md.render(withAnswers) };
}

function wrapMisconceptions(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const match = /^### Wrong model: (.+)$/.exec(lines[i]);
    if (!match) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const claim = match[1].trim();
    i++;
    const block = [];
    while (i < lines.length && !/^#{1,6}\s/.test(lines[i])) {
      block.push(lines[i]);
      i++;
    }
    while (block.length && block[block.length - 1].trim() === "") block.pop();
    out.push(":::misconception", `**Wrong model:** ${claim}`, "", ...block, ":::", "");
  }
  return out.join("\n");
}

function wrapAnswers(markdown) {
  const lines = markdown.split("\n");
  const idx = lines.findIndex((l) => /^##\s+Answers\s*$/.test(l));
  if (idx === -1) return markdown;
  return [...lines.slice(0, idx), ":::answers", "", ...lines.slice(idx + 1), ":::", ""].join("\n");
}

function parseFenceInfo(info) {
  const parts = info.trim().split(/\s+/).filter(Boolean);
  const lang = parts[0] || "";
  const attrs = { run: false, wrapMain: false, expectFail: false, nocompile: false, file: null };
  for (const part of parts.slice(1)) {
    if (part === "run") attrs.run = true;
    else if (part === "wrap=main") attrs.wrapMain = true;
    else if (part === "expect_fail") attrs.expectFail = true;
    else if (part === "nocompile") attrs.nocompile = true;
    else if (part.startsWith("file=")) attrs.file = part.slice(5);
  }
  return { lang, attrs };
}

function badges(attrs) {
  const chips = [];
  if (attrs.expectFail) chips.push('<span class="code-badge code-badge-fail">will not compile</span>');
  if (attrs.nocompile) chips.push('<span class="code-badge">excerpt</span>');
  return chips.join("");
}

function renderOutput(code) {
  return escapeHtml(code).replace(/\{\{ANY\}\}/g, '<span class="wildcard">···</span>');
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
