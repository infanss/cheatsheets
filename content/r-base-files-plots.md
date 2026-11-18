---
title: "Base R: files and saving plots"
slug: r-base-files-plots
lang: r
category: basics
tags: [base-r, io, csv, rds, png, pdf, mhedas]
source_lessons: [L1]
level: beginner
order: 2
datasets: [MASS::birthwt]
packages:
  - name: base R
    version: "4.6.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Read and write CSV and RDS files with base R, and save base or lattice plots to PNG and PDF."
sources:
  - title: "R Data Import/Export (CRAN manual)"
    url: "https://cran.r-project.org/doc/manuals/r-release/R-data.html"
---

## TL;DR
- `read.csv()` / `write.csv(row.names = FALSE)` for CSV; `saveRDS()` / `readRDS()` to keep one R object exactly as it is.
- Save a plot by opening a device (`png()`, `pdf()`), drawing, then `dev.off()`.
- Use an RStudio project and relative paths like `data/file.csv`.
- For ggplot2 use `ggsave()` instead.

## Files
### CSV
Tell R which strings mean missing; drop the row-name column when writing.
```r
dir.create("data", showWarnings = FALSE)
patients <- data.frame(id = 1:3, age = c(25, NA, 28))
write.csv(patients, "data/patients.csv", row.names = FALSE)
patients <- read.csv("data/patients.csv", na.strings = c("", "NA"))
```

### RDS: one object, types preserved
Factors, dates and attributes survive the round trip, unlike CSV.
```r
saveRDS(patients, "data/patients.rds")
restored <- readRDS("data/patients.rds")
identical(patients, restored)   # TRUE
```

## Saving plots
### PNG and PDF
`res` is pixels per inch; PDF sizes are in inches.
```r
b <- MASS::birthwt

png("birthweight.png", width = 1200, height = 800, res = 150)
hist(b$bwt, main = "Birth weight", xlab = "grams")
dev.off()

pdf("birthweight.pdf", width = 7, height = 5)
boxplot(bwt ~ smoke, data = b, xlab = "Smoking (0/1)", ylab = "grams")
dev.off()
```

## Common pitfalls
- **Empty or broken file**: `dev.off()` was not called, so the device never closed.
- **Extra `X` column after re-reading a CSV**: it was written without `row.names = FALSE`.
- **Absolute paths** like `C:/Users/...` break on other machines; use a project and relative paths.
- **lattice plots inside a device**: they must be printed explicitly with `print(p)`.

## Further reading
- [R Data Import/Export](https://cran.r-project.org/doc/manuals/r-release/R-data.html): every import route in base R.
