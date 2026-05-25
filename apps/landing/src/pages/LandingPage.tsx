import { useState } from 'react'
import { AboutOverlay } from '../components/AboutOverlay'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { useBreakpoint } from '../lib/useBreakpoint'
import { ChordsTile } from '../tiles/ChordsTile'
import { MetronomeTile } from '../tiles/MetronomeTile'
import { MusiciansTile } from '../tiles/MusiciansTile'
import { ScalesTile } from '../tiles/ScalesTile'

export function LandingPage() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const variant = useBreakpoint()
  return (
    <div className="landing">
      <Header onAboutClick={() => setAboutOpen(true)} />
      <main className="jzl-main">
        <p className="jzl-explain">
          A jazz musician's workbench — explore who played with whom, and
          practise with scales, chords, and a metronome.
        </p>
        <div className="jzl-grid">
          <MusiciansTile variant={variant} />
          <div className="jzl-grid-small">
            <ScalesTile variant={variant} />
            <ChordsTile variant={variant} />
            <MetronomeTile variant={variant} />
          </div>
        </div>
      </main>
      <Footer />
      <AboutOverlay open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  )
}
