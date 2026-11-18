---
title: "plotly"
slug: r-plotly-ggplotly
lang: r
category: visualization
tags: [plotly, interactive, ggplotly, tooltip, html, mhedas]
source_lessons: [L3]
level: beginner
order: 3
datasets: [survival::pbc]
packages:
  - name: plotly
    version: "4.12.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Turn a ggplot into an interactive chart with custom hover text, and save it as a standalone HTML file."
sources:
  - title: "plotly R: ggplot2 integration"
    url: "https://plotly.com/ggplot2/"
  - title: "Interactive web-based data visualization with R, plotly, and shiny"
    url: "https://plotly-r.com/"
---

## TL;DR
- `ggplotly(p)` converts most ggplot2 plots to interactive HTML.
- Put the hover text in a `text` aesthetic and pass `tooltip = "text"`.
- Save with `htmlwidgets::saveWidget()`; PDFs lose interactivity, so export a static version too.

## Install and load
```r
install.packages("plotly")
library(ggplot2)
library(plotly)
pbc <- survival::pbc
pbc$stage <- factor(pbc$stage)
```

## Core operations
### Interactive scatter with custom hover text
`text` is not a ggplot2 aesthetic; ggplot2 ignores it and plotly uses it for the tooltip.
```r
p <- ggplot(pbc, aes(albumin, bili,
                     text = paste0("Stage: ", stage,
                                   "<br>Albumin: ", albumin,
                                   "<br>Bilirubin: ", bili))) +
  geom_point(aes(colour = stage), alpha = 0.7) +
  labs(x = "Albumin (g/dL)", y = "Bilirubin (mg/dL)")

interactive_plot <- ggplotly(p, tooltip = "text")
interactive_plot
```

### Save as HTML
`selfcontained = TRUE` puts everything in one file you can email.
```r plot
htmlwidgets::saveWidget(interactive_plot, file = "pbc-interactive.html",
                        selfcontained = TRUE)
```

## Common pitfalls
- **Not every layer converts cleanly**: check the HTML result, especially for facets, smoothers and custom themes.
- **Hover text shows raw codes**: build the `text` string from labelled factors, not 0/1 codes.

## Further reading
- [plotly-r.com](https://plotly-r.com/): the book by the package author.
