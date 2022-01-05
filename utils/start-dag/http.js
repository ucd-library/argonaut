import config from '../config.js'
import logger from '../logger.js'

function send(task, key, data, attempt=0) {
  attempt++;  
  if( attempt > config.dags.maxRetry ) {
    logger.error(`Failed ${config.dags.maxRetry} attempts to send ${key} to dag`);
    return;
  }

  try { 
    let response = await task.send(key, data, fetch);
    if( response.status < 200 || response.status > 299 ) {
      logger.warn(`failed to send ${key} to dag`, 'status='+response.status+', body='+(await response.text()) );
      await send(key, data, attempt);
    }
  } catch(e) {
    logger.warn(`failed to send ${key} to dag`, e);
    await send(key, data, attempt);
  }
}