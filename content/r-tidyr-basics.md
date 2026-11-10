---
title: "tidyr basics"
slug: r-tidyr-basics
lang: r
category: data
tags: [tidyr, tidyverse, reshape, missing-values, mhedas]
level: beginner
packages:
  - name: tidyr
    version: "1.3.2"
language_version: "R 4.6"
last_verified: "2026-11-10"
summary: "Reshape between wide and long, handle missing values and split or combine columns with tidyr."
sources:
  - title: "tidyr reference"
    url: "https://tidyr.tidyverse.org/reference/index.html"
  - title: "Pivoting vignette"
    url: "https://tidyr.tidyverse.org/articles/pivot.html"
---

## TL;DR
- `pivot_longer()` / `pivot_wider()` are the only reshape functions you need.
- `complete()` makes implicit missing combinations explicit; `fill()` carries values down.
- Split columns with `separate_wider_delim()`, glue them back with `unite()`.

## Install and load
```r
install.packages("tidyr")
library(tidyr)
library(dplyr)  # for tibble() and the examples
```

## Reshape
### Toy data
Lab results in long format: one row per patient per test.
```r
labs <- tibble(
  patient_id = c(1, 1, 2, 2, 3),
  test = c("hb", "glucose", "hb", "glucose", "hb"),
  value = c(13.1, 5.4, 11.8, NA, 12.6)
)
```

### Long → wide
One column per test. Missing combinations (patient 3, glucose) become `NA`.
```r
wide <- labs |> pivot_wider(names_from = test, values_from = value)
```

### Wide → long
Select the columns to stack; `values_drop_na = TRUE` drops empty cells.
```r
wide |> pivot_longer(cols = c(hb, glucose), names_to = "test", values_to = "value")
wide |> pivot_longer(cols = -patient_id, names_to = "test", values_to = "value",
                     values_drop_na = TRUE)
```

### Fill gaps while pivoting
`values_fill` only fills combinations that are missing from the data, not existing `NA`.
```r
labs |> pivot_wider(names_from = test, values_from = value, values_fill = 0)
```

## Missing values
### Replace or drop NA
```r
labs |> replace_na(list(value = 0))
labs |> drop_na(value)
```

### Make missing combinations explicit
Adds a row with `NA` for every patient × test pair that does not exist yet.
```r
labs |> complete(patient_id, test)
```

### Carry the last value forward
Useful for exports where an ID is only written on the first row of a block.
```r
visits <- tibble(patient_id = c(1, NA, NA, 2, NA), visit = 1:5)
visits |> fill(patient_id, .direction = "down")
```

## Split and combine columns
### One column → several
```r
codes <- tibble(code = c("ICD10:E11", "ICD10:I10", "SNOMED:44054006"))
codes |> separate_wider_delim(code, delim = ":", names = c("vocabulary", "concept_code"))

tibble(bp = c("120/80", "135/90")) |>
  separate_wider_delim(bp, delim = "/", names = c("sbp", "dbp")) |>
  mutate(across(c(sbp, dbp), as.numeric))  # the parts come out as text
```

### One column → several rows
```r
tibble(dx = c("E11;I10", "J45")) |> separate_longer_delim(dx, delim = ";")
```

### Several columns → one
```r
tibble(vocabulary = "ICD10", concept_code = "E11") |>
  unite("code", vocabulary, concept_code, sep = ":")
```

## Nesting and grids
### Nest and unnest
One row per patient with their lab results stored as a small table.
```r
nested <- labs |> nest(data = c(test, value))
nested |> unnest(data)
```

### Every combination of values
```r
expand_grid(sex = c("F", "M"), age_group = c("<40", "40+"))
```

## Common pitfalls
- **`pivot_wider` creates list-columns**: there are duplicate rows for the same id and name. Fix the duplicates first or pass `values_fn = mean`.
- **Split parts are text**: `separate_wider_delim()` returns character columns; convert them with `as.numeric()`.
- **`values_fill` vs `replace_na`**: the first fills only missing combinations, the second replaces existing `NA`.

## Old → new
| Old (superseded) | Now | Since |
|---|---|---|
| `gather()` / `spread()` | `pivot_longer()` / `pivot_wider()` | tidyr 1.0.0 |
| `separate()` | `separate_wider_delim()` / `separate_wider_position()` | tidyr 1.3.0 |
| `separate_rows()` | `separate_longer_delim()` | tidyr 1.3.0 |

## Further reading
- [Pivoting vignette](https://tidyr.tidyverse.org/articles/pivot.html): every reshape case with examples.
- [tidyr reference](https://tidyr.tidyverse.org/reference/index.html): every function.
