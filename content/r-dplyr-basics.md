---
title: "dplyr + tidyr: базовые операции"
slug: r-dplyr-basics
lang: r
category: data
tags: [dplyr, tidyr, tidyverse, wrangling, mhedas]
level: beginner
packages:
  - name: dplyr
    version: "1.2.1"
  - name: tidyr
    version: "1.3.2"
language_version: "R 4.6"
last_verified: "2026-10-28"
summary: "Фильтрация, группировки, джойны и reshape в tidyverse — с современным синтаксисом .by, join_by и across."
sources:
  - title: "dplyr reference"
    url: "https://dplyr.tidyverse.org/reference/index.html"
  - title: "tidyr reference"
    url: "https://tidyr.tidyverse.org/reference/index.html"
---

## TL;DR
- Нативный пайп `|>` вместо `%>%` (R >= 4.1).
- Группировка на одну операцию — аргумент `.by`, без `group_by()` / `ungroup()`.
- Ключи джойна — через `join_by()`, кардинальность — через `relationship`.
- Одна функция на много колонок — `across()` + лямбда `\(x)`.

## Установка и импорт
```r
install.packages(c("dplyr", "tidyr"))
library(dplyr)
library(tidyr)
```

## Основные операции
### Игрушечные данные
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

### Фильтрация строк и выбор колонок
Несколько условий через запятую = AND. Строки с `NA` в условии отбрасываются.
```r
patients |> filter(sex == "F", age > 30)
patients |> select(patient_id, starts_with("s"))
```

### Новая колонка
`case_when` вместо вложенных `ifelse`; `.default` — значение «иначе».
```r
patients |>
  mutate(age_group = case_when(
    age < 40 ~ "<40",
    age < 60 ~ "40-60",
    .default = "60+"
  ))
```

### Группировка и агрегация
`.by` группирует только для этой операции — результат не остаётся сгруппированным.
```r
patients |>
  summarise(n = n(), mean_age = mean(age, na.rm = TRUE), .by = site)

patients |> count(sex, site)
patients |> slice_max(age, n = 1, by = site)
```

### Пропуски
```r
patients |> mutate(age = coalesce(age, median(age, na.rm = TRUE)))
patients |> replace_na(list(age = 0))
patients |> drop_na(age)
```

### Джойны
`relationship` падает с ошибкой, если кардинальность не та, что вы ожидали.
```r
patients |> left_join(visits, by = join_by(patient_id), relationship = "one-to-many")
patients |> anti_join(visits, by = join_by(patient_id))  # patients without visits
```

### Wide ↔ long
```r
long <- patients |> pivot_longer(cols = c(age), names_to = "var", values_to = "val")
long |> pivot_wider(names_from = var, values_from = val)
```

### Одна операция на много колонок
```r
patients |> mutate(across(where(is.numeric), \(x) x / 10))
```

### Сортировка
```r
patients |> arrange(site, desc(age))
```

## Типичные ошибки и ловушки
- **`filter` и `NA`** — строки, где условие даёт `NA`, молча выкидываются. Если они нужны: `filter(age > 30 | is.na(age))`.
- **Забытый `ungroup()`** — после `group_by()` датафрейм остаётся сгруппированным и следующие `mutate` считаются по группам. Используйте `.by`.
- **Размножение строк при джойне** — ставьте `relationship = "one-to-one"` / `"many-to-one"`, чтобы dplyr остановил вас.
- **`mean()` без `na.rm = TRUE`** — один `NA` превращает результат в `NA`.

## Старое → новое
| Было (deprecated) | Сейчас | С версии |
|---|---|---|
| `group_by() \|> summarise() \|> ungroup()` | `summarise(..., .by = x)` | dplyr 1.1.0 |
| `by = c("a" = "b")` | `by = join_by(a == b)` | dplyr 1.1.0 |
| `mutate_at()`, `summarise_if()` | `across()` | dplyr 1.0.0 |
| `gather()` / `spread()` | `pivot_longer()` / `pivot_wider()` | tidyr 1.0.0 |
| `TRUE ~ x` в `case_when` | `.default = x` | dplyr 1.1.0 |

## Дальше читать
- [dplyr reference](https://dplyr.tidyverse.org/reference/index.html) — все функции.
- [R for Data Science, 2e](https://r4ds.hadley.nz/) — главы про трансформацию данных.
