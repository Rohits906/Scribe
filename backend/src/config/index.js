import 'dotenv/config';

const env = process.env.NODE_ENV ?? 'development';

const config = {
  env,
  isProduction: env === 'production',
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
};

export default config;
