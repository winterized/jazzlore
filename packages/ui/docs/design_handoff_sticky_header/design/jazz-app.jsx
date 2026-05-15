// Jazzlore app instance — sticky-header demo wrapped in a fixed-size frame.
// Used as DCArtboard child. Provides its own theme + root + scrolling content.

const { useState: _us, useEffect: _ue, useRef: _ur, useMemo: _um } = React;

function JazzApp({ variation, app, device, initialTheme = "dark", initialRoot = 0, chordGroupHeaders = false, headerStyle = "solid", autoScroll = true }) {
  const [theme, setTheme] = _us(initialTheme);
  const [root, setRoot] = _us(initialRoot);
  const [scrolled, setScrolled] = _us(false);
  const [rootSheetOpen, setRootSheetOpen] = _us(false);
  const scrollerRef = _ur(null);
  const Header = window.HEADERS[variation];

  // Track scroll state for scroll-reactive header (shrinking title etc.)
  _ue(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    const onScroll = () => setScrolled(sc.scrollTop > 24);
    sc.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => sc.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll a bit on mount so the sticky behaviour is visibly engaged.
  _ue(() => {
    if (!autoScroll) return;
    const t = setTimeout(() => {
      const sc = scrollerRef.current;
      if (sc) sc.scrollTo({ top: 380, behavior: "auto" });
    }, 60);
    return () => clearTimeout(t);
  }, [variation, app, device, autoScroll]);

  return (
    <div
      className="jl"
      data-theme={theme}
      data-device={device}
      data-scrolled={scrolled ? "true" : "false"}
      data-header-style={headerStyle}
      style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
    >
      <div className="jl-scroller" ref={scrollerRef}>
        <Header
          app={app}
          device={device}
          root={root}
          setRoot={setRoot}
          theme={theme}
          setTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          scrollerRef={scrollerRef}
          scrolled={scrolled}
          openRootSheet={() => setRootSheetOpen(true)}
        />
        {app === "chords"
          ? <ChordsBody root={root} device={device} showGroupHeaders={chordGroupHeaders} />
          : <ScalesBody root={root} device={device} />}
      </div>
      <RootSheet
        open={rootSheetOpen}
        onClose={() => setRootSheetOpen(false)}
        value={root}
        onChange={setRoot}
      />
    </div>
  );
}

window.JazzApp = JazzApp;
