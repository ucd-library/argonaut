const env = process.env;

export default {
  name : env.A6T_NODE_NAME || 'a6t-node',

  kafka : {
    host : env.KAFKA_HOST || 'kafka',
    port : env.KAFKA_PORT || '9092',
    responseTopic : process.env.A6T_RESPONSE_TOPIC || '86t-response',
    listenTopics : (process.env.A6T_TOPICS || '').split(/(,|\s)/g).map(topic => topic.trim()),
    replay : env.KAFKA_AUTO_OFFSET_RESET !== undefined ? env.KAFKA_AUTO_OFFSET_RESET : 'earliest'
  }
}