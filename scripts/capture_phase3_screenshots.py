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

SARAH_TOKEN = create_access_token("usr_sarah_chen", "sarah.chen@example.com", "sarahc")
SARAH_PROFILE = community_repo.get_profile("usr_sarah_chen")

async def run_capture(
    url: str,
    output_filename: str,
    width: int = 1280,
    height: int = 850,
    dark_mode: bool = False,
    is_authenticated: bool = True,
    click_selector: str = None,
    mobile: bool = False,
):
    temp_dir = tempfile.mkdtemp()
    port = 9333
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
            await send_cmd("Runtime.enable")
            await send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": height,
                "deviceScaleFactor": 1,
                "mobile": mobile,
            })
            theme_val = "dark" if dark_mode else "light"
            await send_cmd("Emulation.setEmulatedMedia", {
                "features": [{"name": "prefers-color-scheme", "value": theme_val}]
            })

            # First navigate to origin to set localStorage
            await send_cmd("Page.navigate", {"url": "http://localhost:5173"})
            await asyncio.sleep(0.5)

            # Set localStorage items
            if is_authenticated:
                user_json_str = json.dumps(json.dumps(SARAH_PROFILE))
                await send_cmd("Runtime.evaluate", {
                    "expression": f"""
                        localStorage.setItem('auth_token', '{SARAH_TOKEN}');
                        localStorage.setItem('auth_user', {user_json_str});
                        localStorage.setItem('theme', '{theme_val}');
                        document.documentElement.classList.toggle('dark', {str(dark_mode).lower()});
                    """
                })
            else:
                await send_cmd("Runtime.evaluate", {
                    "expression": f"""
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_user');
                        localStorage.setItem('theme', '{theme_val}');
                        document.documentElement.classList.toggle('dark', {str(dark_mode).lower()});
                    """
                })

            # Navigate to target URL
            await send_cmd("Page.navigate", {"url": url})
            await asyncio.sleep(1.8)

            # Optional DOM click (e.g. click citation chip or preview button)
            if click_selector:
                await send_cmd("Runtime.evaluate", {
                    "expression": f"""
                        (() => {{
                            const el = document.querySelector('{click_selector}');
                            if (el) el.click();
                        }})();
                    """
                })
                await asyncio.sleep(0.8)

            res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            img_bytes = base64.b64decode(res["data"])

            local_path = os.path.join(OUTPUT_DIR, output_filename)
            os.makedirs(os.path.dirname(os.path.abspath(local_path)), exist_ok=True)
            with open(local_path, "wb") as f:
                f.write(img_bytes)

            artifact_path = os.path.join(ARTIFACT_DIR, output_filename)
            os.makedirs(os.path.dirname(os.path.abspath(artifact_path)), exist_ok=True)
            with open(artifact_path, "wb") as f:
                f.write(img_bytes)

            print(f"Captured: {output_filename} ({len(img_bytes)} bytes)")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)

async def main():
    studio_url = "http://localhost:5173/posts/post_reflect_01?tab=insights"
    public_url = "http://localhost:5173/posts/post_reflect_01"

    print("--- 1. Desktop 3-Pane Creator Studio (1280x850) ---")
    await run_capture(studio_url, "phase3_studio_desktop_light.png", width=1280, height=850, dark_mode=False)
    await run_capture(studio_url, "phase3_studio_desktop_dark.png", width=1280, height=850, dark_mode=True)

    print("--- 2. Desktop Inspected Document Citation (Click [D-1]) ---")
    await run_capture(
        studio_url,
        "phase3_studio_inspected_doc_citation_light.png",
        width=1280,
        height=850,
        dark_mode=False,
        click_selector="button:has(svg.lucide-quote)"
    )
    await run_capture(
        studio_url,
        "phase3_studio_inspected_doc_citation_dark.png",
        width=1280,
        height=850,
        dark_mode=True,
        click_selector="button:has(svg.lucide-quote)"
    )

    print("--- 3. Document Preview Modal (Multi-page PDF) ---")
    await run_capture(
        studio_url,
        "phase3_document_preview_modal_light.png",
        width=1280,
        height=850,
        dark_mode=False,
        click_selector="button[title='Preview extracted text']"
    )
    await run_capture(
        studio_url,
        "phase3_document_preview_modal_dark.png",
        width=1280,
        height=850,
        dark_mode=True,
        click_selector="button[title='Preview extracted text']"
    )

    print("--- 4. Tablet 2-Pane Arrangement (768x1024) ---")
    await run_capture(studio_url, "phase3_studio_tablet_light.png", width=768, height=1024, dark_mode=False)
    await run_capture(studio_url, "phase3_studio_tablet_dark.png", width=768, height=1024, dark_mode=True)

    print("--- 5. Mobile Single-Pane with Segmented Navigation (390x844) ---")
    # Conversation Pane (Default)
    await run_capture(studio_url, "phase3_studio_mobile_conversation_light.png", width=390, height=844, dark_mode=False, mobile=True)
    await run_capture(studio_url, "phase3_studio_mobile_conversation_dark.png", width=390, height=844, dark_mode=True, mobile=True)

    # Sources Pane
    await run_capture(
        studio_url,
        "phase3_studio_mobile_sources_light.png",
        width=390,
        height=844,
        dark_mode=False,
        mobile=True,
        click_selector="button:nth-child(1)"
    )

    # Evidence Inspector Pane
    await run_capture(
        studio_url,
        "phase3_studio_mobile_inspector_light.png",
        width=390,
        height=844,
        dark_mode=False,
        mobile=True,
        click_selector="button:nth-child(3)"
    )

    print("--- 6. Public Visitor Privacy Isolation (1280x850) ---")
    # Unauthenticated visitor seeing post -> NO creator research dock, NO private tabs, NO doc counts
    await run_capture(public_url, "phase3_public_visitor_no_studio_light.png", width=1280, height=850, dark_mode=False, is_authenticated=False)
    await run_capture(public_url, "phase3_public_visitor_no_studio_dark.png", width=1280, height=850, dark_mode=True, is_authenticated=False)

    print("All Phase 3 screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(main())

