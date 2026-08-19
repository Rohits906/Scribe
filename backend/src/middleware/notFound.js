import { HttpError } from '../utils/httpError.js';

export default function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
