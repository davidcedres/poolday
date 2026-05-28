# funpool

> A visual idea space for product owners — not another ticket tracker.

---

## The idea

Jira and Linear are great for engineers. Funpool is for the moment *before* that — when you're staring at a blank whiteboard asking *what should we build next?*

It's a living pool of feature ideas. Throw anything in. Let it float, sink, or rise to the center as it proves its worth.

---

## How it works

### The grid

The main screen is a **2D canvas of wiggly cards** — each card is a feature idea. Cards have a subtle organic animation (hence "wiggly") that makes the space feel alive rather than like a database table. You navigate it by panning and zooming, not by scrolling a list.

### The heatmap

Every card has a **color temperature**:

- **Green** → shipped, live, done
- **Yellow/orange** → in progress, validated, scoped
- **Red/cool** → raw idea, unvalidated, parked

At a glance you can see the health of your backlog — is everything still raw? Are you actually shipping things?

### The center of gravity

**Established ideas gravitate toward the center.** The more validated, upvoted, or discussed an idea is, the closer it floats to the middle of the canvas. New raw ideas start at the edges. This turns the canvas into a natural priority map — look at the center to know what matters.

### Adding an idea

The main CTA is a single input at the bottom of the screen: type your idea, hit enter, a new wiggly card is born and floats into the pool. No forms. No fields. No categories required upfront.

---

## What funpool is NOT

- Not a sprint planner
- Not a Gantt chart
- Not a place to write acceptance criteria
- Not a replacement for your eng team's issue tracker

Funpool answers **WHAT to build**, not HOW or WHEN. It's the product owner's brainstorm canvas, not the engineer's todo list.

---

## Core concepts

| Concept | Description |
|---|---|
| **Idea card** | The atomic unit. A title, a color temperature, a position on the canvas |
| **Pool** | The shared 2D canvas. A team has one pool (or several, per product area) |
| **Heat** | A score that determines color — driven by votes, comments, linked outcomes |
| **Gravity** | Heat also determines position — hot ideas drift toward the center |
| **Wiggly** | The subtle CSS animation on each card. Makes the space feel like a living organism, not a spreadsheet |

---

## Stack (planned)

- **Next.js** (App Router)
- **Canvas / CSS animations** for the wiggly grid
- **Postgres** for idea + heat storage
- **Vercel** for deployment

---

## Status

Early concept. Vibe-coding in progress.
