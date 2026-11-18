#!/usr/bin/env python3
"""Run the R and Python code blocks of every cheatsheet.

All ```r blocks of one sheet run top to bottom in a single R session (the
same for ```python), in a fresh temporary folder, so later blocks can use
objects from earlier ones, just like a reader copying them in order.

Lines that only make sense interactively are skipped: install.packages(),
setwd(), ?help, help.search() and example(). A block whose first line is
`# not run` is skipped entirely.

With --plots DIR, every block fenced as ```r plot is also rendered: each plot
it draws becomes DIR/<slug>-<n>-<k>.png, and any .png/.gif/.svg/.html file the
block itself saves is copied there too (n = plot block number in the sheet,
k = output number). The build puts these images after the code on the site.

Usage:
    python scripts/check_code.py                  # run every sheet
    python scripts/check_code.py "r-lm-*"         # only matching slugs
    python scripts/check_code.py --plots plots    # also render ```r plot blocks
    python scripts/check_code.py --list-r-packages   # R packages the code needs
    python scripts/check_code.py --list-py-packages  # pip packages the code needs
"""

import argparse
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from build import CONTENT, ROOT, parse

BLOCK = re.compile(r"^```(r|python)([^\n]*)\n(.*?)^```", re.DOTALL | re.MULTILINE)
INTERACTIVE_R = re.compile(r"^\s*(install\.packages\(|setwd\(|\?|help\.search\(|example\()")
BASE_R = {
    "base", "stats", "utils", "graphics", "grDevices", "methods", "datasets",
    "tools", "parallel", "grid", "splines", "stats4", "tcltk", "compiler",
}
PRELUDE = {
    # Plots go nowhere unless a plot block opens its own PNG device; warnings print at once.
    "r": r"""pdf(NULL)
options(warn = 1)
.cs <- new.env()
.cs_start <- function(stem) {
  .cs$files <- list.files()
  args <- list(filename = paste0(stem, "-%d.png"), width = 1600, height = 1000, res = 200)
  # Quartz on macOS (cairo there needs XQuartz), cairo elsewhere.
  args$type <- if (Sys.info()[["sysname"]] == "Darwin") "quartz" else "cairo"
  do.call(png, args)
  .cs$dev <- dev.cur()
}
.cs_end <- function(stem) {
  if (.cs$dev %in% dev.list()) dev.off(.cs$dev)
  k <- length(Sys.glob(paste0(stem, "-*.png")))
  saved <- setdiff(list.files(), .cs$files)
  for (f in saved[grepl("[.](png|gif|svg|html)$", saved, ignore.case = TRUE)]) {
    k <- k + 1
    file.copy(f, paste0(stem, "-", k, ".", tolower(tools::file_ext(f))))
  }
}
""",
    "python": "",
}
RUNNER = {"r": ["Rscript", "--vanilla"], "python": [sys.executable]}
EXT = {"r": ".R", "python": ".py"}
TIMEOUT = 600


def sheets(patterns):
    for path in sorted(CONTENT.rglob("*.md")):
        meta, body = parse(path)
        if patterns and not any(fnmatch.fnmatch(meta.get("slug", path.stem), p) for p in patterns):
            continue
        yield path, meta, body


def scripts_for(body, slug=None, plot_dir=None):
    """Return {language: code} with every runnable block of that language joined.

    With plot_dir, ```r plot blocks are wrapped so their output is saved there.
    """
    out, n = {}, 0
    for lang, info, code in BLOCK.findall(body):
        is_plot = lang == "r" and re.search(r"\bplot\b", info)
        n += bool(is_plot)
        if code.lstrip().lower().startswith("# not run"):
            continue
        if lang == "r":
            code = "\n".join("# skipped: " + ln if INTERACTIVE_R.match(ln) else ln
                             for ln in code.splitlines()) + "\n"
            if is_plot and plot_dir:
                stem = json.dumps(str(Path(plot_dir) / f"{slug}-{n}"))
                code = f".cs_start({stem})\n{code}.cs_end({stem})\n"
        out[lang] = out.get(lang, "") + code
    return out


def run_one(path, lang, code):
    """Run one sheet's code in a temp folder; return (ok, warnings, output tail)."""
    if not shutil.which(RUNNER[lang][0]):
        return False, 0, f"{RUNNER[lang][0]} not found"
    with tempfile.TemporaryDirectory() as tmp:
        script = Path(tmp) / ("sheet" + EXT[lang])
        script.write_text(PRELUDE[lang] + code, encoding="utf-8")
        env = dict(os.environ, MPLBACKEND="Agg")
        try:
            res = subprocess.run(RUNNER[lang] + [str(script)], cwd=tmp, env=env,
                                 capture_output=True, text=True, timeout=TIMEOUT)
        except subprocess.TimeoutExpired:
            return False, 0, f"timed out after {TIMEOUT}s"
    warnings = len(re.findall(r"^Warning", res.stderr, re.MULTILINE))
    tail = "\n".join((res.stderr or res.stdout).strip().splitlines()[-12:])
    return res.returncode == 0, warnings, tail


def r_packages(patterns):
    found = set()
    for _, meta, body in sheets(patterns):
        code = "".join(c for lang, _, c in BLOCK.findall(body) if lang == "r")
        found.update(re.findall(r"\b(?:library|require)\(\s*([A-Za-z][\w.]*)", code))
        found.update(re.findall(r"\b([A-Za-z][\w.]*)::", code))
        for call in re.findall(r"install\.packages\(([^)]*)\)", code):
            found.update(re.findall(r'"([A-Za-z][\w.]*)"', call))
        if meta.get("lang") == "r":
            found.update(p["name"] for p in meta.get("packages") or [] if p["name"] != "base R")
            found.update(d.split("::")[0] for d in meta.get("datasets") or [] if "::" in d)
    return sorted(found - BASE_R - {"pkg"}, key=str.lower)


def py_packages(patterns):
    found = set()
    for _, meta, _ in sheets(patterns):
        if meta.get("lang") in ("python", "both"):
            found.update(p["name"] for p in meta.get("packages") or [])
    return sorted(found, key=str.lower)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("patterns", nargs="*", help="slug patterns, e.g. 'r-lm-*'")
    ap.add_argument("--list-r-packages", action="store_true")
    ap.add_argument("--list-py-packages", action="store_true")
    ap.add_argument("--strict", action="store_true", help="treat warnings as failures")
    ap.add_argument("--plots", metavar="DIR", help="render ```r plot blocks into DIR")
    ap.add_argument("--jobs", type=int, default=4)
    args = ap.parse_args()

    if args.list_r_packages:
        print("\n".join(r_packages(args.patterns)))
        return
    if args.list_py_packages:
        print(" ".join(py_packages(args.patterns)))
        return

    plot_dir = None
    if args.plots:
        plot_dir = Path(args.plots).resolve()
        plot_dir.mkdir(parents=True, exist_ok=True)
    tasks = []
    for path, meta, body in sheets(args.patterns):
        slug = meta.get("slug", path.stem)
        if plot_dir:
            for old in plot_dir.glob(f"{slug}-*"):   # outputs from an earlier run
                if re.fullmatch(rf"{re.escape(slug)}-\d+-\d+\.\w+", old.name):
                    old.unlink()
        for lang, code in scripts_for(body, slug, plot_dir).items():
            tasks.append((path, lang, code))
    if not tasks:
        print("no code blocks found")
        return

    in_ci = os.environ.get("GITHUB_ACTIONS") == "true"
    failed = 0
    with ThreadPoolExecutor(max_workers=args.jobs) as pool:
        results = pool.map(lambda t: run_one(*t), tasks)
        for (path, lang, _), (ok, warnings, tail) in zip(tasks, results):
            rel = path.relative_to(ROOT)
            bad = not ok or (args.strict and warnings)
            status = "FAIL" if bad else "ok  "
            note = f"  ({warnings} warning{'s' * (warnings != 1)})" if warnings else ""
            print(f"{status} {rel} [{lang}]{note}")
            if bad or warnings:
                print("     " + tail.replace("\n", "\n     "))
            if in_ci and (bad or warnings):
                kind = "error" if bad else "warning"
                msg = tail.splitlines()[-1] if tail else "see log"
                print(f"::{kind} file={rel}::{msg}")
            failed += bad
    print(f"{len(tasks) - failed}/{len(tasks)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
