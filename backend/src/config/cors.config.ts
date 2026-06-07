import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .filter(Boolean);

const ALLOWED_PATTERNS = [
  /^https:\/\/task-flow(-[a-z0-9]+)*-wizls-projects\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

export const isOriginAllowed = (origin: string): boolean => {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_PATTERNS.some((pattern) => pattern.test(origin));
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // origin undefined = curl / server-to-server, пропускаем
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin not allowed: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};
