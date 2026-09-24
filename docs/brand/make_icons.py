"""Generate cash.sh icons: a `$_` shell prompt in the IBM PC 8×8 console font, monochrome white on black.

Usage: pip install pillow resvg-py && python docs/brand/make_icons.py <out_dir>
Copy AppIcon.png into the iOS AppIcon.appiconset and the favicon/apple-touch files into public/.
"""
import io
import sys
from pathlib import Path

import resvg_py
from PIL import Image

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

BG = "#0a0a0a"
FG = "#e8e8e8"  # the app's `text` token — the brand stays monochrome

# `$` and `_` from the Linux kernel's 8×8 console font (lib/fonts/font_8x8.c, IBM CGA-derived),
# drawn in adjacent character cells as a console would, then cropped to the lit pixels (15×8).
PROMPT = [
    "..##...........",
    ".#####.........",
    "##.............",
    ".####..........",
    "....##.........",
    "#####..........",
    "..##...........",
    ".......########",
]


def pixels(size: int, fill: float) -> str:
    """Lit pixels as squares of an integer size (≤ `fill` of the canvas), centred."""
    cols, rows = len(PROMPT[0]), len(PROMPT)
    px = int(size * fill / cols)
    x0, y0 = (size - cols * px) // 2, (size - rows * px) // 2
    return "".join(
        f'<rect x="{x0 + x * px}" y="{y0 + y * px}" width="{px}" height="{px}"/>'
        for y, row in enumerate(PROMPT)
        for x, cell in enumerate(row)
        if cell == "#"
    )


def flat_svg(size: int) -> str:
    """Favicon art: 15 columns fit 16/32/48 at exactly 1/2/3 px per font pixel — no blur."""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" shape-rendering="crispEdges">'
        f'<rect width="{size}" height="{size}" fill="{BG}"/><g fill="{FG}">{pixels(size, 1)}</g></svg>'
    )


def app_svg(size: int = 1024) -> str:
    """App icon: the prompt with CRT glow, scanlines and vignette."""
    line = size / 256  # scanline pitch
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">
  <defs>
    <radialGradient id="vignette" cx="50%" cy="46%" r="72%">
      <stop offset="0" stop-color="#171717"/>
      <stop offset="1" stop-color="{BG}"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="{size * 0.016:.1f}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="scan" width="{size}" height="{line * 2}" patternUnits="userSpaceOnUse">
      <rect y="{line}" width="{size}" height="{line}" fill="#000" fill-opacity="0.14"/>
    </pattern>
  </defs>
  <rect width="{size}" height="{size}" fill="url(#vignette)"/>
  <g fill="{FG}" filter="url(#glow)">{pixels(size, 0.66)}</g>
  <rect width="{size}" height="{size}" fill="url(#scan)"/>
</svg>'''


def render(svg: str, px: int) -> Image.Image:
    return Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg, width=px, height=px)))


icon = app_svg()
(OUT / "app-icon.svg").write_text(icon)
(OUT / "favicon.svg").write_text(flat_svg(32))

# iOS: 1024 opaque PNG (App Store rejects icons with an alpha channel).
render(icon, 1024).convert("RGB").save(OUT / "AppIcon.png")
render(icon, 180).convert("RGB").save(OUT / "apple-touch-icon.png")
ico = {px: render(flat_svg(px), px) for px in (16, 32, 48)}
ico[48].save(OUT / "favicon.ico", sizes=[(px, px) for px in ico], append_images=[ico[16], ico[32]])
for px, img in ico.items():
    img.save(OUT / f"favicon-{px}.png")
print("done")
