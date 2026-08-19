import { randomUUID } from 'node:crypto';

// In-memory store — swap for a real database when one is chosen.
const notes = new Map();

export function findAll() {
  return [...notes.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function findById(id) {
  return notes.get(id) ?? null;
}

export function create({ title, body = '' }) {
  const now = new Date().toISOString();
  const note = { id: randomUUID(), title, body, createdAt: now, updatedAt: now };
  notes.set(note.id, note);
  return note;
}

export function update(id, { title, body }) {
  const note = notes.get(id);
  if (!note) return null;

  const updated = {
    ...note,
    title: title ?? note.title,
    body: body ?? note.body,
    updatedAt: new Date().toISOString(),
  };
  notes.set(id, updated);
  return updated;
}

export function remove(id) {
  return notes.delete(id);
}
