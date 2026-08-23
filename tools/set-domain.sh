#!/bin/sh
# Point the site at a domain. Usage:  sh tools/set-domain.sh https://pocc.ca/
# Updates the canonical/Open Graph/sitemap address, regenerates the pages and
# sitemap, and writes the CNAME file GitHub Pages needs.
set -e
[ -n "$1" ] || { echo "usage: sh tools/set-domain.sh https://example.ca/"; exit 1; }
URL="$1"; case "$URL" in */) ;; *) URL="$URL/";; esac
HOST=$(printf '%s' "$URL" | sed -E 's#^https?://##; s#/.*##')
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

python3 - "$ROOT" "$URL" <<'PY'
import sys,re,pathlib
root,url=sys.argv[1],sys.argv[2]
b=pathlib.Path(root,'tools','build.py'); s=b.read_text()
s=re.sub(r'^SITE  = ".*"$', 'SITE  = "%s"'%url, s, count=1, flags=re.M)
b.write_text(s)
sm=pathlib.Path(root,'sitemap.xml')
if sm.exists():
    sm.write_text(re.sub(r'https?://[^<]+?/(?=[a-z]*\.html<|<)', url, sm.read_text()))
rb=pathlib.Path(root,'robots.txt')
if rb.exists():
    rb.write_text(re.sub(r'Sitemap: .*', 'Sitemap: %ssitemap.xml'%url, rb.read_text()))
PY

printf '%s\n' "$HOST" > "$ROOT/CNAME"
python3 "$ROOT/tools/build.py" >/dev/null
echo "Site address set to $URL"
echo "CNAME written: $HOST"
echo
echo "Next, at the DNS host for $HOST, replace the A records on @ with:"
echo "  185.199.108.153"
echo "  185.199.109.153"
echo "  185.199.110.153"
echo "  185.199.111.153"
echo "and point www at  eugenazxa.github.io  via CNAME."
