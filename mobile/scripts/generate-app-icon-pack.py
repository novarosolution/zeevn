#!/usr/bin/env python3
"""20 premium Zeevan launcher-icon candidates from the live gold Z mark."""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "app-icon-z-source.png"
OUT = ROOT / "assets" / "app-icon-pack"
SIZE = 2048  # 4K-class source (downscales cleanly to 1024 launcher)

CREAM = (251, 246, 236, 255)
IVORY = (255, 248, 240, 255)
SAND = (232, 220, 200, 255)
GOLD = (198, 162, 76, 255)
GOLD_DEEP = (168, 119, 43, 255)
GOLD_LIGHT = (241, 212, 147, 255)
FOREST = (31, 42, 20, 255)
LEAF = (47, 79, 34, 255)
ESPRESSO = (26, 23, 20, 255)
NIGHT = (10, 10, 10, 255)
WHITE = (255, 255, 255, 255)


def extract_gold(src: Image.Image) -> Image.Image:
    """Keep gold mark pixels, everything else transparent."""
    img = src.convert("RGBA")
    px = img.load()
    w, h = img.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 20:
                continue
            # Cream / near-white background
            if r > 235 and g > 228 and b > 210 and abs(r - g) < 25:
                continue
            # Gold / tan
            if r > 140 and g > 90 and b < 160 and r > b + 20:
                op[x, y] = (r, g, b, 255)
    return out


def crop_content(im: Image.Image, pad: int = 8) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


def split_z_and_ring(gold: Image.Image) -> tuple[Image.Image, Image.Image]:
    """Inner letter vs the circular ring — drop the thin annulus by radius peak."""
    w, h = gold.size
    cx, cy = w / 2, h / 2
    px = gold.load()
    dists: list[float] = []
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 20:
                continue
            dists.append(math.hypot(x - cx, y - cy))
    if not dists:
        return gold, Image.new("RGBA", (1, 1), (0, 0, 0, 0))
    # Histogram: the ring is a sharp peak at one radius.
    bins = [0] * (max(w, h) + 1)
    for d in dists:
        bins[int(d)] += 1
    peak = max(range(int(min(w, h) * 0.18), int(min(w, h) * 0.42) + 1), key=lambda i: bins[i])
    band = 10
    z = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ring = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    zp, rp = z.load(), ring.load()
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] < 20:
                continue
            dist = math.hypot(x - cx, y - cy)
            if abs(dist - peak) <= band:
                rp[x, y] = p
            elif dist < peak - band:
                zp[x, y] = p
    return crop_content(z, 4), crop_content(ring, 4)


def tint(im: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    """Recolor non-transparent pixels, keep anti-aliased edges."""
    src = im.convert("RGBA")
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    sp, op = src.load(), out.load()
    cr, cg, cb, _ = color
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = sp[x, y]
            if a == 0:
                continue
            op[x, y] = (cr, cg, cb, a)
    return out


def fit(im: Image.Image, box: int) -> Image.Image:
    im = im.convert("RGBA")
    if im.width == 0 or im.height == 0:
        return Image.new("RGBA", (box, box), (0, 0, 0, 0))
    scale = box / max(im.width, im.height)
    nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
    return im.resize((nw, nh), Image.Resampling.LANCZOS)


def paste_center(base: Image.Image, layer: Image.Image, y_shift: int = 0) -> None:
    x = (base.width - layer.width) // 2
    y = (base.height - layer.height) // 2 + y_shift
    base.alpha_composite(layer, (x, y))


def canvas(color: tuple[int, int, int, int]) -> Image.Image:
    return Image.new("RGBA", (SIZE, SIZE), color)


def ring(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, width: float, color) -> None:
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=max(1, int(width)))


def disc(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, color) -> None:
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)


def rounded_rect(draw: ImageDraw.ImageDraw, inset: float, radius: float, color) -> None:
    draw.rounded_rectangle([inset, inset, SIZE - inset, SIZE - inset], radius=radius, fill=color)


def build(z: Image.Image, ring_mark: Image.Image) -> list[tuple[str, Image.Image]]:
    cx = cy = SIZE / 2
    gold_z = tint(z, GOLD)
    cream_z = tint(z, CREAM)
    ivory_z = tint(z, IVORY)
    deep_z = tint(z, GOLD_DEEP)
    light_z = tint(z, GOLD_LIGHT)
    white_z = tint(z, WHITE)

    items: list[tuple[str, Image.Image]] = []

    def add(name: str, im: Image.Image) -> None:
        items.append((name, im))

    # 01 — current heritage, cream + thin gold ring
    im = canvas(CREAM)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.30, SIZE * 0.007, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.38)))
    add("01-cream-thin-ring", im)

    # 02 — cream, letter only
    im = canvas(CREAM)
    paste_center(im, fit(gold_z, int(SIZE * 0.46)))
    add("02-cream-z-only", im)

    # 03 — cream, bold ring
    im = canvas(CREAM)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.31, SIZE * 0.022, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.36)))
    add("03-cream-bold-ring", im)

    # 04 — double seal
    im = canvas(CREAM)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.34, SIZE * 0.008, GOLD)
    ring(d, cx, cy, SIZE * 0.29, SIZE * 0.004, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.34)))
    add("04-cream-double-seal", im)

    # 05 — gold medal on cream
    im = canvas(CREAM)
    d = ImageDraw.Draw(im)
    disc(d, cx, cy, SIZE * 0.32, GOLD)
    paste_center(im, fit(cream_z, int(SIZE * 0.36)))
    add("05-cream-gold-medal", im)

    # 06 — full gold field
    im = canvas(GOLD)
    paste_center(im, fit(cream_z, int(SIZE * 0.46)))
    add("06-gold-field", im)

    # 07 — forest + gold Z
    im = canvas(FOREST)
    paste_center(im, fit(gold_z, int(SIZE * 0.46)))
    add("07-forest-z", im)

    # 08 — forest gold medal
    im = canvas(FOREST)
    d = ImageDraw.Draw(im)
    disc(d, cx, cy, SIZE * 0.32, GOLD)
    paste_center(im, fit(tint(z, FOREST), int(SIZE * 0.36)))
    add("08-forest-gold-medal", im)

    # 09 — espresso thin ring (dark companion)
    im = canvas(ESPRESSO)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.30, SIZE * 0.007, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.38)))
    add("09-espresso-thin-ring", im)

    # 10 — espresso letter only
    im = canvas(ESPRESSO)
    paste_center(im, fit(light_z, int(SIZE * 0.46)))
    add("10-espresso-z-only", im)

    # 11 — night gold disc
    im = canvas(NIGHT)
    d = ImageDraw.Draw(im)
    disc(d, cx, cy, SIZE * 0.32, GOLD)
    paste_center(im, fit(tint(z, NIGHT), int(SIZE * 0.36)))
    add("11-night-gold-medal", im)

    # 12 — ivory inner disc
    im = canvas(CREAM)
    d = ImageDraw.Draw(im)
    disc(d, cx, cy, SIZE * 0.30, IVORY)
    ring(d, cx, cy, SIZE * 0.30, SIZE * 0.008, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.36)))
    add("12-ivory-inner-disc", im)

    # 13 — leaf green
    im = canvas(LEAF)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.30, SIZE * 0.008, GOLD_LIGHT)
    paste_center(im, fit(light_z, int(SIZE * 0.38)))
    add("13-leaf-gold-ring", im)

    # 14 — warm sand
    im = canvas(SAND)
    paste_center(im, fit(deep_z, int(SIZE * 0.46)))
    add("14-sand-deep-z", im)

    # 15 — gold ring on forest
    im = canvas(FOREST)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.31, SIZE * 0.018, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.36)))
    add("15-forest-bold-ring", im)

    # 16 — cream rounded plate (safe-zone inset)
    im = canvas(GOLD)
    d = ImageDraw.Draw(im)
    rounded_rect(d, SIZE * 0.08, SIZE * 0.18, CREAM)
    paste_center(im, fit(gold_z, int(SIZE * 0.40)))
    add("16-gold-cream-plate", im)

    # 17 — espresso gold medal
    im = canvas(ESPRESSO)
    d = ImageDraw.Draw(im)
    disc(d, cx, cy, SIZE * 0.32, GOLD)
    paste_center(im, fit(tint(z, ESPRESSO), int(SIZE * 0.36)))
    add("17-espresso-gold-medal", im)

    # 18 — cream large ring, small Z
    im = canvas(CREAM)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.36, SIZE * 0.010, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.28)))
    add("18-cream-wide-seal", im)

    # 19 — white luxury
    im = canvas(WHITE)
    d = ImageDraw.Draw(im)
    ring(d, cx, cy, SIZE * 0.30, SIZE * 0.007, GOLD)
    paste_center(im, fit(gold_z, int(SIZE * 0.38)))
    add("19-white-thin-ring", im)

    # 20 — gold field + ring + cream Z
    im = canvas(GOLD_DEEP)
    d = ImageDraw.Draw(im)
    disc(d, cx, cy, SIZE * 0.34, GOLD)
    ring(d, cx, cy, SIZE * 0.34, SIZE * 0.012, GOLD_LIGHT)
    paste_center(im, fit(ivory_z, int(SIZE * 0.36)))
    add("20-gold-luxe-medal", im)

    # Soft shadow on a couple of letter-only marks for depth
    for name in ("02-cream-z-only", "07-forest-z", "10-espresso-z-only", "14-sand-deep-z"):
        idx = next(i for i, (n, _) in enumerate(items) if n == name)
        base = items[idx][1]
        # already composited; leave as-is — shadow baked only on 02
        if name != "02-cream-z-only":
            continue
        layered = canvas(CREAM)
        mark = fit(gold_z, int(SIZE * 0.46))
        shadow = Image.new("RGBA", mark.size, (0, 0, 0, 0))
        sp = shadow.load()
        mp = mark.load()
        for y in range(mark.height):
            for x in range(mark.width):
                if mp[x, y][3] > 20:
                    sp[x, y] = (90, 70, 30, 40)
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=SIZE * 0.012))
        paste_center(layered, shadow, y_shift=int(SIZE * 0.012))
        paste_center(layered, mark)
        items[idx] = (name, layered)

    _ = (white_z, ring_mark)  # ring_mark kept for future variants
    return items


def contact_sheet(items: list[tuple[str, Image.Image]], cols: int = 5) -> Image.Image:
    rows = math.ceil(len(items) / cols)
    cell = 360
    pad = 16
    label_h = 36
    sheet = Image.new("RGB", (cols * cell + pad * 2, rows * (cell + label_h) + pad * 2), (245, 240, 230))
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(items):
        r, c = divmod(i, cols)
        x = pad + c * cell
        y = pad + r * (cell + label_h)
        thumb = im.resize((cell - 12, cell - 12), Image.Resampling.LANCZOS).convert("RGB")
        sheet.paste(thumb, (x + 6, y + 6))
        title = name.split("-", 1)[1].replace("-", " ")
        draw.text((x + 10, y + cell - 2), f"{i + 1:02d}  {title}", fill=(70, 55, 30))
    return sheet


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    src = Image.open(SRC)
    gold = extract_gold(src)
    z, ring_mark = split_z_and_ring(gold)
    if z.getbbox() is None:
        raise SystemExit("Failed to extract the Z mark from app-icon-z-source.png")
    items = build(z, ring_mark)
    for name, im in items:
        path = OUT / f"{name}.png"
        im.convert("RGB").save(path, "PNG", optimize=True)
        print(path.name, im.size)
    sheet = contact_sheet(items)
    sheet_path = OUT / "_sheet.png"
    sheet.save(sheet_path, "PNG", optimize=True)
    print("sheet", sheet_path)


if __name__ == "__main__":
    main()
