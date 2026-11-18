---
title: "pROC: ROC curve and AUC"
slug: r-proc-roc-auc
lang: r
category: statistics
tags: [proc, roc, auc, discrimination, threshold, mhedas]
source_lessons: [L5]
level: beginner
order: 8
datasets: [MASS::birthwt]
packages:
  - name: pROC
    version: "1.19.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Plot a ROC curve, get AUC with its confidence interval and read sensitivity and specificity at a threshold."
sources:
  - title: "pROC documentation"
    url: "https://xrobin.github.io/pROC/"
---

## TL;DR
- ROC plots sensitivity against 1 − specificity over all thresholds.
- AUC 0.5 = ranking no better than chance, 1 = perfect separation.
- AUC measures discrimination only, not whether the probabilities are right (calibration).
- Fix `levels` and `direction` in `roc()` so results are reproducible.

## Install and load
```r
install.packages("pROC")
library(pROC)
```

## Core operations
### ROC and AUC
`levels = c(0, 1)`: 0 = controls, 1 = cases; `direction = "<"`: higher score means higher risk.
```r
b <- MASS::birthwt
m <- glm(low ~ age + lwt + smoke + ht, family = binomial(), data = b)
p <- predict(m, type = "response")

r <- roc(response = b$low, predictor = p, levels = c(0, 1), direction = "<", quiet = TRUE)
auc(r)
ci.auc(r)   # 95% CI for AUC
plot(r, main = paste("AUC", round(as.numeric(auc(r)), 3)))
```

### Thresholds
```r
coords(r, x = "best", input = "threshold",
       ret = c("threshold", "sensitivity", "specificity"))   # Youden's J
coords(r, x = 0.30, input = "threshold",
       ret = c("sensitivity", "specificity"))
```

## Common pitfalls
- **Automatic direction**: without `direction`, `roc()` guesses it from the group medians, which can hide a model that ranks patients backwards.
- **"Best" threshold is not clinically best**: Youden's J weighs false positives and false negatives equally.
- **Training AUC is optimistic**: report cross-validated or external AUC (see [calibration and cross-validation](#/r/r-glm-calibration-validation)).

## Further reading
- [pROC documentation](https://xrobin.github.io/pROC/): smoothing, comparing curves, partial AUC.
