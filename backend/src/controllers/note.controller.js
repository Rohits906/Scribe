import * as noteService from '../services/note.service.js';
import { HttpError } from '../utils/httpError.js';

export function list(req, res) {
  res.json({ data: noteService.findAll() });
}

export function getById(req, res, next) {
  const note = noteService.findById(req.params.id);
  if (!note) return next(new HttpError(404, 'Note not found'));
  res.json({ data: note });
}

export function create(req, res, next) {
  const { title, body } = req.body ?? {};
  if (!title) return next(new HttpError(400, 'title is required'));
  res.status(201).json({ data: noteService.create({ title, body }) });
}

export function update(req, res, next) {
  const note = noteService.update(req.params.id, req.body ?? {});
  if (!note) return next(new HttpError(404, 'Note not found'));
  res.json({ data: note });
}

export function remove(req, res, next) {
  const deleted = noteService.remove(req.params.id);
  if (!deleted) return next(new HttpError(404, 'Note not found'));
  res.status(204).end();
}
