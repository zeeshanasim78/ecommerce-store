"""
Renders scripts/video/screen-change.html to the home-page repair video (SPECIFICATION.md §16).

Needs: Python Playwright with Chromium (`pip install playwright && python -m playwright install chromium`)
and ffmpeg. Run from the project root:  python3 scripts/video/render.py
Outputs public/media/screen-change.webm, .mp4 and .jpg (poster).
"""
import pathlib, shutil, subprocess, tempfile
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "scripts" / "video" / "screen-change.html"
OUT = ROOT / "public" / "media"
FPS, SECONDS = 30, 6

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    frames = pathlib.Path(tempfile.mkdtemp(prefix="caidea-frames-"))
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 720, "height": 900}, device_scale_factor=1)
        page.goto(SRC.as_uri())
        page.evaluate("document.fonts.ready")
        for i in range(FPS * SECONDS):
            page.evaluate(f"render({i / FPS})")
            page.screenshot(path=str(frames / f"{i:03d}.png"))
        browser.close()

    pattern = str(frames / "%03d.png")
    run = lambda *args: subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)
    run("-framerate", str(FPS), "-i", pattern, "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38", "-row-mt", "1", "-pix_fmt", "yuv420p", "-an", str(OUT / "screen-change.webm"))
    run("-framerate", str(FPS), "-i", pattern, "-c:v", "libx264", "-preset", "slow", "-crf", "26", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(OUT / "screen-change.mp4"))
    shutil.copy(frames / "165.png", OUT / "poster.png")
    run("-i", str(OUT / "poster.png"), "-q:v", "4", str(OUT / "screen-change.jpg"))
    (OUT / "poster.png").unlink()
    shutil.rmtree(frames)
    for f in ("screen-change.webm", "screen-change.mp4", "screen-change.jpg"):
        print(f, (OUT / f).stat().st_size // 1024, "KB")

if __name__ == "__main__":
    main()
