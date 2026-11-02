# Phase 3 — Theme System Implementation Specification

**Status**: IMPLEMENTED & VERIFIED  
**UI/UX Architect**: Senior Full-Stack Architect & Design Systems Lead  
**Date**: November 2, 2026  
**Scope**: Light, Dark, System Theme Architecture, Zero-Flash Bootstrapping & Semantic Tokens  

---

## 1. Theme Architecture & Modes

The platform implements a unified theme architecture supporting three primary modes:

| Mode | Behavior | Activation Trigger |
|---|---|---|
| `light` | Pure light canvas (`#f8fafc`) with deep slate typography (`#0f172a`) | Explicit user choice in theme selector |
| `dark` | Deep obsidian canvas (`#0b0f17`) with crisp white/silver typography | Explicit user choice in theme selector |
| `system` | Automatically synchronizes with OS preference (`prefers-color-scheme`) | Default mode for fresh visitors |

---

## 2. Flash of Unstyled Theme (FOUC) Prevention

To eliminate jarring flashes of bright white when dark mode users refresh the page, a synchronous micro-script is embedded in `<head>` in `frontend/index.html` before any CSS or JS bundles load:

```html
<script>
  (function() {
    try {
      var saved = localStorage.getItem('pri_theme');
      var isDark = false;
      if (saved === 'dark') {
        isDark = true;
      } else if (saved === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (e) {}
  })();
</script>
```

---

## 3. Semantic Token Architecture

All colors in `frontend/src/index.css` are configured as semantic CSS custom properties mapped to Tailwind CSS v4 variables:

```css
:root {
  --canvas: #f8fafc;
  --surface: #ffffff;
  --surface-raised: #f1f5f9;
  --surface-hover: #e2e8f0;
  --border-default: #e2e8f0;
  --border-strong: #cbd5e1;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  --accent: #4f46e5;
  --accent-foreground: #ffffff;
}

.dark {
  --canvas: #090d16;
  --surface: #0f172a;
  --surface-raised: #1e293b;
  --surface-hover: #334155;
  --border-default: #1e293b;
  --border-strong: #334155;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  --accent: #6366f1;
  --accent-foreground: #ffffff;
}
```

---

## 4. Theme Context & React Lifecycle (`ThemeContext.tsx`)

1. **State Management**:
   - `theme`: Current preference (`'light' | 'dark' | 'system'`).
   - `resolvedTheme`: Currently active rendered appearance (`'light' | 'dark'`).
   - `setTheme(theme: Theme)`: Updates state and persists to `localStorage.setItem('pri_theme', theme)`.
   - `toggleTheme()`: Cycles between light and dark.
2. **System Media Query Listener**:
   - When `theme === 'system'`, `ThemeContext` attaches an event listener to `window.matchMedia('(prefers-color-scheme: dark)')` to dynamically respond when the user's OS changes appearance (e.g. at sunset).
3. **Accessibility & WCAG AA Compliance**:
   - Both light and dark themes maintain contrast ratios exceeding **4.5:1** for body text and **3:1** for UI components and interactive controls.

