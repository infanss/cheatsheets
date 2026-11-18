---
title: "Linear model diagnostics"
slug: r-lm-diagnostics
lang: r
category: statistics
tags: [lm, residuals, diagnostics, vif, cooks-distance, leverage, mhedas]
source_lessons: [L4]
level: intermediate
packages:
  - name: stats
    version: "4.6.1"
  - name: car
    version: "3.1-5"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Check a linear model with the four residual plots, Cook's distance, leverage and VIF."
sources:
  - title: "plot.lm() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html"
  - title: "car on CRAN"
    url: "https://cran.r-project.org/package=car"
---

## TL;DR
- `plot(m)` draws four checks: linearity, normality of residuals, constant variance, influential points.
- `cooks.distance()` and `hatvalues()` find observations that pull the fit.
- `car::vif()` measures collinearity; multi-level factors get GVIF instead.
- An influential point is a reason to check the data, not to delete it automatically.

## Install and load
```r
install.packages("car")
pbc <- survival::pbc
pbc$stage <- factor(pbc$stage)
pbc$log_bili <- log(pbc$bili)
m <- lm(log_bili ~ age + stage + albumin, data = pbc)
```

## Core operations
### The four standard plots
```r
op <- par(mfrow = c(2, 2))
plot(m)
par(op)
```

| Panel | Look for | Suggests |
|---|---|---|
| Residuals vs Fitted | curve or pattern | wrong functional form |
| Normal Q-Q | points leaving the line in the tails | non-normal errors |
| Scale-Location | funnel shape | non-constant variance |
| Residuals vs Leverage | points beyond Cook's distance lines | influential observations |

### Residuals, influence, leverage
`4 / n` is a rough flag for Cook's distance, not a formal rule.
```r
head(data.frame(fitted = fitted(m), residual = residuals(m)))
cooks <- cooks.distance(m)
which(cooks > 4 / nobs(m))
head(sort(hatvalues(m), decreasing = TRUE))   # highest leverage
```

### Collinearity
```r
car::vif(m)
```
With a factor such as `stage` (3 df), `vif()` returns `GVIF`, `Df` and `GVIF^(1/(2*Df))`. Compare the last column across terms, not raw GVIF with ordinary VIF.

## Common pitfalls
- **Deleting points until the plots look good**: investigate influential rows (data entry errors, a different population) and report sensitivity analyses instead.
- **Reading VIF and GVIF on the same scale**: they are not directly comparable.
- **Normality of the outcome**: the assumption is about residuals, not about `y` itself.

## Further reading
- [plot.lm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/plot.lm.html): what each panel shows.
