import { NoteForm } from '@/components/NoteForm';
import { NoteList } from '@/components/NoteList';
import { useNotes } from '@/hooks/useNotes';

export default function App() {
  const { notes, loading, error, add, remove } = useNotes();

  return (
    <main className="app">
      <header>
        <h1>Scribe</h1>
      </header>

      <NoteForm onSubmit={add} />

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && <NoteList notes={notes} onDelete={(id) => void remove(id)} />}
    </main>
  );
}
