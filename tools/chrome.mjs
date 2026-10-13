// chrome.mjs: the parts every page of agentnaming.ai shares, the left menu and
// the footer. tools/build-spec.mjs uses it for spec.html; `node tools/chrome.mjs`
// rewrites the same parts of the hand-written pages (the <aside class="rail
// sidenav"> block and the <footer> block), so a menu change is made here once.
// Redirect stubs carry no menu and are left alone.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The naming specification's own repository (SPEC-NAMING.md and its
// conformance vectors). Never link the Agent Messaging repositories for it.
export const SPEC_REPO_URL = "https://github.com/AgentNaming/personal-agent-naming";
// This site's own source.
export const SITE_REPO_URL = "https://github.com/AgentNaming/agentnaming.ai";

const chev = `<svg class="sn-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function rail(active) {
  const a = (href, label, key) =>
    `<a${key && key === active ? ' class="on"' : ""} href="${href}">${label}</a>`;
  const sec = (title, items) => `<details class="sn-sec" open>
          <summary>${title}${chev}</summary>
          <div class="sn-items">
          ${items.join("\n          ")}
          </div>
        </details>`;
  return `<aside class="rail sidenav" id="sidenav">
      <div class="sn-head">
        <a class="sn-brand" href="/"><span class="dot"></span>PAN</a>
        <button class="sn-btn" id="theme-toggle" type="button" aria-label="Switch between light and dark"><span class="sn-to-dark"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1z" fill="currentColor"/></svg></span><span class="sn-to-light"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3 3l1.3 1.3M11.7 11.7L13 13M3 13l1.3-1.3M11.7 4.3L13 3"/></g></svg></span><span class="sn-to-dark">Dark</span><span class="sn-to-light">Light</span></button>
        <button class="sn-btn sn-menu" id="menu-toggle" type="button" aria-expanded="false" aria-controls="sidenav"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Menu</button>
      </div>
      <nav class="sn-nav" aria-label="agentnaming.ai">
        ${sec("Personal Agent Naming", [
          a("/", "What it is", "home"),
          a("/why-names.html", "Why names", "why"),
          a("/reach.html", "How a name is resolved", "reach"),
          a("/trust.html", "Trust and privacy", "trust"),
          a("/comparison.html", "PAN and ANS", "comparison"),
        ])}
        ${sec("The standard", [
          a("/spec.html", "The specification", "spec"),
          a("/get-a-name.html", "Get a name", "get"),
          a("/implementers.html", "For implementers", "implementers"),
          `<a href="${SPEC_REPO_URL}">Its source on GitHub ↗</a>`,
        ])}
        ${sec("Related", [
          `<a href="https://agentmessaging.ai/">Agent Messaging ↗</a>`,
        ])}
      </nav>
      <div class="sn-foot">An open standard for naming personal agents.<br>Sponsored by <a href="https://agentmesh.ai/">AgentMesh</a>.</div>
    </aside>`;
}

export const footer = `<footer>
        <div class="wrap">
          <span>Personal Agent Naming</span>
          <a href="/spec.html">The specification</a>
          <a href="/get-a-name.html">Get a name</a>
          <a href="/implementers.html">For implementers</a>
          <a href="${SPEC_REPO_URL}">The specification's source</a>
          <a href="${SITE_REPO_URL}">This site's source</a>
          <a href="https://agentmessaging.ai/">agentmessaging.ai</a>
          <a href="https://agentmesh.ai/">agentmesh.ai</a>
          <span>Sponsored by <a href="https://agentmesh.ai/">AgentMesh</a></span>
        </div>
      </footer>`;

// file -> the menu entry it highlights. spec.html is written by build-spec.mjs.
export const PAGES = {
  "index.html": "home", "why-names.html": "why", "reach.html": "reach", "trust.html": "trust",
  "comparison.html": "comparison", "get-a-name.html": "get", "implementers.html": "implementers", "404.html": "",
};

export function apply(html, active) {
  const a = html.replace(/<aside class="rail sidenav"[\s\S]*?<\/aside>/, rail(active));
  return a.replace(/<footer>[\s\S]*?<\/footer>/, footer);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  for (const [file, key] of Object.entries(PAGES)) {
    const p = resolve(ROOT, file);
    const before = readFileSync(p, "utf8");
    const after = apply(before, key);
    if (after !== before) { writeFileSync(p, after); console.log(`chrome: ${file}`); }
  }
}
