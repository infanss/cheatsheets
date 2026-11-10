# Python & R Cheatsheets

A personal Python and R reference. Each cheatsheet is a single Markdown file in `content/`.
The site builds the list on its own, groups sheets by category and lets you filter by package.

Live site: https://infanss.github.io/cheatsheets/

## Adding a cheatsheet

1. Add a file `content/{lang}-{topic}.md` (for example `content/r-survival-analysis.md`).
2. Preview locally (optional):
   ```bash
   python scripts/build.py --serve
   ```
   then open http://localhost:8000
3. Commit and push:
   ```bash
   git add content/ && git commit -m "Add r-survival-analysis" && git push
   ```
   GitHub Actions builds the site and publishes it to GitHub Pages in 1–2 minutes.

Files can also live in subfolders (`content/r/omop/...`); the build script searches for `.md` files recursively.

## File format

Each file starts with YAML frontmatter, followed by regular Markdown (GFM: tables, fenced code blocks with a language).

```yaml
---
title: "Survival analysis in R"
slug: r-survival-analysis        # = file name without .md, must be unique
lang: r                          # python | r | both  (both shows up under both languages)
category: statistics             # basics | data | statistics | causal | omop | bioinformatics | visualization | reproducibility | ml
tags: [survival, cox]
level: beginner                  # beginner | intermediate | advanced
packages:                        # feeds the "Packages" filter
  - name: survival
    version: "x.y.z"
language_version: "R 4.6"
last_verified: "2026-11-10"
summary: "One sentence on what is inside."
sources:
  - title: "survival documentation"
    url: "https://..."
---
```

Required fields: `title`, `slug`, `lang`, `category`, `summary`. If one is missing,
the CI build fails and names the file.

How it renders:
- `## Section` is a section heading and an entry in the table of contents.
- `### Task` becomes a card: heading, one-line explanation, and code blocks up to the next heading.
- Every code block gets a "Copy" button.

## Layout

```
content/                     cheatsheets (.md), the only thing you normally edit
site/                        index.html, style.css, app.js: the site itself
scripts/build.py             frontmatter validation + build into public/
.github/workflows/pages.yml  build and publish to GitHub Pages
```

To add a category, add it to `CATEGORIES` in `scripts/build.py` and give it a label in `site/app.js`.

## Hosting

The repository is `infanss/cheatsheets` and GitHub Pages is set to deploy from GitHub Actions
(Settings → Pages → Source: GitHub Actions). Every push to `main` redeploys the site;
pull requests only validate the content.

Locally you only need Python 3 and `pyyaml` (`pip install pyyaml`).
