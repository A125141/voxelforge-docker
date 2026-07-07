// Winston logger (console + rotating file).
import winston from 'winston';
import config from '../config/index.js';

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

try {
  transports.push(new winston.transports.File({
    filename: `${config.dataPath}/voxelforge.log`,
    maxsize: 5_242_880,
    maxFiles: 3,
  }));
} catch {
  // File logging may fail if data path not writable; ignore.
}

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports,
});
