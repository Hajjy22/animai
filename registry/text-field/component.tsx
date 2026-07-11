"use client";

import { useId, useState } from "react";

export default function TextField() {
  const emailId = useId();
  const emailHelpId = useId();
  const pwId = useId();
  const pwErrId = useId();
  const [pw, setPw] = useState("123");

  const pwError = pw.length > 0 && pw.length < 8 ? "Must be at least 8 characters." : "";

  return (
    <section className="flex min-h-[20rem] w-full items-center justify-center bg-slate-950 p-8">
      <div className="tf-stack">
        <div className="tf-group">
          <label htmlFor={emailId} className="tf-label">
            Email
          </label>
          <div className="tf-inputwrap">
            <svg className="tf-icon" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 6h16v12H4z M4 7l8 6 8-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <input
              id={emailId}
              type="email"
              placeholder="you@company.com"
              aria-describedby={emailHelpId}
              className="tf-input tf-input--icon"
            />
          </div>
          <p id={emailHelpId} className="tf-help">
            We&apos;ll never share your email.
          </p>
        </div>

        <div className="tf-group">
          <label htmlFor={pwId} className="tf-label">
            Password
          </label>
          <input
            id={pwId}
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            aria-invalid={pwError ? true : undefined}
            aria-describedby={pwError ? pwErrId : undefined}
            className={`tf-input${pwError ? " tf-input--error" : ""}`}
          />
          {pwError && (
            <p id={pwErrId} className="tf-error" role="alert">
              {pwError}
            </p>
          )}
        </div>

        <style>{`
          .tf-stack {
            display: flex;
            flex-direction: column;
            gap: var(--ai-space-6, 1.5rem);
            width: 100%;
            max-width: 20rem;
          }
          .tf-group {
            display: flex;
            flex-direction: column;
            gap: var(--ai-space-2, 0.5rem);
          }
          .tf-label {
            font-size: var(--ai-text-sm, 0.875rem);
            font-weight: 600;
            color: var(--ai-text, #e2e8f0);
          }
          .tf-inputwrap {
            position: relative;
            display: flex;
            align-items: center;
          }
          .tf-icon {
            position: absolute;
            left: 0.7rem;
            width: 1.1rem;
            height: 1.1rem;
            color: var(--ai-text-muted, #94a3b8);
            pointer-events: none;
          }
          .tf-input {
            width: 100%;
            border-radius: var(--ai-radius, 0.5rem);
            border: 1px solid var(--ai-border, #334155);
            background: var(--ai-surface, #0f172a);
            color: var(--ai-text, #e2e8f0);
            padding: 0.55rem 0.75rem;
            font-size: var(--ai-text-sm, 0.875rem);
            transition:
              border-color var(--ai-duration, 200ms) var(--ai-ease, ease),
              box-shadow var(--ai-duration, 200ms) var(--ai-ease, ease);
          }
          .tf-input--icon {
            padding-left: 2.2rem;
          }
          .tf-input::placeholder {
            color: var(--ai-text-muted, #94a3b8);
          }
          .tf-input:focus-visible {
            outline: none;
            border-color: var(--ai-primary, #38bdf8);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--ai-ring, #38bdf8) 30%, transparent);
          }
          .tf-input--error {
            border-color: var(--ai-danger, #ef4444);
          }
          .tf-input--error:focus-visible {
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--ai-danger, #ef4444) 30%, transparent);
          }
          .tf-help {
            font-size: var(--ai-text-xs, 0.75rem);
            color: var(--ai-text-muted, #94a3b8);
          }
          .tf-error {
            font-size: var(--ai-text-xs, 0.75rem);
            color: var(--ai-danger, #ef4444);
          }
          @media (prefers-reduced-motion: reduce) {
            .tf-input {
              transition: none;
            }
          }
        `}</style>
      </div>
    </section>
  );
}
