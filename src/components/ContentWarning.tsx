import { useState } from 'react';

// ─── Content Warning Config ────────────────────────────────────────────────────
// Edit this section to customize the warning. No code changes needed — only
// update the values below.

const WARNING_CONFIG = {
  // When true, the warning is shown once per browser and then remembered.
  // Set to false to show it on every page load.
  rememberDismissal: true,

  title: 'Content Warning',
  intro: 'This experience contains descriptions of:',
  topics: [
    'Family separation and child removal',
    'Racial and economic discrimination in the child welfare system',
    'Institutional surveillance and coercion',
    'Psychological harm to children and parents',
  ],

  // Support resource line — set supportLinkUrl to '' to hide.
  supportText: 'If you or someone you know needs support: ',
  supportLinkLabel: 'The Bronx Defenders',
  supportLinkUrl: 'https://www.bronxdefenders.org',

  confirmLabel: 'I understand — Continue',

  // Exit button — set exitUrl to '' to hide the button.
  exitLabel: 'Leave this site',
  exitUrl: '',
} as const;

// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'family-policing-warning-dismissed';

export default function ContentWarning() {
  const [dismissed, setDismissed] = useState(() => {
    if (!WARNING_CONFIG.rememberDismissal) return false;
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  if (dismissed) return null;

  const dismiss = () => {
    if (WARNING_CONFIG.rememberDismissal) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setDismissed(true);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-neutral-950 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6">
        <div>
          <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            {WARNING_CONFIG.title}
          </p>
          <p className="text-neutral-300 text-sm leading-relaxed">
            {WARNING_CONFIG.intro}
          </p>
        </div>

        <ul className="space-y-2">
          {WARNING_CONFIG.topics.map(topic => (
            <li key={topic} className="flex items-start gap-2.5 text-sm text-neutral-400">
              <span className="text-red-500 shrink-0 mt-0.5">·</span>
              <span>{topic}</span>
            </li>
          ))}
        </ul>

        {WARNING_CONFIG.supportLinkUrl && (
          <p className="text-neutral-600 text-xs leading-relaxed border-t border-neutral-800 pt-4">
            {WARNING_CONFIG.supportText}
            <a
              href={WARNING_CONFIG.supportLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-400 transition-colors"
            >
              {WARNING_CONFIG.supportLinkLabel}
            </a>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={dismiss}
            className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-900 rounded-full text-sm font-semibold hover:bg-white transition-colors"
          >
            {WARNING_CONFIG.confirmLabel}
          </button>
          {WARNING_CONFIG.exitUrl && (
            <a
              href={WARNING_CONFIG.exitUrl}
              className="flex-1 px-6 py-3 border border-neutral-700 text-neutral-500 rounded-full text-sm font-semibold hover:bg-neutral-900 text-center transition-colors"
            >
              {WARNING_CONFIG.exitLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
