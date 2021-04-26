
module.exports = {

  graphFile : process.env.A6T_GRAPH_FILE || '/etc/a6t/graph.js',

  kafka : {
    host : process.env.KAFKA_HOST || 'kafka',
    port : process.env.KAFKA_PORT || 9092,
    responseTopic : 'a6t-response'
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
  },

  dependsOn : {
    // this is just cleanup, so keys can stick are for a little bit
    defaultWindow : '5min'
  },

  groupBy : {
    // this controls to flow
    defaultWindow : '1min'
  }
}