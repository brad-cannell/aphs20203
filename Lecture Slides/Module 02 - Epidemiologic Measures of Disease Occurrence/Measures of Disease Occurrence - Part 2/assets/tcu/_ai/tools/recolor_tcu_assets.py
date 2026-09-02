#!/usr/bin/env python3
"""Create nondestructive TCU copies of the Part 2 teaching assets.

Requires Pillow and NumPy. Run with SOURCE_ASSETS NEW_OUTPUT_DIRECTORY.
The palette follows knowledge-workbench/Notes/TCU Brand/TCU Color Palette.md.
Colors change; raster geometry, text shapes, dimensions, and alpha do not.
"""

import argparse
import hashlib
import html
import io
import itertools
import json
from pathlib import Path
import shutil

import numpy as np
from PIL import Image, ImageCms, ImageDraw

PURPLE = "4D1979"
GRAY = "A3A9AC"
ORANGE = "F47D20"
YELLOW = "F9D44B"
BLACK = "000000"


def rgb(value):
    """Decode the explicit six-digit brand/source color specification."""
    return np.array([int(value[i:i + 2], 16) for i in (0, 2, 4)]) / 255


def palette_for(name):
    """Use per-family mappings so the same teaching category stays consistent."""
    if name.startswith("closed_vs_open"):
        return [("ED7D31", PURPLE), ("4472C4", GRAY), ("2F528F", PURPLE)]
    if name.startswith("counts_"):
        return [("AE6042", PURPLE), ("4E738A", GRAY)]
    if name.startswith("example_study"):
        return [("ED7D31", PURPLE), ("FF0000", ORANGE), ("4472C4", GRAY)]
    return {
        "population_1.png": [("AE6042", PURPLE)],
        "measurement.png": [("AE6041", PURPLE)],
        "statistics.png": [("4D738A", PURPLE)],
        "uncertainty.png": [("4D738A", PURPLE)],
        "study_design.png": [("817290", PURPLE)],
        "data.png": [("002756", PURPLE)],
        "measurement_data_statistics.png": [
            ("AD6040", PURPLE), ("002756", PURPLE),
            ("4D738A", PURPLE), ("F2B825", YELLOW),
        ],
        "measures_uncertainty_study_design.png": [("46136D", PURPLE)],
        "types_of_studies.png": [("ED7D31", PURPLE), ("5B9BD5", GRAY)],
    }[name]


def recolor_pixels(pixels, palette):
    """Transfer color mixtures, retaining antialiasing and overlay boundaries.

    A source pixel can blend up to two palette colors with black and white.
    Find its closest nonnegative mixture and apply the same weights to the
    TCU colors. This preserves dashed overlays and soft edges without resizing,
    thresholding, redrawing text, or generating new image content.
    """
    colors, inverse = np.unique(pixels, axis=0, return_inverse=True)
    values = colors.astype(float) / 255
    best_error = np.full(len(colors), np.inf)
    best = values.copy()
    groups = [(i,) for i in range(len(palette))]
    groups += list(itertools.combinations(range(len(palette)), 2))
    for group in groups:
        source = np.column_stack([rgb(palette[i][0]) for i in group] + [np.ones(3)])
        target = np.column_stack([rgb(palette[i][1]) for i in group] + [np.ones(3)])
        weights = values @ np.linalg.pinv(source).T
        weights = np.maximum(weights, 0)
        weights /= np.maximum(weights.sum(axis=1, keepdims=True), 1)
        error = ((weights @ source.T - values) ** 2).sum(axis=1)
        choose = error < best_error
        best[choose] = (weights @ target.T)[choose]
        best_error[choose] = error[choose]
    return np.round(np.clip(best[inverse], 0, 1) * 255).astype(np.uint8)


def checksum(path):
    """Record source and deliverable identity for the non-overwrite audit."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def make_copy(source, destination):
    """Recolor one raster with explicit exceptions for text and neutral art."""
    with Image.open(source) as im:
        mode = im.mode
        raw = np.array(im.convert("RGBA"))
        # Screenshot PNGs embed a display profile. Decode their colors to sRGB
        # before matching, so the requested web hex colors render correctly.
        if im.info.get("icc_profile"):
            profile = ImageCms.ImageCmsProfile(io.BytesIO(im.info["icc_profile"]))
            working = ImageCms.profileToProfile(
                im, profile, ImageCms.createProfile("sRGB"), outputMode="RGBA"
            )
            decoded = np.array(working)
        else:
            decoded = raw.copy()

    output = raw.copy()
    visible = raw[:, :, 3] > 0
    # Leave neutral text, white space, black icons, and invisible RGB untouched.
    chroma = np.ptp(raw[:, :, :3].astype(int), axis=2)
    mask = visible & (chroma > 4)
    if source.name == "description_prediction_causation.png":
        # This figure is entirely neutral: tint its existing lines and letters
        # purple while preserving their original grayscale edge coverage.
        shade = raw[:, :, :3].mean(axis=2, keepdims=True) / 255
        output[:, :, :3] = np.round(
            255 * (rgb(PURPLE) * (1 - shade) + shade)
        ).astype(np.uint8)
        output[~visible] = raw[~visible]
        allowed = visible
    else:
        output[:, :, :3][mask] = recolor_pixels(decoded[:, :, :3][mask], palette_for(source.name))
        allowed = mask.copy()

    legend = None
    if source.name.startswith("example_study"):
        # White text on the new orange disease swatch lacks contrast. Change
        # only that existing legend's text to black, preserving every glyph.
        h, w = visible.shape
        red = (raw[:, :, 0] == 255) & (raw[:, :, 1] == 0) & (raw[:, :, 2] == 0)
        red[:int(h * .8)] = False
        ys, xs = np.where(red & visible)
        if len(xs):
            x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
            patch = raw[y0:y1, x0:x1, :3].astype(float) / 255
            # In this red swatch, green/blue measure white-letter coverage.
            coverage = patch[:, :, 1:3].mean(axis=2, keepdims=True)
            output[y0:y1, x0:x1, :3] = np.round(
                255 * rgb(ORANGE) * (1 - coverage)
            ).astype(np.uint8)
            allowed[y0:y1, x0:x1] = True
            legend = [x0, y0, x1, y1]

    # Alpha is copied without arithmetic, and unchanged regions must match
    # byte-for-byte; these checks guard against accidental edits or flattening.
    assert np.array_equal(raw[:, :, 3], output[:, :, 3])
    assert np.array_equal(raw[~allowed], output[~allowed])
    result = Image.fromarray(output, "RGBA")
    if mode == "RGB":
        result = result.convert("RGB")
    result.save(destination, icc_profile=ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes())
    with Image.open(destination) as check:
        verified = np.array(check.convert("RGBA"))
        assert check.size == (raw.shape[1], raw.shape[0])
        assert np.array_equal(verified, output)
    return {
        "filename": source.name, "dimensions": [raw.shape[1], raw.shape[0]],
        "alpha_identical": True, "unchanged_regions_identical": True,
        "changed_pixels": int(np.any(raw[:, :, :3] != output[:, :, :3], axis=2).sum()),
        "disease_legend_black_text_bounds": legend,
        "palette": [("#" + a, "#" + b) for a, b in palette_for(source.name)]
        if source.name != "description_prediction_causation.png" else [["grayscale ink", "#" + PURPLE]],
        "source_sha256": checksum(source), "copy_sha256": checksum(destination),
    }


def build_previews(source, output, names):
    """Make a review gallery; preview compositing never alters deliverables."""
    entries = []
    for name in names:
        # Embed source bytes so the comparison gallery is portable and keeps
        # working when the complete output directory is moved beside sources.
        import base64
        suffix = "svg+xml" if name.endswith(".svg") else "png"
        original = base64.b64encode((source / name).read_bytes()).decode()
        escaped = html.escape(name)
        entries.append(f'<section><h2>{escaped}</h2><div class="pair"><figure><img src="data:image/{suffix};base64,{original}"><figcaption>Original</figcaption></figure><figure><a href="{escaped}"><img src="{escaped}"></a><figcaption>TCU copy</figcaption></figure></div></section>')
    page = '<!doctype html><html lang="en"><meta charset="utf-8"><title>TCU asset review</title><style>body{font:16px system-ui;margin:32px;color:#222;background:#f3f3f3}h1,h2{color:#4d1979}h2{font-size:18px}section{background:white;margin:24px 0;padding:20px;border-radius:8px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}img{display:block;max-width:100%;max-height:660px;margin:auto}figcaption{text-align:center;padding-top:10px}section:last-child figure{background:#4d1979;padding:20px}section:last-child figcaption{color:white}</style><h1>TCU asset review</h1><p>Originals on the left; themed copies on the right. Click a copy to view its full resolution.</p>' + ''.join(entries) + '</html>'
    (output / "review.html").write_text(page)
    for start in range(0, len(names) - 1, 5):
        sheet = Image.new("RGB", (1500, 400 * min(5, len(names) - 1 - start)), "white")
        draw = ImageDraw.Draw(sheet)
        for row, name in enumerate(names[start:min(start + 5, len(names) - 1)]):
            draw.text((15, row * 400 + 10), name, fill="black")
            for col, root in enumerate((source, output)):
                im = Image.open(root / name).convert("RGBA")
                im.thumbnail((710, 350))
                sheet.paste(im, (col * 750 + (750 - im.width) // 2, row * 400 + 35), im)
        sheet.save(output / "review" / f"comparison-{start // 5 + 1}.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if args.output.exists():
        parser.error("Output directory already exists; choose a new one to avoid overwriting.")
    args.output.mkdir(parents=True)
    (args.output / "review").mkdir()
    rasters = sorted(args.source.glob("*.png"))
    records = [make_copy(path, args.output / path.name) for path in rasters]
    # The supplied official white SVG is already TCU branded. Copy its bytes,
    # including every path, proportion, trademark, and original fill color.
    shutil.copy2(args.source / "tcu-logo.svg", args.output / "tcu-logo.svg")
    assert checksum(args.source / "tcu-logo.svg") == checksum(args.output / "tcu-logo.svg")
    for record in records:
        assert checksum(args.source / record["filename"]) == record["source_sha256"]
    (args.output / "review" / "validation.json").write_text(json.dumps(records, indent=2) + "\n")
    build_previews(args.source, args.output, [p.name for p in rasters] + ["tcu-logo.svg"])
    script_dir = args.output / "_ai" / "tools"
    script_dir.mkdir(parents=True)
    shutil.copy2(__file__, script_dir / Path(__file__).name)
    print(json.dumps({"output": str(args.output), "pngs": len(records), "svgs": 1, "checks": "dimensions, alpha, unchanged regions, source hashes"}))


if __name__ == "__main__":
    main()
