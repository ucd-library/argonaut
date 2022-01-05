import bunyan from 'bunyan'
import config from '../utils/config.js'
import {LoggingBunyan} from '@google-cloud/logging-bunyan';

const streams = [
  // Log to the console
  { stream: process.stdout, level: config.logging.level }
];

// wire in stack driver if google cloud service account provided
let projectId;
if( config.google.serviceAccountFile && config.google.gcLogger === true) {
  // create bunyan logger google cloud logging
  let gcLogging = new LoggingBunyan();

  // add new logger stream
  streams.push(gcLogging.stream(config.logging.level));
}


let logger = bunyan.createLogger({
  name: config.logging.name,
  // level: config.logging.level,
  streams: streams
});

let info = {
  name: config.logging.name,
  level: config.logging.level,
  google : {
    enabled : config.google.gcLogger,
    serviceAccountFile : config.google.serviceAccountFile
  }
}

logger.info('logger initialized', info);

export default logger;