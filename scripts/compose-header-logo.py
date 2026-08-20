"""Compose merkaall-logo.png: brand icon + wordmark on a transparent canvas."""
from __future__ import annotations

from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ICON_SRC = ASSETS / "icon.png"
OUT = ASSETS / "merkaall-logo.png"

ORANGE = (255, 107, 0, 255)
DARK = (26, 26, 26, 255)
FONT_PATH = Path(r"C:\Windows\Fonts\seguibl.ttf")


def is_near_white(r: int, g: int, b: int, tol: int = 28) -> bool:
    return r >= 255 - tol and g >= 255 - tol and b >= 255 - tol


def knock_out_white(r: int, g: int, b: int) -> tuple[int, int, int, int]:
    """Recover color as if composited over white; keep the M interior untouched elsewhere."""
    alpha = max(255 - r, 255 - g, 255 - b)
    if alpha <= 0:
        return (0, 0, 0, 0)
    scale = 255 / alpha
    nr = max(0, min(255, round((r - (255 - alpha)) * scale)))
    ng = max(0, min(255, round((g - (255 - alpha)) * scale)))
    nb = max(0, min(255, round((b - (255 - alpha)) * scale)))
    return (nr, ng, nb, alpha)


def strip_white_background(img: Image.Image, tol: int = 28, dilate: int = 2) -> Image.Image:
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    bg = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def seed(x: int, y: int) -> None:
        r, g, b, _a = px[x, y]
        if not bg[y][x] and is_near_white(r, g, b, tol):
            bg[y][x] = True
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny][nx]:
                r, g, b, _a = px[nx, ny]
                if is_near_white(r, g, b, tol):
                    bg[ny][nx] = True
                    q.append((nx, ny))

    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    for y in range(h):
        for x in range(w):
            if bg[y][x]:
                mp[x, y] = 255
    if dilate:
        mask = mask.filter(ImageFilter.MaxFilter(dilate * 2 + 1))
        mp = mask.load()

    out = rgba.copy()
    op = out.load()
    for y in range(h):
        for x in range(w):
            if mp[x, y] == 0:
                continue
            r, g, b, _a = px[x, y]
            op[x, y] = knock_out_white(r, g, b)
    return out


def content_bbox(img: Image.Image, alpha_min: int = 12) -> tuple[int, int, int, int]:
    a = img.split()[-1]
    box = a.point(lambda p: 255 if p >= alpha_min else 0).getbbox()
    if not box:
        raise RuntimeError("Logo vazio apos remover fundo")
    return box


def compose() -> Image.Image:
    icon = strip_white_background(Image.open(ICON_SRC))
    ix1, iy1, ix2, iy2 = content_bbox(icon)
    icon = icon.crop((ix1, iy1, ix2, iy2))

    icon_h = 512
    ratio = icon_h / icon.height
    icon = icon.resize((max(1, round(icon.width * ratio)), icon_h), Image.Resampling.LANCZOS)

    font_size = int(icon_h * 0.48)
    font = ImageFont.truetype(str(FONT_PATH), font_size)
    merka = "Merka"
    all_txt = "all"

    probe = ImageDraw.Draw(Image.new("RGBA", (8, 8)))
    merka_box = probe.textbbox((0, 0), merka, font=font)
    all_box = probe.textbbox((0, 0), all_txt, font=font)
    merka_w = merka_box[2] - merka_box[0]
    text_h = max(merka_box[3] - merka_box[1], all_box[3] - all_box[1])
    all_w = all_box[2] - all_box[0]
    text_w = merka_w + all_w

    pad = 24
    gap = int(icon_h * 0.16)
    width = pad * 2 + icon.width + gap + text_w
    height = pad * 2 + icon_h

    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    canvas.paste(icon, (pad, pad), icon)

    text_x = pad + icon.width + gap
    text_y = pad + (icon_h - text_h) // 2 - merka_box[1]
    draw = ImageDraw.Draw(canvas)
    draw.text((text_x, text_y), merka, font=font, fill=DARK)
    draw.text((text_x + merka_w, text_y), all_txt, font=font, fill=ORANGE)

    bx1, by1, bx2, by2 = content_bbox(canvas)
    pad2 = 8
    cropped = canvas.crop(
        (
            max(0, bx1 - pad2),
            max(0, by1 - pad2),
            min(canvas.width, bx2 + pad2),
            min(canvas.height, by2 + pad2),
        )
    )
    return cropped


def main() -> None:
    logo = compose()
    logo.save(OUT, format="PNG", optimize=True)
    print(f"saved {OUT} {logo.mode} {logo.size} ratio={logo.width / logo.height:.3f}")


if __name__ == "__main__":
    main()
