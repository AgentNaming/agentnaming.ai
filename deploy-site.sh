#!/usr/bin/env bash
# Publish https://agentnaming.ai to Google Cloud object storage and refresh the
# CDN. GitHub is source only and serves nothing. The bucket, the project and the
# load balancer are named in deploy.env, which is not committed (copy
# deploy.env.example and fill it in from the operator's records).
#
# It ships the committed files only (git ls-files), so commit first. It does
# NOT regenerate spec.html: rendering from ../AgentMesh/SPEC-NAMING.md
# publishes whatever is on that checkout, which can be ahead of what has been
# released. Render deliberately with `node tools/build-spec.mjs`, read the
# diff, commit, then run this.
set -euo pipefail
HOSTS=(agentnaming.ai www.agentnaming.ai)
GCLOUD="${GCLOUD:-/c/Users/jeffr/google-cloud-sdk-extract/google-cloud-sdk/bin/gcloud.cmd}"

cd "$(dirname "$0")"
[ -f deploy.env ] || { echo "deploy.env is missing: copy deploy.env.example and fill it in" >&2; exit 1; }
# shellcheck source=/dev/null
. ./deploy.env
: "${BUCKET:?deploy.env sets BUCKET}" "${PROJECT:?deploy.env sets PROJECT}" "${LB:?deploy.env sets LB}"

STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
git ls-files | grep -v -e '^deploy-site\.sh$' -e '^deploy\.env' -e '^CLAUDE\.md$' -e '^README\.md$' -e '^LICENSE$' -e '^\.gitignore$' -e '^tools/' | while read -r f; do
  mkdir -p "$STAGE/$(dirname "$f")"
  cp "$f" "$STAGE/$f"
done
# sitemap.xml and robots.txt, written fresh from the tracked pages so search
# engines always get the current list. Redirect stubs and noindex pages are
# left out. They live in the bucket only.
node tools/build-sitemap.mjs . "https://${HOSTS[0]}" --out "$STAGE"
WSTAGE=$(cygpath -w "$STAGE" 2>/dev/null || echo "$STAGE")

# The contrast gate: every page in light and dark at 1440 and 390 px, with the
# menu, the phone menu and the consent bar open. Any text below 4.5:1 stops
# the deploy here, listed by page, element and ratio.
[ -d tools/node_modules/playwright ] || (cd tools && npm ci --no-audit --no-fund)
if ! node tools/contrast-gate.mjs --root "$WSTAGE"; then
  echo "deploy refused: text below 4.5:1 contrast (listed above). Fix it, then deploy again." >&2
  exit 1
fi

# rsync uploads what changed (an expanded file list overflows the Windows
# command line). Never --delete-unmatched-destination-objects: the bucket holds
# files this repository does not.
"$GCLOUD" storage rsync -r "$WSTAGE" "$BUCKET" --cache-control="public, max-age=300" --project "$PROJECT"
for h in "${HOSTS[@]}"; do
  "$GCLOUD" compute url-maps invalidate-cdn-cache "$LB" --path "/*" --host "$h" --project "$PROJECT"
done
echo "deployed: https://${HOSTS[0]}"
