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

async def capture(url: str, output_path: str, width: int = 1280, height: int = 800, dark_mode: bool = False):
    temp_dir = tempfile.mkdtemp()
    port = 9222
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
        ws_url = None
        for _ in range(30):
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

        # Get existing target or create new one
        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new", method="PUT")
        with urllib.request.urlopen(req, timeout=2) as r:
            page_data = json.loads(r.read().decode())
        page_ws = page_data["webSocketDebuggerUrl"]

        async with websockets.connect(page_ws, max_size=20 * 1024 * 1024) as ws:
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
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": width <= 600,
            })
            if dark_mode:
                await send_cmd("Emulation.setEmulatedMedia", {
                    "features": [{"name": "prefers-color-scheme", "value": "dark"}]
                })
            else:
                await send_cmd("Emulation.setEmulatedMedia", {
                    "features": [{"name": "prefers-color-scheme", "value": "light"}]
                })

            await send_cmd("Page.navigate", {"url": url})
            # Wait for render
            await asyncio.sleep(1.2)

            res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            img_bytes = base64.b64decode(res["data"])
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(img_bytes)
            print(f"Captured: {output_path} ({len(img_bytes)} bytes)")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    asyncio.run(capture("http://localhost:5173", "docs/screenshots/baseline_home_1280.png", width=1280, height=800, dark_mode=False))
