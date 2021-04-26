const A6tController = require('./lib/model');
const waitUntil = require('./lib/wait-until');
const config = require('./lib/config');

(async function() {

  await waitUntil(config.kafka.host, config.kafka.port);
  await waitUntil(config.redis.host, config.redis.port);

  const controller = new A6tController();

})();