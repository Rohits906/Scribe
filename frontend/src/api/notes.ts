import { api } from '@/api/client';
import type { Note, NoteDraft } from '@/types/note';

export const listNotes = () => api.get<Note[]>('/notes');

export const getNote = (id: string) => api.get<Note>(`/notes/${id}`);

export const createNote = (draft: NoteDraft) => api.post<Note>('/notes', draft);

export const updateNote = (id: string, draft: Partial<NoteDraft>) =>
  api.put<Note>(`/notes/${id}`, draft);

export const deleteNote = (id: string) => api.delete<void>(`/notes/${id}`);
