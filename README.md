# Python & R Cheatsheets

A personal Python and R reference. Each cheatsheet is a single Markdown file in `content/`.
The site builds the list on its own, groups sheets by category and lets you filter by package.

Live site: https://infanss.github.io/cheatsheets/

## Adding a cheatsheet

1. Add a file `content/{lang}-{topic}.md` (for example `content/r-survival-analysis.md`).
2. Run its code examples, render its plots and preview locally (optional):
   ```bash
   python scripts/check_code.py --plots plots "r-survival-*"
   python scripts/build.py --serve
   ```
   then open http://localhost:8000
3. Commit and push:
   ```bash
   git add content/ && git commit -m "Add r-survival-analysis" && git push
   ```
   GitHub Actions runs every code example, then builds the site and publishes it to GitHub Pages.
   If an example fails, the site is not updated and the failing file is shown in the Actions log.

Files can also live in subfolders (`content/r/omop/...`); the build script searches for `.md` files recursively.

## File format

Each file starts with YAML frontmatter, followed by regular Markdown (GFM: tables, fenced code blocks with a language).

```yaml
---
title: "survival"                # a sheet about one package is titled with just its name
slug: r-survival-analysis        # = file name without .md, must be unique
lang: r                          # python | r | both  (both shows up under both languages)
category: statistics             # basics | data | statistics | causal | omop | bioinformatics | visualization | reproducibility | ml
tags: [survival, cox]
level: beginner                  # beginner | intermediate | advanced
source_lessons: [L4]             # optional: MHEDAS course units, shown as a badge
order: 2                         # optional: position in its category (learning sequence)
datasets: [survival::pbc]        # optional: datasets the examples use, shown as badges
packages:                        # feeds the "Packages" filter: only what the sheet teaches
  - name: survival               # use "base R" for anything built into R (stats, utils, ...)
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
- Sheets in a category are sorted by `order`, with Previous / Next links at the bottom.
- Link to another sheet with `[text](#/r/r-lm-diagnostics)`; the build fails if the slug does not exist.
- A filter box above each sheet hides cards, list items and table rows that do not match (shortcut: F).
- Fence an R block as ```` ```r plot ```` to show its output after the code: every plot it draws,
  plus any `.png`, `.gif`, `.svg` or `.html` file it saves (an htmlwidget is shown interactive).
  The block must draw the plot itself, e.g. end with `p` rather than only `p <- ggplot(...)`.

## Code examples are tested

`scripts/check_code.py` runs all ```` ```r ```` blocks of a sheet top to bottom in one R session
(and ```` ```python ```` blocks in one Python process), in a temporary folder.
- Interactive lines are skipped: `install.packages()`, `setwd()`, `?topic`, `help.search()`, `example()`.
- A block whose first line is `# not run` is skipped, e.g. code that needs a database or a private file.
- Packages are detected from `library()`, `pkg::` and `install.packages()` calls, so CI installs them automatically.
- `--plots plots` also renders the ```` ```r plot ```` blocks into `plots/` (not committed; CI renders them for the site).
- Locally it needs R and the packages installed; `--strict` also fails on warnings.

## Layout

```
content/                     cheatsheets (.md), the only thing you normally edit
site/                        index.html, style.css, app.js: the site itself
scripts/build.py             frontmatter and link validation + build into public/
scripts/check_code.py        runs every code example and renders plots
.github/workflows/pages.yml  run examples, build and publish to GitHub Pages
```

To add a category, add it to `CATEGORIES` in `scripts/build.py` and give it a label in `site/app.js`.

## Hosting

The repository is `infanss/cheatsheets` and GitHub Pages is set to deploy from GitHub Actions
(Settings → Pages → Source: GitHub Actions). Every push to `main` runs the examples and
redeploys the site; pull requests only run the examples and validate the content.

Locally you only need Python 3 and `pyyaml` (`pip install pyyaml`).
