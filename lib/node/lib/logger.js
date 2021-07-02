import bunyan from 'bunyan';
import config from './config.js';

const streams = [
  // Log to the console
  { stream: process.stdout }
];

let logger = bunyan.createLogger({
  name: config.logging.name,
  level: config.logging.level,
  streams: streams
});

let info = {
  name: config.logging.name,
  level: config.logging.level
}

logger.info('logger initialized', info);

export default logger;