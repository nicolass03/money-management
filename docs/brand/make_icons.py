"""Generate cash.sh icons: a dot-matrix `$` (receipt printer / LED panel), monochrome white on black.

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
UNLIT = "#161616"  # unlit dots, only on the large icon

# 5×9 dot glyph (tall spine) for the icon and favicons ≥32px. At 16px dots can't have gaps,
# so it becomes a 7×10 pixel `$` where every pixel is a "dot".
DOLLAR_9 = ["..#..", ".####", "#.#..", "#.#..", ".###.", "..#.#", "..#.#", "####.", "..#.."]
PIXEL_16 = ["...#...", ".#####.", "#..#..#", "#..#...", ".####..", "...###.", "...#..#", "#..#..#", ".#####.", "...#..."]


def dots(size: float, pattern: list[str], pitch: float, dot: float, radius: float, lit: bool = True) -> str:
    """Centred grid of `dot`-sized squares (corner `radius`) spaced by `pitch`: the lit dots, or the unlit ones."""
    cols, rows = len(pattern[0]), len(pattern)
    x0 = (size - ((cols - 1) * pitch + dot)) / 2
    y0 = (size - ((rows - 1) * pitch + dot)) / 2
    out = []
    for j, row in enumerate(pattern):
        for i, cell in enumerate(row):
            if (cell == "#") == lit:
                out.append(
                    f'<rect x="{x0 + i * pitch:g}" y="{y0 + j * pitch:g}" width="{dot:g}" height="{dot:g}" '
                    f'rx="{radius:g}"/>'
                )
    return "".join(out)


def flat_svg(size: int, pattern: list[str], pitch: int, dot: int, radius: float) -> str:
    """Favicon art: integer pitch/dot so every dot lands on whole pixels at its native size."""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" shape-rendering="crispEdges">'
        f'<rect width="{size}" height="{size}" fill="{BG}"/><g fill="{FG}">{dots(size, pattern, pitch, dot, radius)}</g></svg>'
    )


def app_svg(size: int = 1024) -> str:
    """App icon: round dots, faint unlit grid, glow, scanlines and vignette."""
    pitch, dot = size * 0.086, size * 0.06
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
  <g fill="{UNLIT}">{dots(size, DOLLAR_9, pitch, dot, dot / 2, lit=False)}</g>
  <g fill="{FG}" filter="url(#glow)">{dots(size, DOLLAR_9, pitch, dot, dot / 2)}</g>
  <rect width="{size}" height="{size}" fill="url(#scan)"/>
</svg>'''


def render(svg: str, px: int) -> Image.Image:
    return Image.open(io.BytesIO(resvg_py.svg_to_bytes(svg_string=svg, width=px, height=px)))


icon = app_svg()
# One hand-tuned grid per favicon size (pitch, dot) so dots stay pixel-aligned.
favicons = {
    16: flat_svg(16, PIXEL_16, 1, 1, 0),
    32: flat_svg(32, DOLLAR_9, 3, 2, 0.5),
    48: flat_svg(48, DOLLAR_9, 5, 4, 1),
}
(OUT / "app-icon.svg").write_text(icon)
(OUT / "favicon.svg").write_text(favicons[32])

# iOS: 1024 opaque PNG (App Store rejects icons with an alpha channel).
render(icon, 1024).convert("RGB").save(OUT / "AppIcon.png")
render(icon, 180).convert("RGB").save(OUT / "apple-touch-icon.png")
ico = {px: render(svg, px) for px, svg in favicons.items()}
ico[48].save(OUT / "favicon.ico", sizes=[(px, px) for px in ico], append_images=[ico[16], ico[32]])
for px, img in ico.items():
    img.save(OUT / f"favicon-{px}.png")
print("done")
