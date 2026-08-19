import { useState } from 'react';
import type { FormEvent } from 'react';

import type { NoteDraft } from '@/types/note';

interface NoteFormProps {
  onSubmit: (draft: NoteDraft) => Promise<void>;
}

export function NoteForm({ onSubmit }: NoteFormProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <input
        aria-label="Title"
        placeholder="Title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <textarea
        aria-label="Body"
        placeholder="Write something…"
        rows={4}
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      <button type="submit" disabled={saving || !title.trim()}>
        {saving ? 'Saving…' : 'Add note'}
      </button>
    </form>
  );
}
