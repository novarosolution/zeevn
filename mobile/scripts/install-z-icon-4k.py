#!/usr/bin/env python3
"""Build 4K Zeevan Z masters (light cream + dark forest) from the chosen mark."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
USER = Path("/Users/kuldip/.cursor/projects/Users-kuldip-zeevanwebandapp/assets/image-d7812b85-4df3-4026-ae5a-d1af75fe7a59.png")
GEN_DARK = Path("/Users/kuldip/.cursor/projects/Users-kuldip-zeevanwebandapp/assets/zeevan-4k-dark.jpg")
GEN_LIGHT = Path("/Users/kuldip/.cursor/projects/Users-kuldip-zeevanwebandapp/assets/zeevan-4k-light.jpg")

SIZE = 4096
CREAM = (251, 246, 236, 255)
# Sampled from the chosen forest icon.
FOREST = (15, 61, 36, 255)


def extract_gold_z(src: Image.Image) -> Image.Image:
    img = src.convert("RGBA")
    px = img.load()
    w, h = img.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16:
                continue
            # Forest / cream / white field
            if g > r + 15 and g > b + 8 and r < 90:
                continue
            if min(r, g, b) > 220 and max(r, g, b) - min(r, g, b) < 40:
                continue
            # Gold
            if r > 140 and g > 100 and b < 190 and r >= g >= b - 10:
                op[x, y] = (r, g, b, 255)
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def fit_center(mark: Image.Image, canvas: Image.Image, cover=0.52) -> None:
    box = int(canvas.width * cover)
    scale = box / max(mark.width, mark.height)
    nw, nh = max(1, int(mark.width * scale)), max(1, int(mark.height * scale))
    placed = mark.resize((nw, nh), Image.Resampling.LANCZOS)
    x = (canvas.width - nw) // 2
    y = (canvas.height - nh) // 2
    canvas.alpha_composite(placed, (x, y))


def upscale(path: Path, size: int) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    return im.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    src = Image.open(USER if USER.exists() else GEN_DARK)
    z = extract_gold_z(src)
    z4 = z.resize((int(z.width * (SIZE / src.width)), int(z.height * (SIZE / src.height))), Image.Resampling.LANCZOS)

    mark = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    fit_center(z4, mark, 0.54)
    mark_path = ASSETS / "app-icon-z-mark.png"
    mark.save(mark_path, "PNG", optimize=True)

    light = Image.new("RGBA", (SIZE, SIZE), CREAM)
    fit_center(z4, light, 0.54)
    dark = Image.new("RGBA", (SIZE, SIZE), FOREST)
    fit_center(z4, dark, 0.54)

    # Prefer the improved generated frames when present — same Z, cleaner field.
    if GEN_LIGHT.exists():
        light = upscale(GEN_LIGHT, SIZE)
    if GEN_DARK.exists():
        dark = upscale(GEN_DARK, SIZE)

    light_path = ASSETS / "app-icon-z-4k-light.png"
    dark_path = ASSETS / "app-icon-z-4k-dark.png"
    light.convert("RGB").save(light_path, "PNG", optimize=True)
    dark.convert("RGB").save(dark_path, "PNG", optimize=True)

    # Working 1024 sources used by Expo / existing generators
    light.resize((1024, 1024), Image.Resampling.LANCZOS).convert("RGB").save(ASSETS / "app-icon-light.png", "PNG")
    dark.resize((1024, 1024), Image.Resampling.LANCZOS).convert("RGB").save(ASSETS / "app-icon-dark.png", "PNG")
    dark.resize((1024, 1024), Image.Resampling.LANCZOS).convert("RGB").save(ASSETS / "app-icon-z-source.png", "PNG")
    print("4K light", light_path)
    print("4K dark", dark_path)
    print("mark", mark_path, mark.size)


if __name__ == "__main__":
    main()
