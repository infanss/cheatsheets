---
title: "lattice"
slug: r-lattice-basics
lang: r
category: visualization
tags: [lattice, trellis, panels, xyplot, mhedas]
source_lessons: [L1]
level: beginner
order: 1
datasets: [MASS::birthwt]
packages:
  - name: lattice
    version: "0.22-9"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Trellis plots: the same chart repeated per group with the | operator, and how to save them."
sources:
  - title: "lattice on CRAN"
    url: "https://cran.r-project.org/package=lattice"
---

## TL;DR
- Formula `y ~ x | group` draws one panel per group.
- Main functions: `xyplot()`, `histogram()`, `bwplot()`, `densityplot()`.
- Inside a device or a loop, a lattice plot is drawn only when you `print()` it.
- For layer-by-layer styling, [ggplot2](#/r/r-ggplot2-basics) is more flexible.

## Install and load
```r
library(lattice)   # ships with R
b <- MASS::birthwt
b$smoke <- factor(b$smoke, levels = 0:1, labels = c("no", "yes"))
```

## Core operations
### Scatter plot per group
```r plot
xyplot(bwt ~ age | smoke, data = b,
       xlab = "Maternal age", ylab = "Birth weight (g)")
```

### Distributions per group
```r plot
histogram(~ bwt | smoke, data = b)
bwplot(smoke ~ bwt, data = b)
densityplot(~ bwt, groups = smoke, data = b, auto.key = TRUE)
```

### Save to a file
```r
p <- xyplot(bwt ~ age | smoke, data = b)
png("birthweight-by-smoking.png", width = 1100, height = 650)
print(p)   # required: lattice returns an object, it does not draw itself here
dev.off()
```

## Common pitfalls
- **Blank PNG**: the plot object was not printed inside the device.
- **Numeric group after `|`**: lattice turns it into shingles (overlapping ranges); convert to a factor for one panel per value.

## Further reading
- [lattice on CRAN](https://cran.r-project.org/package=lattice): reference manual.
