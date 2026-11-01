import asyncio
import base64
import json
import os
import shutil
import subprocess
import tempfile
import urllib.request
import websockets
from backend.app.services.auth_service import create_access_token
from backend.app.db.repository import community_repo

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"docs\screenshots"
ARTIFACT_DIR = r"C:\Users\OMEN\.gemini\antigravity\brain\22039a5b-f036-4ec2-a561-3a0265d31049\screenshots"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

SARAH_TOKEN = create_access_token("usr_sarah_chen", "sarah.chen@example.com", "sarahc")
SARAH_PROFILE = community_repo.get_profile("usr_sarah_chen")

port_counter = 9480


async def run_capture(
    url: str,
    output_filename: str,
    width: int = 1280,
    height: int = 850,
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

            # Navigate to target
            await send_cmd("Page.navigate", {"url": url})
            await asyncio.sleep(1.0)

            # Inject Sarah's session token and theme into localStorage
            theme_val = "dark" if dark_mode else "light"
            user_json = json.dumps(SARAH_PROFILE) if SARAH_PROFILE else "{}"
            inject_script = f"""
                localStorage.setItem('pri_auth_token', '{SARAH_TOKEN}');
                localStorage.setItem('pri_auth_user', JSON.stringify({user_json}));
                localStorage.setItem('pri_theme', '{theme_val}');
                if ({str(dark_mode).lower()}) {{
                    document.documentElement.classList.add('dark');
                }} else {{
                    document.documentElement.classList.remove('dark');
                }}
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_script})

            # Reload to load session
            await send_cmd("Page.reload")
            await asyncio.sleep(2.0)

            # If additional JS is needed
            if eval_js:
                await send_cmd("Runtime.evaluate", {"expression": eval_js})
                await asyncio.sleep(1.0)

            # Ensure theme is correct
            theme_check = f"""
                if ({str(dark_mode).lower()}) {{
                    document.documentElement.classList.add('dark');
                }} else {{
                    document.documentElement.classList.remove('dark');
                }}
            """
            await send_cmd("Runtime.evaluate", {"expression": theme_check})
            await asyncio.sleep(0.5)

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
            proc.wait(timeout=1)
        except Exception:
            proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)


async def main():
    target_url = "http://localhost:5173/posts/post_reflect_01?tab=insights"

    # 1. Full Review Report Light
    await run_capture(target_url, "final_review_report_light.png", width=1280, height=850, dark_mode=False)

    # 2. Full Review Report Dark
    await run_capture(target_url, "final_review_report_dark.png", width=1280, height=850, dark_mode=True)

    # 3. Review-Linked Chat Light (click chat tab)
    click_chat_js = """
        const btns = Array.from(document.querySelectorAll('button'));
        const chatBtn = btns.find(b => b.textContent && b.textContent.includes('Review-Linked Chat'));
        if (chatBtn) chatBtn.click();
    """
    await run_capture(target_url, "final_review_chat_light.png", width=1280, height=850, dark_mode=False, eval_js=click_chat_js)

    # 4. Review-Linked Chat Dark
    await run_capture(target_url, "final_review_chat_dark.png", width=1280, height=850, dark_mode=True, eval_js=click_chat_js)


if __name__ == "__main__":
    asyncio.run(main())

