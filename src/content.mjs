// Reads front matter (YAML subset) and turns Markdown into HTML. No dependencies.

export function parseFront(src) {
  src = src.replace(/^﻿/, "");
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return { data: {}, body: src };
  return { data: yaml(m[1]), body: m[2] };
}

function scalar(v) {
  v = v.trim();
  if (v === "" || v === "~" || v === "null") return "";
  if (/^".*"$/s.test(v)) { try { return JSON.parse(v.replace(/\n/g, " ")); } catch { return v.slice(1, -1); } }
  if (/^'.*'$/s.test(v)) return v.slice(1, -1).replace(/''/g, "'");
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (/^\[.*\]$/s.test(v)) return v.slice(1, -1).split(",").map((x) => scalar(x)).filter((x) => x !== "");
  return v.replace(/\s+#.*$/, "");
}

function fold(lines) {
  return lines.join("\n").split(/\n\s*\n/).map((p) => p.replace(/\n/g, " ")).join("\n").trim();
}

function yaml(text) {
  const L = text.split(/\r?\n/), o = {};
  let i = 0;
  while (i < L.length) {
    const line = L[i];
    if (!line.trim() || line.trim().startsWith("#")) { i++; continue; }
    const m = line.match(/^([A-Za-z0-9_-]+):(?:\s+(.*))?$/);
    i++;
    if (!m) continue;
    const k = m[1];
    const v = m[2] ?? "";
    const cont = [];
    while (i < L.length && (/^\s+\S/.test(L[i]) || /^-\s/.test(L[i]) || (L[i].trim() === "" && i + 1 < L.length && /^\s+\S/.test(L[i + 1])))) { cont.push(L[i]); i++; }
    if (v.trim() === "" && cont.length && /^\s*-\s/.test(cont[0])) { o[k] = cont.filter((c) => c.trim()).map((c) => scalar(c.trim().replace(/^-\s*/, ""))); continue; }
    if (/^[|>][+-]?$/.test(v.trim())) {
      const filled = cont.filter((c) => c.trim());
      const ind = filled.length ? Math.min(...filled.map((c) => c.match(/^\s*/)[0].length)) : 0;
      const ls = cont.map((c) => c.slice(ind));
      o[k] = v.trim()[0] === "|" ? ls.join("\n").replace(/\n+$/, "") : fold(ls);
      continue;
    }
    o[k] = scalar(cont.length ? v + " " + cont.map((c) => c.trim()).join(" ") : v);
  }
  return o;
}

export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function inline(t) {
  return esc(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, h) => `<a href="${h}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener"' : ""}>${a}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>")
    .replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>")
    .replace(/ {2}\n/g, "<br>");
}

// Markdown subset: headings, paragraphs, > pull quotes, lists, images, links, bold, italic.
// If the body is already HTML (some editors save rich text as HTML), it is used as it is.
export function md(src = "") {
  src = String(src).trim();
  if (/^<(p|h[1-6]|ul|ol|blockquote|figure|div|img)[\s>]/i.test(src)) return src;
  return src.split(/\r?\n\s*\r?\n/).map((b) => {
    b = b.trim();
    if (!b) return "";
    let m;
    if ((m = b.match(/^(#{2,4})\s+(.*)$/s))) return `<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`;
    if (/^#\s/.test(b)) return `<h2>${inline(b.slice(2))}</h2>`;
    if (/^>/.test(b)) return `<blockquote><p>${inline(b.replace(/^>\s?/gm, ""))}</p></blockquote>`;
    if (/^[-*]\s/.test(b)) return `<ul>${b.split(/\n(?=[-*]\s)/).map((li) => `<li>${inline(li.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    if (/^\d+\.\s/.test(b)) return `<ol>${b.split(/\n(?=\d+\.\s)/).map((li) => `<li>${inline(li.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
    if ((m = b.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) return `<figure><img src="${esc(m[2])}" alt="${esc(m[1])}" loading="lazy">${m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : ""}</figure>`;
    return `<p>${inline(b)}</p>`;
  }).join("\n");
}

export const words = (s) => String(s).replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
