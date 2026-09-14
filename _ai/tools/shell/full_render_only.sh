#!/bin/sh
# Keep the site's PDF export out of ordinary preview and single-deck renders.
# Quarto sets this flag for full-project builds; see:
# https://quarto.org/docs/projects/scripts.html#pre-and-post-render
set -eu

if [ "${QUARTO_PROJECT_RENDER_ALL:-}" != "1" ]; then
    printf '%s\n' 'Skipping site PDFs for preview/single-deck render; run quarto render from Lecture Slides to rebuild PDFs.'
    exit 0
fi

# Forward the configured command unchanged, including paths containing spaces.
# exec preserves export failures so a full build cannot silently omit its PDFs.
exec "$@"
