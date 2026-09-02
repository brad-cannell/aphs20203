# TCU-Themed Teaching Assets

This folder contains themed copies of all 19 PNGs and the existing TCU SVG logo from the parent `assets` folder. Original files and lecture references are unchanged. Each copy keeps its original filename, dimensions, text shapes, diagram geometry, and transparency.

Open `review.html` for side-by-side comparisons. The PNG files in `review/` provide printable comparison sheets.

## Palette

- TCU purple: `#4D1979`, used for the main figures, icons, event counts, and at-risk periods.
- TCU gray: `#A3A9AC`, used for no-event counts, axes, and the experimental-study branch.
- Old School Orange: `#F47D20`, used for diseased periods. The existing disease-legend lettering is black for readability.
- Goldenrod Yellow: `#F9D44B`, used for arrows in the measurement-to-data-to-statistics graphic.
- Existing black, white, and neutral elements are retained. The all-neutral Venn diagram is tinted purple. The already-themed measurement/uncertainty/study-design composite retains its gray and black panels.

The white TCU SVG logo is copied byte-for-byte; display it against purple or another dark background. Brand colors come from the local knowledge-workbench TCU Color Palette note.

## Validation

All raster dimensions and alpha channels were checked against their originals. Regions outside the recoloring masks were checked byte-for-byte. The count diagrams retain 53 event circles and 47 no-event circles at the same positions; the population diagram retains 225 circles. Solid timeline segments retain their exact pixel positions. All 19 raster copies were visually reviewed against the originals, including transparent content displayed on white. Details and checksums are in `review/validation.json` and `review/data-checks.json`.

## Recreate

The reusable script requires Python, Pillow, and NumPy. From the parent `assets` directory, run:

```sh
python3 tcu/_ai/tools/recolor_tcu_assets.py . tcu-v2
```

The output directory must be new. The script never overwrites the originals. It decodes embedded display profiles, maps existing color mixtures to the TCU palette, and writes sRGB PNGs without redrawing or resizing the artwork.
