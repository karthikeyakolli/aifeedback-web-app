# ResearchIntel Authentication UX Specification

This document details the dedicated authentication architecture, user journeys, form validation, security affordances, and Supabase integration implemented in Phase 1.

---

## 1. Authentication Route Structure

Rather than burying authentication in disruptive modal overlays that break URL state and deep linking, Phase 1 establishes 5 dedicated top-level authentication routes:

| Route | Page Component | Primary Purpose | Key Features |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginPage.tsx` | User sign-in | Email/Password, Show/Hide password toggle, Demo login CTA, redirect preservation |
| `/signup` | `SignupPage.tsx` | New account registration | Display name, Username, Email, Password with real-time criteria checklist, Terms acceptance |
| `/forgot-password` | `ForgotPasswordPage.tsx` | Password reset request | Email form, instant submission feedback, recovery email notification |
| `/verify-email` | `VerifyEmailPage.tsx` | Email confirmation screen | Resend email with 60-second cooldown timer, check inbox instructions |
| `/auth/callback` | `AuthCallbackPage.tsx` | OAuth/Magic link callback | Token extraction, session exchange, seamless redirect to intended destination |

---

## 2. Desktop Brand Visual Panel (`AuthVisualPanel`)

On desktop viewports (`lg` breakpoint, ≥ 1024px), the authentication container features a high-fidelity visual panel on the right side that reinforces the platform's core value propositions:

1. **Candid Anonymity with Translucence**: Honest peer feedback while maintaining accountability and reputation scores.
2. **Bounded High-Signal Threading**: Structured discussion without the chaos of infinitely nested reply trees.
3. **Dual-Source RAG Grounding**: AI synthesis powered strictly by verified community quotes and uploaded product specs.

On mobile and tablet viewports (< 1024px), this panel is cleanly omitted, presenting a focused single-column authentication form with zero extraneous clutter.

---

## 3. Login Flow (`/login`)

### 3.1 Field Specifications & Ergonomics
* **Email Address**:
  * Input `type="email"`, `autoComplete="email"`, `inputMode="email"`.
  * Leading Mail icon (`lucide-react/Mail`).
  * Trims whitespace automatically before submission.
* **Password**:
  * Input `type={showPassword ? 'text' : 'password'}` with `autoComplete="current-password"`.
  * Trailing interactive toggle button with `aria-label={showPassword ? "Hide password" : "Show password"}`.
  * Preserves cursor position when toggling visibility.
* **Forgot Password Link**: Right-aligned above password field with explicit keyboard focus outline.
* **Quick Demo Sign-in**: One-click secondary button enabling reviewers or evaluators to bypass credentials and test the system with demo founder roles.

### 3.2 State Preservation & Redirect
* Uses React Router `useLocation()` to inspect `location.state.from`.
* If a visitor attempted to access a protected workspace (`/workspace`) before signing in, successful authentication redirects them directly back to their intended destination rather than dumping them onto the home feed.

---

## 4. Signup Flow (`/signup`)

### 4.1 Real-Time Password Quality Checklist
To prevent frustrating post-submission validation rejections, the signup form provides instant real-time visual feedback against 4 standard criteria:
1. **At least 8 characters in length** (`password.length >= 8`).
2. **At least one uppercase letter** (`/[A-Z]/.test(password)`).
3. **At least one lowercase letter** (`/[a-z]/.test(password)`).
4. **At least one number or special character** (`/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)`).

Each criterion displays a dynamic checkmark (Emerald) or empty circle (Muted) with an animated transition as the user types.

### 4.2 Terms of Service & Privacy Acceptance
* Includes an accessible checkbox with clear textual label: *"I agree to the Community Guidelines and acknowledge the Privacy Policy."*
* Registration button remains disabled until valid terms acknowledgement is checked.

---

## 5. Password Reset & Verification Flows

### 5.1 `/forgot-password`
* Submits reset instruction request via Supabase Auth API (`supabase.auth.resetPasswordForEmail`).
* On submission, replaces the input form with a reassuring confirmation screen displaying the target email address and instructions to check junk/spam folders.
* Includes a prominent *"Return to sign in"* button.

### 5.2 `/verify-email`
* Displayed when a user signs up with email confirmation enabled or clicks verification links.
* **Rate-Limited Resend**: Features a resend button backed by a 60-second cooldown countdown timer to prevent accidental API rate-limiting or email spamming.

---

## 6. Accessibility & Error Handling Standards

* **`role="alert"` for Errors**: Any authentication failure message is rendered inside a container with `role="alert"` and `aria-live="polite"` so screen readers announce it immediately.
* **Input Label Associations**: All input fields have explicit `id` attributes matched to `<label htmlFor="...">`.
* **Keyboard Flow**: Logical tab sequence: Email → Password → Show Toggle → Forgot Link → Sign In Button → Demo Login Button → Signup Link.

