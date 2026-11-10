---
title: "pandas ↔ dplyr: словарь операций"
slug: both-data-wrangling-map
lang: both
category: data
tags: [pandas, dplyr, translation, mhedas]
level: beginner
packages:
  - name: pandas
    version: "3.0.3"
  - name: dplyr
    version: "1.2.1"
  - name: tidyr
    version: "1.3.2"
language_version: "Python 3.14 / R 4.6"
last_verified: "2026-10-28"
summary: "Как одна и та же операция с таблицей пишется в pandas и в dplyr/tidyr."
sources:
  - title: "pandas: Comparison with R"
    url: "https://pandas.pydata.org/docs/getting_started/comparison/comparison_with_r.html"
---

## TL;DR
- `filter` ↔ `.loc[mask]` / `.query()`, `mutate` ↔ `.assign()`, `summarise(.by=)` ↔ `.groupby().agg()`.
- В R индексы не нужны; в pandas после `groupby` ставьте `as_index=False`, чтобы не получить индекс из ключей.

## Python ↔ R
| Задача | Python | R |
|---|---|---|
| Фильтр строк | `df.query("age > 40")` | `filter(df, age > 40)` |
| Выбор колонок | `df[["a", "b"]]` | `select(df, a, b)` |
| Новая колонка | `df.assign(b=lambda d: d["a"] * 2)` | `mutate(df, b = a * 2)` |
| Агрегация по группам | `df.groupby("g", as_index=False).agg(m=("x", "mean"))` | `summarise(df, m = mean(x), .by = g)` |
| Частоты | `df.value_counts(["a", "b"])` | `count(df, a, b)` |
| Сортировка по убыванию | `df.sort_values("x", ascending=False)` | `arrange(df, desc(x))` |
| Left join | `df.merge(other, on="id", how="left")` | `left_join(df, other, by = join_by(id))` |
| Anti join | `df[~df["id"].isin(other["id"])]` | `anti_join(df, other, by = join_by(id))` |
| В длинный формат | `df.melt(id_vars="id")` | `pivot_longer(df, -id)` |
| В широкий формат | `df.pivot(index="id", columns="var", values="val")` | `pivot_wider(df, names_from = var, values_from = val)` |
| Заполнить пропуски | `df.fillna({"x": 0})` | `replace_na(df, list(x = 0))` |
| Удалить строки с NA | `df.dropna(subset=["x"])` | `drop_na(df, x)` |

## Основные операции
### Один и тот же пайплайн
Средний возраст женщин по сайтам.
```python
(df.query("sex == 'F'")
   .groupby("site", as_index=False)
   .agg(mean_age=("age", "mean"))
   .sort_values("mean_age", ascending=False))
```
```r
df |>
  filter(sex == "F") |>
  summarise(mean_age = mean(age, na.rm = TRUE), .by = site) |>
  arrange(desc(mean_age))
```

## Типичные ошибки и ловушки
- **NA в агрегатах** — pandas пропускает `NaN` в `mean` по умолчанию, R — нет (нужен `na.rm = TRUE`). Результаты могут разойтись.
- **Индексация с 0 и 1** — `df.iloc[0]` в Python и `df[1, ]` в R — это одна и та же первая строка.

## Дальше читать
- [pandas: Comparison with R](https://pandas.pydata.org/docs/getting_started/comparison/comparison_with_r.html) — официальная таблица соответствий.
