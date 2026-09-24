"""Generate cash.sh icons: a JetBrains Mono `$_` shell prompt, monochrome white on black.

Usage: pip install fonttools pillow resvg-py && python docs/brand/make_icons.py <out_dir>
Copy AppIcon.png into the iOS AppIcon.appiconset and the favicon/apple-touch files into public/.
"""
import io
import sys
from pathlib import Path

import resvg_py
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

FONT = Path(__file__).resolve().parents[2] / "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff"
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

BG = "#0a0a0a"
FG = "#e8e8e8"  # the app's `text` token — the brand stays monochrome

font = TTFont(FONT)
glyph_set = font.getGlyphSet()
dollar = glyph_set[font.getBestCmap()[ord("$")]]
bp = BoundsPen(glyph_set)
dollar.draw(bp)
gx0, gy0, gx1, gy1 = bp.bounds
cap_height = font["OS/2"].sCapHeight


def dollar_path(scale: float, x: float, baseline: float) -> str:
    """`$` outline, y-flipped, with its left edge at x and baseline at `baseline`."""
    pen = SVGPathPen(glyph_set)
    dollar.draw(TransformPen(pen, (scale, 0, 0, -scale, x - gx0 * scale, baseline)))
    return pen.getCommands()


def build_svg(size: int, detailed: bool) -> str:
    """detailed=True → app icon (glow, scanlines, vignette); False → flat, crisp favicon."""
    glyph_h = size * (0.54 if detailed else 0.78)
    scale = glyph_h / (gy1 - gy0)
    glyph_w = (gx1 - gx0) * scale
    # `_` cursor sits on the baseline, like the blinking prompt on the login screen.
    cursor_w = glyph_w * (0.95 if detailed else 0.75)
    cursor_h = glyph_h * (0.11 if detailed else 0.14)
    gap = glyph_w * (0.12 if detailed else 0.08)
    total_w = glyph_w + gap + cursor_w
    x = (size - total_w) / 2
    baseline = size / 2 + (gy1 + gy0) / 2 * scale  # vertically centre the glyph box
    cx = x + glyph_w + gap

    shapes = (
        f'<path d="{dollar_path(scale, x, baseline)}"/>'
        f'<rect x="{cx:.2f}" y="{baseline - cursor_h:.2f}" width="{cursor_w:.2f}" height="{cursor_h:.2f}"/>'
    )

    if not detailed:
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
            f'<rect width="{size}" height="{size}" fill="{BG}"/>'
            f'<g fill="{FG}">{shapes}</g></svg>'
        )

    line = size / 256  # scanline pitch
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="46%" r="72%">
      <stop offset="0" stop-color="#171717"/>
      <stop offset="1" stop-color="{BG}"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="{size * 0.018:.1f}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="scan" width="{size}" height="{line * 2}" patternUnits="userSpaceOnUse">
      <rect y="{line}" width="{size}" height="{line}" fill="#000" fill-opacity="0.14"/>
    </pattern>
  </defs>
  <rect width="{size}" height="{size}" fill="url(#vignette)"/>
  <g fill="{FG}" filter="url(#glow)">{shapes}</g>
  <rect width="{size}" height="{size}" fill="url(#scan)"/>
</svg>'''


def render(svg: str, px: int) -> Image.Image:
    return Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg, width=px, height=px)))


app_svg = build_svg(1024, detailed=True)
fav_svg = build_svg(32, detailed=False)
(OUT / "app-icon.svg").write_text(app_svg)
(OUT / "favicon.svg").write_text(fav_svg)

# iOS: 1024 opaque PNG (App Store rejects icons with an alpha channel).
render(app_svg, 1024).convert("RGB").save(OUT / "AppIcon.png")
# Web: apple-touch-icon uses the detailed art; favicons use the flat art.
render(app_svg, 180).convert("RGB").save(OUT / "apple-touch-icon.png")
# Render each ICO size natively so 16px stays crisp instead of being downsampled.
ico_sizes = [16, 32, 48]
render(fav_svg, 48).save(
    OUT / "favicon.ico",
    sizes=[(px, px) for px in ico_sizes],
    append_images=[render(fav_svg, px) for px in ico_sizes[:-1]],
)
for px in (16, 32, 64):
    render(fav_svg, px).save(OUT / f"favicon-{px}.png")
print("done")
