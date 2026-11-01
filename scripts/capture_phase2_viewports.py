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
VIEWPORTS = [
    ("desktop", 1280, 850, False),
    ("tablet", 768, 850, False),
    ("mobile", 390, 844, True),
    ("mobile_narrow", 320, 640, True),
]

PAGES = [
    ("community_home", "http://localhost:5173/"),
    ("explore_products", "http://localhost:5173/explore"),
    ("product_detail", "http://localhost:5173/products/post_reflect_01"),
    ("discussion_detail", "http://localhost:5173/posts/post_reflect_01"),
    ("create_discussion", "http://localhost:5173/create"),
    ("my_activity", "http://localhost:5173/activity"),
]

async def run_captures():
    temp_dir = tempfile.mkdtemp()
    port = 9224
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

            # Warm up dev server
            await send_cmd("Page.navigate", {"url": "http://localhost:5173/"})
            await asyncio.sleep(1.5)

            for page_name, url in PAGES:
                for vp_label, vp_width, vp_height, is_mobile in VIEWPORTS:
                    for mode in ["light", "dark"]:
                        await send_cmd("Emulation.setDeviceMetricsOverride", {
                            "width": vp_width,
                            "height": vp_height,
                            "deviceScaleFactor": 1,
                            "mobile": is_mobile,
                        })
                        await send_cmd("Emulation.setEmulatedMedia", {
                            "features": [{"name": "prefers-color-scheme", "value": mode}]
                        })
                        await send_cmd("Page.navigate", {"url": url})
                        await asyncio.sleep(0.8)

                        # Set theme in localStorage and DOM
                        script = f"""
                            document.documentElement.classList.toggle('dark', '{mode}' === 'dark');
                            document.documentElement.setAttribute('data-theme', '{mode}');
                            document.documentElement.style.colorScheme = '{mode}';
                            localStorage.setItem('theme', '{mode}');
                        """
                        await send_cmd("Runtime.evaluate", {"expression": script})
                        await asyncio.sleep(0.3)

                        res = await send_cmd("Page.captureScreenshot", {"format": "png"})
                        img_bytes = base64.b64decode(res["data"])
                        out_file = f"docs/screenshots/phase2_{page_name}_{vp_label}_{mode}.png"
                        os.makedirs(os.path.dirname(out_file), exist_ok=True)
                        with open(out_file, "wb") as f:
                            f.write(img_bytes)
                        print(f"Captured: {out_file} ({len(img_bytes)} bytes)")

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    asyncio.run(run_captures())

