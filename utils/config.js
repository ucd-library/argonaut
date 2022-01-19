const env = process.env;


const config = {

  sink : {
    maxRetry : 3
  },

  task : {
    defaultExpire : parseInt(env.DEFAULT_TASK_EXPIRE || 60)
  },

  graph : {
    file : env.ARGONAUT_GRAPH || '/etc/argonaut/graph.js'
  },

  logging : {
    name : env.LOG_NAME || 'argonaut',
    level : env.LOG_LEVEL || 'info'
  },

  google : {
    gcLogging : (toStr(env.GC_LOGGING) === 'true'),
    serviceAccountFile: env.GOOGLE_APPLICATION_CREDENTIALS
  },

  redis : {
    host : env.REDIS_HOST || 'redis',
    port : env.REDIS_PORT || '6379',
  },

  kafka : {
    host : env.KAFKA_HOST || 'kafka',
    port : env.KAFKA_PORT || '9092',
    groups : {
      composer :  'argonaut-composer',
    },
    topicDefaults : {
      replicationFactor : 1,
      retention : parseInt(env.KAFKA_DEFAULT_TOPIC_RETENTION || 1000 * 60 * 60 * 24 * 7), // ms
      partitions : parseInt(env.KAFKA_DEFAULT_TOPIC_PARITIONS || 10)
    }
  },

  zookeeper : {
    host : env.ZOOKEEPER_HOST || 'zookeeper',
    port : env.ZOOKEEPER_PORT || '2181'
  }
}

function toStr(value, lowerCase=true) {
  value = (value || '').trim();
  if( lowerCase ) value = value.toLowerCase();
  return value;
}

export default config;