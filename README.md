# APHS 20203

Course materials for APHS 20203, including a multi-deck Quarto website under `Lecture Slides/`.

## Lecture slide architecture

Course-wide presentation files live at the top of `Lecture Slides/`:

- `_quarto.yml` defines the website, render targets, and published resources.
- `_theme/tcu.scss` is the shared TCU Reveal.js theme and the home for reusable visual utility classes.
- `assets/` contains shared course assets, including the TCU logos.

Each presentation folder contains its editable `.qmd`, bibliography, deck-specific assets, and—only when needed—a `custom.scss` for styling unique to that deck. A typical deck references the shared theme like this:

```yaml
format:
  revealjs:
    theme: [default, ../../_theme/tcu.scss, custom.scss]
```

The relative path depends on the deck's nesting depth, so verify that it resolves to `Lecture Slides/_theme/tcu.scss`. Do not copy `theme.scss` or a TCU logo into every presentation folder. Put course-wide changes in the shared theme or shared `assets/`; keep genuinely deck-specific rules in the deck's `custom.scss`.

### CSS class names

Prefer native Quarto and Reveal.js classes. Name reusable custom classes for their visual behavior rather than the slide topic—for example, `.grid-2`, `.align-center`, or `.text-small`. Compose small utilities when a slide needs more than one effect. Reserve content-specific names for bespoke components whose structure and styling are inseparable, such as a unique transition diagram.

### Rendering

Run Quarto commands from `Lecture Slides/`, which contains `_quarto.yml`. Generated files under `_site/` are outputs and should not be edited directly.
