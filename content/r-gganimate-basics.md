---
title: "gganimate basics"
slug: r-gganimate-basics
lang: r
category: visualization
tags: [gganimate, gifski, animation, gif, mhedas]
source_lessons: [L3]
level: beginner
order: 5
packages:
  - name: gganimate
    version: "1.0.11"
language_version: "R 4.6"
last_verified: "2026-11-18"
summary: "Animate a ggplot over time or across states, render it to GIF with gifski and save it."
sources:
  - title: "gganimate documentation"
    url: "https://gganimate.com/"
---

## TL;DR
- Add a `transition_*()` layer to a normal ggplot.
- `transition_reveal(time)` draws a trajectory step by step; `transition_states(group)` switches between states.
- Titles can use frame variables: `{frame_along}`, `{closest_state}`.
- `animate()` renders, `anim_save()` writes the file; `gifski` is the GIF backend.

## Install and load
```r
install.packages(c("gganimate", "gifski"))
library(ggplot2)
library(gganimate)
```

## Core operations
### Reveal a line over time
```r
followup <- data.frame(day = c(0, 10, 20, 30), remaining = c(100, 82, 61, 47))

p <- ggplot(followup, aes(day, remaining)) +
  geom_line() +
  geom_point() +
  labs(title = "Day {round(frame_along)}",
       x = "Follow-up day", y = "Patients remaining") +
  transition_reveal(day)

gif <- animate(p, nframes = 50, fps = 10, width = 720, height = 420,
               renderer = gifski_renderer())
anim_save("followup.gif", animation = gif)
```

### Switch between states
```r
states <- data.frame(stage = factor(rep(1:3, each = 4)),
                     x = rep(1:4, 3), y = c(2:5, 4:7, 6:9))

p2 <- ggplot(states, aes(x, y)) +
  geom_point(size = 3) +
  transition_states(stage, transition_length = 2, state_length = 1) +
  labs(title = "Stage: {closest_state}")
```

## Common pitfalls
- **Rendering is slow**: lower `nframes` and the size while drafting.
- **Animation instead of information**: if a static facet plot shows the same thing, prefer it; animations cannot be read in print.

## Further reading
- [gganimate documentation](https://gganimate.com/): transitions, views and easing.
