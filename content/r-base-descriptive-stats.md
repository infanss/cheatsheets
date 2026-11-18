---
title: "Base R: descriptive statistics and NA"
slug: r-base-descriptive-stats
lang: r
category: statistics
tags: [base-r, descriptives, missing-data, na, tables, mhedas]
source_lessons: [L1, L2]
level: beginner
order: 1
datasets: [MASS::birthwt]
packages:
  - name: base R
    version: "4.6.1"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Summaries, quantiles, frequency tables and proportions, counting missing values, and why unknown is not zero."
sources:
  - title: "An Introduction to R (CRAN manual)"
    url: "https://cran.r-project.org/doc/manuals/r-release/R-intro.html"
  - title: "MASS::birthwt documentation"
    url: "https://cran.r-project.org/package=MASS"
---

## TL;DR
- `summary()` and `str()` first, then targeted statistics with `na.rm = TRUE`.
- `table(..., useNA = "ifany")` shows missing values instead of hiding them.
- `prop.table(tab, margin = 1)` gives row percentages.
- `sum(x, na.rm = TRUE)` on all-`NA` input returns `0`, not `NA`.

## Summaries
### Toy data
Birth weight data from `MASS`: 189 births, `low` = 1 for birth weight below 2.5 kg.
```r
b <- MASS::birthwt
str(b)
summary(b)
```

### Centre and spread
```r
mean(b$bwt, na.rm = TRUE)
median(b$bwt, na.rm = TRUE)
sd(b$bwt, na.rm = TRUE)
quantile(b$bwt, probs = c(0.25, 0.5, 0.75), na.rm = TRUE)
```

### Frequency tables and proportions
`margin = 1` divides by row totals, `margin = 2` by column totals.
```r
tab <- table(smoke = b$smoke, low = b$low, useNA = "ifany")
tab
prop.table(tab, margin = 1)   # share of low birth weight within each smoking group
```

## Missing values
### Count and drop
```r
colSums(is.na(b))                  # NA count per column
sum(is.na(b$bwt))
complete.cases(b)                  # TRUE for rows without any NA
b_complete <- b[complete.cases(b[, c("bwt", "smoke")]), ]
```

### Unknown is not zero
`sum(x, na.rm = TRUE)` returns `0` when every value is missing. In a registry that reads as "no cases" when the truth is "not reported".
```r
sum(c(NA, NA), na.rm = TRUE)       # 0, misleading

sum_reported <- function(x) {
  if (all(is.na(x))) NA_real_ else sum(x, na.rm = TRUE)
}
sum_reported(c(NA_real_, NA_real_))  # NA
sum_reported(c(2, NA_real_, 5))      # 7
```

## Common pitfalls
- **`table()` hides `NA` by default**: pass `useNA = "ifany"` so missingness is visible.
- **Complete-case filtering changes the sample**: report how many rows were dropped and why.
- **All-`NA` sums become `0`**: use a helper like `sum_reported()` for counts that feed reports.

## Further reading
- [An Introduction to R](https://cran.r-project.org/doc/manuals/r-release/R-intro.html): the official manual.
