# Python & R Cheatsheets

Личный справочник по Python и R. Каждая шпаргалка — отдельный Markdown-файл в `content/`.
Сайт сам собирает список, группирует по категориям и даёт фильтр по пакетам.

## Как добавить шпаргалку

1. Положить файл `content/{lang}-{topic}.md` (например `content/r-survival-analysis.md`).
2. Проверить локально (по желанию):
   ```bash
   python scripts/build.py --serve
   ```
   и открыть http://localhost:8000
3. Закоммитить и запушить:
   ```bash
   git add content/ && git commit -m "Add r-survival-analysis" && git push
   ```
   GitHub Actions соберёт сайт и опубликует его на GitHub Pages за 1–2 минуты.

Можно класть файлы и в подпапки (`content/r/omop/...`) — сборщик ищет `.md` рекурсивно.

## Формат файла

Файл начинается с YAML frontmatter, дальше обычный Markdown (GFM: таблицы, блоки кода с языком).

```yaml
---
title: "Survival analysis в R"
slug: r-survival-analysis        # = имя файла без .md, должен быть уникальным
lang: r                          # python | r | both  (both показывается в обоих режимах)
category: statistics             # data | statistics | causal | omop | bioinformatics | visualization | reproducibility | ml
tags: [survival, cox]
level: beginner                  # beginner | intermediate | advanced
packages:                        # из этого строится фильтр «Пакеты»
  - name: survival
    version: "x.y.z"
language_version: "R 4.6"
last_verified: "2026-10-28"
summary: "Одна фраза о том, что внутри."
sources:
  - title: "Документация survival"
    url: "https://..."
---
```

Обязательные поля: `title`, `slug`, `lang`, `category`, `summary`. Если чего-то не хватает,
сборка в CI упадёт и покажет, в каком файле ошибка.

Как отображается:
- `## Раздел` — заголовок раздела и пункт оглавления справа.
- `### Задача` — карточка: заголовок, строка пояснения, блоки кода до следующего заголовка.
- У каждого блока кода есть кнопка «Копировать».

## Структура

```
content/                     шпаргалки (.md) — единственное, что нужно менять
site/                        index.html, style.css, app.js — сам сайт
scripts/build.py             проверка frontmatter + сборка в public/
.github/workflows/pages.yml  сборка и публикация на GitHub Pages
```

Новая категория: добавить её в `CATEGORIES` в `scripts/build.py` и подпись в `site/app.js`.

## Первый запуск на GitHub

1. Создать пустой репозиторий на GitHub (без README, .gitignore и лицензии).
2. В этой папке:
   ```bash
   git init -b main
   git add .
   git commit -m "Initial cheatsheet site"
   git remote add origin https://github.com/<username>/cheatsheets.git
   git push -u origin main
   ```
3. В репозитории: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
   Затем **Actions → Pages → Run workflow** (или просто следующий пуш).
4. Адрес сайта: `https://<username>.github.io/cheatsheets/` — он же виден в Settings → Pages.

GitHub Pages для приватного репозитория доступен только на платном плане (Pro и выше);
на бесплатном аккаунте репозиторий должен быть публичным. Сайт Pages в любом случае открыт всем.

Локально нужен только Python 3 и `pyyaml` (`pip install pyyaml`).
