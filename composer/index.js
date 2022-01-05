import {logger, config} from '../utils/index.js';
import fetch from 'node-fetch';
import Consumer from './lib/consumer.js';
import {render as renderKey} from './lib/key-message.js';
import redis from './lib/redis.js';
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
        return;
      }
    }

    // push on key
    await redis.client.lpush(key, {id: taskId, data});

    // todo, if length is 1, set expire
    let taskDataArray = await redis.client.get(key);

    // create task id / data array object from array
    data = {};
    taskDataArray.forEach(item => {
      if( !data[item.id] ) data[item.id] = [];
      data[item.id].push(item.data);
    });

    if( !task.ready(taskDataArray) ) {
      return;
    }

    await this.send(key, data);

    // cleanup 
    await redis.client.del(key);
  }

  send(key, data, attempt=0) {
    attempt++;  
    if( attempt > 3 ) {
      logger.error(`Failed 3 attempts to send ${key} to dag`);
      return;
    }
  

    try { 
      let response = await task.send(key, data, fetch);
      if( response.status < 200 || response.status > 299 ) {
        logger.warn(`failed to send ${key} to dag`, 'status='+response.status+', body='+(await response.text()) );
        await this.send(key, data, attempt);
      }
    } catch(e) {
      logger.warn(`failed to send ${key} to dag`, e);
      await this.send(key, data, attempt);
    }
  }

}

export default Composer;