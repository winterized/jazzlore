// Detect known in-app webviews (WKWebView on iOS) where both the Wake
// Lock API AND NoSleep.js silently fail. Mitigation per the spec: show a
// banner prompting the user to "open in Safari" or "Add to Home Screen"
// so they land in a proper standalone context.
//
// The list is conservative — it matches user agents known to embed iOS
// webviews. False positives (regular Safari incorrectly flagged) are
// worse than false negatives (a webview missed) because they nag a user
// who doesn't have the problem. Each entry has a comment explaining the
// UA token's origin.

/** Returns true if the user agent matches a known in-app webview where
 *  both wake-lock layers silently fail. Pure — accepts a UA string for
 *  testability. */
export function isWkwebviewUa(ua: string): boolean {
  // Slack iOS app — embeds posts/links in a WKWebView.
  if (/Slack\//.test(ua)) return true
  // Discord iOS app.
  if (/Discord\//.test(ua)) return true
  // Facebook in-app browser. FBAN is the app name, FBAV is the version.
  if (/FBAN\//.test(ua) || /FBAV\//.test(ua)) return true
  // Instagram in-app browser.
  if (/Instagram\b/.test(ua)) return true
  // Line messenger in-app browser.
  if (/\bLine\//.test(ua)) return true
  // Twitter / X in-app browser.
  if (/Twitter\b/i.test(ua) || /\bX\//.test(ua)) return true
  // LinkedIn in-app browser.
  if (/LinkedInApp/i.test(ua)) return true
  // Claude iOS app (Anthropic). The official Claude app embeds a
  // WKWebView for links opened from chat.
  if (/Claude\b/.test(ua) && /Mobile/.test(ua)) return true
  return false
}

/** Same as isWkwebviewUa but reads from navigator.userAgent. Safe in
 *  SSR / jsdom (returns false). */
export function isWkwebview(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) return false
  return isWkwebviewUa(navigator.userAgent)
}
