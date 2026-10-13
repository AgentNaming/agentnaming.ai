// build-spec.mjs: render spec.html from the canonical SPEC-NAMING.md.
// Usage, from this repo's root: node tools/build-spec.mjs [path-to-SPEC-NAMING.md]
// Default source: ../AgentMesh/SPEC-NAMING.md, a sibling checkout of the
// AgentMesh repository (falls back to the public GitHub raw copy).
// spec.html is a committed artifact and must never be hand edited: edit the
// spec there, regenerate here, read the diff, commit, then deploy.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { rail, footer, SPEC_REPO_URL } from "./chrome.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(ROOT, "..", "AgentMesh");
const SRC = process.argv[2] ?? resolve(REPO, "SPEC-NAMING.md");
const RAW_URL = "https://raw.githubusercontent.com/AgentNaming/personal-agent-naming/main/SPEC-NAMING.md";

let md, commit = "";
try {
  md = readFileSync(SRC, "utf8");
  try {
    commit = execSync(`git -C "${dirname(SRC)}" rev-parse --short HEAD`, { encoding: "utf8" }).trim();
  } catch { /* no local repo info */ }
} catch {
  md = await (await fetch(RAW_URL)).text();
}

md = md.replace(/\r\n/g, "\n");

// Pull version/status/date from the one-line header block
// (**Version:** x · **Date:** y · **Status:** z).
const meta = {};
for (const [k, re] of Object.entries({
  version: /\*\*Version:\*\*\s*([^·\n]+)/,
  status: /\*\*Status:\*\*\s*([^·\n]+)/,
  date: /\*\*Date:\*\*\s*([^·\n]+)/,
})) meta[k] = (md.match(re) ?? [, "?"])[1].trim();

// Drop the md title + header block through the Authors line; the page hero
// renders the metadata as chips.
const mdBody = md.replace(/^# .*\n[\s\S]*?\*\*Authors:\*\*.*\n/, "");
marked.setOptions({ gfm: true, breaks: false });
let body = marked.parse(mdBody);

// Anchor the headings ourselves (stable slugs; marked no longer ships ids).
const slugCount = new Map();
const toc = [];
body = body.replace(/<h([1-4])>([\s\S]*?)<\/h\1>/g, (m, lvl, inner) => {
  const text = inner.replace(/<[^>]+>/g, "");
  let slug = text.toLowerCase()
    .replace(/&amp;/g, "and").replace(/[^\w\s.§-]/g, "")
    .replace(/\./g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const n = slugCount.get(slug) ?? 0;
  slugCount.set(slug, n + 1);
  if (n) slug = `${slug}-${n}`;
  if (lvl === "2") toc.push({ slug, text });
  return `<h${lvl} id="${slug}">${inner}<a class="hl" href="#${slug}">#</a></h${lvl}>`;
});

const tocHtml = toc.map(t => `<a href="#${t.slug}">${t.text}</a>`).join("\n            ");
const generated = new Date().toISOString().slice(0, 10);

const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script async src="/ga.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The naming specification: Personal Agent Naming</title>
  <meta name="description" content="The Personal Agent Naming specification: handles, cards, binding, resolution, and the registrar's obligations, normatively defined.">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Personal Agent Naming">
  <meta property="og:title" content="The naming specification: Personal Agent Naming">
  <meta property="og:description" content="The Personal Agent Naming specification: handles, cards, binding, resolution, and the registrar's obligations, normatively defined.">
  <meta property="og:url" content="https://agentnaming.ai/spec.html">
  <meta property="og:image" content="https://agentnaming.ai/brand/png/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Personal Agent Naming. A name for your agent, and an address behind it">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/site.css">
  <style>
    html{ scroll-behavior:smooth; scroll-padding-top:20px; }
    .hero{ padding-block:64px 30px; }
    .hero h1{ font-size:clamp(1.9rem,4.2vw,2.8rem); max-width:26ch; margin:0 0 12px; }
    .metas{ display:flex; gap:10px; flex-wrap:wrap; margin:14px 0 0; }
    .metas span{ font-family:var(--wire); font-size:.74rem; color:var(--dim);
      border:1px solid var(--line); border-radius:100px; padding:4px 12px; background:var(--panel); }
    .metas span b{ color:var(--signal); font-weight:600; }
    .canon{ margin-top:14px; font-family:var(--wire); font-size:.76rem; color:var(--faint);
      max-width:72ch; overflow-wrap:anywhere; }
    .canon a{ color:var(--verify); }

    .toc{ margin:26px 0 0; border:1px solid var(--line); border-radius:12px; background:var(--panel);
      padding:16px 18px; columns:2; column-gap:28px; }
    .toc a{ display:block; font-family:var(--wire); font-size:.78rem; color:var(--dim);
      text-decoration:none; padding:3px 0; break-inside:avoid; }
    .toc a:hover{ color:var(--signal); }

    .spec{ padding:10px 0 70px; }
    .spec h1{ display:none; } /* the page hero replaces the md title */
    .spec h2{ font-family:var(--disp); font-weight:700; letter-spacing:-.02em; font-size:1.7rem;
      line-height:1.16; margin:54px 0 14px; padding-top:22px; border-top:1px solid var(--line); }
    .spec h3{ font-family:var(--disp); font-weight:700; font-size:1.2rem; line-height:1.2; margin:34px 0 10px; }
    .spec h4{ font-family:var(--disp); font-weight:600; font-size:1.02rem; line-height:1.24; margin:26px 0 8px; }
    .spec .hl{ opacity:0; margin-left:8px; font-family:var(--wire); font-size:.8em;
      color:var(--signal); text-decoration:none; }
    .spec h2:hover .hl, .spec h3:hover .hl, .spec h4:hover .hl{ opacity:1; }
    .spec p, .spec li{ color:var(--dim); max-width:76ch; }
    .spec ul, .spec ol{ padding-left:22px; }
    .spec li{ margin:8px 0; }
    .spec strong{ color:var(--paper); font-weight:600; }
    .spec em{ color:var(--paper); }
    .spec code{ font-family:var(--wire); font-size:.86em; color:var(--verify);
      background:rgba(67,214,166,.07); border:1px solid rgba(67,214,166,.15);
      border-radius:5px; padding:1px 5px; overflow-wrap:anywhere; }
    .spec pre{ background:var(--panel); border:1px solid var(--line); border-radius:12px;
      padding:16px 18px; overflow-x:auto; line-height:1.7; margin:18px 0; max-width:100%; }
    .spec pre code{ background:none; border:0; padding:0; color:var(--paper); font-size:.82rem;
      white-space:pre; overflow-wrap:normal; }
    .spec blockquote{ margin:18px 0; border:1px solid var(--line); border-left:3px solid var(--signal);
      border-radius:10px; background:var(--panel); padding:12px 18px; max-width:72ch; }
    .spec blockquote p{ margin:6px 0; }
    .spec table{ border-collapse:collapse; margin:18px 0; display:block; overflow-x:auto;
      max-width:100%; border:1px solid var(--line); border-radius:10px; }
    .spec th{ font-family:var(--wire); font-size:.72rem; letter-spacing:.1em; text-transform:uppercase;
      color:var(--faint); text-align:left; padding:10px 14px; background:rgba(255,255,255,.015);
      border-bottom:1px solid var(--line); white-space:nowrap; }
    .spec td{ padding:9px 14px; border-bottom:1px solid var(--line); font-size:.9rem;
      color:var(--dim); vertical-align:top; }
    .spec tr:last-child td{ border-bottom:0; }
    .spec td:first-child{ color:var(--paper); font-family:var(--wire); font-size:.84rem; }
    .spec hr{ border:0; border-top:1px solid var(--line); margin:40px 0; }
    .spec a{ color:var(--verify); overflow-wrap:anywhere; }
    .spec img{ max-width:100%; }
    footer{ padding:14px 0 60px; }
    @media (max-width:900px){
      .toc{ columns:1; }
    }
    @media (max-width:700px){
      .hero{ padding-block:44px 26px; }
      .spec h2{ font-size:1.4rem; margin-top:42px; }
      .spec h3{ font-size:1.08rem; }
      .spec pre{ padding:12px 14px; }
      .spec pre code{ font-size:.72rem; }
      .toc{ padding:14px 16px; }
    }
  </style>
  <link rel="stylesheet" href="/theme.css">
  <script src="/theme.js"></script>
</head>
<body>
  <div class="layout">

    ${rail("spec")}

    <main class="main">

      <div class="wrap hero">
        <span class="eyebrow"><span class="tag">pan</span> · the specification</span>
        <h1>Personal Agent Naming</h1>
        <div class="metas">
          <span>version <b>${meta.version.replace(/-?draft$/i, "")}</b></span>
          <span>date <b>${meta.date}</b></span>
        </div>
        <p class="canon">The normative specification of Personal Agent Naming, an open standard for
          naming personal agents, sponsored by <a href="https://agentmesh.ai/">AgentMesh</a> and a
          companion to <a href="https://agentmessaging.ai/">Agent Messaging</a>.
          Rendered ${generated}${commit ? ` from commit <span class="mono">${commit}</span>` : ""}.
          The published specification is this page, and its source is SPEC-NAMING.md in
          <a href="${SPEC_REPO_URL}">${SPEC_REPO_URL}</a>.</p>
        <div class="toc">
            ${tocHtml}
        </div>
      </div>

      <div class="wrap spec">
${body}
      </div>

      ${footer}

    </main>
  </div>
</body>
</html>
`;

writeFileSync(resolve(ROOT, "spec.html"), page);
console.log(`spec.html written: ${(page.length / 1024).toFixed(0)} KB, ${toc.length} sections, ${meta.version} (${meta.date})${commit ? ", commit " + commit : ""}`);
