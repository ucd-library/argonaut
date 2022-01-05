import {logger, config, redis, StartDag} from '../utils/index.js';
import Graph from './lib/graph.js';

class Composer {
   
  constructor() {
    this.graph = new Graph();
    this.graph.load(config.graph.file);

    this.consumer = new Consumer(this.graph);

    this.consumer.on('message', msg => this.onMessage(msg));
  }

  async connect() {
    await this.consumer.connect();
    await redis.connect();
  }

  async onMessage(msg) {
    let id = msg.task;
    let data = msg.data;
    
    if( !id ) {
      logger.error(`Consumed message "${msg.msgId}" without a task identifier`);
      return;
    }

    // render the task key
    let dependencies = this.graph.getDependencies(id);
    for( let dependency of dependencies ) {
      await this.runDependency(dependency, data);
    }
  }

  runDependency(taskId, data) {
    let task = this.graph.getTask(taskId);
    let key = renderKey(taskId, task.groupByKey, data);

    if( task.filter ) {
      // no op
      if( task.filter(data) !== true ) {
        logger.debug(`key '${key}' is a noop`);
        return;
      }
    }

    // push on key
    await redis.client.lpush(key, JSON.stringify({id: taskId, data}));

    // grab all messages form redis
    let taskMsgArray = (await redis.client.get(key))
      .map(item => JSON.parse(item));

    // if this was the first message, set to expire
    if( taskMsgArray.length === 1 ) {
      redis.client.expire(key, task.expire || config.task.defaultExpire);
      logger.debug(`key '${expire}' set to expire in: ${task.expire || config.task.defaultExpire}s`);
    }

    // check is task is ready send to dag
    if( task.ready(taskMsgArray) !== true ) {      
      return; // task is not ready
    }

    // send to dag via HTTP API call
    // TODO: support other mechanisms than HTTP (ex: kafka)
    logger.debug(`key '${key}' is ready, sending to dag`);
    await StartDag.http(task, key, taskMsgArray);

    // cleanup 
    logger.debug(`Cleaning up key '${key}''`);
    await redis.client.del(key);
  }

}

export default Composer;