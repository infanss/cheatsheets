---
title: "dplyr basics"
slug: r-dplyr-basics
lang: r
category: data
tags: [dplyr, tidyverse, wrangling, mhedas]
level: beginner
packages:
  - name: dplyr
    version: "1.2.1"
language_version: "R 4.6"
last_verified: "2026-11-10"
summary: "Filter, mutate, summarise and join data frames with modern dplyr syntax: .by, join_by and across."
sources:
  - title: "dplyr reference"
    url: "https://dplyr.tidyverse.org/reference/index.html"
---

## TL;DR
- Use the native pipe `|>` instead of `%>%` (R >= 4.1).
- Group for a single operation with `.by`, no `group_by()` / `ungroup()` needed.
- Specify join keys with `join_by()` and expected cardinality with `relationship`.
- Apply one function to many columns with `across()` and a `\(x)` lambda.

## Install and load
```r
install.packages("dplyr")
library(dplyr)
```

## Core operations
### Toy data
Two small tables used in every example below.
```r
patients <- tibble(
  patient_id = 1:5,
  sex = c("F", "M", "F", "F", "M"),
  age = c(34, 51, NA, 62, 45),
  site = c("A", "A", "B", "B", "B")
)
visits <- tibble(
  patient_id = c(1, 1, 3, 6),
  visit_date = as.Date(c("2024-01-05", "2024-03-10", "2024-02-01", "2024-04-01"))
)
glimpse(patients)
```

### Filter rows, select columns
Comma-separated conditions are combined with AND. Rows where a condition is `NA` are dropped.
```r
patients |> filter(sex == "F", age > 30)
patients |> select(patient_id, starts_with("s"))
```

### Add a column
`case_when` replaces nested `ifelse`; `.default` is the "otherwise" value.
```r
patients |>
  mutate(age_group = case_when(
    age < 40 ~ "<40",
    age < 60 ~ "40-60",
    .default = "60+"
  ))
```

### Group and summarise
`.by` groups for this call only, so the result is never left grouped.
```r
patients |>
  summarise(n = n(), mean_age = mean(age, na.rm = TRUE), .by = site)

patients |> count(sex, site)
patients |> slice_max(age, n = 1, by = site)
```

### Fill missing values with another value
`coalesce` takes the first non-missing value, element by element.
```r
patients |> mutate(age = coalesce(age, median(age, na.rm = TRUE)))
```

### Joins
`relationship` throws an error if the cardinality is not what you expect.
```r
patients |> left_join(visits, by = join_by(patient_id), relationship = "one-to-many")
patients |> anti_join(visits, by = join_by(patient_id))  # patients without visits
```

### One operation on many columns
```r
patients |> mutate(across(where(is.numeric), \(x) x / 10))
```

### Sort
```r
patients |> arrange(site, desc(age))
```

## Common pitfalls
- **`filter` and `NA`**: rows where the condition evaluates to `NA` are silently dropped. To keep them: `filter(age > 30 | is.na(age))`.
- **Forgotten `ungroup()`**: after `group_by()` the data frame stays grouped and later `mutate` calls run per group. Prefer `.by`.
- **Rows multiplied by a join**: set `relationship = "one-to-one"` or `"many-to-one"` so dplyr stops you.
- **`mean()` without `na.rm = TRUE`**: a single `NA` makes the result `NA`.

## Old → new
| Old (superseded) | Now | Since |
|---|---|---|
| `group_by() \|> summarise() \|> ungroup()` | `summarise(..., .by = x)` | dplyr 1.1.0 |
| `by = c("a" = "b")` | `by = join_by(a == b)` | dplyr 1.1.0 |
| `mutate_at()`, `summarise_if()` | `across()` | dplyr 1.0.0 |
| `TRUE ~ x` in `case_when` | `.default = x` | dplyr 1.1.0 |

## Further reading
- [dplyr reference](https://dplyr.tidyverse.org/reference/index.html): every function.
- [R for Data Science, 2e](https://r4ds.hadley.nz/): the data transformation chapters.
