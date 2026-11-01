import asyncio
import base64
import json
import os
import shutil
import subprocess
import tempfile
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
VIEWPORTS = [320, 360, 390, 430, 600, 768, 1024, 1280, 1440, 1920]

PAGES = [
    ("home", "http://localhost:5173/"),
    ("login", "http://localhost:5173/login"),
    ("signup", "http://localhost:5173/signup"),
    ("forgot_password", "http://localhost:5173/forgot-password"),
    ("verify_email", "http://localhost:5173/verify-email?email=test%40example.com"),
]

async def run_captures():
    temp_dir = tempfile.mkdtemp()
    port = 9223
    proc = subprocess.Popen([
        CHROME_PATH,
        "--headless=new",
        f"--remote-debugging-port={port}",
        "--disable-gpu",
        "--no-sandbox",
        f"--user-data-dir={temp_dir}",
        "--hide-scrollbars",
        "about:blank"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        # Wait for debugging port
        for _ in range(30):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=1)
                break
            except Exception:
                await asyncio.sleep(0.1)

        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new", method="PUT")
        with urllib.request.urlopen(req, timeout=2) as r:
            page_data = json.loads(r.read().decode())
        page_ws = page_data["webSocketDebuggerUrl"]

        async with websockets.connect(page_ws, max_size=30 * 1024 * 1024) as ws:
            msg_id = 1
            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get("id") == cid:
                        return resp.get("result", {})

            await send_cmd("Page.enable")

            # 1. Capture Key Auth Pages across representative viewports (320, 390, 768, 1280, 1920) in Light & Dark
            key_viewports = [320, 390, 768, 1280, 1920]
            for page_name, url in PAGES:
                for vp in key_viewports:
                    for mode in ["light", "dark"]:
                        h = 800 if vp >= 768 else (844 if vp >= 390 else 640)
                        await send_cmd("Emulation.setDeviceMetricsOverride", {
                            "width": vp,
                            "height": h,
                            "deviceScaleFactor": 1,
                            "mobile": vp <= 600,
                        })
                        await send_cmd("Emulation.setEmulatedMedia", {
                            "features": [{"name": "prefers-color-scheme", "value": mode}]
                        })
                        await send_cmd("Page.navigate", {"url": url})
                        await asyncio.sleep(0.7)

                        res = await send_cmd("Page.captureScreenshot", {"format": "png"})
                        img_bytes = base64.b64decode(res["data"])
                        out_file = f"docs/screenshots/{page_name}_{vp}_{mode}.png"
                        os.makedirs(os.path.dirname(out_file), exist_ok=True)
                        with open(out_file, "wb") as f:
                            f.write(img_bytes)
                        print(f"Captured: {out_file}")

            # 2. Comprehensive Acceptance at all 10 viewports for Home and Login
            for vp in [360, 430, 600, 1024, 1440]:
                for page_name, url in [("home", "http://localhost:5173/"), ("login", "http://localhost:5173/login")]:
                    h = 800 if vp >= 768 else (844 if vp >= 390 else 640)
                    await send_cmd("Emulation.setDeviceMetricsOverride", {
                        "width": vp,
                        "height": h,
                        "deviceScaleFactor": 1,
                        "mobile": vp <= 600,
                    })
                    await send_cmd("Emulation.setEmulatedMedia", {
                        "features": [{"name": "prefers-color-scheme", "value": "dark"}]
                    })
                    await send_cmd("Page.navigate", {"url": url})
                    await asyncio.sleep(0.7)

                    res = await send_cmd("Page.captureScreenshot", {"format": "png"})
                    img_bytes = base64.b64decode(res["data"])
                    out_file = f"docs/screenshots/{page_name}_{vp}_dark.png"
                    with open(out_file, "wb") as f:
                        f.write(img_bytes)
                    print(f"Captured: {out_file}")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    asyncio.run(run_captures())

