#!/usr/bin/env python3
"""Play Store icon, feature graphic, and phone screenshots. Run from repo."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = Path(__file__).resolve().parent
SHOTS = OUT / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)

CREAM = (251, 246, 236)
FOREST = (15, 61, 36)
INK = (25, 20, 15)
GOLD = (201, 162, 39)
SOFT = (238, 232, 220)


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def cover(src, size):
    im = Image.open(src).convert("RGB")
    iw, ih = im.size
    tw, th = size
    scale = max(tw / iw, th / ih)
    im = im.resize((int(iw * scale), int(ih * scale)), Image.Resampling.LANCZOS)
    left = (im.width - tw) // 2
    top = (im.height - th) // 2
    return im.crop((left, top, left + tw, top + th))


def icon_512():
    src = ASSETS / "app-icon-dark.png"
    im = Image.open(src).convert("RGB").resize((512, 512), Image.Resampling.LANCZOS)
    im.save(OUT / "icon-512.png", "PNG")
    print("icon-512.png")


def feature_1024():
    canvas = Image.new("RGB", (1024, 500), FOREST)
    draw = ImageDraw.Draw(canvas)
    mark = Image.open(ASSETS / "splash-mark-dark.png").convert("RGBA")
    mark.thumbnail((280, 280), Image.Resampling.LANCZOS)
    canvas.paste(mark, (70, (500 - mark.height) // 2), mark)
    draw.text((400, 150), "Zeevan", font=font(72, True), fill=CREAM)
    draw.text((400, 250), "Ghee  |  Tel  |  Masala  |  Honey", font=font(28), fill=GOLD)
    draw.text((400, 310), "Pure heritage, delivered.", font=font(24), fill=SOFT)
    canvas.save(OUT / "feature-graphic-1024x500.png", "PNG")
    print("feature-graphic-1024x500.png")


def shot(name, photo, kicker, title, line):
    w, h = 1080, 1920
    canvas = Image.new("RGB", (w, h), CREAM)
    hero = cover(photo, (1080, 1180)).filter(ImageFilter.GaussianBlur(0.4))
    canvas.paste(hero, (0, 0))
    fade = Image.new("RGBA", (w, 420), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fade)
    for i in range(420):
        a = int(220 * (i / 419))
        fd.line([(0, i), (w, i)], fill=(15, 61, 36, a))
    canvas.paste(Image.alpha_composite(canvas.convert("RGBA"), Image.new("RGBA", (w, h), (0, 0, 0, 0))), (0, 0))
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(380):
        a = int(200 * (i / 379))
        od.line([(0, 1180 - 380 + i), (w, 1180 - 380 + i)], fill=(15, 61, 36, a))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 1180, w, h), fill=CREAM)
    y = 1260
    draw.text((72, 1088), kicker, font=font(28, True), fill=GOLD)
    draw.text((72, y), title, font=font(64, True), fill=INK)
    for i, row in enumerate(line.split("\n")):
        draw.text((72, 1388 + i * 48), row, font=font(32), fill=(90, 74, 58))
    draw.text((72, 1780), "Zeevan", font=font(28, True), fill=FOREST)
    canvas.save(SHOTS / name, "PNG")
    print(name)


def main():
    icon_512()
    feature_1024()
    shot("01-home.png", ASSETS / "zeevan-ghee-packaging-hero.png", "FARM SHOP", "Zeevan", "Ghee, tel, masala & honey\nfrom our Gujarat farm.")
    shot("02-ghee.png", ASSETS / "zeevan-a2-desi-cow-ghee.jpg", "A2 BILONA", "Desi cow ghee", "Slow-churned. Honest labels.")
    shot("03-tel.png", ASSETS / "zeevan-tel-product.jpg", "COLD PRESSED", "Wood-pressed tel", "Daily oils, the old way.")
    shot("04-masala.png", ASSETS / "zeevan-masala-product.jpg", "SPICE RACK", "Fresh masala", "Ground in small batches.")
    shot("05-honey.png", ASSETS / "zeevan-honey-product.jpg", "WILD", "Haldar honey", "From flower to jar.")
    shot("06-delivery.png", ASSETS / "trust/gujarat.jpg", "DELIVERY", "To your door", "Live tracking. Farm to home.")
    print("done", OUT)


if __name__ == "__main__":
    main()
