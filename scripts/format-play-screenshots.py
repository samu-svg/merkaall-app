"""
Gera capturas Play Store com a imagem INTEIRA visível, simulando dispositivos.
Uso: python scripts/format-play-screenshots.py [caminho-da-captura.png]
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = (
    Path(r"C:\Users\AVELL\.cursor\projects\c-promocaopro-mobile\assets")
    / "c__Users_AVELL_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_"
    "Captura_de_tela_2026-07-21_145829-8fad26a9-88f0-4afa-b828-c27d83032498.png"
)
OUT_DIR = ROOT / "assets" / "play-store"

BG = (245, 245, 240)
FRAME = (26, 26, 26)
FRAME_LIGHT = (58, 58, 60)
ACCENT = (255, 107, 0)


def contain(img: Image.Image, box_w: int, box_h: int) -> Image.Image:
    w, h = img.size
    scale = min(box_w / w, box_h / h)
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (box_w, box_h), BG)
    canvas.paste(resized, ((box_w - nw) // 2, (box_h - nh) // 2))
    return canvas


def rounded_rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], r: int, fill: str | tuple) -> None:
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=r, fill=fill)


def shadow(size: tuple[int, int], radius: int = 40) -> Image.Image:
    w, h = size
    layer = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle((40, 40, w + 40, h + 40), radius=radius, fill=(0, 0, 0, 90))
    return layer.filter(ImageFilter.GaussianBlur(18))


def device_mockup(
    screenshot: Image.Image,
    canvas_w: int,
    canvas_h: int,
    *,
    kind: str,
    label: str,
) -> Image.Image:
    canvas = Image.new("RGB", (canvas_w, canvas_h), BG)

    if kind == "phone":
        margin_x = int(canvas_w * 0.06)
        margin_top = int(canvas_h * 0.07)
        margin_bottom = int(canvas_h * 0.06)
        frame_r = int(canvas_w * 0.08)
        bezel = max(10, int(canvas_w * 0.018))
    elif kind == "tablet":
        margin_x = int(canvas_w * 0.05)
        margin_top = int(canvas_h * 0.05)
        margin_bottom = int(canvas_h * 0.05)
        frame_r = int(min(canvas_w, canvas_h) * 0.04)
        bezel = max(12, int(min(canvas_w, canvas_h) * 0.014))
    else:
        margin_x = int(canvas_w * 0.04)
        margin_top = int(canvas_h * 0.08)
        margin_bottom = int(canvas_h * 0.12)
        frame_r = 24
        bezel = 14

    fx0, fy0 = margin_x, margin_top
    fx1, fy1 = canvas_w - margin_x, canvas_h - margin_bottom
    frame_w, frame_h = fx1 - fx0, fy1 - fy0

    sh = shadow((frame_w, frame_h), radius=frame_r)
    canvas.paste(sh, (fx0 - 40, fy0 - 40), sh)

    frame_layer = Image.new("RGB", (frame_w, frame_h), FRAME)
    canvas.paste(frame_layer, (fx0, fy0))

    inner_w = frame_w - bezel * 2
    inner_h = frame_h - bezel * 2
    screen = contain(screenshot, inner_w, inner_h)
    canvas.paste(screen, (fx0 + bezel, fy0 + bezel))

    if kind == "phone":
        fd = ImageDraw.Draw(canvas)
        notch_w = int(frame_w * 0.28)
        notch_h = max(12, int(frame_h * 0.022))
        nx0 = fx0 + (frame_w - notch_w) // 2
        fd.rounded_rectangle(
            (nx0, fy0 + bezel, nx0 + notch_w, fy0 + bezel + notch_h),
            radius=notch_h // 2,
            fill=FRAME,
        )

    draw = ImageDraw.Draw(canvas)
    draw.text((canvas_w // 2 - len(label) * 4, canvas_h - margin_bottom + 16), label, fill=FRAME_LIGHT)

    return canvas


def full_canvas(screenshot: Image.Image, canvas_w: int, canvas_h: int) -> Image.Image:
    return contain(screenshot, canvas_w, canvas_h)


DEVICES = [
    ("telefone-1080x1920-mockup", 1080, 1920, "phone", "Smartphone"),
    ("telefone-1080x1920-full", 1080, 1920, "full", "Smartphone"),
    ("telefone-1080x2340-mockup", 1080, 2340, "phone", "Smartphone"),
    ("tablet-7-1200x1920-mockup", 1200, 1920, "tablet", 'Tablet 7"'),
    ("tablet-7-1200x1920-full", 1200, 1920, "full", 'Tablet 7"'),
    ("tablet-10-2560x1600-mockup", 2560, 1600, "tablet", 'Tablet 10"'),
    ("tablet-10-1920x1200-mockup", 1920, 1200, "tablet", 'Tablet 10"'),
    ("tablet-10-1920x1200-full", 1920, 1200, "full", 'Tablet 10"'),
    ("chromebook-1920x1080-mockup", 1920, 1080, "laptop", "Chromebook"),
    ("chromebook-1920x1080-full", 1920, 1080, "full", "Chromebook"),
    ("android-xr-1080x1920-mockup", 1080, 1920, "phone", "Android XR"),
]


def main() -> None:
    src_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC
    if not src_path.exists():
        raise SystemExit(f"Captura não encontrada: {src_path}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    screenshot = Image.open(src_path).convert("RGB")
    screenshot.save(OUT_DIR / "00-original-referencia.png", "PNG", optimize=True)

    for name, w, h, kind, label in DEVICES:
        if kind == "full":
            out = full_canvas(screenshot, w, h)
        else:
            out = device_mockup(screenshot, w, h, kind=kind, label=label)
        path = OUT_DIR / f"{name}.png"
        out.save(path, "PNG", optimize=True)
        print(f"OK {path.name} ({w}x{h})")

    print(f"\nPasta: {OUT_DIR}")


if __name__ == "__main__":
    main()
