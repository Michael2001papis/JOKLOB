"""Generate PWA PNG icons from the SVG-like mark."""
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("pip install pillow")

out = Path(__file__).resolve().parents[1] / "frontend" / "public"
out.mkdir(parents=True, exist_ok=True)

def icon(size: int, path: Path):
    img = Image.new("RGBA", (size, size), (7, 11, 22, 255))
    d = ImageDraw.Draw(img)
    m = int(size * 0.12)
    d.rounded_rectangle([m, m, size - m, size - m], radius=size // 6, outline=(126, 231, 255, 255), width=max(3, size // 48))
    d.ellipse([size * 0.22, size * 0.22, size * 0.78, size * 0.78], outline=(179, 136, 255, 255), width=max(3, size // 42))
    try:
        font = ImageFont.truetype("arial.ttf", size // 3)
    except Exception:
        font = ImageFont.load_default()
    d.text((size // 2, size // 2), "∫", fill=(232, 241, 255, 255), font=font, anchor="mm")
    img.save(path)

icon(192, out / "icon-192.png")
icon(512, out / "icon-512.png")
print("icons written", out)
