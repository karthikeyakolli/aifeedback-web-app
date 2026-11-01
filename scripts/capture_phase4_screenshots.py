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
    eval_js: str = None,
):
    temp_dir = tempfile.mkdtemp()
    port = 9334
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
            await asyncio.sleep(2.0)

            # Optional DOM evaluation
            if eval_js:
                await send_cmd("Runtime.evaluate", {"expression": eval_js})
                await asyncio.sleep(1.0)

            # Optional DOM click
            if click_selector:
                await send_cmd("Runtime.evaluate", {
                    "expression": f"""
                        (() => {{
                            const el = document.querySelector('{click_selector}');
                            if (el) el.click();
                        }})();
                    """
                })
                await asyncio.sleep(1.0)

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

    # Seed structured research exchange into session cs_f8f64b39f548 so the screenshot shows all Section 5 output cards
    with community_repo.db.session() as conn:
        assistant_meta = json.dumps({
            "direct_answer": "Analysis indicates user excitement around rapid reflection capabilities, alongside urgent requests for explicit CLI handover docs and offline cache resilience.",
            "executive_summary": "Community consensus confirms strong product-market fit for core telemetry, while attached documentation reveals an unverified assumption regarding automated failover.",
            "key_findings": [
                "Reviewers praise clean API boundaries but report connection drops during network handover.",
                "Attached PRD emphasizes enterprise security but omits quickstart setup parameters.",
                "Contributors request structured telemetry export and webhook integration."
            ],
            "cross_source_comparison": {
                "agreement": ["Both feedback and specs prioritize low-latency WebSocket streaming."],
                "contradiction": ["Specs assume self-explanatory CLI parameters, while reviews cite confusion."],
                "missingDocumentation": ["Distributed topology failover is absent from uploaded docs."],
                "unverifiedAssumptions": ["Whitepaper assumes zero dropped frames under mobile network loss."]
            },
            "recommendations": [
                {
                    "action": "Publish comprehensive CLI Quickstart Guide",
                    "reason": "Resolves frequent user confusion during setup",
                    "evidence": "cmt_003",
                    "applicability": "all developers",
                    "suggestedSuccessMeasure": ">45% reduction in onboarding support queries",
                    "missingInformation": "User breakdown across Linux vs macOS"
                },
                {
                    "action": "Implement exponential backoff on WebSocket handover",
                    "reason": "Eliminates connection resets reported in cellular benchmarks",
                    "evidence": "reflect_whitepaper_v2.pdf",
                    "applicability": "mobile clients",
                    "suggestedSuccessMeasure": "Zero socket resets on handover",
                    "missingInformation": "Optimal initial retry timeout"
                }
            ],
            "limitations": "Synthesis is grounded in 4 verified comments and 2 attached project documents. Quantitative telemetry verification recommended.",
            "suggested_follow_ups": [
                "Which comments discuss missing CLI parameters?",
                "What is the estimated engineering complexity for backoff retry?",
                "Prepare an improvement roadmap for next sprint."
            ]
        })
        conn.execute(
            """UPDATE conversation_messages 
               SET metadata = ?, content = ?
               WHERE session_id = 'cs_f8f64b39f548' AND role = 'assistant'""",
            (assistant_meta, "Analysis indicates user excitement around rapid reflection capabilities, alongside urgent requests for explicit CLI handover docs and offline cache resilience.")
        )

    print("--- 1. Desktop 3-Pane Research Workflow & Structured Answer (1280x850) ---")
    await run_capture(studio_url, "phase4_research_workflow_desktop_light.png", width=1280, height=850, dark_mode=False)
    await run_capture(studio_url, "phase4_research_workflow_desktop_dark.png", width=1280, height=850, dark_mode=True)

    print("--- 2. Desktop Deliverables Studio (PRD & PDF Export) ---")
    await run_capture(
        studio_url,
        "phase4_deliverables_studio_light.png",
        width=1280,
        height=850,
        dark_mode=False,
        eval_js="""
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Deliverables Studio'));
                if (btn) btn.click();
            })();
        """
    )
    await run_capture(
        studio_url,
        "phase4_deliverables_studio_dark.png",
        width=1280,
        height=850,
        dark_mode=True,
        eval_js="""
            (() => {
                const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Deliverables Studio'));
                if (btn) btn.click();
            })();
        """
    )

    print("--- 3. Tablet Responsive View (768x1024) ---")
    await run_capture(studio_url, "phase4_research_tablet_light.png", width=768, height=1024, dark_mode=False)
    await run_capture(studio_url, "phase4_research_tablet_dark.png", width=768, height=1024, dark_mode=True)

    print("--- 4. Mobile Responsive View (390x844) ---")
    await run_capture(studio_url, "phase4_research_mobile_conversation_light.png", width=390, height=844, dark_mode=False, mobile=True)
    await run_capture(studio_url, "phase4_research_mobile_conversation_dark.png", width=390, height=844, dark_mode=True, mobile=True)

    print("All Phase 4 screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(main())

