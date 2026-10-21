"""Generate PWA/iOS icons: stacked boxes on white tile with violet->cyan gradient."""
from PIL import Image, ImageDraw
import os
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
BG = (255, 255, 255, 255)
def grad(S):
    g = Image.new('RGBA', (S, S)); px = g.load()
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * S); px[x, y] = (int(124 + (6 - 124) * t), int(58 + (182 - 58) * t), int(237 + (212 - 237) * t), 255)
    return g
def icon(size, mode):
    S = 256; im = Image.new('RGBA', (S, S), BG if mode != 'any' else (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if mode == 'any': d.rounded_rectangle([0, 0, S - 1, S - 1], radius=56, fill=BG)
    k = .62 if mode == 'maskable' else .8; o = S * (1 - k) / 2; u = S * k / 10
    m = Image.new('L', (S, S), 0); md = ImageDraw.Draw(m)
    for (x, y) in [(1, 5.2), (5.2, 5.2), (3.1, 1.2)]:
        md.rounded_rectangle([o + x * u, o + y * u, o + (x + 3.8) * u, o + (y + 3.6) * u], radius=int(u * .6), fill=255)
    im.paste(grad(S), (0, 0), m)
    for (x, y) in [(1, 5.2), (5.2, 5.2), (3.1, 1.2)]:
        d.rectangle([o + (x + 1.6) * u, o + y * u, o + (x + 2.2) * u, o + (y + 1.3) * u], fill=BG)
    return im.resize((size, size), Image.LANCZOS)
os.makedirs(OUT, exist_ok=True)
icon(192, 'any').save(f'{OUT}/icon-192.png'); icon(512, 'any').save(f'{OUT}/icon-512.png')
icon(512, 'maskable').save(f'{OUT}/icon-maskable-512.png'); icon(180, 'apple').convert('RGB').save(f'{OUT}/apple-touch-icon.png')
icon(32, 'any').save(f'{OUT}/favicon-32.png'); print('ok')
