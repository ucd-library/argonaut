import {logger, config, redis, sendToSink, Graph} from '../utils/index.js';
import Consumer from './lib/consumer.js';
import {render as renderKey} from './lib/key-message.js';

class Composer {
   
  constructor() {
    this.graph = new Graph();
    this.consumer = new Consumer(this.graph, this.onMessage.bind(this));
  }

  async connect() {
    logger.info('loading graph: '+config.graph.file);
    await this.graph.load(config.graph.file);
    logger.info('Connecting to redis');
    await redis.connect();
    await this.consumer.connect();
  }

  async onMessage(msg) {
    let id = msg.taskId;
    let data = msg.payload;
    
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

  async runDependency(taskId, data) {
    let task = this.graph.getTask(taskId);

    // Nothing to group, just run task if match
    if( !task.groupBy ) {
      this.runSingleton(task, taskId, data);
      return;
    }

    // get rendered group by key
    let key = renderKey(taskId, task.groupBy, data);

    // there is a where clause, check clause
    if( task.where ) {
      // no op
      if( await task.where(data) !== true ) {
        logger.debug(`key '${key}' is a noop`);
        return;
      }
    }

    // we need locking on both array length check and 
    // on send (so we don't send twice)
    // https://github.com/mike-marcacci/node-redlock

    // push on key
    await redis.client.lPush(key, JSON.stringify(data));

    // grab all messages form redis
    let taskMsgArray = (await redis.client.lRange(key, 0, -1))
      .map(item => JSON.parse(item));

    // if this was the first message, set to expire
    if( taskMsgArray.length === 1 ) {
      await redis.client.expire(key, task.expire || config.task.defaultExpire);
      logger.debug(`key '${key}' set to expire in: ${task.expire || config.task.defaultExpire}s`);
    }

    // check is task is ready send to sink
    if( task.ready(key, taskMsgArray) !== true ) {      
      return; // task is not ready
    }

    await this.send(task, key, taskMsgArray);
  }

  async runSingleton(task, key, data) {
    if( task.where ) {
      // no op
      if( task.where(data) !== true ) {
        logger.debug(`taskId '${key}' is a noop`);
        return;
      }
    }

    await this.send(task, key, [data]);
  }

  async send(task, key, taskMsgArray) {
    // send to sink via task supplied method.
    // this will attempt maxRetry times before quiting
    logger.debug(`key '${key}' is ready, sending to sink`);
    await sendToSink(task, key, taskMsgArray);

    // cleanup 
    logger.debug(`Cleaning up key '${key}'`);
    await redis.client.del(key);
  }

}

export default Composer;