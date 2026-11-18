---
title: "readr basics"
slug: r-readr-basics
lang: r
category: data
tags: [readr, tidyverse, csv, import, export, mhedas]
source_lessons: [L2]
level: beginner
packages:
  - name: readr
    version: "2.2.0"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Read and write CSV files with explicit column types, missing values and parsing checks."
sources:
  - title: "readr documentation"
    url: "https://readr.tidyverse.org/"
---

## TL;DR
- `read_csv()` returns a tibble and guesses column types; fix them with `col_types` for anything you rely on.
- Declare which strings mean missing with `na =`.
- After reading, check `problems()` and `spec()`.
- `write_csv()` never writes row names.

## Install and load
```r
install.packages("readr")
library(readr)
```

## Core operations
### Write and read a CSV
```r
dir.create("data", showWarnings = FALSE)
write_csv(data.frame(id = 1:2, age = c(32, NA)), "data/ages.csv", na = "")
ages <- read_csv("data/ages.csv", na = c("", "NA"), show_col_types = FALSE)
```

### Fix the column types
Typed columns stop silent surprises, such as IDs read as numbers or numbers read as text.
```r
ages <- read_csv("data/ages.csv",
                 col_types = cols(id = col_integer(), age = col_double()))
spec(ages)       # the column specification that was used
problems(ages)   # rows that failed to parse
```

## Common pitfalls
- **Codes with leading zeros** (`"014"`, ZIP codes) become numbers; read them with `col_character()`.
- **Decimal comma** (European exports): use `read_csv2()` or `locale = locale(decimal_mark = ",")`.
- **Undocumented missingness**: write down which codes (`""`, `"NA"`, `-99`) mean missing and pass them to `na =`.

## Old → new
| Old | Now | Why |
|---|---|---|
| `read.csv()` | `read_csv()` | faster, explicit types, tibble output |
| `write.csv(row.names = FALSE)` | `write_csv()` | no row names by default |

## Further reading
- [readr documentation](https://readr.tidyverse.org/): column types, locales and parsing problems.
