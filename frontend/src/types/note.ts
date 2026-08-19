export interface Note {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type NoteDraft = Pick<Note, 'title' | 'body'>;
