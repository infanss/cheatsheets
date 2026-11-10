#!/usr/bin/env python3
"""Build the cheatsheet site into public/.

Reads every content/**/*.md, parses its YAML frontmatter, validates it and
writes public/cheatsheets.json next to a copy of site/.

Usage:
    python scripts/build.py            # build into public/
    python scripts/build.py --check    # validate only, no output
    python scripts/build.py --serve    # build and serve on http://localhost:8000
"""

import argparse
import datetime as dt
import functools
import hashlib
import http.server
import json
import re
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
SITE = ROOT / "site"
PUBLIC = ROOT / "public"

LANGS = {"python", "r", "both"}
CATEGORIES = {
    "basics", "data", "statistics", "causal", "omop", "bioinformatics",
    "visualization", "reproducibility", "ml",
}
LEVELS = {"beginner", "intermediate", "advanced"}
REQUIRED = ["title", "slug", "lang", "category", "summary"]

FRONTMATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z", re.DOTALL)


def parse(path):
    text = path.read_text(encoding="utf-8")
    m = FRONTMATTER.match(text)
    if not m:
        raise ValueError("no YAML frontmatter (file must start with ---)")
    meta = yaml.safe_load(m.group(1)) or {}
    if not isinstance(meta, dict):
        raise ValueError("frontmatter is not a mapping")
    return meta, m.group(2).strip() + "\n"


def validate(path, meta):
    errors, warnings = [], []
    for key in REQUIRED:
        if not meta.get(key):
            errors.append(f"missing required field '{key}'")
    if meta.get("lang") and meta["lang"] not in LANGS:
        errors.append(f"lang must be one of {sorted(LANGS)}, got '{meta['lang']}'")
    if meta.get("category") and meta["category"] not in CATEGORIES:
        warnings.append(f"unknown category '{meta['category']}' (will be shown under its own name)")
    if meta.get("level") and meta["level"] not in LEVELS:
        warnings.append(f"unknown level '{meta['level']}'")
    if meta.get("slug") and meta["slug"] != path.stem:
        warnings.append(f"slug '{meta['slug']}' differs from file name '{path.stem}'")
    if not meta.get("last_verified"):
        warnings.append("no last_verified date")
    for pkg in meta.get("packages") or []:
        if not isinstance(pkg, dict) or not pkg.get("name"):
            errors.append("each entry in packages needs a 'name'")
    return errors, warnings


def normalize(meta):
    # YAML turns unquoted dates into date objects; keep everything JSON-friendly.
    out = json.loads(json.dumps(meta, default=str, ensure_ascii=False))
    out["tags"] = [str(t) for t in out.get("tags") or []]
    out["packages"] = [
        {"name": str(p["name"]), "version": str(p.get("version", "") or "")}
        for p in out.get("packages") or []
    ]
    out["sources"] = out.get("sources") or []
    return out


def collect():
    items, problems = [], 0
    seen = {}
    for path in sorted(CONTENT.rglob("*.md")):
        rel = path.relative_to(ROOT)
        try:
            meta, body = parse(path)
        except Exception as e:  # noqa: BLE001 - report any parse failure per file
            print(f"ERROR {rel}: {e}")
            problems += 1
            continue
        errors, warnings = validate(path, meta)
        for w in warnings:
            print(f"warn  {rel}: {w}")
        for e in errors:
            print(f"ERROR {rel}: {e}")
        if errors:
            problems += 1
            continue
        slug = meta["slug"]
        if slug in seen:
            print(f"ERROR {rel}: duplicate slug '{slug}' (also in {seen[slug]})")
            problems += 1
            continue
        seen[slug] = rel
        item = normalize(meta)
        item["file"] = str(rel)
        item["body"] = body
        items.append(item)
    return items, problems


def bust_cache(html_path, assets):
    """Append ?v=<content hash> to asset links so browsers pick up new versions."""
    html = html_path.read_text(encoding="utf-8")
    for name in assets:
        digest = hashlib.sha1((html_path.parent / name).read_bytes()).hexdigest()[:10]
        html = html.replace(f'"{name}"', f'"{name}?v={digest}"')
    html_path.write_text(html, encoding="utf-8")


def build():
    items, problems = collect()
    print(f"{len(items)} cheatsheet(s), {problems} with errors")
    if problems:
        return False
    if PUBLIC.exists():
        shutil.rmtree(PUBLIC)
    shutil.copytree(SITE, PUBLIC)
    bust_cache(PUBLIC / "index.html", ["style.css", "app.js"])
    data = {
        "generated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "items": items,
    }
    (PUBLIC / "cheatsheets.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8"
    )
    print(f"built -> {PUBLIC.relative_to(ROOT)}/")
    return True


def serve(port):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(PUBLIC))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"serving on http://localhost:{port}  (Ctrl+C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate content only")
    ap.add_argument("--serve", action="store_true", help="serve public/ after building")
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args()

    if args.check:
        _, problems = collect()
        sys.exit(1 if problems else 0)
    if not build():
        sys.exit(1)
    if args.serve:
        serve(args.port)


if __name__ == "__main__":
    main()
