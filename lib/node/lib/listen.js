import {Consumer} from '@ucd-lib/node-kafka';
import {waitUntil} from './wait-util';
import config from './config';

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
    }, topicConfig);
  }

  async connect() {
    await waitUntil(config.kafka.host, config.kafka.port);
    await this.consumer.subscribe(config.kafka.listenTopics);
    this.consumer.consume(this.messageHandler);
  }

}

export {Listen};