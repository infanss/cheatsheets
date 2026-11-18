---
title: "Classification metrics: threshold and confusion matrix"
slug: r-glm-classification-metrics
lang: r
category: statistics
tags: [classification, threshold, confusion-matrix, sensitivity, specificity, ppv, npv, mhedas]
source_lessons: [L5]
level: beginner
order: 7
datasets: [MASS::birthwt]
packages:
  - name: base R
    version: "4.6.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Turn predicted probabilities into classes with a threshold and compute sensitivity, specificity, PPV, NPV and accuracy."
sources:
  - title: "table() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/base/html/table.html"
---

## TL;DR
- Pick a threshold, classify `p >= threshold` as positive, cross-tabulate with the observed outcome.
- Sensitivity: share of true events detected. Specificity: share of non-events correctly ruled out.
- PPV and NPV depend on how common the event is.
- 0.5 is not a universal threshold; screening often uses a lower one.

## Core operations
### Probabilities to classes
```r
b <- MASS::birthwt
m <- glm(low ~ age + lwt + smoke + ht, family = binomial(), data = b)
p <- predict(m, type = "response")
threshold <- 0.30
pred <- as.integer(p >= threshold)
```

### Confusion matrix
Fixed factor levels keep a row or column even when a class never occurs.
```r
tab <- table(predicted = factor(pred, levels = 0:1),
             observed = factor(b$low, levels = 0:1))
tab
TN <- tab["0", "0"]; FN <- tab["0", "1"]
FP <- tab["1", "0"]; TP <- tab["1", "1"]
```

### Metrics
```r
c(
  sensitivity = TP / (TP + FN),
  specificity = TN / (TN + FP),
  PPV = TP / (TP + FP),
  NPV = TN / (TN + FN),
  accuracy = (TP + TN) / sum(tab)
)
```

| Metric | Question it answers |
|---|---|
| Sensitivity | Of the real events, how many did we catch? |
| Specificity | Of the non-events, how many did we correctly rule out? |
| PPV | Of those flagged positive, how many really are? |
| NPV | Of those flagged negative, how many really are? |

## Common pitfalls
- **Threshold chosen on the same data you report**: the metrics are optimistic. Choose it on training data or by clinical reasoning.
- **Accuracy with a rare event**: predicting "no event" for everyone can look accurate.
- **Zero denominator**: if no one is predicted positive, PPV is undefined (`NaN`), not 0.
- **Metrics on training data**: they overstate performance on new patients; see [calibration and cross-validation](#/r/r-glm-calibration-validation).

## Further reading
- [pROC: ROC curve and AUC](#/r/r-proc-roc-auc): how sensitivity and specificity change across all thresholds.
