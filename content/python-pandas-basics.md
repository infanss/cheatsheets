---
title: "pandas basics"
slug: python-pandas-basics
lang: python
category: data
tags: [pandas, dataframe, wrangling, mhedas]
level: beginner
packages:
  - name: pandas
    version: "3.0.3"
language_version: "Python 3.14"
last_verified: "2026-11-10"
summary: "Filtering, grouping, joins and reshaping in pandas 3, including Copy-on-Write and the new string dtype."
sources:
  - title: "pandas User Guide"
    url: "https://pandas.pydata.org/docs/user_guide/index.html"
  - title: "Copy-on-Write in pandas"
    url: "https://pandas.pydata.org/docs/user_guide/copy_on_write.html"
---

## TL;DR
- Copy-on-Write is always on in pandas 3: anything you get by indexing behaves like a copy.
- Change values with a single `.loc[rows, cols] = value`; chained `df[...][...] = ...` does nothing.
- Strings get the `str` dtype by default, not `object`.
- Use named aggregation for group summaries: `agg(new_col=("col", "func"))`.

## Install and import
```bash
pip install pandas
```
```python
import pandas as pd
```

## Core operations
### Toy data
A small patient table used in every example below.
```python
df = pd.DataFrame({
    "patient_id": [1, 2, 3, 4, 5],
    "sex": ["F", "M", "F", "F", "M"],
    "age": [34, 51, None, 62, 45],
    "site": ["A", "A", "B", "B", "B"],
})
df.dtypes  # sex/site -> str, age -> float64 (because of None)
```

### Filter rows, select columns
`.loc` with a boolean mask, or `query` for readable conditions.
```python
df.loc[df["age"] > 40, ["patient_id", "age"]]
df.query("sex == 'F' and age > 30")
```

### Add a column
`assign` works well in chains; `pd.cut` bins numbers into intervals.
```python
df = df.assign(
    age_group=lambda d: pd.cut(d["age"], bins=[0, 40, 60, 120], labels=["<40", "40-60", "60+"])
)
```

### Group and aggregate
Named aggregation gives clear column names; `as_index=False` returns a regular data frame.
```python
df.groupby("site", as_index=False).agg(
    n=("patient_id", "size"),
    mean_age=("age", "mean"),
)
```

### Missing values
Count and fill.
```python
df.isna().sum()
df.loc[df["age"].isna(), "age"] = df["age"].median()
```

### Join
`validate` checks the cardinality, `indicator=True` shows where each row came from.
```python
visits = pd.DataFrame({
    "patient_id": [1, 1, 3, 6],
    "visit_date": pd.to_datetime(["2024-01-05", "2024-03-10", "2024-02-01", "2024-04-01"]),
})
m = df.merge(visits, on="patient_id", how="left", validate="one_to_many", indicator=True)
m["_merge"].value_counts()
```

### Wide ↔ long
`melt` goes to long format, `pivot` goes back.
```python
long = df.melt(id_vars="patient_id", value_vars=["age"], var_name="var", value_name="val")
wide = long.pivot(index="patient_id", columns="var", values="val")
```

### Frequencies and cross-tabs
```python
df["sex"].value_counts(dropna=False)
pd.crosstab(df["sex"], df["site"], margins=True)
```

### Sort
```python
df.sort_values(["site", "age"], ascending=[True, False])
```

## Common pitfalls
- **Chained assignment**: `df[df["sex"] == "F"]["age"] = 0` changes nothing and raises a `ChainedAssignmentError` warning. Use `df.loc[df["sex"] == "F", "age"] = 0`.
- **Integers with missing values**: an `int` column with `None` becomes `float64`. For a nullable integer use `astype("Int64")`.
- **Rows multiplied by a join**: the right table has several rows per key. Pass `validate=` to `merge`.
- **Checking for `object`**: in pandas 3 strings have the `str` dtype, so `df.select_dtypes("object")` may miss them; use `select_dtypes(include=["str", "object"])`.

## Old → new
| Old (deprecated) | Now | Since |
|---|---|---|
| `df[mask]["col"] = x` | `df.loc[mask, "col"] = x` | 3.0 (CoW by default) |
| Strings as `object` | `str` dtype | 3.0 |
| `df.append(other)` | `pd.concat([df, other])` | 2.0 |

## Further reading
- [pandas User Guide](https://pandas.pydata.org/docs/user_guide/index.html): the full reference.
- [Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html): why old chained code breaks.
