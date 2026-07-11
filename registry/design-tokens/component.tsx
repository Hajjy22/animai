// AnimAITheme — the design-token layer every AnimAI everyday-UI component reads.
// Drop <AnimAITheme /> once at your app root (e.g. in app/layout.tsx). It emits
// a :root block of CSS custom properties: color, radius, spacing, type, shadow,
// and motion. Components reference these with fallbacks (var(--ai-radius,
// 0.5rem)), so they look right on their own but snap into one cohesive system
// when this is present. Override any --ai-* variable in your own CSS to retheme
// everything at once. Ships light by default with a prefers-color-scheme dark
// variant; no dependencies, no client JS.
export default function AnimAITheme() {
  return (
    <style>{`
      :root {
        /* Color */
        --ai-bg: #ffffff;
        --ai-surface: #f8fafc;
        --ai-surface-2: #f1f5f9;
        --ai-border: #e2e8f0;
        --ai-text: #0f172a;
        --ai-text-muted: #64748b;
        --ai-primary: #0ea5e9;
        --ai-primary-hover: #0284c7;
        --ai-primary-fg: #ffffff;
        --ai-danger: #ef4444;
        --ai-danger-fg: #ffffff;
        --ai-success: #10b981;
        --ai-warning: #f59e0b;
        --ai-ring: #38bdf8;

        /* Radius */
        --ai-radius-sm: 0.375rem;
        --ai-radius: 0.5rem;
        --ai-radius-lg: 0.75rem;
        --ai-radius-full: 9999px;

        /* Spacing scale (4px base) */
        --ai-space-1: 0.25rem;
        --ai-space-2: 0.5rem;
        --ai-space-3: 0.75rem;
        --ai-space-4: 1rem;
        --ai-space-6: 1.5rem;
        --ai-space-8: 2rem;

        /* Type */
        --ai-font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        --ai-font-mono: ui-monospace, "SF Mono", "Cascadia Code", Menlo, monospace;
        --ai-text-xs: 0.75rem;
        --ai-text-sm: 0.875rem;
        --ai-text-base: 1rem;
        --ai-text-lg: 1.125rem;

        /* Shadow */
        --ai-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
        --ai-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        --ai-shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.14);

        /* Motion */
        --ai-duration-fast: 150ms;
        --ai-duration: 200ms;
        --ai-duration-slow: 320ms;
        --ai-ease: cubic-bezier(0.4, 0, 0.2, 1);
        --ai-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
        --ai-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --ai-bg: #020617;
          --ai-surface: #0f172a;
          --ai-surface-2: #1e293b;
          --ai-border: #1e293b;
          --ai-text: #e2e8f0;
          --ai-text-muted: #94a3b8;
          --ai-primary: #38bdf8;
          --ai-primary-hover: #0ea5e9;
          --ai-primary-fg: #020617;
          --ai-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
          --ai-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          --ai-shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.6);
        }
      }
    `}</style>
  );
}
