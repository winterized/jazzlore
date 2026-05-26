// PwaInstallSheet — platform-aware install instructions, rendered as a
// bottom drawer on mobile and a centered modal on desktop. Portals to
// `document.body`, focus-trapped, dismisses via backdrop / Esc / close
// button. Self-contained Tailwind (no per-app CSS required).
//
// Content branches on `platform`:
//   - 'ios'              → Safari Share → Add to Home Screen → Add
//   - 'android-prompt'   → native Install prompt CTA
//   - 'desktop-prompt'   → native Install prompt CTA
//   - 'android-no-prompt'→ "Tap ⋮ → Install app" guidance
//   - 'desktop-no-prompt'→ "Look for the install icon in your address bar"
//
// The component is dumb about its parent: callers decide *when* it mounts
// (the button conditionally renders it). When `isStandalone` is true the
// button doesn't mount the sheet at all.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from './useFocusTrap'
import { usePwaInstall } from './usePwaInstall'

type Props = {
  appName: string
  appIconHref: string
  appAccent: string
  onClose: () => void
}

const ShareIcon = () => (
  // iOS Share icon — a square with an arrow rising out of it. 16×20 so the
  // taller arrow reads at small inline sizes.
  <svg
    width="16"
    height="20"
    viewBox="0 0 16 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M8 12V2" />
    <path d="M4.5 5.5 8 2l3.5 3.5" />
    <path d="M3 9v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" />
  </svg>
)

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M7 2v10" />
    <path d="M2 7h10" />
  </svg>
)

const DotsIcon = () => (
  <svg
    width="6"
    height="18"
    viewBox="0 0 6 18"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="3" cy="3" r="1.4" />
    <circle cx="3" cy="9" r="1.4" />
    <circle cx="3" cy="15" r="1.4" />
  </svg>
)

function Step({
  n,
  children,
}: {
  n: number
  children: React.ReactNode
}) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed text-stone-800 dark:text-stone-200">
      <span
        className={[
          'flex h-6 w-6 flex-none items-center justify-center rounded-full',
          'bg-stone-200 text-xs font-semibold text-stone-700',
          'dark:bg-stone-800 dark:text-stone-300',
        ].join(' ')}
        aria-hidden="true"
      >
        {n}
      </span>
      <span>{children}</span>
    </li>
  )
}

function IOSInstructions({ appName }: { appName: string }) {
  return (
    <ol className="space-y-3">
      <Step n={1}>
        Tap the{' '}
        <span className="mx-1 inline-flex translate-y-[3px]">
          <ShareIcon />
        </span>{' '}
        <strong>Share</strong> button in Safari (at the bottom of the screen).
      </Step>
      <Step n={2}>
        Scroll down and tap <strong>Add to Home Screen</strong>{' '}
        <span className="ml-1 inline-flex translate-y-[2px]">
          <PlusIcon />
        </span>
        .
      </Step>
      <Step n={3}>
        Confirm by tapping <strong>Add</strong>. {appName} will appear on
        your home screen like any other app.
      </Step>
    </ol>
  )
}

function AndroidNoPromptInstructions({
  appName,
}: {
  appName: string
}) {
  return (
    <ol className="space-y-3">
      <Step n={1}>
        Tap the{' '}
        <span className="mx-1 inline-flex translate-y-[3px]">
          <DotsIcon />
        </span>{' '}
        menu in Chrome (top-right of the address bar).
      </Step>
      <Step n={2}>
        Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
      </Step>
      <Step n={3}>
        Confirm. {appName} will appear on your home screen like any other
        app.
      </Step>
    </ol>
  )
}

function DesktopNoPromptInstructions({
  appName,
}: {
  appName: string
}) {
  return (
    <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
      Look for an <strong>install</strong> icon (usually at the right edge
      of the address bar) and click it, or open {appName} as an app via your
      browser&rsquo;s menu. On Safari, use <em>File → Add to Dock</em>.
    </p>
  )
}

function PromptCta({
  appName,
  appAccent,
  onInstalled,
}: {
  appName: string
  appAccent: string
  onInstalled: () => void
}) {
  const { requestInstall } = usePwaInstall()
  const [pending, setPending] = useState(false)
  return (
    <>
      <p className="mb-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        Install {appName} for one-tap launch and offline support.
      </p>
      <button
        type="button"
        disabled={pending || requestInstall === null}
        onClick={async () => {
          if (!requestInstall) return
          setPending(true)
          try {
            await requestInstall()
          } finally {
            setPending(false)
            onInstalled()
          }
        }}
        style={{ backgroundColor: appAccent }}
        className={[
          'inline-flex h-11 w-full items-center justify-center rounded-lg',
          'font-medium text-white',
          'transition-opacity duration-[120ms]',
          'hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-500',
        ].join(' ')}
      >
        {pending ? 'Installing…' : `Install ${appName}`}
      </button>
    </>
  )
}

function platformHeading(
  platform: ReturnType<typeof usePwaInstall>['platform'],
  appName: string,
): string {
  switch (platform) {
    case 'ios':
      return `Install ${appName} on your iPhone`
    case 'android-prompt':
    case 'android-no-prompt':
      return `Install ${appName} on your Android`
    case 'desktop-prompt':
    case 'desktop-no-prompt':
    default:
      return `Install ${appName}`
  }
}

export function PwaInstallSheet({
  appName,
  appIconHref,
  appAccent,
  onClose,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [entered, setEntered] = useState(false)
  const titleId = 'pwa-install-title'
  const { platform } = usePwaInstall()
  useFocusTrap(sheetRef, true)

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      <div
        data-testid="pwa-install-backdrop"
        aria-hidden="true"
        onClick={onClose}
        className={[
          'fixed inset-0 z-[100] bg-stone-900/60',
          'transition-opacity duration-200',
          entered ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      />
      <div
        ref={sheetRef}
        data-testid="pwa-install-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={[
          'fixed z-[101] bg-white dark:bg-stone-950',
          'border border-stone-200 dark:border-stone-800 shadow-2xl',
          // Mobile (default): bottom drawer
          'inset-x-0 bottom-0 rounded-t-2xl max-h-[88vh] overflow-y-auto',
          // Desktop: centered modal
          'sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2',
          'sm:-translate-x-1/2 sm:-translate-y-1/2',
          'sm:w-[28rem] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl',
          // Enter transition: slide up on mobile only — keep the panel
          // fully opaque from the first paint so a11y tools never sample
          // colors against the half-faded backdrop bleed-through.
          'transition-transform duration-[280ms]',
          entered ? 'translate-y-0' : 'translate-y-full sm:translate-y-0',
        ].join(' ')}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <img
            src={appIconHref}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 flex-none rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-base font-semibold text-stone-900 dark:text-stone-50"
            >
              {platformHeading(platform, appName)}
            </h2>
            <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-300">
              No app store · works offline · zero tracking
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close install instructions"
            className={[
              'flex h-8 w-8 flex-none items-center justify-center rounded-md',
              'text-stone-500 hover:bg-stone-100 hover:text-stone-900',
              'dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-50',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            ].join(' ')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m4 4 8 8" />
              <path d="m12 4-8 8" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-6 pt-4">
          {platform === 'ios' && <IOSInstructions appName={appName} />}
          {platform === 'android-no-prompt' && (
            <AndroidNoPromptInstructions appName={appName} />
          )}
          {platform === 'desktop-no-prompt' && (
            <DesktopNoPromptInstructions appName={appName} />
          )}
          {(platform === 'android-prompt' || platform === 'desktop-prompt') && (
            <PromptCta
              appName={appName}
              appAccent={appAccent}
              onInstalled={onClose}
            />
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}
