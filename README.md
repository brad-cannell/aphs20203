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

### Python setup

This repository owns the course's Python environment, dependency versions, and operating instructions. KWB continues to own the reusable scripts in `/Users/bradcannell/Desktop/Git/knowledge-workbench/_presentations/scripts/` and the general presentation guides. Those scripts remain an external dependency; this change separates the Python environments, not the script repositories.

From the repository root, create the local environment and install the course dependencies:

```sh
sh _ai/tools/shell/setup_python.sh
```

The setup script requires Python 3.10 or newer and accepts an explicit interpreter path as its first argument. This course environment was validated with Python 3.13. Select `/Users/bradcannell/Desktop/Git/Academia/Teaching/aphs20203/.venv/bin/python` in Positron and restart any existing Python session. Quarto's hooks call this environment directly, so shell activation is not required.

The root `requirements.txt` pins the direct runtime dependencies for quiz generation, QR images, PDF export, presentation conversion, and manual Python chunks. `.venv/` is ignored by Git. Rerun the setup script after changing dependencies; recreate the environment after relocating the repository. Quarto and Chrome, Chromium, or Edge must be installed separately for HTML rendering and PDF export. If KWB moves, update its script paths in `Lecture Slides/_quarto.yml` and `kwb_root` in `Lecture Slides/create-lecture-slides.qmd`.

### On-screen exercise timers

Use the [countdown Quarto extension](https://github.com/gadenbuie/countdown/blob/main/quarto/README.md) for timers on Reveal.js exercise slides. The extension is installed under `Lecture Slides/_extensions/gadenbuie/countdown/`; keep that directory in version control so other checkouts can render the timers. It requires Quarto 1.4 or newer and does not require the R package.

If the extension is missing, install it once from the repository root:

```sh
cd "Lecture Slides"
quarto add gadenbuie/countdown/quarto
```

Place this shortcode in the slide's `.qmd` body, outside its speaker-notes block:

```markdown
{{< countdown minutes=2 warn_when=30 start_immediately=false >}}
```

This is the timer used on the **Exercise: Primary Vs. Secondary Data** slide in the Disease Occurrence Data deck. It appears in the bottom-right corner, waits for a manual start, and changes to the warning color with 30 seconds remaining. Change `minutes`, add `seconds`, or adjust `warn_when` (seconds) for another exercise.

Click the timer to start, pause, or resume it. For keyboard control, Tab to focus the timer, use Space or Enter to start/pause, and press Escape while the timer is focused to reset it.

Preview the deck and check the timer's placement, controls, and warning before class. If it overlaps content or the slide number, adjust its position, for example by adding `bottom="70px" right="20px"` to the shortcode. The live timer runs in the HTML presentation; use a separate timer when teaching from a PDF backup.

### Rendering

Run Quarto commands from `Lecture Slides/`, which contains `_quarto.yml`. Generated files under `_site/` are outputs and should not be edited directly.

Use the IDE Preview button or `quarto preview "path/to/deck.qmd"` while editing. Preview and single-deck renders regenerate quiz materials and HTML but skip the site-wide PDF export. Existing PDFs are not refreshed by those commands.

Run `quarto render` from `Lecture Slides/` (or `quarto render "Lecture Slides"` from the repository root) to build the complete site and regenerate its PDFs. The post-render hook uses `_ai/tools/shell/full_render_only.sh` and Quarto's `QUARTO_PROJECT_RENDER_ALL` flag to reserve PDF export for full-project builds. An explicit full build before preview, such as `quarto preview --render all`, also generates PDFs.

If Quarto reports a missing generated quiz include, run this from the repository root before retrying preview or rendering. Quarto can inspect includes before its pre-render hook runs:

```sh
.venv/bin/python /Users/bradcannell/Desktop/Git/knowledge-workbench/_presentations/scripts/presentation_build_quiz_slides.py "Lecture Slides"
```

Release reviewed course materials with `quarto publish gh-pages` from `Lecture Slides/`. Publishing performs a full build, including PDFs, unless `--no-render` is specified. Review records, conversion evidence, and draft folders must not be added to published resources or the release render list before review.

### Validation copies

For disposable validation, copy `Lecture Slides/` and `_ai/` under a temporary course root. Create a `.venv` symlink there pointing to this repository's `.venv` so the relative hook paths resolve without copying a virtual environment. Alternatively, copy `requirements.txt` too and run the copied setup script to create an independent environment. Run Quarto inside the copied `Lecture Slides/`; outputs stay in that copy. Add draft decks only to the copy's render list until they have been reviewed.

### Convert inherited PowerPoint slides

Open `Lecture Slides/create-lecture-slides.qmd` in Positron and select this repository's `.venv/bin/python` interpreter. Its setup chunk imports `presentation_pptx_to_quarto()` from KWB's `_presentations/scripts/presentation_convert.py`. The conversion chunk creates a new editable deck with the shared course theme, source evidence, and explicit review findings. Run it manually; rendering the workflow does not execute conversion. No template copy is needed.

The `pptx` command in the same script calls the same function. See KWB's *Convert Presentation Sources to Quarto* guide for arguments, environment setup, stage commands, and the review sequence. An existing or edited draft is never overwritten. Conversion does not render or publish.

The course hooks and manual chunks use this repository's environment to execute KWB's shared scripts. Changes to those scripts can affect this course and other presentations; validate course preview, full builds, and any affected manual workflows after shared-tool updates.
