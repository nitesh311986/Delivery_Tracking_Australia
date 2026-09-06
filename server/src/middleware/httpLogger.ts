import morgan from 'morgan';
import type { Request } from 'express';
import { logger } from '../utils/logger.js';

morgan.token('body', (req: Request) => JSON.stringify(req.body));

const stream: morgan.StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};

export const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms body: :body',
  { stream }
);
