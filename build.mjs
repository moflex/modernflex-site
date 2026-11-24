// MODERNFLEX site builder. Run `node build.mjs`; the finished site is written to dist/.
// No packages needed. Content lives in content/, styles and scripts in src/.
import fs from "node:fs";
import path from "node:path";
import { parseFront, md, esc, words } from "./src/content.mjs";
import { plate, PLATE_DEFS } from "./src/plates.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };

/* ---------- load content ---------- */
const S = JSON.parse(read("content/settings.json"));
export const SECTIONS = ["Fashion", "Music", "Art", "Photography", "Culture", "Pop culture", "Technology & creativity"];
const slugify = (s) => String(s).toLowerCase().replace(/&/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fmtDate = (d) => { const t = new Date(String(d) + "T12:00:00Z"); return isNaN(t) ? String(d || "") : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); };
const PLATE_CYCLE = [["vinyl", "ink"], ["figure", "cream"], ["crowd", "blue"], ["cranes", "bone"], ["lens", "cream"], ["blocks", "ink"]];

function loadDir(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith(".md")).map((f, i) => {
    const { data, body } = parseFront(fs.readFileSync(path.join(full, f), "utf8"));
    return { ...data, slug: slugify(f.replace(/\.md$/, "")), body, i };
  }).filter((x) => x.title && x.draft !== true);
}
const byDate = (a, b) => String(b.date || "").localeCompare(String(a.date || ""));
const warn = [];

const stories = loadDir("content/stories").map((s) => {
  if (!SECTIONS.includes(s.section)) warn.push(`Story "${s.slug}" has an unknown section "${s.section}".`);
  const [pk, pt] = PLATE_CYCLE[s.i % PLATE_CYCLE.length];
  const html = md(s.body);
  return { ...s, section: s.section || "Culture", format: s.format || "Article", location: s.location || "Worldwide", dateText: fmtDate(s.date), read: s.read || `${Math.max(2, Math.ceil(words(html) / 220))} min`, html, plate: s.plate || pk, tone: s.tone || pt, url: `/stories/${s.slug}/` };
}).sort(byDate);

const ytId = (u) => { const m = String(u || "").match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{6,})/); return m ? m[1] : ""; };
const TV = S.mftv || {};
const channelUrl = TV.channel_id ? `https://www.youtube.com/channel/${TV.channel_id}` : ((S.socials || []).find((x) => /youtube/i.test(x.label || x.url)) || {}).url || "";

// Latest videos from the YouTube channel (its public feed holds the newest 15).
// A video with its own file in content/episodes (same YouTube link) uses that file's details instead.
const xmlText = (s) => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&").trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`)); return m ? xmlText(m[1]) : ""; };
async function channelVideos() {
  if (!TV.channel_id || TV.auto_from_youtube === false) return [];
  try {
    const r = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(TV.channel_id)}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const xml = await r.text();
    const vids = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
      const id = tag(e, "yt:videoId");
      const desc = tag(e, "media:description").split(/\n/).map((l) => l.trim()).filter(Boolean)[0] || "";
      return { title: tag(e, "title"), yt: id, date: tag(e, "published").slice(0, 10), description: desc.length > 160 ? desc.slice(0, 157).replace(/\s+\S*$/, "") + "…" : desc, image: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, image_alt: tag(e, "title"), series: TV.default_series || "Latest", location: "", length: "", fromFeed: true };
    }).filter((v) => v.yt && v.title);
    console.log(`YouTube: found ${vids.length} video${vids.length === 1 ? "" : "s"} on the channel.`);
    return vids;
  } catch (err) {
    warn.push(`Couldn't read the YouTube channel feed (${err.message}). Built MFTV from episode files only.`);
    return [];
  }
}
const manualEps = loadDir("content/episodes").map((e) => {
  const [pk, pt] = PLATE_CYCLE[(e.i + 2) % PLATE_CYCLE.length];
  return { ...e, yt: ytId(e.youtube), plate: e.plate || pk, tone: e.tone || pt, description: e.description || "", date: String(e.date || "") };
});
const feedEps = await channelVideos();
const episodes = [
  ...manualEps.map((e) => { const f = feedEps.find((v) => v.yt && v.yt === e.yt); return f ? { ...f, ...Object.fromEntries(Object.entries(e).filter(([, v]) => v !== "" && v != null)) } : e; }),
  ...feedEps.filter((v) => !manualEps.some((e) => e.yt === v.yt))
].sort(byDate);

const about = (() => { try { return parseFront(read("content/pages/about.md")); } catch { return { data: {}, body: "" }; } })();
const find = (slug) => stories.find((s) => s.slug === slugify(slug || ""));

/* ---------- components ---------- */
const pic = (o, sizes = "100vw") => o.image ? `<img src="${esc(o.image)}" alt="${esc(o.image_alt || "")}" loading="lazy" decoding="async" sizes="${sizes}">` : plate(o.plate, o.tone);
const kick = (s) => `<p class="k">${esc(s.section)} / ${esc(s.format)} <span class="mute">/ ${esc(s.location)}</span></p>`;
const card = (s) => `<a class="card" href="${s.url}"><div class="pl">${pic(s, "(max-width: 800px) 100vw, 50vw")}</div>${kick(s)}<h3 class="D">${esc(s.title)}</h3><p class="dek">${esc(s.dek)}</p></a>`;
const playIcon = `<svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d="M9 6L22 14L9 22Z" fill="currentColor"/></svg>`;
const player = (e) => `<div class="frame" data-yt="${esc(e.yt)}" data-title="${esc(e.title)}"><div class="pl">${pic(e)}</div><div class="ov"><span class="chip rec">MFTV</span>${e.length ? `<span class="chip">${esc(e.length)}</span>` : ""}</div><button class="play" type="button" data-play aria-label="Play ${esc(e.title)}">${playIcon}</button></div>
<div class="g12 pinfo"><div class="pt"><p class="k">${[e.series, e.location].filter(Boolean).map(esc).join(" / ")}</p><h3 class="D">${esc(e.title)}</h3></div><p class="pd">${esc(e.description)}</p></div>`;
const epInner = (e) => `<div class="pl">${pic(e, "33vw")}</div><p class="k mute">${[e.series, e.length].filter(Boolean).map(esc).join(" / ")}</p><h3 class="D">${esc(e.title)}</h3>`;

function newsletter(where) {
  const n = S.newsletter || {};
  const ext = /^https:\/\//.test(n.action || "");
  const attrs = ext ? `action="${esc(n.action)}" method="post" target="_blank"` : `name="newsletter" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="company"`;
  return `<section class="nl x" id="newsletter"><div class="wrap g12"><div class="nh"><h2 class="D">Newsletter</h2><p class="tag">${esc(n.tagline || "In your inbox, unfiltered.")}</p></div>
<form class="nf" ${attrs}>${ext ? "" : `<input type="hidden" name="form-name" value="newsletter"><p class="hp"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>`}<p class="np">${esc(n.pitch || "")}</p>
<div class="nrow"><label class="sr" for="nl-${where}">Email address</label><input id="nl-${where}" name="${esc(ext ? (n.field || "email") : "email")}" type="email" autocomplete="email" placeholder="you@example.com" required><button class="btn" type="submit">Subscribe</button></div><p class="msg" role="status" aria-live="polite"></p></form></div></section>`;
}

const tvSoon = () => `<div class="soon"><p class="ct">${esc(TV.coming_soon || "First episodes landing soon.")}</p>${channelUrl ? `<a class="btn" href="${esc(channelUrl)}" target="_blank" rel="noopener">Subscribe on YouTube</a>` : ""}</div>`;

const NAV = [["Editorial", "/editorial/"], ["MFTV", "/mftv/"], ["Community", "/community/"], ["About", "/about/"]];
function page({ title, desc, body, cur = "", cls = "", pathName = "/", image = "" }) {
  const site = S.site || {};
  const full = title ? `${title} | MODERNFLEX` : "MODERNFLEX | The culture. Unfiltered.";
  const d = desc || site.description || "";
  const canon = (site.url || "").replace(/\/$/, "") + pathName;
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(d)}">
${site.url ? `<link rel="canonical" href="${esc(canon)}">` : ""}
<meta property="og:title" content="${esc(full)}"><meta property="og:description" content="${esc(d)}"><meta property="og:type" content="website">${image ? `<meta property="og:image" content="${esc(/^https?:/.test(image) ? image : (site.url || "").replace(/\/$/, "") + image)}">` : ""}
<meta name="theme-color" content="#0E0D0B">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,300..900;1,62..125,300..900&family=Instrument+Serif:ital@0;1&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${BUILD}">
</head>
<body class="${cls}">
<a class="skip" href="#main">Skip to content</a>
${PLATE_DEFS}
<header class="bar x"><div class="wrap in">
<a class="mini D" href="/" aria-label="MODERNFLEX home">MODERNFLEX</a>
<nav class="nav" aria-label="Main">${NAV.map(([l, h]) => `<a href="${h}"${cur === h ? ' aria-current="page"' : ""}>${l}</a>`).join("")}</nav>
<div class="side"><a href="/#newsletter">Newsletter</a><a href="/contact/">Contact</a></div>
</div></header>
<main id="main">
${body}
</main>
<footer class="ft x"><div class="wrap">
<div class="fw D" aria-hidden="true"><span class="fit">MODERNFLEX<sup>®</sup></span></div>
<div class="fg">
<div><p class="k">The culture. Unfiltered.</p><p class="S fs">${esc(site.footer || "")}</p></div>
<nav aria-label="Footer"><p class="k">Explore</p>${NAV.map(([l, h]) => `<a href="${h}">${l}</a>`).join("")}<a href="/contact/">Contact</a></nav>
<div><p class="k">Follow</p>${(S.socials || []).filter((x) => x.url).map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join("")}</div>
<div><p class="k">Contact</p><p><a href="mailto:${esc(site.email)}">${esc(site.email)}</a></p><p>${esc(site.base || "")}</p></div>
</div>
<p class="sm">© ${new Date().getFullYear()} MODERNFLEX®.${site.smallprint ? " " + esc(site.smallprint) : ""}</p>
</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
<script src="/assets/site.js?v=${BUILD}" defer></script>
<!-- Cloudflare Web Analytics --><script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "a2774662cb5f4905837c6749cc65e492"}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
`;
}
const BUILD = Date.now().toString(36);

/* ---------- pages ---------- */
function home() {
  const h = S.home || {};
  const used = new Set();
  const take = (slug) => { const s = find(slug); if (s && !used.has(s)) { used.add(s); return s; } return null; };
  const next = () => { const s = stories.find((x) => !used.has(x)); if (s) used.add(s); return s; };
  const hero = take(h.hero) || next();
  const edit = [0, 1, 2, 3].map((i) => take((h.edit || [])[i]) || next()).filter(Boolean);
  const also = [0, 1, 2].map((i) => take((h.also || [])[i]) || next()).filter(Boolean);
  const [ep0, ...eps] = episodes;
  const m = S.masthead || {};
  const block = (s, cl) => s ? `<div class="${cl}">${card(s)}</div>` : "";
  return page({ cls: "home", pathName: "/", body: `
<section class="mast x"><div class="wrap">
<div class="top k"><span>${esc(m.left || "")}</span><span>${esc(m.right || "")}</span></div>
<h1 class="wm D" aria-label="MODERNFLEX"><span class="fit">MODERNFLEX<sup>®</sup></span></h1>
<div class="tagrow"><p class="tag">The culture. Unfiltered.</p><p class="k">${esc(m.signoff || "")}</p></div></div></section>
${hero ? `<section class="hero x"><div class="wrap"><a class="card" href="${hero.url}"><div class="pl hpl">${pic(hero)}</div>
<div class="g12"><div class="hl">${kick(hero)}<h2 class="D">${esc(hero.title)}</h2></div><div class="hs"><p class="dek">${esc(hero.dek)}</p><p class="k mute">${esc(hero.read)} read</p></div></div></a></div></section>` : ""}
<section class="x"><div class="wrap"><div class="sh"><h2 class="D">The Edit</h2><a class="more" href="/editorial/">All editorial</a></div>
<div class="g12 edit">${block(edit[0], "e1")}${block(edit[1], "e2")}
${edit[2] ? `<a class="card e3" href="${edit[2].url}">${kick(edit[2])}<h3>${esc(edit[2].title)}</h3><p class="dek">${esc(edit[2].dek)}</p></a>` : ""}${block(edit[3], "e4")}
${also.length ? `<div class="also">${also.map((s) => `<a class="card" href="${s.url}"><p class="k mute">${esc(s.section)} / ${esc(s.location)}</p><h4 class="D">${esc(s.title)}</h4></a>`).join("")}</div>` : ""}</div></div></section>
<section class="tvb x"><div class="wrap"><div class="sh"><div><h2 class="D">MFTV</h2><p class="tag">${esc(TV.home_tagline || "")}</p></div><a class="more" href="/mftv/">Watch MFTV</a></div>
${ep0 ? `${player(ep0)}${eps.length ? `<div class="eps">${eps.slice(0, 3).map((e) => `<a class="ep" href="/mftv/">${epInner(e)}</a>`).join("")}</div>` : ""}` : tvSoon()}</div></section>
<section class="com x"><div class="wrap g12"><p class="ct">${esc((S.community || {}).home_statement || "")}</p>
<div class="cw"><p class="k mute">Built for</p><p class="who D">${esc((S.community || {}).built_for || "")}</p><div class="acts"><a class="btn" href="/community/">Explore community</a><a class="lnk" href="/contact/">Submit your work</a></div></div></div></section>
${newsletter("home")}` });
}

function editorialPage(sec) {
  const list = sec ? stories.filter((s) => s.section === sec) : stories;
  const [lead, ...rest] = list;
  const chips = [["All", "/editorial/"], ...SECTIONS.map((c) => [c, `/editorial/${slugify(c)}/`])];
  const here = sec ? `/editorial/${slugify(sec)}/` : "/editorial/";
  return page({ title: sec || "Editorial", cur: "/editorial/", pathName: here, desc: (S.editorial || {}).intro, body: `
<section class="ph x"><div class="wrap"><h1 class="D">${esc(sec || "Editorial")}</h1><p class="intro">${esc((S.editorial || {}).intro || "")}</p>
<nav class="flt" aria-label="Sections">${chips.map(([l, h]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ""}>${esc(l)}</a>`).join("")}</nav></div></section>
<section class="x"><div class="wrap">${lead ? `<a class="card g12 lead" href="${lead.url}"><div class="pl">${pic(lead, "(max-width: 800px) 100vw, 60vw")}</div><div class="t">${kick(lead)}<h2 class="D">${esc(lead.title)}</h2><p class="dek">${esc(lead.dek)}</p><p class="k mute">${esc(lead.dateText)} / ${esc(lead.read)} read</p></div></a>` : `<p class="empty S">Nothing in ${esc(sec)} yet.</p>`}
<ul class="rows">${rest.map((s) => `<li><a class="row card" href="${s.url}"><div class="pl">${pic(s, "200px")}</div><div>${kick(s)}<h3 class="D">${esc(s.title)}</h3><p class="dek">${esc(s.dek)}</p></div><p class="meta k mute">${esc(s.dateText)}<br>${esc(s.read)} read</p></a></li>`).join("")}</ul></div></section>` });
}

function storyPage(s) {
  const rel = [...stories.filter((x) => x !== s && (x.section === s.section || x.format === s.format)), ...stories.filter((x) => x !== s)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 3);
  return page({ title: s.title, desc: s.dek, cur: "/editorial/", pathName: s.url, image: s.image, body: `
<article><header class="ah x"><div class="wrap"><p class="k"><a href="/editorial/${slugify(s.section)}/">${esc(s.section)}</a> / ${esc(s.format)} <span class="mute">/ ${esc(s.location)}</span></p><h1 class="D">${esc(s.title)}</h1><p class="dek">${esc(s.dek)}</p><p class="k mute">Words: ${esc(s.author || "MODERNFLEX Editorial")} / ${esc(s.dateText)} / ${esc(s.read)} read</p></div></header>
<div class="x"><div class="wrap"><div class="pl apl">${pic(s)}</div>${s.image_credit ? `<p class="k mute" style="margin-top:8px">${esc(s.image_credit)}</p>` : ""}</div></div>
<div class="x"><div class="wrap g12 sec"><div class="prose">${s.html}</div></div></div></article>
${rel.length ? `<section class="x"><div class="wrap"><div class="sh"><h2 class="D">Keep reading</h2><a class="more" href="/editorial/">All editorial</a></div><div class="g12 r3">${rel.map(card).join("")}</div></div></section>` : ""}` });
}

function mftvPage() {
  const tv = TV;
  const series = tv.series || [];
  const json = JSON.stringify(episodes.map(player)).replace(/</g, "\\u003c");
  return page({ title: "MFTV", cls: "tv", cur: "/mftv/", pathName: "/mftv/", desc: tv.tagline, body: `
<section class="tvp x"><div class="wrap"><div class="tvh"><h1 class="D">MFTV</h1><p class="tag">${esc(tv.tagline || "")}</p></div><div id="player">${episodes[0] ? player(episodes[0]) : tvSoon()}</div></div></section>
${series.length ? `<section class="x sec"><div class="wrap"><div class="sh"><h2 class="D">Series</h2></div><ul class="ser">${series.map((x) => { const c = episodes.filter((e) => e.series === x.name).length; return `<li><h3 class="D">${esc(x.name)}</h3><p>${esc(x.text)}</p><p class="k mute">${c ? `${c} episode${c === 1 ? "" : "s"}` : "Coming soon"}</p></li>`; }).join("")}</ul></div></section>` : ""}
${episodes.length ? `<section class="x sec"><div class="wrap"><div class="sh"><h2 class="D">Episodes</h2>${channelUrl ? `<a class="more" href="${esc(channelUrl)}" target="_blank" rel="noopener">All on YouTube</a>` : ""}</div><div class="eps all">${episodes.map((e, i) => `<button class="ep" type="button" data-ep="${i}" aria-pressed="${i === 0}">${epInner(e)}</button>`).join("")}</div></div></section>` : ""}
<script type="application/json" id="eps">${json}</script>` });
}

function communityPage() {
  const c = S.community || {};
  const li = (x) => `<li><h3 class="D">${esc(x.title)}</h3><div><p>${esc(x.text)}</p>${x.link ? `<a class="lnk" href="${esc(x.link)}">${esc(x.link_label || "Find out more")}</a>` : ""}</div></li>`;
  return page({ title: "Community", cur: "/community/", pathName: "/community/", desc: c.intro, body: `
<section class="ph x"><div class="wrap"><h1 class="D">Community</h1><p class="intro">${esc(c.intro || "")}</p></div></section>
<section class="x sec"><div class="wrap g12"><p class="k mute cl">Who it’s for</p><p class="D cr">${esc(c.who_for || "")}</p></div></section>
${(c.open_now || []).length ? `<section class="x sec"><div class="wrap"><div class="sh"><h2 class="D">Open now</h2></div><ul class="lst">${c.open_now.map(li).join("")}</ul></div></section>` : ""}
${(c.in_development || []).length ? `<section class="x sec"><div class="wrap"><div class="sh"><h2 class="D">In development</h2><p class="k mute">Coming as the community grows</p></div><ul class="lst">${c.in_development.map(li).join("")}</ul></div></section>` : ""}
${newsletter("com")}` });
}

function aboutPage() {
  const a = about.data;
  return page({ title: "About", cur: "/about/", pathName: "/about/", desc: a.description, body: `
<section class="ph x"><div class="wrap"><h1 class="D">About</h1></div></section>
<section class="x sec"><div class="wrap g12 ab"><p class="abs D">${esc(a.statement || "")}</p><div class="abt">${md(about.body)}
<div class="acts"><a class="btn" href="/contact/">Work with us</a><a class="lnk" href="/editorial/">Read the latest</a></div></div></div></section>
<section class="x sec"><div class="wrap"><div class="sh"><h2 class="D">What we cover</h2></div><p class="cov D">${SECTIONS.map(esc).join(" / ")}</p></div></section>` });
}

function contactPage() {
  const reasons = S.contact_reasons || [];
  return page({ title: "Contact", pathName: "/contact/", desc: "Collaborations, editorial submissions, partnerships, events and general enquiries.", body: `
<section class="ph x"><div class="wrap"><h1 class="D">Contact</h1><p class="intro">Got a story, a project or an idea that belongs here? Tell us.</p></div></section>
<section class="x sec"><div class="wrap g12"><div class="cr1"><ul class="rs">${reasons.map((r) => `<li><h3 class="D">${esc(r.title)}</h3><p>${esc(r.text)}</p></li>`).join("")}</ul><p class="k mute">Or email</p><p class="em S"><a href="mailto:${esc(S.site.email)}">${esc(S.site.email)}</a></p></div>
<form class="cf" name="contact" method="POST" action="/thanks/" data-netlify="true" netlify-honeypot="company">
<input type="hidden" name="form-name" value="contact"><p class="hp"><label>Company <input name="company" tabindex="-1" autocomplete="off"></label></p>
<div class="two"><div class="fld"><label for="c-name">Name</label><input id="c-name" name="name" autocomplete="name" required data-req="Add your name."></div><div class="fld"><label for="c-email">Email</label><input id="c-email" name="email" type="email" autocomplete="email" required></div></div>
<div class="fld"><label for="c-reason">What’s it about?</label><select id="c-reason" name="reason">${reasons.map((r) => `<option>${esc(r.title)}</option>`).join("")}</select></div>
<div class="fld"><label for="c-link">Link to your work (optional)</label><input id="c-link" name="link" type="url" placeholder="https://"></div>
<div class="fld"><label for="c-msg">Message</label><textarea id="c-msg" name="message" required data-req="Write a short message."></textarea></div>
<div><button class="btn" type="submit">Send message</button><p class="msg" role="status" aria-live="polite"></p></div></form></div></section>` });
}

const simple = (t, h, p, links) => page({ title: t, pathName: "/" + slugify(t) + "/", body: `<section class="ph x"><div class="wrap"><h1 class="D">${h}</h1><p class="intro">${p}</p><div class="acts" style="margin-top:28px">${links}</div></div></section>` });

/* ---------- write ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.cpSync(path.join(ROOT, "public"), OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "src/site.css"), path.join(OUT, "assets/site.css"));
fs.copyFileSync(path.join(ROOT, "src/site.js"), path.join(OUT, "assets/site.js"));

write("index.html", home());
write("editorial/index.html", editorialPage(""));
for (const sec of SECTIONS) write(`editorial/${slugify(sec)}/index.html`, editorialPage(sec));
for (const s of stories) write(`stories/${s.slug}/index.html`, storyPage(s));
write("mftv/index.html", mftvPage());
write("community/index.html", communityPage());
write("about/index.html", aboutPage());
write("contact/index.html", contactPage());
write("thanks/index.html", simple("Thanks", "Thank you", "Got it. If you sent a message, we’ll reply as soon as we can. If you signed up, the next newsletter is on its way to you.", `<a class="btn" href="/">Back to the homepage</a><a class="lnk" href="/editorial/">Read the latest</a>`));
write("404.html", simple("Not found", "Lost?", "That page doesn’t exist, or it’s moved.", `<a class="btn" href="/">Homepage</a><a class="lnk" href="/editorial/">Editorial</a>`));

const base = (S.site.url || "").replace(/\/$/, "");
if (base) {
  const urls = ["/", "/editorial/", ...SECTIONS.map((s) => `/editorial/${slugify(s)}/`), ...stories.map((s) => s.url), "/mftv/", "/community/", "/about/", "/contact/"];
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${base}${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
}

for (const w of warn) console.warn("Warning: " + w);
console.log(`Built ${stories.length} stories, ${episodes.length} episodes and ${SECTIONS.length} section pages into dist/.`);
