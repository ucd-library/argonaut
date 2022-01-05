const env = process.env;

const KAFKA_COMPOSER_TOPICS = {
  EXPIRED_JOINS : 'argonaut-expired-joins',
  RESPONSES : 'argonaut-task-responses',
  SOURCES : 'argonaut-sources'
}
const KAFKA_COMPOSER_TASK_TOPICS = [
  KAFKA_COMPOSER_TOPICS.EXPIRED_JOINS,
  KAFKA_COMPOSER_TOPICS.RESPONSES,
  KAFKA_COMPOSER_TOPICS.SOURCES
]

const config = {

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

  kafka : {
    host : env.KAFKA_HOST || 'kafka',
    port : env.KAFKA_PORT || '9092',
    groups : {
      composer : {
        id : 'argonaut-composer',
        topics : KAFKA_COMPOSER_TASK_TOPICS
      }
    },
    topics : {
      expiredJoins : KAFKA_COMPOSER_TOPICS.EXPIRED_JOINS,
      responses : KAFKA_COMPOSER_TOPICS.RESPONSES,
      sources : KAFKA_COMPOSER_TOPICS.SOURCES
    }
  }
}

function toStr(value, lowerCase=true) {
  value = (value || '').trim();
  if( lowerCase ) value = value.toLowerCase();
  return value;
}

export default config;