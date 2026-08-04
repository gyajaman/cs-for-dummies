// Minimal, hand-rolled C17 syntax highlighter. Produces static <span> markup
// at build time so the client ships no highlighter JS, only CSS. Deliberately
// does not recurse into preprocessor line contents or interpret printf
// format specifiers inside strings — those are cosmetic simplifications, not
// correctness issues (actual compilation is verified separately by
// scripts/test_c.py).

const KEYWORDS = new Set([
  "auto", "break", "case", "char", "const", "continue", "default", "do",
  "double", "else", "enum", "extern", "float", "for", "goto", "if", "inline",
  "int", "long", "register", "restrict", "return", "short", "signed",
  "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned",
  "void", "volatile", "while",
  "_Alignas", "_Alignof", "_Atomic", "_Bool", "_Complex", "_Generic",
  "_Imaginary", "_Noreturn", "_Static_assert", "_Thread_local",
]);

const STDLIB_TYPES = new Set([
  "size_t", "ssize_t", "ptrdiff_t", "intptr_t", "uintptr_t", "wchar_t",
  "int8_t", "int16_t", "int32_t", "int64_t",
  "uint8_t", "uint16_t", "uint32_t", "uint64_t",
  "int_fast8_t", "int_fast16_t", "int_fast32_t", "int_fast64_t",
  "uint_fast8_t", "uint_fast16_t", "uint_fast32_t", "uint_fast64_t",
  "int_least8_t", "int_least16_t", "int_least32_t", "int_least64_t",
  "uint_least8_t", "uint_least16_t", "uint_least32_t", "uint_least64_t",
  "intmax_t", "uintmax_t", "FILE", "va_list", "NULL",
]);

const TOKEN_RE = new RegExp(
  [
    String.raw`(?<comment>//[^\n]*|/\*[\s\S]*?\*/)`,
    String.raw`(?<preproc>^[ \t]*#[^\n]*)`,
    String.raw`(?<string>"(?:\\.|[^"\\\n])*")`,
    String.raw`(?<char>'(?:\\.|[^'\\\n])*')`,
    String.raw`(?<number>\b0[xX][0-9a-fA-F]+[uUlL]*\b|\b\d+\.\d+(?:[eE][+-]?\d+)?[fFlL]?\b|\b\.\d+(?:[eE][+-]?\d+)?[fFlL]?\b|\b\d+[uUlL]*\b)`,
    String.raw`(?<funccall>\b[A-Za-z_]\w*\b(?=\s*\())`,
    String.raw`(?<ident>\b[A-Za-z_]\w*\b)`,
    String.raw`(?<other>[\s\S])`,
  ].join("|"),
  "gm"
);

export function highlightC(code) {
  let out = "";
  TOKEN_RE.lastIndex = 0;
  let match;
  while ((match = TOKEN_RE.exec(code)) !== null) {
    const g = match.groups;
    if (g.comment !== undefined) out += span("comment", g.comment);
    else if (g.preproc !== undefined) out += span("preproc", g.preproc);
    else if (g.string !== undefined) out += span("string", g.string);
    else if (g.char !== undefined) out += span("string", g.char);
    else if (g.number !== undefined) out += span("number", g.number);
    else if (g.funccall !== undefined) {
      out += span(KEYWORDS.has(g.funccall) ? "keyword" : "func", g.funccall);
    } else if (g.ident !== undefined) {
      const cls = KEYWORDS.has(g.ident)
        ? "keyword"
        : STDLIB_TYPES.has(g.ident)
        ? "type"
        : "ident";
      out += span(cls, g.ident);
    } else {
      out += escapeHtml(g.other);
    }

    if (match.index === TOKEN_RE.lastIndex) TOKEN_RE.lastIndex++;
  }
  return out;
}

function span(cls, text) {
  return `<span class="tok-${cls}">${escapeHtml(text)}</span>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
