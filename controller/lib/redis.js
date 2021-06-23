import redis from 'redis';
import {promisify} from 'util';
import config from './config.js';

const PROMISE_WRAPPERS = ['get', 'set', 'rpush', 'keys', 'expire', 'del', 'mget', 'lrange'];

class RedisClient {

  constructor() {
    this.client = redis.createClient({
      host: config.redis.host,
      port: config.redis.port
    });

    PROMISE_WRAPPERS.forEach(fn => {
      this[fn] = promisify(this.client[fn]).bind(this.client);
    });
  }

  getKey(type, args=[]) {
    return config.redis.prefix[type]+args.join('-');
  }

}

export default RedisClient;