---
title: "Comparing and selecting models"
slug: r-model-comparison
lang: r
category: statistics
tags: [model-selection, anova, aic, step, likelihood-ratio, mhedas]
source_lessons: [L4, L5]
level: intermediate
order: 5
datasets: [survival::pbc, MASS::birthwt]
packages:
  - name: base R
    version: "4.6.1"
  - name: MASS
    version: "7.3-65"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Compare nested lm and glm models with F and likelihood-ratio tests, rank models by AIC, and know the limits of stepwise selection."
sources:
  - title: "anova() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/anova.html"
  - title: "step() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/step.html"
---

## TL;DR
- Nested models: `anova(small, large)` for `lm` (F-test), `anova(..., test = "Chisq")` for `glm` (likelihood-ratio test).
- `AIC()`: lower is better, only among models fitted to the same rows.
- `step()` / `MASS::stepAIC()` are exploratory; p-values after selection are too optimistic.

## Linear models
### Same rows for every model
Missing values in an extra predictor silently shrink the sample, which breaks the comparison.
```r
pbc <- survival::pbc
pbc$log_bili <- log(pbc$bili)
vars <- c("log_bili", "age", "albumin", "sex")
d <- pbc[complete.cases(pbc[, vars]), vars]

small <- lm(log_bili ~ age, data = d)
large <- lm(log_bili ~ age + albumin + sex, data = d)
```

### F-test, AIC and stepwise
```r
anova(small, large)
AIC(small, large)
selected <- step(large, direction = "both", trace = 0)
summary(selected)
```

## Logistic models
### Likelihood-ratio test and stepAIC
```r
b <- MASS::birthwt
base_glm <- glm(low ~ age + lwt, data = b, family = binomial())
full_glm <- glm(low ~ age + lwt + smoke + ht, data = b, family = binomial())
anova(base_glm, full_glm, test = "Chisq")
MASS::stepAIC(full_glm, direction = "both", trace = FALSE)
```

## Common pitfalls
- **Different rows**: `anova()` errors or `AIC()` misleads when models were fitted on different subsets because of `NA`.
- **Trusting p-values from the selected model**: they ignore the selection step. Prefer predictors chosen from subject knowledge and validate externally.
- **AIC on different outcomes**: models of `y` and `log(y)` cannot be compared by AIC directly.

## Further reading
- [step() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/step.html): scope and direction.
