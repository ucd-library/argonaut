import nodeKafka from '@ucd-lib/node-kafka';
import waitUntil from './wait-util.js';
import config from './config.js';

const {Consumer} = nodeKafka;

class Listen {

  constructor(messageHandler) {
    this.messageHandler = messageHandler;

    this.topicConfig = {};
    if( config.kafka.replay ) {
      this.topicConfig['auto.offset.reset'] = config.kafka.replay;
    }

    this.consumer = new Consumer({
      'group.id': config.name,
      'metadata.broker.list': config.kafka.host+':'+config.kafka.port,
    }, this.topicConfig);
  }

  async connect() {
    if( config.kafka.listenTopics.length === 0 ) {
      throw new Error('No topics to listen too');
    }

    await waitUntil(config.kafka.host, config.kafka.port);
    await this.consumer.subscribe(config.kafka.listenTopics);
    this.consumer.consume(this.messageHandler);
  }

}

export default Listen;