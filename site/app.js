"use strict";

const CATEGORIES = [
  ["basics", "Language basics"],
  ["data", "Data wrangling"],
  ["statistics", "Statistics"],
  ["causal", "Causal inference"],
  ["omop", "OMOP / OHDSI"],
  ["bioinformatics", "Bioinformatics"],
  ["visualization", "Visualization"],
  ["reproducibility", "Reproducibility"],
  ["ml", "Machine learning"],
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES);
const LEVEL_LABEL = { beginner: "beginner", intermediate: "intermediate", advanced: "advanced" };
const LANG_LABEL = { python: "Python", r: "R", both: "Python + R" };
const THEMES = ["auto", "light", "dark"];
const THEME_LABEL = { auto: "Theme: auto", light: "Theme: light", dark: "Theme: dark" };

const state = {
  items: [],
  generated: null,
  lang: "python",
  query: "",
  packages: new Set(),
  current: null,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
  },
};

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function categoryLabel(cat) {
  return CATEGORY_LABEL[cat] || cat;
}

function categoryRank(cat) {
  const i = CATEGORIES.findIndex(([key]) => key === cat);
  return i === -1 ? CATEGORIES.length : i;
}

function forLang(lang) {
  return state.items.filter((it) => it.lang === lang || it.lang === "both");
}

function href(lang, slug) {
  return slug ? `#/${lang}/${encodeURIComponent(slug)}` : `#/${lang}`;
}

/* ---------- filtering ---------- */

function haystack(it) {
  if (!it._hay) {
    it._hay = [
      it.title, it.summary, categoryLabel(it.category), it.category,
      ...(it.tags || []), ...(it.packages || []).map((p) => p.name),
      ...(it.source_lessons || []), ...(it.datasets || []),
    ].join(" ").toLowerCase();
    it._body = (it.body || "").toLowerCase();
  }
  return it;
}

function filtered() {
  const tokens = state.query.toLowerCase().split(/\s+/).filter(Boolean);
  const out = [];
  for (const it of forLang(state.lang)) {
    if (state.packages.size && !it.packages.some((p) => state.packages.has(p.name))) continue;
    if (tokens.length) {
      haystack(it);
      const inMeta = tokens.every((t) => it._hay.includes(t));
      const inAny = inMeta || tokens.every((t) => it._hay.includes(t) || it._body.includes(t));
      if (!inAny) continue;
      out.push({ it, bodyOnly: !inMeta });
    } else {
      out.push({ it, bodyOnly: false });
    }
  }
  return out;
}

function groupByCategory(entries) {
  const groups = new Map();
  for (const e of entries) {
    const cat = e.it.category;
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(e);
  }
  return [...groups.entries()]
    .sort((a, b) => categoryRank(a[0]) - categoryRank(b[0]) || a[0].localeCompare(b[0]))
    .map(([cat, list]) => [cat, list.sort((a, b) => bySeries(a.it, b.it))]);
}

// Within a category: the order field (learning sequence), then title.
function bySeries(a, b) {
  return (a.order ?? 999) - (b.order ?? 999) || a.title.localeCompare(b.title, "en");
}

/* ---------- sidebar ---------- */

function renderLangSwitch() {
  for (const btn of $$(".lang-switch button")) {
    const lang = btn.dataset.lang;
    const active = lang === state.lang;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active);
    $(".count", btn).textContent = forLang(lang).length;
  }
  document.body.dataset.lang = state.lang;
}

function renderChips() {
  const counts = new Map();
  for (const it of forLang(state.lang)) {
    for (const p of it.packages) counts.set(p.name, (counts.get(p.name) || 0) + 1);
  }
  // Drop selections that do not exist in this language.
  for (const name of [...state.packages]) if (!counts.has(name)) state.packages.delete(name);

  const names = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
  $("#chips").innerHTML = names.length
    ? names.map((n) => `<button type="button" class="chip${state.packages.has(n) ? " on" : ""}" data-pkg="${esc(n)}">${esc(n)}<span>${counts.get(n)}</span></button>`).join("")
    : `<span class="muted small">No packages yet</span>`;
  $("#pkg-clear").hidden = state.packages.size === 0;
}

function renderNav() {
  const entries = filtered();
  const nav = $("#nav");
  if (!entries.length) {
    const any = forLang(state.lang).length > 0;
    nav.innerHTML = `<p class="nav-empty">${any ? "Nothing found" : `No ${LANG_LABEL[state.lang]} cheatsheets yet`}</p>`;
    return;
  }
  nav.innerHTML = groupByCategory(entries).map(([cat, list]) => `
    <div class="nav-group">
      <div class="section-label"><span>${esc(categoryLabel(cat))}</span><span class="muted">${list.length}</span></div>
      <ul>
        ${list.map(({ it, bodyOnly }) => `
          <li>
            <a href="${href(state.lang, it.slug)}" class="nav-item${state.current === it ? " active" : ""}">
              <span class="nav-title">${esc(it.title)}${it.lang === "both" ? ` <span class="tag-both">Py+R</span>` : ""}</span>
              <span class="nav-sub">${esc(it.packages.map((p) => p.name).join(", ") || (it.datasets || []).join(", ") || categoryLabel(it.category))}${bodyOnly ? " · match in text" : ""}</span>
            </a>
          </li>`).join("")}
      </ul>
    </div>`).join("");
}

function renderFoot() {
  if (!state.generated) return;
  const d = new Date(state.generated);
  $("#sidebar-foot").textContent = `${state.items.length} ${plural(state.items.length)} · built ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function renderSidebar() {
  renderLangSwitch();
  renderChips();
  renderNav();
}

/* ---------- views ---------- */

function pkgBadges(it, clickable) {
  return it.packages.map((p) => {
    const label = `${esc(p.name)}${p.version ? ` <span class="ver">${esc(p.version)}</span>` : ""}`;
    return clickable
      ? `<button type="button" class="badge badge-pkg" data-pkg="${esc(p.name)}" title="Show all cheatsheets using ${esc(p.name)}">${label}</button>`
      : `<span class="badge badge-pkg">${label}</span>`;
  }).join("");
}

function renderHome() {
  const entries = filtered();
  const total = forLang(state.lang).length;
  $("#topbar-title").textContent = LANG_LABEL[state.lang];
  document.title = `${LANG_LABEL[state.lang]} · Cheatsheets`;

  const groups = groupByCategory(entries);
  const filterNote = state.packages.size || state.query
    ? `<p class="muted">Showing ${entries.length} of ${total} · filter: ${esc([...state.packages, state.query].filter(Boolean).join(", "))}</p>`
    : "";

  $("#view").innerHTML = `
    <section class="home">
      <header class="home-head">
        <p class="eyebrow">${total} ${plural(total)}</p>
        <h1>${LANG_LABEL[state.lang]}</h1>
        <p class="lede">Pick a cheatsheet on the left or filter by package. New files show up here automatically after a push to GitHub.</p>
        ${filterNote}
      </header>
      ${groups.length ? groups.map(([cat, list]) => `
        <section class="home-group">
          <h2>${esc(categoryLabel(cat))}</h2>
          <div class="cards">
            ${list.map(({ it }) => `
              <a class="card" href="${href(state.lang, it.slug)}">
                <span class="card-title">${esc(it.title)}</span>
                <span class="card-summary">${esc(it.summary)}</span>
                <span class="card-meta">
                  ${pkgBadges(it, false)}
                  ${it.level ? `<span class="badge">${esc(LEVEL_LABEL[it.level] || it.level)}</span>` : ""}
                  ${it.lang === "both" ? `<span class="badge badge-both">Python + R</span>` : ""}
                </span>
              </a>`).join("")}
          </div>
        </section>`).join("") : `<div class="empty"><p>Nothing here yet.</p><p class="muted">Add a <code>.md</code> file to <code>content/</code> and push.</p></div>`}
    </section>`;
}

function plural(n) {
  return n === 1 ? "cheatsheet" : "cheatsheets";
}

function slugify(text, used) {
  let base = text.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";
  let id = base, n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

// Group each h3 with the content after it into a card, so a sheet reads as blocks.
function wrapBlocks(prose) {
  for (const h3 of $$("h3", prose)) {
    const block = document.createElement("section");
    block.className = "block";
    h3.before(block);
    let node = h3;
    while (node && !(node !== h3 && node.nodeType === 1 && /^H[1-3]$/.test(node.tagName))) {
      const next = node.nextSibling;
      block.appendChild(node);
      node = next;
    }
  }
}

// ```r plot blocks are numbered in order, so the rendered output (built by
// scripts/check_code.py --plots) can be placed right after each one.
let plotBlock = 0;
if (window.marked) {
  marked.use({
    renderer: {
      code(code, info) {
        if (!/\bplot\b/.test(info || "")) return false;
        plotBlock += 1;
        const lang = (info.match(/^\S+/) || [""])[0];
        return `<pre data-plot="${plotBlock}"><code class="language-${esc(lang)}">${esc(code.replace(/\n$/, ""))}\n</code></pre>\n`;
      },
    },
  });
}

function plotFigure(files) {
  const fig = document.createElement("figure");
  fig.className = "plot-output";
  fig.innerHTML = files.map((f) => /\.html$/i.test(f)
    ? `<iframe src="${esc(f)}" loading="lazy" title="Interactive output of the code above"></iframe>`
    : `<img src="${esc(f)}" loading="lazy" alt="Plot produced by the code above">`).join("")
    + `<figcaption>Output of the code above</figcaption>`;
  return fig;
}

function enhanceCode(prose, plots) {
  for (const pre of $$("pre", prose)) {
    const code = $("code", pre);
    if (!code) continue;
    const lang = (code.className.match(/language-([\w+-]+)/) || [])[1] || "";
    if (window.hljs && lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
    const wrap = document.createElement("div");
    wrap.className = `code lang-${lang || "text"}`;
    wrap.innerHTML = `<div class="code-head"><span>${esc(lang || "text")}</span><button type="button" class="copy-btn">Copy</button></div>`;
    pre.before(wrap);
    wrap.appendChild(pre);
    const files = pre.dataset.plot && plots && plots[pre.dataset.plot];
    if (files && files.length) wrap.after(plotFigure(files));
  }
}

// Wrap each h2 and what follows it into a section, the unit the page filter hides.
function sectionize(prose) {
  for (const h2 of $$(":scope > h2", prose)) {
    const sec = document.createElement("section");
    sec.className = "sec";
    h2.before(sec);
    let node = h2;
    while (node && !(node !== h2 && node.tagName === "H2")) {
      const next = node.nextSibling;
      sec.appendChild(node);
      node = next;
    }
  }
}

// Page filter: hide cards, list items and table rows that do not contain every word.
function filterSheet(query) {
  const prose = $("#prose");
  if (!prose) return;
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const has = (el) => {
    const text = el.textContent.toLowerCase();
    return tokens.every((t) => text.includes(t));
  };
  let shownCards = 0, totalCards = 0, anyVisible = false;
  for (const sec of $$(".sec", prose)) {
    const h2 = $(":scope > h2", sec);
    const all = !tokens.length || (h2 && has(h2));
    let visible = false;
    for (const el of sec.children) {
      if (el === h2) continue;
      const parts = el.matches("ul, ol") ? [...el.children]
        : el.matches(".table-wrap") ? $$("tbody tr", el) : [el];
      let shown = 0;
      for (const part of parts) {
        const ok = all || has(part);
        part.hidden = !ok;
        shown += ok;
        if (part.classList.contains("block")) { totalCards += 1; shownCards += ok; }
      }
      if (parts[0] !== el) el.hidden = shown === 0;
      visible = visible || shown > 0;
    }
    sec.hidden = !(all || visible);
    anyVisible = anyVisible || !sec.hidden;
  }
  const count = $("#filter-count");
  if (count) count.textContent = tokens.length ? `${shownCards} of ${totalCards} cards` : `${totalCards} cards`;
  $("#filter-empty").hidden = anyVisible;
  for (const a of $$("#toc a")) {
    const target = document.getElementById(a.dataset.target);
    a.parentElement.hidden = !target || !!target.closest("[hidden]");
  }
  highlightMatches(prose, tokens);
  if (tocSpy) tocSpy();
}

function highlightMatches(root, tokens) {
  if (!window.CSS || !CSS.highlights || typeof Highlight === "undefined") return;
  CSS.highlights.delete("cs-match");
  if (!tokens.length) return;
  const ranges = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest("[hidden], .code-head")) continue;
    const text = node.data.toLowerCase();
    for (const t of tokens) {
      for (let i = text.indexOf(t); i !== -1; i = text.indexOf(t, i + t.length)) {
        const r = new Range();
        r.setStart(node, i);
        r.setEnd(node, i + t.length);
        ranges.push(r);
      }
    }
  }
  CSS.highlights.set("cs-match", new Highlight(...ranges));
}

// Previous / next sheet in the same category, following the order field.
function seriesNav(it) {
  const list = forLang(state.lang).filter((x) => x.category === it.category).sort(bySeries);
  const i = list.indexOf(it);
  const prev = list[i - 1], next = list[i + 1];
  if (!prev && !next) return "";
  const link = (x, dir) => x
    ? `<a class="series-link series-${dir}" href="${href(state.lang, x.slug)}"><span>${dir === "prev" ? "← Previous" : "Next →"}</span>${esc(x.title)}</a>`
    : "<span></span>";
  return `<nav class="series-nav" aria-label="${esc(categoryLabel(it.category))} series">${link(prev, "prev")}${link(next, "next")}</nav>`;
}

function renderSheet(it) {
  $("#topbar-title").textContent = it.title;
  document.title = `${it.title} · Cheatsheets`;

  plotBlock = 0;
  const body = window.marked ? marked.parse(it.body, { gfm: true }) : `<pre>${esc(it.body)}</pre>`;
  const sources = (it.sources || []).filter((s) => s && s.url);

  $("#view").innerHTML = `
    <article class="sheet">
      <header class="sheet-head">
        <p class="eyebrow">
          <a href="${href(state.lang)}">${esc(LANG_LABEL[state.lang])}</a>
          <span>/</span><span>${esc(categoryLabel(it.category))}</span>
          ${it.level ? `<span>/</span><span>${esc(LEVEL_LABEL[it.level] || it.level)}</span>` : ""}
        </p>
        <h1>${esc(it.title)}</h1>
        <p class="lede">${esc(it.summary)}</p>
        <div class="meta">
          ${pkgBadges(it, true)}
          ${it.lang === "both" ? `<span class="badge badge-both">Python + R</span>` : ""}
          ${it.language_version ? `<span class="badge">${esc(it.language_version)}</span>` : ""}
          ${(it.datasets || []).map((d) => `<span class="badge badge-data" title="Dataset used in the examples">data: ${esc(d)}</span>`).join("")}
          ${(it.source_lessons || []).length ? `<span class="badge" title="MHEDAS course units">MHEDAS ${esc(it.source_lessons.join(", "))}</span>` : ""}
          ${it.last_verified ? `<span class="badge badge-date" title="Last checked against the official docs">verified ${esc(it.last_verified)}</span>` : ""}
        </div>
      </header>
      <div class="sheet-filter" role="search">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
        <input id="sheet-filter" type="search" placeholder="Filter this sheet: function, keyword…"
               value="${esc(state.query)}" autocomplete="off" spellcheck="false" aria-label="Filter this sheet">
        <span class="filter-count" id="filter-count"></span>
        <kbd>F</kbd>
      </div>
      <p class="filter-empty" id="filter-empty" hidden>Nothing on this page matches. Press Esc to clear the filter.</p>
      <div class="sheet-grid">
        <div class="prose" id="prose">${body}</div>
        <aside class="toc" id="toc" aria-label="Table of contents"></aside>
      </div>
      ${sources.length ? `
        <footer class="sources">
          <div class="section-label"><span>Sources</span></div>
          <ul>${sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a></li>`).join("")}</ul>
        </footer>` : ""}
      ${seriesNav(it)}
    </article>`;

  const prose = $("#prose");
  // A leading h1 duplicates the header.
  const first = prose.firstElementChild;
  if (first && first.tagName === "H1") first.remove();

  const used = new Set();
  const headings = $$("h2, h3", prose);
  for (const h of headings) h.id = slugify(h.textContent, used);

  wrapBlocks(prose);
  sectionize(prose);
  enhanceCode(prose, it.plots);
  for (const table of $$("table", prose)) {
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.before(wrap);
    wrap.appendChild(table);
  }
  for (const a of $$("a[href^='http']", prose)) {
    a.target = "_blank";
    a.rel = "noopener";
  }

  renderToc(headings);
  filterSheet(state.query);
  window.scrollTo(0, 0);
}

let tocSpy = null;

function renderToc(headings) {
  const toc = $("#toc");
  if (tocSpy) window.removeEventListener("scroll", tocSpy);
  tocSpy = null;
  if (headings.length < 3) {
    toc.remove();
    $(".sheet-grid").classList.add("no-toc");
    return;
  }
  toc.innerHTML = `<div class="section-label"><span>On this page</span></div><ul>${headings.map((h) =>
    `<li class="toc-${h.tagName.toLowerCase()}"><a href="#${h.id}" data-target="${h.id}">${esc(h.textContent)}</a></li>`).join("")}</ul>`;

  // Active = last heading above the top area; at the very bottom, the last heading.
  const links = $$("a", toc);
  tocSpy = () => {
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    let idx = 0;
    if (atBottom) idx = headings.length - 1;
    else headings.forEach((h, i) => { if (h.offsetParent && h.getBoundingClientRect().top < 120) idx = i; });
    links.forEach((a, i) => a.classList.toggle("active", i === idx));
  };
  window.addEventListener("scroll", tocSpy, { passive: true });
  tocSpy();
}

/* ---------- routing ---------- */

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  return { lang: parts[0], slug: parts[1] };
}

function route() {
  const { lang, slug } = parseHash();
  const it = slug ? state.items.find((x) => x.slug === slug) : null;

  if (lang === "python" || lang === "r") state.lang = lang;
  else state.lang = store.get("cs-lang") === "r" ? "r" : "python";
  // A python-only sheet opened under /r (or vice versa) switches language.
  if (it && it.lang !== "both" && it.lang !== state.lang) {
    state.lang = it.lang;
    history.replaceState(null, "", href(state.lang, it.slug));
  }
  store.set("cs-lang", state.lang);

  state.current = it || null;
  renderSidebar();
  if (it) renderSheet(it);
  else renderHome();
  closeNav();
}

function go(lang, slug) {
  const target = href(lang, slug);
  if (location.hash === target) route();
  else location.hash = target;
}

/* ---------- interactions ---------- */

function togglePackage(name, only) {
  if (only) {
    state.packages = new Set([name]);
  } else if (state.packages.has(name)) {
    state.packages.delete(name);
  } else {
    state.packages.add(name);
  }
  renderChips();
  renderNav();
  if (!state.current || only) go(state.lang);
}

function applyTheme(theme) {
  if (theme === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  const btn = $("#theme-btn");
  btn.title = THEME_LABEL[theme];
  btn.innerHTML = {
    auto: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/></svg>`,
    light: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    dark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>`,
  }[theme];
}

function openNav() { document.body.classList.add("nav-open"); }
function closeNav() { document.body.classList.remove("nav-open"); }

function bind() {
  window.addEventListener("hashchange", route);

  for (const btn of $$(".lang-switch button")) {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      const keep = state.current && state.current.lang === "both" ? state.current.slug : null;
      go(lang, keep);
    });
  }

  const search = $("#search");
  search.addEventListener("input", () => {
    state.query = search.value.trim();
    renderNav();
    if (!state.current) renderHome();
  });
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      search.value = "";
      state.query = "";
      renderNav();
      if (!state.current) renderHome();
      search.blur();
    } else if (e.key === "Enter") {
      const first = $("#nav .nav-item");
      if (first) location.hash = first.getAttribute("href");
    }
  });
  document.addEventListener("keydown", (e) => {
    if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey && $("#sheet-filter")
        && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      $("#sheet-filter").focus();
    }
    if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault();
      openNav();
      search.focus();
    }
  });

  $("#chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) togglePackage(chip.dataset.pkg, false);
  });
  $("#pkg-clear").addEventListener("click", () => {
    state.packages.clear();
    renderChips();
    renderNav();
    if (!state.current) renderHome();
  });

  $("#view").addEventListener("input", (e) => {
    if (e.target.id === "sheet-filter") filterSheet(e.target.value);
  });
  $("#view").addEventListener("keydown", (e) => {
    if (e.target.id === "sheet-filter" && e.key === "Escape") {
      e.target.value = "";
      filterSheet("");
      e.target.blur();
    }
  });

  $("#view").addEventListener("click", async (e) => {
    const pkg = e.target.closest(".badge-pkg[data-pkg]");
    if (pkg) {
      togglePackage(pkg.dataset.pkg, true);
      return;
    }
    const copy = e.target.closest(".copy-btn");
    if (copy) {
      const code = $("code", copy.closest(".code")).innerText;
      try {
        await navigator.clipboard.writeText(code);
        copy.textContent = "Copied";
      } catch {
        copy.textContent = "Copy failed";
      }
      setTimeout(() => { copy.textContent = "Copy"; }, 1500);
      return;
    }
    const tocLink = e.target.closest(".toc a, .prose a[href^='#']");
    if (tocLink) {
      // In-page anchors must not clobber the router hash.
      const target = document.getElementById(tocLink.getAttribute("href").slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });

  let theme = store.get("cs-theme");
  if (!THEMES.includes(theme)) theme = "auto";
  applyTheme(theme);
  $("#theme-btn").addEventListener("click", () => {
    theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    store.set("cs-theme", theme);
    applyTheme(theme);
  });

  $("#menu-btn").addEventListener("click", openNav);
  $("#scrim").addEventListener("click", closeNav);
}

async function init() {
  bind();
  try {
    const res = await fetch("cheatsheets.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.items = data.items || [];
    state.generated = data.generated;
  } catch (err) {
    $("#view").innerHTML = `<div class="empty"><p>Could not load <code>cheatsheets.json</code>.</p><p class="muted">Run <code>python scripts/build.py --serve</code> and open the site through the local server, not as a file. (${esc(err.message)})</p></div>`;
    return;
  }
  renderFoot();
  route();
}

init();
