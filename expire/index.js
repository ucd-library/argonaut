import Redis from 'ioredis';
import {logger, config, redis, sendToSink, Graph} from '../utils/index.js';
import RedisLock from '../utils/lock.js';

class Expire {
   
  constructor() {
    this.graph = new Graph();
    this.redisEvents = new Redis({
      host: config.redis.host,
      port : config.redis.port
    });
  }

  async connect() {
    await this.graph.load(config.graph.file);
    await redis.connect();

    this.redisLock = RedisLock(redis.client);

    await this.redisEvents.config('set','notify-keyspace-events','Ex');
    await this.redisEvents.subscribe('__keyevent@0__:expired');
    this.redisEvents.on('message', (channel, key) => {
      if( channel !== '__keyevent@0__:expired' ) return;
      this.sendKey(key);
    });
  }

  async sendKey(key) {
    let lock = await this.redisLock.acquire([key+'-lock'], 5000);

    if( !await redis.client.exists(key) ) {
      lock.unlock();
      return;
    }

    try {

      let taskMsgArray = (await redis.client.get(key))
        .map(item => JSON.parse(item));

      let task = this.graph.getTask(taskMsgArray[0].taskId);
      taskMsgArray = taskMsgArray.map(item => item.data);

      logger.info(`key '${key}' is expired, sending to sink`);
      await sendToSink(task, key, taskMsgArray);

      // cleanup 
      logger.debug(`Cleaning up key '${key}''`);
      await redis.client.del(key);

    } finally {
      lock.unlock();
    }
  }

}

export default Expire;