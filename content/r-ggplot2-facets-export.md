---
title: "ggplot2: relationships, facets and export"
slug: r-ggplot2-facets-export
lang: r
category: visualization
tags: [ggplot2, facets, smoothing, themes, ggsave, mhedas]
source_lessons: [L3, L4]
level: beginner
packages:
  - name: ggplot2
    version: "4.0.4"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Scatter plots with smoothers, small multiples with facets, zooming, themes and saving with ggsave."
sources:
  - title: "ggplot2 reference"
    url: "https://ggplot2.tidyverse.org/reference/"
---

## TL;DR
- `facet_wrap(~ g)` for one grouping variable, `facet_grid(rows ~ cols)` for two.
- Zoom with `coord_cartesian()`; `xlim()` / `scale_*(limits =)` drop data before smoothing.
- A log axis changes how the axis is drawn, not the model behind `geom_smooth()`.
- Save with `ggsave()`, setting size and dpi explicitly.

## Install and load
```r
library(ggplot2)
pbc <- survival::pbc
pbc$stage <- factor(pbc$stage)
pbc <- subset(pbc, !is.na(stage))   # else a 6-patient "NA" panel breaks loess
```

## Core operations
### Relationship with a smoother, one panel per stage
```r
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
```r
p + coord_cartesian(xlim = c(2, 5))     # zoom, data kept
p + facet_grid(. ~ stage)               # stages as columns
p + theme(legend.position = "bottom")
```

### Save
Width and height are in inches unless `units` says otherwise.
```r
ggsave("pbc-albumin-bilirubin.png", plot = p, width = 8, height = 5, dpi = 300)
ggsave("pbc-albumin-bilirubin.pdf", plot = p, width = 8, height = 5)
```

## Common pitfalls
- **Smoother changes after zooming with `xlim()`**: points outside the limits were removed first. Use `coord_cartesian()`.
- **Log of zero or negative values**: check `min(x, na.rm = TRUE) > 0` before a log scale.
- **`ggsave()` without `plot =`** saves the last plot shown, which may not be the one you mean.
- **`NA` as its own facet**: missing values in the facet variable get an extra panel; filter them or report them on purpose.

## Further reading
- [ggplot2 reference: facets](https://ggplot2.tidyverse.org/reference/facet_wrap.html): all facet options.
