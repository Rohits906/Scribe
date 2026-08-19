import type { Note } from '@/types/note';

interface NoteListProps {
  notes: Note[];
  onDelete: (id: string) => void;
}

export function NoteList({ notes, onDelete }: NoteListProps) {
  if (notes.length === 0) {
    return <p className="empty">No notes yet.</p>;
  }

  return (
    <ul className="note-list">
      {notes.map((note) => (
        <li key={note.id} className="note">
          <div>
            <h2>{note.title}</h2>
            {note.body && <p>{note.body}</p>}
            <time dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleString()}</time>
          </div>
          <button type="button" onClick={() => onDelete(note.id)} aria-label={`Delete ${note.title}`}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
