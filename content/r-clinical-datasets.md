---
title: "Teaching clinical datasets"
slug: r-clinical-datasets
lang: r
category: data
tags: [datasets, clinical, birthwt, juul, pbc, who, mhedas]
source_lessons: [L1, L2, L3, L4, L5]
level: beginner
order: 1
datasets: [MASS::birthwt, ISwR::juul, survival::pbc, tidyr::who]
packages: []
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "The four datasets used across MHEDAS units L1–L5: what is in them, how to load them and how to recode them before analysis."
sources:
  - title: "MASS on CRAN (birthwt)"
    url: "https://cran.r-project.org/package=MASS"
  - title: "ISwR on CRAN (juul)"
    url: "https://cran.r-project.org/package=ISwR"
  - title: "survival on CRAN (pbc)"
    url: "https://cran.r-project.org/package=survival"
---

## TL;DR
- `birthwt` (MASS): 189 births, risk factors for low birth weight. Used in L1 and L5.
- `juul` (ISwR): 1,339 children and adolescents, IGF-1, age, Tanner stage. Used in L1.
- `pbc` (survival): 418 patients with primary biliary cholangitis, 312 of them in the randomized trial. Used in L3 and L4.
- `who` (tidyr): tuberculosis notifications with values packed into column names. Used in L2.

## Load
### Without attaching the packages
`pkg::name` loads one dataset without `library()`.
```r
births <- MASS::birthwt
juul <- ISwR::juul
pbc <- survival::pbc
who <- tidyr::who
str(births)
```

## Prepare
### birthwt: 0/1 codes to labelled factors
`low` is 0/1 (birth weight < 2.5 kg); `bwt` is the weight in grams.
```r
births$smoke <- factor(births$smoke, levels = 0:1, labels = c("no", "yes"))
births$race <- factor(births$race, levels = 1:3,
                      labels = c("white", "black", "other"))
table(births$low)   # check that the event is coded as 1
```

### pbc: factors and a log-transformed lab value
Bilirubin is strongly right-skewed, so models usually use its log.
```r
pbc$stage <- factor(pbc$stage, levels = 1:4)
pbc$ascites <- factor(pbc$ascites, levels = 0:1, labels = c("no", "yes"))
pbc$log_bili <- log(pbc$bili)
```

## Common pitfalls
- **`pbc$trt` is `NA` for the 106 patients outside the randomized trial**: do not compare treatments before deciding how to handle them.
- **`pbc$status` is not 0/1**: 0 = censored, 1 = transplant, 2 = dead. Recode explicitly for a binary or survival outcome.
- **Numeric codes treated as numbers**: `race` 1/2/3 in a model means a linear trend unless it is a factor.

## Further reading
- Run `?MASS::birthwt`, `?ISwR::juul`, `?survival::pbc` and `?tidyr::who` for the full variable descriptions.
