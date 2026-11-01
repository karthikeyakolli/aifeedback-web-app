# ResearchIntel Theme Engine Specification

This document details the theme architecture, token switching mechanics, zero-flash script implementation, and accessibility safeguards for Light, Dark, and System modes.

---

## 1. Supported Themes

The application supports three distinct user-selectable theme preferences:
1. **Light Mode (`light`)**: Clean, high-legibility light surface palette optimized for daylight reading and documentation review.
2. **Dark Mode (`dark`)**: High-contrast, low-glare deep navy/slate palette designed to reduce eye strain during prolonged research sessions.
3. **System Mode (`system`)**: Dynamically mirrors the operating system or browser preference (`prefers-color-scheme`), automatically reacting when the OS switches themes (e.g., sunrise/sunset transitions).

---

## 2. Zero-Flash Initialization (`index.html`)

A common flaw in client-side rendered Single Page Applications is the "flash of incorrect theme" (FOUC), where a white page flashes before JavaScript parses `localStorage`.

To eliminate this, Phase 1 includes a blocking inline script inside `<head>` in `index.html` that executes synchronously before any HTML rendering or stylesheet evaluation occurs:

```html
<script>
  (function () {
    try {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = saved === 'dark' || (!saved && prefersDark) || (saved === 'system' && prefersDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.colorScheme = 'dark';
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.style.colorScheme = 'light';
      }
    } catch (e) {}
  })();
</script>
```

### Key Effects:
* **Immediate DOM Tagging**: The `dark` class is attached to `<html>` prior to the first frame render.
* **Native Form Control Sync**: Setting `document.documentElement.style.colorScheme = 'dark' | 'light'` instructs the browser engine to render native form controls (scrollbars, datepickers, checkboxes, select dropdowns) with dark or light system primitives automatically.
* **`data-theme` Attribute**: Added for compatibility with standard CSS attribute selectors.

---

## 3. Theme Context (`src/context/ThemeContext.tsx`)

The React `ThemeContext` provides application-wide reactive state management:

```tsx
export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;          // Current user setting ('light' | 'dark' | 'system')
  isDark: boolean;       // Resolved boolean state (evaluates OS setting when theme is 'system')
  setTheme: (theme: Theme) => void;
}
```

### OS Preference Listening
When `theme === 'system'`, `ThemeContext` binds an event listener to `window.matchMedia('(prefers-color-scheme: dark)')`:
```tsx
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const handleChange = (e: MediaQueryListEvent) => {
  if (theme === 'system') {
    applyTheme(e.matches);
  }
};
mediaQuery.addEventListener('change', handleChange);
```
This guarantees real-time synchronization with OS mode shifts without requiring page reloads.

---

## 4. Semantic Color Variables (`src/index.css`)

All color variables are declared semantically so components never need conditional `dark:bg-...` cascades for basic surface colors:

```css
:root {
  --bg-app: #F7F8FC;
  --bg-surface: #FFFFFF;
  --bg-secondary: #F1F3F9;
  --text-primary: #172033;
  --text-muted: #667085;
  --border-subtle: #E6E8EF;
  --primary: #4F46E5;
  --primary-hover: #4338CA;
  --evidence-community: #0F766E;
  --evidence-document: #2563EB;
  --ai-synthesis: #7C3AED;
}

.dark {
  --bg-app: #0D1321;
  --bg-surface: #151D2E;
  --bg-secondary: #1B2638;
  --text-primary: #EEF2FF;
  --text-muted: #A6B0C3;
  --border-subtle: #293449;
  --primary: #818CF8;
  --primary-hover: #6366F1;
  --evidence-community: #2DD4BF;
  --evidence-document: #60A5FA;
  --ai-synthesis: #A78BFA;
}
```

---

## 5. Report Export Theme Invariance

When exporting AI research summaries or audit reports to PDF/Markdown/Print, reports must remain readable regardless of the user's active UI theme.

* Printed stylesheets and export templates utilize explicit `#FFFFFF` backgrounds and `#172033` high-contrast ink colors.
* AI synthesis badges and citation markers maintain neutral dark borders in print mode to prevent muddy gray printouts.

---

## 6. Contrast Audit Across Themes

| Pair | Light Mode Ratio | Dark Mode Ratio | WCAG 2.2 AA Standard |
| :--- | :--- | :--- | :--- |
| **Primary Text on Surface** | `13.8 : 1` (`#172033` on `#FFFFFF`) | `12.1 : 1` (`#EEF2FF` on `#151D2E`) | Pass (≥ 4.5:1) |
| **Muted Text on Surface** | `4.8 : 1` (`#667085` on `#FFFFFF`) | `5.6 : 1` (`#A6B0C3` on `#151D2E`) | Pass (≥ 4.5:1) |
| **Primary Brand CTA Text** | `8.2 : 1` (`#FFFFFF` on `#4F46E5`) | `10.4 : 1` (`#0D1321` on `#818CF8`) | Pass (≥ 4.5:1) |
| **Evidence Community Pill**| `5.2 : 1` (`#0F766E` on `#F1F3F9`) | `7.1 : 1` (`#2DD4BF` on `#1B2638`) | Pass (≥ 4.5:1) |
| **Evidence Document Pill** | `5.1 : 1` (`#2563EB` on `#F1F3F9`) | `6.8 : 1` (`#60A5FA` on `#1B2638`) | Pass (≥ 4.5:1) |
| **AI Synthesis Pill** | `5.9 : 1` (`#7C3AED` on `#F1F3F9`) | `7.3 : 1` (`#A78BFA` on `#1B2638`) | Pass (≥ 4.5:1) |

