import config from '../config/index.js';

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
export default function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;

  if (status >= 500) console.error(err);

  res.status(status).json({
    error: {
      message: status >= 500 && config.isProduction ? 'Internal server error' : err.message,
      ...(config.isProduction ? {} : { stack: err.stack }),
    },
  });
}
