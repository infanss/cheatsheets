---
title: "pandas: базовые операции"
slug: python-pandas-basics
lang: python
category: data
tags: [pandas, dataframe, wrangling, mhedas]
level: beginner
packages:
  - name: pandas
    version: "3.0.3"
language_version: "Python 3.14"
last_verified: "2026-10-28"
summary: "Фильтрация, группировки, джойны и reshape в pandas 3 — с учётом Copy-on-Write и нового строкового dtype."
sources:
  - title: "pandas User Guide"
    url: "https://pandas.pydata.org/docs/user_guide/index.html"
  - title: "Copy-on-Write в pandas"
    url: "https://pandas.pydata.org/docs/user_guide/copy_on_write.html"
---

## TL;DR
- В pandas 3 Copy-on-Write включён всегда: любой результат индексации ведёт себя как копия.
- Изменять данные — только через `.loc[rows, cols] = value` за один шаг, цепочки `df[...][...] = ...` не работают.
- Строки по умолчанию получают dtype `str`, а не `object`.
- Для группировок используйте named aggregation: `agg(new_col=("col", "func"))`.

## Установка и импорт
```bash
pip install pandas
```
```python
import pandas as pd
```

## Основные операции
### Игрушечные данные
Небольшой датафрейм пациентов, на нём все примеры ниже.
```python
df = pd.DataFrame({
    "patient_id": [1, 2, 3, 4, 5],
    "sex": ["F", "M", "F", "F", "M"],
    "age": [34, 51, None, 62, 45],
    "site": ["A", "A", "B", "B", "B"],
})
df.dtypes  # sex/site -> str, age -> float64 (из-за None)
```

### Фильтрация строк и выбор колонок
`.loc` с булевой маской или `query` для читаемых условий.
```python
df.loc[df["age"] > 40, ["patient_id", "age"]]
df.query("sex == 'F' and age > 30")
```

### Новая колонка
`assign` удобен в цепочках, `pd.cut` бьёт числа на интервалы.
```python
df = df.assign(
    age_group=lambda d: pd.cut(d["age"], bins=[0, 40, 60, 120], labels=["<40", "40-60", "60+"])
)
```

### Группировка и агрегация
Named aggregation даёт понятные имена колонок; `as_index=False` — обычный датафрейм на выходе.
```python
df.groupby("site", as_index=False).agg(
    n=("patient_id", "size"),
    mean_age=("age", "mean"),
)
```

### Пропуски
Посчитать и заполнить.
```python
df.isna().sum()
df.loc[df["age"].isna(), "age"] = df["age"].median()
```

### Джойн
`validate` проверяет кардинальность, `indicator=True` показывает, откуда строка.
```python
visits = pd.DataFrame({
    "patient_id": [1, 1, 3, 6],
    "visit_date": pd.to_datetime(["2024-01-05", "2024-03-10", "2024-02-01", "2024-04-01"]),
})
m = df.merge(visits, on="patient_id", how="left", validate="one_to_many", indicator=True)
m["_merge"].value_counts()
```

### Wide ↔ long
`melt` — в длинный формат, `pivot` — обратно.
```python
long = df.melt(id_vars="patient_id", value_vars=["age"], var_name="var", value_name="val")
wide = long.pivot(index="patient_id", columns="var", values="val")
```

### Частоты и таблицы сопряжённости
```python
df["sex"].value_counts(dropna=False)
pd.crosstab(df["sex"], df["site"], margins=True)
```

### Сортировка
```python
df.sort_values(["site", "age"], ascending=[True, False])
```

## Типичные ошибки и ловушки
- **Chained assignment** — `df[df["sex"] == "F"]["age"] = 0` ничего не меняет и выдаёт `ChainedAssignmentError`. Правильно: `df.loc[df["sex"] == "F", "age"] = 0`.
- **Целые числа с пропусками** — колонка `int` с `None` становится `float64`. Если нужен целый тип с пропусками — `astype("Int64")`.
- **Джойн размножил строки** — забыли, что справа несколько строк на ключ. Ставьте `validate=` в `merge`.
- **Проверка на `object`** — в pandas 3 строки имеют dtype `str`, код вида `df.select_dtypes("object")` может их не найти; используйте `select_dtypes(include=["str", "object"])`.

## Старое → новое
| Было (deprecated) | Сейчас | С версии |
|---|---|---|
| `df[mask]["col"] = x` | `df.loc[mask, "col"] = x` | 3.0 (CoW по умолчанию) |
| Строки как `object` | dtype `str` | 3.0 |
| `df.append(other)` | `pd.concat([df, other])` | 2.0 |

## Дальше читать
- [pandas User Guide](https://pandas.pydata.org/docs/user_guide/index.html) — полный справочник.
- [Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html) — почему старый код с цепочками ломается.
