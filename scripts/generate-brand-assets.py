"""Gera icon.png, adaptive-icon.png, splash e variantes a partir das artes Merkaall."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

BRAND_ORANGE = (255, 107, 0)  # #FF6B00
BRAND_DARK = (26, 26, 26)  # #1a1a1a
ICON_SRC = ASSETS / "merkaall-icon-brand.png"
LOGO_SRC = ASSETS / "merkaall-logo.png"


def center_crop_square(img: Image.Image, size: int) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    cropped = img.crop((left, top, left + side, top + side))
    if side != size:
        cropped = cropped.resize((size, size), Image.Resampling.LANCZOS)
    return cropped


def replace_near_color(
    img: Image.Image,
    src_rgb: tuple[int, int, int],
    dst_rgb: tuple[int, int, int],
    tolerance: int = 42,
) -> Image.Image:
    out = img.convert("RGB")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if (
                abs(r - src_rgb[0]) <= tolerance
                and abs(g - src_rgb[1]) <= tolerance
                and abs(b - src_rgb[2]) <= tolerance
            ):
                px[x, y] = dst_rgb
    return out


def make_icon(size: int = 1024) -> Image.Image:
    return center_crop_square(Image.open(ICON_SRC).convert("RGB"), size)


def make_adaptive_icon(size: int = 1024) -> Image.Image:
    icon = make_icon(size)
    inner = int(size * 0.72)
    scaled = icon.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = (size - inner) // 2
    canvas.paste(scaled, (offset, offset))
    return canvas


def make_splash(width: int = 1284, height: int = 2778) -> Image.Image:
    logo = _strip_light_background(Image.open(LOGO_SRC))
    canvas = Image.new("RGB", (width, height), BRAND_ORANGE)
    max_w = int(width * 0.78)
    max_h = int(height * 0.22)
    ratio = min(max_w / logo.width, max_h / logo.height)
    new_size = (max(1, int(logo.width * ratio)), max(1, int(logo.height * ratio)))
    logo = logo.resize(new_size, Image.Resampling.LANCZOS)
    x = (width - logo.width) // 2
    y = (height - logo.height) // 2
    if logo.mode == "RGBA":
        canvas.paste(logo, (x, y), logo)
    else:
        canvas.paste(logo, (x, y))
    return canvas


def _strip_light_background(img: Image.Image, tolerance: int = 28) -> Image.Image:
    """Remove fundo branco/cinza claro para splash sobre cor sólida."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= 245 and g >= 245 and b >= 245:
                px[x, y] = (r, g, b, 0)
            elif abs(r - g) < 8 and abs(g - b) < 8 and r >= 220:
                px[x, y] = (r, g, b, 0)
    return rgba


def make_splash_logo_only(max_width: int = 900) -> Image.Image:
    """Logo horizontal transparente para splash com resizeMode contain."""
    logo = _strip_light_background(Image.open(LOGO_SRC))
    ratio = max_width / logo.width
    new_size = (max_width, max(1, int(logo.height * ratio)))
    return logo.resize(new_size, Image.Resampling.LANCZOS)


def make_dark_icon(size: int = 1024) -> Image.Image:
    icon = make_icon(size)
    return replace_near_color(icon, BRAND_ORANGE, BRAND_DARK)


def make_mono_logo() -> Image.Image:
    return ImageOps.grayscale(Image.open(LOGO_SRC).convert("RGB"))


def save_png(img: Image.Image, path: Path) -> None:
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
    img.save(path, format="PNG", optimize=True)


def save_ico(img: Image.Image, path: Path) -> None:
    icon = center_crop_square(img.convert("RGBA"), 256)
    icon.save(
        path,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)

    icon = make_icon(1024)
    adaptive = make_adaptive_icon(1024)
    splash_logo = make_splash_logo_only(900)
    splash_full = make_splash()
    dark_icon = make_dark_icon(1024)
    mono_logo = make_mono_logo()
    favicon_src = icon.resize((48, 48), Image.Resampling.LANCZOS)

    save_png(icon, ASSETS / "icon.png")
    save_png(adaptive, ASSETS / "adaptive-icon.png")
    save_png(splash_logo, ASSETS / "splash-icon.png")
    save_png(splash_full, ASSETS / "splash-full.png")
    save_png(dark_icon, ASSETS / "merkaall-icon-dark.png")
    save_png(mono_logo, ASSETS / "merkaall-logo-mono.png")
    save_png(favicon_src, ASSETS / "favicon.png")
    save_ico(icon, ASSETS / "favicon.ico")

    print("Assets gerados em", ASSETS)
    for name in (
        "icon.png",
        "adaptive-icon.png",
        "splash-icon.png",
        "splash-full.png",
        "merkaall-icon-dark.png",
        "merkaall-logo-mono.png",
        "favicon.png",
        "favicon.ico",
    ):
        path = ASSETS / name
        print(f"  {name}: {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
