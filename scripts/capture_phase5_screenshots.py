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

port_counter = 9340


async def run_capture(
    url: str,
    output_filename: str,
    width: int = 1280,
    height: int = 850,
    dark_mode: bool = False,
    is_authenticated: bool = True,
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
            raise RuntimeError(f"Could not connect to Chrome DevTools port {port}")

        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new", method="PUT")
        with urllib.request.urlopen(req, timeout=2) as r:
            target_data = json.loads(r.read().decode())
            page_ws_url = target_data.get("webSocketDebuggerUrl")

        async with websockets.connect(page_ws_url, max_size=25 * 1024 * 1024) as ws:
            msg_id = 1

            async def send_cmd(method, params=None):
                nonlocal msg_id
                cid = msg_id
                msg_id += 1
                await ws.send(json.dumps({"id": cid, "method": method, "params": params or {}}))
                while True:
                    res = json.loads(await ws.recv())
                    if res.get("id") == cid:
                        return res.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")
            await send_cmd(
                "Emulation.setDeviceMetricsOverride",
                {
                    "width": width,
                    "height": height,
                    "deviceScaleFactor": 1,
                    "mobile": width < 768,
                },
            )

            # Navigate to origin to set localStorage
            await send_cmd("Page.navigate", {"url": "http://localhost:5173"})
            await asyncio.sleep(0.6)

            theme_val = "dark" if dark_mode else "light"
            js_theme = f"""
            localStorage.setItem('theme', '{theme_val}');
            if ('{theme_val}' === 'dark') {{
                document.documentElement.classList.add('dark');
            }} else {{
                document.documentElement.classList.remove('dark');
            }}
            """
            if is_authenticated:
                user_str = json.dumps(json.dumps(SARAH_PROFILE))
                js_auth = f"""
                localStorage.setItem('pri_auth_token', '{SARAH_TOKEN}');
                localStorage.setItem('auth_token', '{SARAH_TOKEN}');
                localStorage.setItem('auth_user', {user_str});
                """
                await send_cmd("Runtime.evaluate", {"expression": js_theme + js_auth})
            else:
                await send_cmd("Runtime.evaluate", {"expression": js_theme})

            # Navigate to target URL
            await send_cmd("Page.navigate", {"url": url})
            await asyncio.sleep(1.8)

            # Execute any custom evaluation JS
            if eval_js:
                await send_cmd("Runtime.evaluate", {"expression": eval_js})
                await asyncio.sleep(1.5)

            # Extra rendering stabilization
            await asyncio.sleep(0.5)

            # Capture screenshot
            res = await send_cmd("Page.captureScreenshot", {"format": "png", "quality": 95})
            img_bytes = base64.b64decode(res.get("data", ""))

            os.makedirs(OUTPUT_DIR, exist_ok=True)
            out_path = os.path.join(OUTPUT_DIR, output_filename)
            with open(out_path, "wb") as f:
                f.write(img_bytes)
            print(f"Captured: {out_path} ({width}x{height})", flush=True)

            # Copy to artifact dir
            if os.path.exists(os.path.dirname(ARTIFACT_DIR)):
                os.makedirs(ARTIFACT_DIR, exist_ok=True)
                artifact_path = os.path.join(ARTIFACT_DIR, output_filename)
                shutil.copy2(out_path, artifact_path)
                print(f"Copied to artifact: {artifact_path}", flush=True)

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        shutil.rmtree(temp_dir, ignore_errors=True)


async def main():
    print("Capturing Phase 5 Developer Workspace, AI Lab & Benchmark Screenshots...", flush=True)

    # 1. Developer Workspace: System Health (Light & Dark)
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_developer_workspace_health_light.png",
        width=1280,
        height=850,
        dark_mode=False,
    )
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_developer_workspace_health_dark.png",
        width=1280,
        height=850,
        dark_mode=True,
    )

    # 2. AI Testing Lab Tab (Light & Dark)
    js_switch_lab = """
    const buttons = Array.from(document.querySelectorAll('button'));
    const labBtn = buttons.find(b => b.textContent.includes('AI Testing Lab'));
    if (labBtn) labBtn.click();
    """
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_ai_testing_lab_light.png",
        width=1280,
        height=900,
        dark_mode=False,
        eval_js=js_switch_lab,
    )
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_ai_testing_lab_dark.png",
        width=1280,
        height=900,
        dark_mode=True,
        eval_js=js_switch_lab,
    )

    # 3. AI Evaluation Benchmark Matrix Tab (Light & Dark)
    js_switch_bench = """
    const buttons = Array.from(document.querySelectorAll('button'));
    const benchBtn = buttons.find(b => b.textContent.includes('Benchmark Evaluation Matrix'));
    if (benchBtn) benchBtn.click();
    """
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_benchmark_matrix_light.png",
        width=1280,
        height=900,
        dark_mode=False,
        eval_js=js_switch_bench,
    )
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_benchmark_matrix_dark.png",
        width=1280,
        height=900,
        dark_mode=True,
        eval_js=js_switch_bench,
    )

    # 4. Synthetic Data Manager Tab (Light & Dark)
    js_switch_synthetic = """
    const buttons = Array.from(document.querySelectorAll('button'));
    const synBtn = buttons.find(b => b.textContent.includes('Synthetic Data Manager'));
    if (synBtn) synBtn.click();
    """
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_synthetic_data_manager_light.png",
        width=1280,
        height=850,
        dark_mode=False,
        eval_js=js_switch_synthetic,
    )
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_synthetic_data_manager_dark.png",
        width=1280,
        height=850,
        dark_mode=True,
        eval_js=js_switch_synthetic,
    )

    # 5. Responsive QA: Tablet (768px) & Mobile (390px)
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_responsive_tablet_dark.png",
        width=768,
        height=1024,
        dark_mode=True,
    )
    await run_capture(
        url="http://localhost:5173/developer",
        output_filename="phase5_responsive_mobile_light.png",
        width=390,
        height=844,
        dark_mode=False,
    )

    print("Phase 5 Screenshots capture complete!", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
