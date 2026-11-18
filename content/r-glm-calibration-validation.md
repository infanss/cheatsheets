---
title: "Logistic models: calibration and cross-validation"
slug: r-glm-calibration-validation
lang: r
category: statistics
tags: [glm, calibration, hosmer-lemeshow, cross-validation, brier, auc, mhedas]
source_lessons: [L5]
level: intermediate
order: 9
datasets: [MASS::birthwt]
packages:
  - name: base R
    version: "4.6.1"
  - name: pROC
    version: "1.19.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Check whether predicted risks match observed rates, compute Hosmer–Lemeshow by hand, and estimate AUC and Brier score with stratified 5-fold cross-validation."
sources:
  - title: "glm() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html"
  - title: "pROC documentation"
    url: "https://xrobin.github.io/pROC/"
---

## TL;DR
- Calibration: do patients given 20% risk have the event about 20% of the time? Plot observed vs predicted by risk group.
- A large Hosmer–Lemeshow p-value does not prove good calibration.
- Report performance on data the model did not see: cross-validation or an external set.
- Brier score is the mean squared error of the probabilities; lower is better.

## Diagnostics
### Fit and deviance residuals
```r
b <- MASS::birthwt
m <- glm(low ~ lwt + smoke + ht + ui, family = binomial(), data = b)
p <- predict(m, type = "response")
head(residuals(m, type = "deviance"))
```

### Calibration plot by risk decile
Points on the dashed diagonal mean predicted risk matches the observed rate.
```r plot
bin <- cut(p, breaks = unique(quantile(p, seq(0, 1, 0.1))), include.lowest = TRUE)
cal <- aggregate(data.frame(observed = b$low, predicted = p),
                 by = list(bin = bin), FUN = mean)
plot(cal$predicted, cal$observed, xlim = c(0, 1), ylim = c(0, 1),
     xlab = "Mean predicted risk", ylab = "Observed event rate")
abline(0, 1, lty = 2)
```

### Binned residuals
```r plot
plot(cal$predicted, cal$observed - cal$predicted,
     xlab = "Mean predicted risk", ylab = "Observed - predicted")
abline(h = 0, lty = 2)
```

### Hosmer–Lemeshow by hand
Compares observed and expected events across risk groups.
```r
obs <- tapply(b$low, bin, sum)
expected <- tapply(p, bin, sum)
n_g <- tapply(b$low, bin, length)
hl <- sum((obs - expected)^2 / (expected * (1 - expected / n_g)))
df <- length(obs) - 2
c(HL = hl, df = df, p = pchisq(hl, df = df, lower.tail = FALSE))
```
The test depends heavily on sample size and the number of groups. Use it next to the calibration plot, never instead of it.

## Validation
### Stratified 5-fold cross-validation without leakage
Every prediction comes from a model that did not see that patient.
```r
set.seed(20261008)
fold <- integer(nrow(b))
for (y in 0:1) {
  i <- which(b$low == y)
  fold[i] <- sample(rep(1:5, length.out = length(i)))
}

oof <- rep(NA_real_, nrow(b))
for (k in 1:5) {
  fit <- glm(low ~ lwt + smoke + ht + ui, data = b[fold != k, ], family = binomial())
  oof[fold == k] <- predict(fit, newdata = b[fold == k, ], type = "response")
}
stopifnot(!anyNA(oof))
```

### Out-of-fold AUC and Brier score
```r
roc_oof <- pROC::roc(b$low, oof, levels = c(0, 1), direction = "<", quiet = TRUE)
c(AUC = as.numeric(pROC::auc(roc_oof)), Brier = mean((b$low - oof)^2))
```

## Common pitfalls
- **Leakage**: choosing predictors, thresholds or tuning on the full data before CV makes the CV estimate optimistic. Do every selection step inside the training folds.
- **Training AUC reported as performance**: it is optimistic; report the cross-validated or external value.
- **Good discrimination, poor calibration**: a model can rank patients well (high AUC) and still give wrong absolute risks.

## Further reading
- [pROC documentation](https://xrobin.github.io/pROC/): ROC analysis and AUC confidence intervals.
