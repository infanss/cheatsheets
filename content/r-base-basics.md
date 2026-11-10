---
title: "Base R essentials"
slug: r-base-basics
lang: r
category: basics
tags: [base-r, swirl, vectors, functions, apply, mhedas]
level: beginner
packages:
  - name: base
    version: "4.6.1"
language_version: "R 4.6"
last_verified: "2026-11-10"
summary: "The core of R without packages, following swirl's R Programming course: vectors, NA, subsetting, data frames, functions, the apply family, simulation, dates and base plots."
sources:
  - title: "swirl: R Programming course"
    url: "https://swirlstats.com/scn/rprog.html"
  - title: "An Introduction to R (CRAN manual)"
    url: "https://cran.r-project.org/doc/manuals/r-release/R-intro.html"
---

## TL;DR
- Everything is a vector; operations apply element by element.
- Indexing starts at `1`. Negative indices drop elements.
- Test for missing values with `is.na(x)`, never `x == NA`.
- `lapply` always returns a list, `sapply` simplifies, `vapply` simplifies with a guaranteed type.

## Basics
### Arithmetic and assignment
```r
x <- 5 + 7      # assign with <-
x / 2           # 6
2 ^ 3           # 8
10 %% 3         # 1  (remainder)
10 %/% 3        # 3  (integer division)
sqrt(16); abs(-5); log(10); exp(2)
```

### Workspace and help
```r
getwd()                # current working directory
setwd("path/to/dir")   # change it
list.files()           # files in the directory
ls()                   # objects in memory
rm(x)                  # remove an object
?mean                  # help page
help.search("mean")    # search the docs
```

### Files
```r
dir.create("data")
file.create("a.txt")
file.exists("a.txt")             # TRUE
file.rename("a.txt", "b.txt")
file.copy("b.txt", "copy.txt")
file.remove("b.txt", "copy.txt")
```

## Vectors
### Sequences and repeats
`seq()` builds a sequence, `rep()` repeats values.
```r
1:5                            # 1 2 3 4 5
seq(1, 10, by = 2)             # 1 3 5 7 9
seq(0, 1, length.out = 5)      # 0.00 0.25 0.50 0.75 1.00
seq_len(5)                     # 1 2 3 4 5, safe when the length is 0
seq_along(c("a", "b", "c"))    # 1 2 3
rep(1:3, times = 2)            # 1 2 3 1 2 3
rep(1:3, each = 2)             # 1 1 2 2 3 3
```

### Create, inspect, convert
```r
x <- c(10, 20, 30)
numeric(3)          # 0 0 0
length(x)           # 3
class(x)            # "numeric"
typeof(x)           # "double"
as.character(x)     # "10" "20" "30"
as.numeric("3.5")   # 3.5
```

### Vectorized math and summaries
```r
x * 2               # 20 40 60
x + c(1, 2, 3)      # 11 22 33
sum(x); mean(x); median(x); min(x); max(x)
sd(x); var(x)
sort(x, decreasing = TRUE); rev(x); unique(c(1, 1, 2))
```

### Strings
`sep` goes between arguments, `collapse` joins a vector into one string.
```r
paste("Hello", "world")                    # "Hello world"
paste0("Hello", "world")                   # "Helloworld"
paste(c("A", "B", "C"), collapse = ", ")   # "A, B, C"
```

## Missing values
### NA, NaN and NULL
`NA` is a missing value, `NaN` an undefined number (`0/0`), `NULL` the absence of an object.
```r
x <- c(1, 2, NA, 4)
is.na(x)                # FALSE FALSE TRUE FALSE
anyNA(x)                # TRUE
sum(is.na(x))           # 1
mean(x)                 # NA
mean(x, na.rm = TRUE)   # 2.333333
x[!is.na(x)]            # 1 2 4
```

### Rows without missing values
```r
df <- data.frame(a = c(1, NA, 3), b = c("x", "y", NA))
complete.cases(df)      # TRUE FALSE FALSE
na.omit(df)             # keeps row 1 only
colSums(is.na(df))      # NA count per column
```

## Subsetting
### By position, condition and name
```r
x <- c(10, 20, 30, 40, 50)
x[1]                    # 10
x[c(1, 3)]              # 10 30
x[-1]                   # all but the first
x[x > 25]               # 30 40 50
x[x >= 20 & x < 50]     # 20 30 40
which(x > 25)           # 3 4 5  (positions)
x %in% c(20, 40)        # FALSE TRUE FALSE TRUE FALSE

scores <- c(Ana = 90, Bob = 80)
scores["Ana"]           # 90
```

## Matrices and data frames
### Matrices
A matrix holds one type. It fills by column unless `byrow = TRUE`.
```r
m <- matrix(1:6, nrow = 2)
m[1, 2]                 # row 1, column 2
m[1, ]                  # row 1
m[, 2]                  # column 2
dim(m); nrow(m); ncol(m)
t(m)                    # transpose
```

### Data frames
Columns can have different types.
```r
df <- data.frame(name = c("Ana", "Bob"), age = c(25, 30))
df$age                  # column as a vector
df["age"]               # column as a data frame
df[1, ]                 # first row
df[df$age > 26, ]       # rows by condition
names(df)
df <- cbind(df, score = c(8, 9))                              # add a column
df <- rbind(df, data.frame(name = "Eva", age = 22, score = 7)) # add a row
```

### Look at the data
```r
head(df); tail(df)      # first / last 6 rows
str(df)                 # structure and column types
summary(df)             # descriptive statistics
dim(df)
table(df$name)          # frequencies
identical(df, df)       # TRUE: exact comparison
```

## Logic
### Comparisons and combining
`&` and `|` work element by element on vectors. `&&` and `||` take a single `TRUE`/`FALSE` and belong in `if`.
```r
x <- c(5, 10, 15)
x > 8                   # FALSE TRUE TRUE
x > 5 & x < 15          # FALSE TRUE FALSE
x < 6 | x > 12          # TRUE FALSE TRUE
!(x > 8)                # TRUE FALSE FALSE
any(x > 12)             # TRUE
all(x > 0)              # TRUE
```

## Functions
### Define and call
The last evaluated expression is returned; `return()` is only needed to exit early.
```r
add <- function(x, y = 2) {
  x + y
}
add(5)                  # 7
add(5, y = 10)          # 15
```

### if / else
```r
check_age <- function(age) {
  if (age >= 18) {
    "Adult"
  } else {
    "Minor"
  }
}
check_age(20)           # "Adult"
```

### Inspect a function
```r
args(paste)             # arguments
formals(add)            # arguments with defaults
body(add)               # the code
```

## The apply family
### lapply, sapply, vapply
`vapply` needs a template for each result, here `numeric(1)`: one number.
```r
x <- list(a = 1:3, b = 4:6)
lapply(x, mean)                 # list: $a 2, $b 5
sapply(x, mean)                 # named vector: a 2, b 5
vapply(x, mean, numeric(1))     # like sapply, type-checked
sapply(x, \(v) max(v) - min(v)) # anonymous function
```

### tapply: a function per group
```r
scores <- c(80, 90, 70, 100)
groups <- c("A", "A", "B", "B")
tapply(scores, groups, mean)    # A 85, B 85
```

## Simulation
### Random numbers
Call `set.seed()` first so the results are reproducible.
```r
set.seed(123)
sample(1:10, 5)                       # without replacement
sample(1:10, 5, replace = TRUE)
rnorm(5, mean = 0, sd = 1)            # normal
runif(5, min = 0, max = 1)            # uniform
rbinom(5, size = 1, prob = 0.5)       # binomial
rpois(5, lambda = 3)                  # Poisson
replicate(100, mean(rnorm(10)))       # repeat a simulation
```

## Dates and times
### Parse, format, compute
```r
d <- as.Date("2026-11-09")
d + 7                                  # "2026-11-16"
format(d, "%d/%m/%Y")                  # "09/11/2026"
format(d, "%Y")                        # "2026"
weekdays(d); months(d)
difftime(as.Date("2026-12-25"), d, units = "days")   # 46 days
Sys.Date(); Sys.time()
as.POSIXct("2026-11-09 14:30:00", tz = "UTC")
```

## Base graphics
### Common plots
```r
x <- rnorm(100); y <- 2 * x + rnorm(100)
plot(x, y, main = "My plot", xlab = "X", ylab = "Y", col = "blue", pch = 19)
abline(lm(y ~ x))                      # regression line
abline(h = 0, v = 0, lty = 2)          # reference lines
hist(x)
boxplot(y ~ (x > 0))
barplot(table(c("a", "b", "b")))
```

### Several plots side by side
```r
par(mfrow = c(1, 2))
hist(x); hist(y)
par(mfrow = c(1, 1))                   # reset
```

## Common pitfalls
- **`x == NA`** always returns `NA`. Use `is.na(x)`.
- **`1:length(x)` on an empty vector** gives `1 0`. Use `seq_along(x)` or `seq_len(n)`.
- **Recycling**: `c(1, 2, 3, 4) + c(10, 20)` silently repeats the shorter vector.
- **`&&` with a vector**: since R 4.3 it is an error. Use `&` for vectors, or `any()` / `all()`.
- **`sapply` changes shape**: it can return a list, vector or matrix depending on the input. Use `vapply` in functions.

## Further reading
- [swirl: R Programming](https://swirlstats.com/scn/rprog.html): the interactive course this sheet follows.
- [An Introduction to R](https://cran.r-project.org/doc/manuals/r-release/R-intro.html): the official manual.
