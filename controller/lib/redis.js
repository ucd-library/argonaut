const redis = require('redis');

const PROMISE_WRAPPERS = ['get', 'set', 'rpush', 'keys', 'expire', 'del', 'mget', 'lrange'];

class RedisClient {

  constructor() {
    this.client = redis.createClient();

    PROMISE_WRAPPERS.forEach(fn => {
      this[fn] = promisify(client[fn]).bind(this.client);
    });
  }

  getKey(type, args=[]) {
    return config.redis.prefix[type]+args.join('-');
  }

}

module.exports = new RedisClient();