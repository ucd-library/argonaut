
const env = process.env;

export default {
  name : env.A6T_NODE_NAME || 'a6t-node',

  kafka : {
    host : env.KAFKA_HOST || 'kafka',
    port : env.KAFKA_PORT || '9092',
    responseTopic : process.env.A6T_RESPONSE_TOPIC || 'a6t-response',
    listenTopics : (process.env.A6T_TOPICS || '').split(/(,|\s)/g).map(topic => topic.trim()),
    replay : env.KAFKA_AUTO_OFFSET_RESET !== undefined ? env.KAFKA_AUTO_OFFSET_RESET : 'earliest'
  },

  redis : {
    host : process.env.REDIS_HOST || 'redis',
    port : process.env.REDIS_PORT || 6379,
    prefix : {
      dependsOnKeys : 'a6t-depends-on-keys-',
      dependsOnOrgMsg : 'a6t-depends-on-org-msg-',
      dependsOnValue : 'a6t-depends-on-value-',
      dependsOnResults : 'a6t-depends-on-results-',
      expireKey : 'a6t-expire-key-',
      expirekeys : 'a6t-expire-keys-',
      expireValue : 'a6t-expire-value-',
      expireReady : 'a6t-expire-ready-'
    }
  }
}