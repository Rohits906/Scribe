import app from './app.js';
import config from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`Scribe API listening on http://localhost:${config.port} (${config.env})`);
});

// Let in-flight requests finish before the process goes away.
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
