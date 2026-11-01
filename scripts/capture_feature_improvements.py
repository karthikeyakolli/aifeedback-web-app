import asyncio
import base64
import json
import os
import sys
import shutil
import subprocess
import tempfile
import urllib.request
import websockets

sys.path.insert(0, os.path.abspath("."))

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"docs\screenshots"
ARTIFACT_DIR = r"C:\Users\OMEN\.gemini\antigravity\brain\22039a5b-f036-4ec2-a561-3a0265d31049\screenshots"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

port_counter = 9910


async def capture_page(
    target_url: str,
    output_filename: str,
    width: int = 1440,
    height: int = 900,
    dark_mode: bool = True,
    setup_js: str = None,
):
    global port_counter
    port_counter += 1
    port = port_counter

    temp_dir = tempfile.mkdtemp()
    proc = subprocess.Popen(
        [
            CHROME_PATH,
            "--headless=new",
            f"--remote-debugging-port={port}",
            "--disable-gpu",
            "--no-sandbox",
            f"--user-data-dir={temp_dir}",
            "--hide-scrollbars",
            "about:blank",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    try:
        ws_url = None
        for _ in range(40):
            try:
                req = urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=1)
                data = json.loads(req.read().decode())
                ws_url = data.get("webSocketDebuggerUrl")
                if ws_url:
                    break
            except Exception:
                await asyncio.sleep(0.1)

        if not ws_url:
            raise RuntimeError("Could not connect to Chrome DevTools port")

        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new", method="PUT")
        with urllib.request.urlopen(req, timeout=2) as r:
            page_data = json.loads(r.read().decode())
        page_ws = page_data["webSocketDebuggerUrl"]

        async with websockets.connect(page_ws, max_size=25 * 1024 * 1024) as ws:
            mid = 0

            async def send_cmd(method, params=None):
                nonlocal mid
                mid += 1
                payload = {"id": mid, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == mid:
                        return resp.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1.5,
                "mobile": False,
            })

            # Login as Sarah Chen
            await send_cmd("Page.navigate", {"url": "http://localhost:5173/login"})
            await asyncio.sleep(1.5)

            click_demo_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const demoBtn = btns.find(b => b.textContent && b.textContent.includes('Sarah Chen'));
                    if (demoBtn) demoBtn.click();
                })()
            """
            await send_cmd("Runtime.evaluate", {"expression": click_demo_js})
            await asyncio.sleep(2.0)

            # Navigate to target URL
            await send_cmd("Runtime.evaluate", {
                "expression": f'window.location.href = "{target_url}"'
            })
            await asyncio.sleep(3.0)

            # Theme setup
            theme_val = "dark" if dark_mode else "light"
            theme_js = f"""
                localStorage.setItem('theme', '{theme_val}');
                localStorage.setItem('pri_theme', '{theme_val}');
                if ('{theme_val}' === 'dark') {{
                    document.documentElement.classList.add('dark');
                }} else {{
                    document.documentElement.classList.remove('dark');
                }}
            """
            await send_cmd("Runtime.evaluate", {"expression": theme_js})
            await asyncio.sleep(0.5)

            # Execute custom setup JS
            if setup_js:
                await send_cmd("Runtime.evaluate", {"expression": setup_js})
                await asyncio.sleep(1.2)

            # Capture screenshot
            shot_res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            img_data = base64.b64decode(shot_res["data"])

            out_path1 = os.path.join(OUTPUT_DIR, output_filename)
            with open(out_path1, "wb") as f:
                f.write(img_data)

            out_path2 = os.path.join(ARTIFACT_DIR, output_filename)
            with open(out_path2, "wb") as f:
                f.write(img_data)

            print(f"Captured {output_filename} successfully ({len(img_data)} bytes)")

    finally:
        proc.terminate()
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass


async def main():
    print("--- Capturing Feature Improvements Screenshots ---")

    # 1. Audio Briefing Overview Player (Dark Mode)
    js_audio = """
        (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const audioBtn = btns.find(b => b.textContent && b.textContent.includes('Audio Overview'));
            if (audioBtn) audioBtn.click();
        })()
    """
    await capture_page(
        target_url="/posts/post_reflect_01?tab=insights",
        output_filename="feature_audio_briefing_dark.png",
        dark_mode=True,
        setup_js=js_audio,
    )

    # 2. Global Keyboard Command Palette (Dark Mode)
    js_cmd = """
        (() => {
            // Trigger command palette button in header
            const searchBtn = document.querySelector('header button');
            if (searchBtn) searchBtn.click();
        })()
    """
    await capture_page(
        target_url="/explore",
        output_filename="feature_command_palette_dark.png",
        dark_mode=True,
        setup_js=js_cmd,
    )

    # 3. Rich Comment Composer with Markdown Preview (Dark Mode)
    js_comment = """
        (() => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.value = "### Thorough Evaluation\\n\\nTested the latest release of **ReflectAI**. Key observations:\\n- **Latency**: Very snappy retrieval (< 250ms)\\n- **Citation Accuracy**: Every finding traces to an uploaded PDF\\n\\n> *Recommendation*: Consider adding batch export for Linear.";
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
            // Switch to Preview tab
            const btns = Array.from(document.querySelectorAll('button'));
            const previewBtn = btns.find(b => b.textContent && b.textContent.includes('Preview'));
            if (previewBtn) previewBtn.click();
        })()
    """
    await capture_page(
        target_url="/posts/post_reflect_01",
        output_filename="feature_comment_markdown_preview.png",
        dark_mode=True,
        setup_js=js_comment,
    )

    # 4. Evolution Diff View (V1 vs V2 Milestone Comparison)
    js_diff = """
        (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const diffBtn = btns.find(b => b.textContent && b.textContent.includes('Evolution Diff'));
            if (diffBtn) diffBtn.click();
        })()
    """
    await capture_page(
        target_url="/posts/post_reflect_01?tab=insights",
        output_filename="feature_evolution_diff_dark.png",
        dark_mode=True,
        setup_js=js_diff,
    )

    print("All feature screenshots captured successfully!")


if __name__ == "__main__":
    asyncio.run(main())
