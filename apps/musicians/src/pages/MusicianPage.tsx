import { useParams } from 'react-router'

export default function MusicianPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <main>
      <h1>Musician: {id}</h1>
      <p>scaffold — Phase A</p>
    </main>
  )
}
