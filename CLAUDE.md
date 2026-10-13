# agentnaming.ai

Source for https://agentnaming.ai (repository https://github.com/AgentNaming/agentnaming.ai),
the site of **Personal Agent Naming (PAN)**,
an open standard for naming personal agents. Keep the name: "Personal Agent
Naming", short name "PAN" (owner, 2026-10-13). Never rename it "Agent Naming"
and never say it was formerly called anything else.

## Who is who

- **AgentMesh sponsors the standard.** Say "sponsored by AgentMesh". Never call
  PAN "AgentMesh's naming service", and never make the site a funnel into
  AgentMesh: AgentMesh appears as the sponsor and as one registrar, on the "Get
  a name" page.
- **Registrars are listed on `get-a-name.html`**, AgentMesh first. An
  open-source registrar is being released (owner, 2026-10-13), at
  https://github.com/AgentNaming/pan-registrar once it is public. Until it is,
  the site says AgentMesh runs a registrar and links no registrar repository.
  The places to fill in are marked `<!-- OPEN-REGISTRAR: ... -->` in
  `index.html`, `get-a-name.html`, `implementers.html` and, in the AgentMesh
  repository, `SPEC-NAMING.md` §11.
- **Link https://agentmesh.ai only.** Never link app.agentmesh.ai, and never
  link AgentMesh's "family of standards" page.
- **Say "Agent Messaging" for the messaging protocol.** Wire identifiers keep
  their names: the `agentmesh` endpoint type on a card stays `agentmesh`.
- Never stamp the published specification or any page as draft, beta or
  untested.

## spec.html is generated, never hand-edited

`spec.html` is rendered from `SPEC-NAMING.md` by `tools/build-spec.mjs`. The
specification is published as https://agentnaming.ai/spec.html, and its public
source repository is https://github.com/AgentNaming/personal-agent-naming. Link
those two for the naming spec, never the Agent Messaging repositories. The
builder reads SPEC-NAMING.md from a sibling checkout of the AgentMesh
repository by default, or from the path you give it. Edit the spec where it is
maintained, then regenerate here:

```bash
cd tools && npm ci && cd ..      # once
node tools/build-spec.mjs        # defaults to ../AgentMesh/SPEC-NAMING.md
```

SPEC-NAMING.md can be ahead of what is meant to be public. Read the diff of
spec.html before you commit it. deploy-site.sh deliberately does not
regenerate it.

## The menu and the footer

`tools/chrome.mjs` holds the left menu and the footer. After changing either,
run `node tools/chrome.mjs` to rewrite every hand-written page;
`tools/build-spec.mjs` imports the same pieces for spec.html. A new page goes in
chrome.mjs's `PAGES` (and in the menu if readers should find it). The menu is in
reader order: what it is, why names, how a name is resolved, trust and privacy,
the comparison with ANS, then the specification, getting a name, implementers,
and Related.

## Look and contrast

Light by default, with a Dark switch in the menu (`theme.js`, remembered as
`site-theme`). The palette is `theme.css`, which overrides `site.css`'s older
token names. Every piece of text must clear 4.5:1 in both themes: use the
tokens, never fade text with opacity or rgba. `deploy-site.sh` runs the
contrast gate (`tools/contrast-gate.mjs`) on every page at 1440 and 390 px in
both themes and refuses to publish below 4.5:1. Run it yourself before
committing: `node tools/contrast-gate.mjs`.

## Prose

Plain writing. No em dashes (`—`, `&mdash;`, `&#8212;`) in the site's own
prose: use a colon, a comma or a new sentence. spec.html is exempt because it
renders the specification verbatim. No headline fragments, no "X, not Y"
constructions, no clever equations.

## Analytics

Every page loads `/ga.js` (the Google Analytics stream for agentnaming.ai,
with Consent Mode v2). Add the same head tag to any new page.

## Deploying

**Pushing to `main` does not deploy.** The site serves from a Google Cloud
Storage bucket behind a shared load balancer. This repository is public, so
their names are not committed: `deploy-site.sh` reads them from `deploy.env`
(ignored by git; copy `deploy.env.example` and fill it in from the operator's
records, AgentMesh's `docs/our-instance.md`). Never commit a project id, a
bucket or a load balancer name here.
`./deploy-site.sh` uploads the committed files, writes sitemap.xml and
robots.txt (redirect stubs and noindex pages are left out), runs the contrast
gate, and clears the CDN for both hosts. Commit first. After a deploy, fetch
the live page and check the change is on it.

Moved pages stay as redirect stubs (`location.replace` plus a meta refresh),
so old links keep working: `claim.html`, `pair.html` and `agent-setup.html`
go to `get-a-name.html`, and `developers.html` goes to `implementers.html`.
