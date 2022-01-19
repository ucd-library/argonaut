import {logger, config, redis, sendToSink, Graph} from '../utils/index.js';

class Expire {
   
  constructor() {
    this.graph = new Graph();
    this.redisEvents = new redis.RedisClient();
  }

  async connect() {
    await this.graph.load(config.graph.file);
    await this.redisEvents.connect();
    await redis.connect();

    this.redisEvents.client.config('set','notify-keyspace-events','Ex');
    this.redisEvents.client.subscribe('__keyevent@0__:expired');
    this.redisEvents.client.on('message', (channel, key) => {
      if( channel !== '__keyevent@0__:expired' ) return;
      this.sendKey(key);
    });
  }

  sendKey(key, data) {
    let taskMsgArray = (await redis.client.get(key))
      .map(item => JSON.parse(item));

    let task = this.graph.getTask(taskMsgArray[0].id);

    logger.info(`key '${key}' is expired, sending to sink`);
    await sendToSink.http(task, key, taskMsgArray);

    // cleanup 
    logger.debug(`Cleaning up key '${key}''`);
    await redis.client.del(key);
  }

}

export default Expire;