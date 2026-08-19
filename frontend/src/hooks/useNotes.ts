import { useCallback, useEffect, useState } from 'react';

import { createNote, deleteNote, listNotes } from '@/api/notes';
import type { Note, NoteDraft } from '@/types/note';

interface UseNotes {
  notes: Note[];
  loading: boolean;
  error: string | null;
  add: (draft: NoteDraft) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useNotes(): UseNotes {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await listNotes());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(async (draft: NoteDraft) => {
    const note = await createNote(draft);
    setNotes((current) => [note, ...current]);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteNote(id);
    setNotes((current) => current.filter((note) => note.id !== id));
  }, []);

  return { notes, loading, error, add, remove, reload };
}
