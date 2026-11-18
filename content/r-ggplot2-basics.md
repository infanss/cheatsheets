---
title: "ggplot2 basics: grammar and geoms"
slug: r-ggplot2-basics
lang: r
category: visualization
tags: [ggplot2, tidyverse, geoms, distributions, mhedas]
source_lessons: [L3]
level: beginner
packages:
  - name: ggplot2
    version: "4.0.4"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "The structure of a ggplot, distributions, group comparisons and counts, using the pbc liver data."
sources:
  - title: "ggplot2 reference"
    url: "https://ggplot2.tidyverse.org/reference/"
---

## TL;DR
- A plot is layers: `ggplot(data, aes(...)) + geom_*() + scale_*() + facet_*() + labs() + theme_*()`.
- `aes()` maps columns to visual properties; fixed settings (`fill = "steelblue"`) go outside `aes()`.
- `geom_bar()` counts rows, `geom_col()` plots values you already computed.
- Log scales need strictly positive values.

## Install and load
```r
install.packages("ggplot2")
library(ggplot2)
pbc <- survival::pbc
pbc$stage <- factor(pbc$stage)
```

## Core operations
### Distribution of a skewed variable
```r
ggplot(pbc, aes(bili)) +
  geom_histogram(bins = 40, fill = "steelblue", colour = "white") +
  scale_x_log10() +
  labs(x = "Bilirubin (mg/dL, log10 scale)", y = "Patients")
```

### Compare groups
Hide the boxplot outliers when the raw points are drawn on top, so nothing is shown twice.
```r
ggplot(pbc, aes(stage, bili)) +
  geom_boxplot(outlier.shape = NA) +
  geom_jitter(width = 0.15, alpha = 0.25) +
  scale_y_log10() +
  labs(x = "Histological stage", y = "Bilirubin (mg/dL)")
```

### Counts per category
```r
ggplot(pbc, aes(stage)) + geom_bar()

# Precomputed values: geom_col
counts <- as.data.frame(table(stage = pbc$stage))
ggplot(counts, aes(stage, Freq)) + geom_col()
```

### Common geoms
| Geom | Use for |
|---|---|
| `geom_histogram()` | distribution of a number |
| `geom_density()` | smoothed distribution |
| `geom_boxplot()` | comparing groups |
| `geom_bar()` | counts of a category |
| `geom_col()` | precomputed values |
| `geom_jitter()` | raw points with spread |
| `geom_point()` | relationship of two numbers |

## Common pitfalls
- **Colour inside `aes()` by mistake**: `aes(colour = "blue")` creates a legend entry called "blue". Put fixed colours outside `aes()`.
- **Warning "Removed rows containing missing values"**: `NA` rows (here, `stage` has missing values) were dropped from that layer.
- **Log scale and zeros**: `scale_*_log10()` drops values ≤ 0.

## Further reading
- [ggplot2 reference](https://ggplot2.tidyverse.org/reference/): every geom, scale and theme.
- [R for Data Science, 2e: Visualize](https://r4ds.hadley.nz/visualize.html): a guided introduction.
