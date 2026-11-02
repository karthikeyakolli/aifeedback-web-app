---
name: custom-login-test
description: Automated web testing playbook for user authentication and dashboard verification using the agent-browser CLI.
triggers:
  - test login
  - web test login
  - agent-browser login test
  - verify login dashboard
  - e2e authentication test
allowed-tools: Bash(agent-browser:*), Bash(npx agent-browser:*), Bash(cmd.exe /c npx.cmd agent-browser:*)
---

# Custom Login & Dashboard Web Test Playbook

This skill automates end-to-end web testing of the user authentication flow and dashboard verification using `agent-browser`. It leverages token-efficient accessibility tree snapshots (`@eN` reference handles) to interact with form controls deterministically without brittle XPath or CSS selectors.

---

## 1. Prerequisites & Environment

1. **Local Servers Active**:
   - Backend API: `http://127.0.0.1:8000/api/v1/health` (FastAPI)
   - Frontend SPA: `http://localhost:5173/login` (Vite + React)
2. **Browser Engine**:
   - `agent-browser` (v0.41.1+) installed with Chrome for Testing:
     ```bash
     npx.cmd --yes agent-browser install
     ```
3. **Test Account Credentials**:
   - **Email**: `sarah.chen@example.com`
   - **Password**: `demo-password-123`
   - **Expected Profile**: Sarah Chen (Founder & Creator)

---

## 2. Interactive Discovery & Element Reference Mapping

When navigating to `http://localhost:5173/login`, execute an interactive snapshot (`agent-browser snapshot -i`) to extract DOM reference handles:

| Target Element | Accessibility Role & Label | Snapshot Ref | Action Performed |
|---|---|---|---|
| **Email Input** | `textbox "Email address" [required]` | `@e9` | `fill @e9 "sarah.chen@example.com"` |
| **Password Input** | `textbox "Password" [required]` | `@e10` | `fill @e10 "demo-password-123"` |
| **Submit Button** | `button "Sign in to Account"` | `@e7` | `click @e7` |
| **Demo Login Button** (Alternative) | `button "Sign In as Demo Product Founder"` | `@e5` | `click @e5` |

---

## 3. Step-by-Step Execution Sequence

### Step 1: Open Target Login Page
Launch the browser and load the login route:
```bash
agent-browser open http://localhost:5173/login
agent-browser wait 1000
```

### Step 2: Capture Interactive Accessibility Snapshot
Scan the page structure to identify form fields and verify ref stability:
```bash
agent-browser snapshot -i
```
*Expected Output Preview:*
```text
- generic "ResearchIntel..." [ref=e1]
  - textbox "Email address" [required, ref=e9]
  - textbox "Password" [required, ref=e10]
  - button "Sign in to Account" [ref=e7]
```

### Step 3: Populate Credentials via Element References
Inject the email and password into their respective `@eN` references:
```bash
agent-browser fill @e9 sarah.chen@example.com
agent-browser fill @e10 demo-password-123
```

### Step 4: Submit Authentication Form
Trigger the login submission by clicking the submit button ref:
```bash
agent-browser click @e7
```

### Step 5: Wait for Settle & Capture Final Dashboard Snapshot
Allow React Router and authentication state to settle (2 seconds), then capture the post-login state and visual screenshot:
```bash
agent-browser wait 2000
agent-browser screenshot ./screenshots/dashboard_login_verified.png
agent-browser snapshot -i
```

---

## 4. Single-Command Chained Execution

On Windows environments (PowerShell / Command Prompt), chain the full sequence into a single resilient command:

```cmd
cmd.exe /c "npx.cmd --yes agent-browser open http://localhost:5173/login && npx.cmd --yes agent-browser wait 1000 && npx.cmd --yes agent-browser snapshot -i && npx.cmd --yes agent-browser fill @e9 sarah.chen@example.com && npx.cmd --yes agent-browser fill @e10 demo-password-123 && npx.cmd --yes agent-browser click @e7 && npx.cmd --yes agent-browser wait 2000 && npx.cmd --yes agent-browser screenshot ./screenshots/dashboard_logged_in.png && npx.cmd --yes agent-browser snapshot -i"
```

---

## 5. Verification & Success Assertions

Verify that the final accessibility snapshot satisfies the following criteria:

- [x] **URL Transition**: Successfully redirected from `/login` to root dashboard `/`.
- [x] **Authenticated User Identity**: Snapshot contains `link "Sarah Chen" [ref=e20]`.
- [x] **Session Actions Active**: Snapshot displays `button "Sign Out" [ref=e15]`.
- [x] **Dashboard Workspace Rendered**:
  - `region "Creator Studio Command Center"` is mounted.
  - `heading "Creator Command Center"` is visible.
  - Active discussions, upvote counters, and products under review are populated.
- [x] **No Error Banners**: No `alert` or error message banners appear.

---

## 6. Troubleshooting & Edge Cases

1. **React Controlled Input Events**:
   - If a custom React form component does not update state on `fill`, use `type`:
     ```bash
     agent-browser type @e9 sarah.chen@example.com
     ```
2. **Session Persistence**:
   - On Windows, chaining with `&&` within `cmd.exe /c` ensures that `agent-browser` persists its browser daemon and retains ref validity between navigation and actions.
3. **Session Reset**:
   - To force a clean browser instance before running tests, close active daemons:
     ```bash
     agent-browser close --all
     ```

