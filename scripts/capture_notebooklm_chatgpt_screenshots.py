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

port_counter = 9800


async def capture_studio_experience(
    output_filename: str,
    width: int = 1440,
    height: int = 900,
    dark_mode: bool = False,
    eval_js: str = None,
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

            # 1. Navigate to /login to log in Sarah Chen
            await send_cmd("Page.navigate", {"url": "http://localhost:5173/login"})
            await asyncio.sleep(1.5)

            # Click demo login button
            click_demo_js = """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const demoBtn = btns.find(b => b.textContent && b.textContent.includes('Sarah Chen'));
                    if (demoBtn) {
                        demoBtn.click();
                        return 'clicked';
                    }
                    return 'not found';
                })()
            """
            await send_cmd("Runtime.evaluate", {"expression": click_demo_js})
            await asyncio.sleep(2.0)

            # Set theme
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

            # 2. Navigate to Research Studio (tab=insights)
            await send_cmd("Runtime.evaluate", {
                "expression": 'window.location.href = "/posts/post_reflect_01?tab=insights"'
            })
            await asyncio.sleep(3.0)

            # Re-ensure theme class
            await send_cmd("Runtime.evaluate", {"expression": theme_js})
            await asyncio.sleep(0.5)

            # If additional JS is needed
            if eval_js:
                await send_cmd("Runtime.evaluate", {"expression": eval_js})
                await asyncio.sleep(1.0)

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
    print("--- Capturing Authenticated NotebookLM + ChatGPT Interface Screenshots ---")

    # 1. 3-Column NotebookLM Interface (Light Mode)
    await capture_studio_experience(
        output_filename="notebooklm_chatgpt_workspace_light.png",
        width=1440,
        height=900,
        dark_mode=False,
    )

    # 2. 3-Column NotebookLM Interface (Dark Mode)
    await capture_studio_experience(
        output_filename="notebooklm_chatgpt_workspace_dark.png",
        width=1440,
        height=900,
        dark_mode=True,
    )

    # 3. Studio Notes View (Dark Mode)
    eval_switch_notes = """
        (() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const notesBtn = btns.find(b => b.textContent && b.textContent.includes('Studio Notes'));
            if (notesBtn) notesBtn.click();
        })()
    """
    await capture_studio_experience(
        output_filename="notebooklm_studio_notes_dark.png",
        width=1440,
        height=900,
        dark_mode=True,
        eval_js=eval_switch_notes,
    )

    print("All captures completed.")


if __name__ == "__main__":
    asyncio.run(main())
