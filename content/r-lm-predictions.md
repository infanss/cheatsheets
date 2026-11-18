---
title: "Predictions and intervals from lm"
slug: r-lm-predictions
lang: r
category: statistics
tags: [lm, predict, confidence-interval, prediction-interval, log-transform, mhedas]
source_lessons: [L4]
level: beginner
order: 3
datasets: [survival::pbc]
packages:
  - name: base R
    version: "4.6.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Predict from a linear model for new patients, tell confidence from prediction intervals, and back-transform a log outcome."
sources:
  - title: "predict.lm() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html"
---

## TL;DR
- `predict(m, newdata = nd, interval = "confidence")`: uncertainty about the mean outcome at those predictor values.
- `interval = "prediction"`: the range for one new patient; always wider.
- `newdata` must have the same column names, types and factor levels as the training data.
- `exp()` of a prediction on the log scale gives a geometric mean (median under the usual assumptions), not the arithmetic mean.

## Core operations
### Fit and new data
```r
pbc <- survival::pbc
pbc$log_bili <- log(pbc$bili)
m <- lm(log_bili ~ age, data = pbc)
new_patients <- data.frame(age = c(35, 55, 70))
```

### Confidence vs prediction interval
```r
mean_ci <- predict(m, newdata = new_patients, interval = "confidence", level = 0.95)
individual_pi <- predict(m, newdata = new_patients, interval = "prediction", level = 0.95)
```

### Back to the original scale
```r
exp(mean_ci)         # geometric-mean bilirubin with its CI
exp(individual_pi)   # range for a new patient, mg/dL
```

| Interval | Covers | Width |
|---|---|---|
| `confidence` | the mean outcome at given X | narrower |
| `prediction` | the outcome of one new observation at given X | wider |

## Common pitfalls
- **New factor levels**: a level absent from the training data makes `predict()` fail.
- **Arithmetic mean on the original scale** needs a retransformation bias correction; plain `exp()` underestimates it.
- **Extrapolation**: predictions outside the observed range of X rest on the linear form alone.

## Further reading
- [predict.lm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/predict.lm.html): all interval options.
