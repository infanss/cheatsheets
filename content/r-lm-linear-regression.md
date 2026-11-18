---
title: "Linear regression with lm"
slug: r-lm-linear-regression
lang: r
category: statistics
tags: [lm, regression, formula, factors, interaction, mhedas]
source_lessons: [L4]
level: beginner
packages:
  - name: stats
    version: "4.6.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Fit a linear model, read coefficients and confidence intervals, and use factors and interactions in formulas."
sources:
  - title: "lm() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html"
  - title: "survival::pbc documentation"
    url: "https://cran.r-project.org/package=survival"
---

## TL;DR
- `lm(y ~ x1 + x2, data = d)`, then `summary()`, `coef()` and `confint()`.
- A numeric coefficient is the change in expected `y` per +1 unit of that predictor, others held fixed.
- A factor coefficient is the difference from the reference level.
- `a * b` means `a + b + a:b`; the `a:b` term is how the slope of `a` differs across `b`.
- An association in observational data is not a causal effect.

## Prepare
### Model data without missing values
Fit every model on the same complete rows so they can be compared.
```r
pbc <- survival::pbc
pbc$stage <- factor(pbc$stage)
pbc$ascites <- factor(pbc$ascites, levels = 0:1, labels = c("no", "yes"))
pbc$log_bili <- log(pbc$bili)   # outcome: log bilirubin
model_data <- pbc[complete.cases(pbc[, c("log_bili", "age", "stage", "ascites")]), ]
```

## Fit and read
### Simple and multiple regression
```r
m1 <- lm(log_bili ~ age, data = model_data)
m2 <- lm(log_bili ~ age + stage + ascites, data = model_data)
summary(m2)
coef(m2)
confint(m2)                  # 95% CI for each coefficient
head(model.matrix(m2))       # how factors become dummy columns
```

### Interactions
```r
m_int <- lm(log_bili ~ age * ascites, data = model_data)
coef(m_int)["age:ascitesyes"]   # difference in the age slope for ascites = yes
m_factors <- lm(log_bili ~ stage * ascites, data = model_data)
```

### Log-transformed outcome
With `log(y)` as the outcome, `exp(beta)` is approximately a multiplicative change in `y` (for example 1.10 = about 10% higher). It is not an odds ratio.
```r
exp(coef(m2))
exp(confint(m2))
```

## Common pitfalls
- **Changing reference level changes the coefficients, not the fit**: set it with `relevel()` so the comparison makes sense.
- **Numeric codes for categories**: `stage` as a number forces a linear trend across stages.
- **Main effects in an interaction model**: `age` alone is now the slope when `ascites = "no"`, not an average slope.
- **Collinear predictors** inflate standard errors; check VIF (see the diagnostics sheet).

## Further reading
- [lm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/lm.html): arguments and value.
- [Formula syntax](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/formula.html): `*`, `:`, `-`, `I()` and more.
