#!/usr/bin/env python3
"""Pack generated + real captures into Play-ready 4K screenshots and feature graphics."""
from pathlib import Path
from PIL import Image

ASSETS = Path("/Users/kuldip/.cursor/projects/Users-kuldip-zeevanwebandapp/assets")
REAL = Path("/var/folders/ry/0xx0tvpd48d_tzn5kdrn93pw0000gn/T/cursor/screenshots")
OUT = Path(__file__).resolve().parent
SHOTS = OUT / "screenshots"
SHOTS_4K = OUT / "screenshots-4k"
SHOTS.mkdir(exist_ok=True)
SHOTS_4K.mkdir(exist_ok=True)

PHONE = (2160, 3840)  # 4K portrait, Play max 3840
FEATURE_PLAY = (1024, 500)
FEATURE_4K = (4096, 2000)

SCREENS = [
    ("01-home.png", ASSETS / "zeevan-screen-home.jpg"),
    ("02-shop.png", ASSETS / "zeevan-screen-shop.jpg"),
    ("03-product.png", ASSETS / "zeevan-screen-product.jpg"),
    ("04-cart.png", ASSETS / "zeevan-screen-cart.jpg"),
    ("05-profile.png", ASSETS / "zeevan-screen-profile.jpg"),
    ("06-orders.png", ASSETS / "zeevan-screen-orders.jpg"),
    ("07-login.png", ASSETS / "zeevan-screen-login.jpg"),
    ("08-about.png", ASSETS / "zeevan-screen-about.jpg"),
    ("09-wishlist.png", ASSETS / "zeevan-screen-wishlist.jpg"),
]

REAL_HOME = REAL / "real-home.png"


def fit(im, size, fill=(251, 246, 236)):
    tw, th = size
    canvas = Image.new("RGB", size, fill)
    src = im.convert("RGB")
    scale = min(tw / src.width, th / src.height)
    nw, nh = max(1, int(src.width * scale)), max(1, int(src.height * scale))
    src = src.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas.paste(src, ((tw - nw) // 2, (th - nh) // 2))
    return canvas


def cover(im, size):
    src = im.convert("RGB")
    tw, th = size
    scale = max(tw / src.width, th / src.height)
    nw, nh = int(src.width * scale), int(src.height * scale)
    src = src.resize((nw, nh), Image.Resampling.LANCZOS)
    left, top = (nw - tw) // 2, (nh - th) // 2
    return src.crop((left, top, left + tw, top + th))


def main():
    feat = Image.open(ASSETS / "zeevan-feature-graphic-4k.jpg")
    cover(feat, FEATURE_4K).save(OUT / "feature-graphic-4k.png", "PNG", optimize=True)
    cover(feat, FEATURE_PLAY).save(OUT / "feature-graphic-1024x500.png", "PNG", optimize=True)
    print("feature-graphic-4k.png", FEATURE_4K)
    print("feature-graphic-1024x500.png", FEATURE_PLAY)

    if REAL_HOME.exists():
        raw = Image.open(REAL_HOME)
        fit(raw, PHONE).save(SHOTS_4K / "00-real-home-web.png", "PNG")
        fit(raw, (1080, 1920)).save(SHOTS / "00-real-home-web.png", "PNG")
        print("00-real-home-web.png")

    for name, src in SCREENS:
        if not src.exists():
            print("missing", src)
            continue
        im = Image.open(src)
        four = cover(im, PHONE)
        four.save(SHOTS_4K / name, "PNG")
        cover(im, (1080, 1920)).save(SHOTS / name, "PNG")
        print(name, four.size)

    print("done", SHOTS, SHOTS_4K)


if __name__ == "__main__":
    main()
