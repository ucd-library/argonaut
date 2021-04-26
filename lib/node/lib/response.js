import {Producer} from '@ucd-lib/node-kafka';
import {waitUntil} from './wait-util';
import config from './config';

class Response {

  constructor() {
    this.producer = new Producer({
      'metadata.broker.list': config.kafka.host+':'+config.kafka.port
    });
  }

  async connect() {
    await waitUntil(config.kafka.host, config.kafka.port);
    await this.producer.connect();
  }

  send(msg, topic) {
    if( !topic ) {
      topic = config.kafka.responseTopic
    }
    msg.topic = topic;

    this.producer.produce({
      topic,
      value : msg
    });
  }

}

export {Response};