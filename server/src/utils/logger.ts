import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import 'winston-daily-rotate-file';

const logsDir = path.resolve(process.cwd(), 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const fileRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logsDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: '20m',
  zippedArchive: true,
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'http',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => 
          `[${timestamp}] ${level}: ${stack || message}`
        )
      ),
    }),
    fileRotateTransport,
  ],
});
