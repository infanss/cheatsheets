---
title: "ggplot2"
slug: r-ggplot2-basics
lang: r
category: visualization
tags: [ggplot2, tidyverse, geoms, distributions, facets, smoothing, themes, ggsave, mhedas]
source_lessons: [L3, L4]
level: beginner
order: 2
datasets: [survival::pbc]
packages:
  - name: ggplot2
    version: "4.0.4"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "The grammar of a ggplot, distributions and group comparisons, relationships with smoothers, facets, zooming, themes and ggsave, using the pbc liver data."
sources:
  - title: "ggplot2 reference"
    url: "https://ggplot2.tidyverse.org/reference/"
---

## TL;DR
- A plot is layers: `ggplot(data, aes(...)) + geom_*() + scale_*() + facet_*() + labs() + theme_*()`.
- `aes()` maps columns to visual properties; fixed settings (`fill = "steelblue"`) go outside `aes()`.
- `geom_bar()` counts rows, `geom_col()` plots values you already computed.
- `facet_wrap(~ g)` for one grouping variable, `facet_grid(rows ~ cols)` for two.
- Zoom with `coord_cartesian()`; `xlim()` drops data before smoothing.
- Save with `ggsave()`, setting size and dpi explicitly.

## Install and load
```r
install.packages("ggplot2")
library(ggplot2)
pbc <- survival::pbc
pbc$stage <- factor(pbc$stage)
pbc <- subset(pbc, !is.na(stage))   # 6 patients without a stage
```

## Distributions and groups
### Distribution of a skewed variable
```r plot
ggplot(pbc, aes(bili)) +
  geom_histogram(bins = 40, fill = "steelblue", colour = "white") +
  scale_x_log10() +
  labs(x = "Bilirubin (mg/dL, log10 scale)", y = "Patients")
```

### Compare groups
Hide the boxplot outliers when the raw points are drawn on top, so nothing is shown twice.
```r plot
ggplot(pbc, aes(stage, bili)) +
  geom_boxplot(outlier.shape = NA) +
  geom_jitter(width = 0.15, alpha = 0.25) +
  scale_y_log10() +
  labs(x = "Histological stage", y = "Bilirubin (mg/dL)")
```

### Counts per category
`geom_bar()` counts rows itself; `geom_col()` takes counts you computed.
```r plot
ggplot(pbc, aes(stage)) + geom_bar()

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
| `geom_smooth()` | trend line |

## Relationships and facets
### Scatter with a smoother, one panel per stage
```r plot
p <- ggplot(pbc, aes(albumin, bili)) +
  geom_point(aes(colour = stage), alpha = 0.65) +
  geom_smooth(method = "loess", formula = y ~ x, se = FALSE, colour = "black") +
  facet_wrap(~ stage) +
  scale_y_log10() +
  labs(title = "Albumin and bilirubin by stage",
       x = "Albumin (g/dL)", y = "Bilirubin (mg/dL, log scale)", colour = "Stage") +
  theme_minimal(base_size = 12)
p
```

### Adjust the layout
```r plot
p + coord_cartesian(xlim = c(2, 5))     # zoom, data kept
p + facet_grid(. ~ stage)               # stages as columns
p + theme(legend.position = "bottom")
```

## Export
### Save with ggsave
Width and height are in inches unless `units` says otherwise.
```r
ggsave("pbc-albumin-bilirubin.png", plot = p, width = 8, height = 5, dpi = 300)
ggsave("pbc-albumin-bilirubin.pdf", plot = p, width = 8, height = 5)
```

## Common pitfalls
- **Colour inside `aes()` by mistake**: `aes(colour = "blue")` creates a legend entry called "blue". Put fixed colours outside `aes()`.
- **Warning "Removed rows containing missing values"**: `NA` rows were dropped from that layer.
- **Log scale and zeros**: `scale_*_log10()` drops values ≤ 0; check `min(x, na.rm = TRUE) > 0` first.
- **Smoother changes after zooming with `xlim()`**: points outside the limits were removed first. Use `coord_cartesian()`.
- **`NA` as its own facet**: missing values in the facet variable get an extra panel; filter them or report them on purpose.
- **`ggsave()` without `plot =`** saves the last plot shown, which may not be the one you mean.

## Further reading
- [ggplot2 reference](https://ggplot2.tidyverse.org/reference/): every geom, scale, facet and theme.
- [R for Data Science, 2e: Visualize](https://r4ds.hadley.nz/visualize.html): a guided introduction.
