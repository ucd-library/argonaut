import config from '../config.js'
import logger from '../logger.js'

function send(task, key, data, attempt=0) {
  let maxRetry = task.maxRetry !== undefined ? task.maxRetry : config.sink.maxRetry;

  attempt++;  
  if( attempt > maxRetry ) {
    logger.error(`Failed ${maxRetry} attempts to send ${key} to sink`);
    return;
  }

  try { 
    let response = await task.sink(key, data);
    if( response.success !== true ) {
      logger.warn(`failed to send ${key} to sink`, response.message);
      await send(task, key, data, attempt);
    }
  } catch(e) {
    logger.warn(`failed to send ${key} to sink`, e);
    await send(task, key, data, attempt);
  }
}

export default send;