// The landing app is a single static React app with no client-side router
// (deliberate — one extra page doesn't justify pulling in react-router). The
// Cloudflare Worker serves index.html for any unknown path via
// not_found_handling: "single-page-application", so /privacy boots the same
// bundle; App.tsx then picks the view from the entry pathname. Navigation
// between views is a plain full-page <a href> — no history API, so this only
// runs once at mount and a trailing slash is the only path variant worth
// normalising.

export type Route = 'landing' | 'privacy'

export function routeFor(pathname: string): Route {
  return pathname.replace(/\/+$/, '') === '/privacy' ? 'privacy' : 'landing'
}
