---
title: "Logistic regression with glm"
slug: r-glm-logistic-regression
lang: r
category: statistics
tags: [glm, logistic-regression, odds-ratio, logit, mhedas]
source_lessons: [L5]
level: beginner
packages:
  - name: stats
    version: "4.6.1"
  - name: MASS
    version: "7.3-65"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Fit a binomial GLM, turn coefficients into odds ratios with profile CIs, and get predicted probabilities."
sources:
  - title: "glm() documentation"
    url: "https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html"
  - title: "MASS::birthwt documentation"
    url: "https://cran.r-project.org/package=MASS"
---

## TL;DR
- The model is linear on the log-odds scale: `logit(p) = log(p / (1 - p)) = b0 + b1*x1 + ...`; back to probability with `plogis()`.
- `exp(coef(m))` gives odds ratios, `exp(confint(m))` their 95% profile-likelihood CIs.
- An odds ratio is not a risk ratio and not a probability.
- `predict(m, type = "response")` returns probabilities, `type = "link"` log-odds.

## Core operations
### Prepare and fit
The outcome must code the event as `1`.
```r
b <- MASS::birthwt
b$race <- factor(b$race, levels = 1:3, labels = c("white", "black", "other"))
b$smoke <- factor(b$smoke, levels = 0:1, labels = c("no", "yes"))
b$ht <- factor(b$ht, levels = 0:1, labels = c("no", "yes"))
b$ui <- factor(b$ui, levels = 0:1, labels = c("no", "yes"))
table(b$low)   # 130 controls, 59 events

m <- glm(low ~ age + lwt + race + smoke + ptl + ht + ui + ftv,
         family = binomial(), data = b)
summary(m)
```

### Odds ratios with confidence intervals
```r
coef(m)              # log odds ratios
exp(coef(m))         # odds ratios; smokeyes is about 2.6
exp(confint(m))      # 95% profile-likelihood CI
exp(confint.default(m))   # Wald CI, faster but less accurate in small samples
```

### Predicted probabilities
```r
b$predicted_risk <- predict(m, type = "response")   # 0 to 1
head(predict(m, type = "link"))                      # log-odds
plogis(predict(m, type = "link"))[1:3]               # same as type = "response"
```

### Reading an odds ratio
- `exp(b) > 1`: higher odds of the event per unit increase (or versus the reference level), other predictors fixed.
- `exp(b) < 1`: lower odds.
- Smoking OR of about 2.6 in the full model means 2.6 times the **odds** of low birth weight, not 2.6 times the risk.

## Common pitfalls
- **OR read as RR**: with a common outcome (here 31% of births) the odds ratio is noticeably further from 1 than the risk ratio.
- **Event coded as 0**: all ORs invert. Check `table(outcome)` first.
- **Causal language**: an adjusted OR from observational data is an association.
- **Separation**: huge coefficients and SEs mean a predictor perfectly splits the outcome; the estimates are unreliable.

## Further reading
- [glm() documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html): families and links.
