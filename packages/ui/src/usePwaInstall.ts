// usePwaInstall — UI-availability hook for the install affordance.
//
// Reports which install path applies right now and exposes the native
// install prompt where the browser supports it. Captures the
// `beforeinstallprompt` event at MODULE LOAD (not in a useEffect) — the
// event fires early in the page lifecycle and a React-attached listener
// arrives too late on hot paths. Listeners are notified through a tiny
// in-module set so hook subscribers update synchronously when the event
// fires or when the app gets installed mid-session.
//
// No music-domain logic, no fetch, no storage — pure UI infrastructure,
// same architectural neighborhood as ThemeToggle.

import { useEffect, useState } from 'react'

export type PwaInstallPlatform =
  | 'ios' // iOS Safari — no beforeinstallprompt; show Share → Add to Home Screen
  | 'android-prompt' // Android Chrome with beforeinstallprompt fired
  | 'android-no-prompt' // Android Chrome without beforeinstallprompt (yet)
  | 'desktop-prompt' // Desktop Chrome/Edge with beforeinstallprompt fired
  | 'desktop-no-prompt' // Desktop without prompt (Firefox, Safari, …)

export interface PwaInstallState {
  /** Which platform / install path applies. */
  platform: PwaInstallPlatform
  /** True if the app is already running as an installed PWA — UIs hide the
   * install button when this is true. */
  isStandalone: boolean
  /** True if the app is running inside the Capacitor native shell (the iOS /
   * Android wrapper at `capacitor://localhost`). A native WKWebView matches
   * neither standalone signal, so this is a distinct gate — UIs hide the
   * install affordance when this is true (it's meaningless once wrapped, and
   * App Review dislikes UI hinting at other distribution channels). */
  isNativeApp: boolean
  /** Triggers the native install prompt. Non-null only when the platform is
   * `*-prompt` (Chrome/Edge with `beforeinstallprompt` queued). Resolves
   * after the user accepts or dismisses. */
  requestInstall: (() => Promise<void>) | null
}

/** The DOM-level `BeforeInstallPromptEvent` (TS doesn't ship a typing). */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  prompt(): Promise<void>
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let bipEvent: BeforeInstallPromptEvent | null = null
let installed = false
const subscribers = new Set<() => void>()

const notify = (): void => {
  for (const fn of subscribers) fn()
}

/** Test-only: reset module state so a vitest run isn't polluted across
 * cases. Not exported from the package barrel. */
export function __resetPwaInstallForTests(): void {
  bipEvent = null
  installed = false
}

// Bootstrap-once guard: in Vite dev HMR, re-executing the module would
// stack duplicate listeners on every save. A `globalThis` sentinel keeps
// exactly one pair of listeners alive across hot updates.
const BOOTSTRAP_KEY = '__jazzlorePwaInstallBootstrapped'
type BootstrapGlobal = typeof globalThis & { [BOOTSTRAP_KEY]?: boolean }
if (
  typeof window !== 'undefined' &&
  !(globalThis as BootstrapGlobal)[BOOTSTRAP_KEY]
) {
  ;(globalThis as BootstrapGlobal)[BOOTSTRAP_KEY] = true
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    bipEvent = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    installed = true
    bipEvent = null
    notify()
  })
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (installed) return true
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  // iOS Safari ships a non-standard `navigator.standalone` boolean — still
  // the only signal on Safari versions that don't support the standard
  // display-mode media query.
  const nav = window.navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) return true
  return false
}

/** The runtime-injected Capacitor global (we don't depend on `@capacitor/core`,
 * so TS has no typing for it). Only the bit we read is declared. */
interface CapacitorGlobal {
  isNativePlatform?: () => boolean
}

function detectNativeApp(): boolean {
  if (typeof window === 'undefined') return false
  // Capacitor injects `window.Capacitor` at runtime when the web build is
  // bundled in the native shell — no `@capacitor/core` dependency needed.
  const cap = (window as Window & { Capacitor?: CapacitorGlobal }).Capacitor
  return cap?.isNativePlatform?.() === true
}

function detectPlatform(): PwaInstallPlatform {
  if (typeof window === 'undefined') return 'desktop-no-prompt'
  const ua = window.navigator.userAgent
  const nav = window.navigator
  // iPadOS 13+ reports as MacIntel Safari — pair the platform string with
  // touch points (regular macOS has 0 touch points) to distinguish.
  const isIPad =
    typeof nav.maxTouchPoints === 'number' &&
    nav.maxTouchPoints > 1 &&
    /MacIntel/.test(nav.platform)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || isIPad
  if (isIOS) return 'ios'
  const isAndroid = /Android/.test(ua)
  if (isAndroid) return bipEvent ? 'android-prompt' : 'android-no-prompt'
  return bipEvent ? 'desktop-prompt' : 'desktop-no-prompt'
}

export function usePwaInstall(): PwaInstallState {
  const [, force] = useState(0)
  useEffect(() => {
    const sub = (): void => force((t) => t + 1)
    subscribers.add(sub)
    return () => {
      subscribers.delete(sub)
    }
  }, [])
  const platform = detectPlatform()
  const isStandalone = detectStandalone()
  const isNativeApp = detectNativeApp()
  const requestInstall =
    bipEvent && (platform === 'android-prompt' || platform === 'desktop-prompt')
      ? async (): Promise<void> => {
          const e = bipEvent
          if (!e) return
          await e.prompt()
          await e.userChoice
          // After the user accepts or dismisses, the event is one-shot —
          // Chromium dispatches a fresh one if the user dismissed.
          bipEvent = null
          notify()
        }
      : null
  return { platform, isStandalone, isNativeApp, requestInstall }
}
