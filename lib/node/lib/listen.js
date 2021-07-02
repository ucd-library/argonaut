import nodeKafka from '@ucd-lib/node-kafka';
import waitUntil from './wait-util.js';
import config from './config.js';
import logger from './logger.js';

const {Consumer, utils} = nodeKafka;

class Listen {

  constructor(messageHandler, opts={}) {
    this.messageHandler = messageHandler;
    this.opts = opts;

    this.topicConfig = {};
    if( config.kafka.replay ) {
      this.topicConfig['auto.offset.reset'] = config.kafka.replay;
    }

    this.connectOpts = {
      'group.id': config.name,
      'metadata.broker.list': config.kafka.host+':'+config.kafka.port,
      // 'event_cb' : true,
      // debug : 'all'
    };

    logger.info('Kafka consumer connection', this.connectOpts, this.topicConfig);
    this.consumer = new Consumer(this.connectOpts, this.topicConfig, {
      eventHandlers : {
        // 'event' : e => console.log('event', e),
        // 'event.log' : e => console.log('event.log', e),
        // 'event.error' : e => console.log('event.error', e),
        // 'warning' : e => console.log('warning', e),
        // 'ready' : e => console.log('ready', e),
        // 'disconnected' : e => console.log('disconnected', e)
      }
    });
  }

  async connect() {
    let listenTopics = this.opts.listenTopics || config.kafka.listenTopics;

    if( listenTopics.length === 0 ) {
      throw new Error('No topics to listen too');
    }

    logger.info('Waiting for Kafka connection', config.kafka.host+':'+config.kafka.port);
    await waitUntil(config.kafka.host, config.kafka.port);

    await this.consumer.connect();

    for( let topic of listenTopics ) {
      logger.info('Ensuring Kafka topic', topic, {
        topic, 
        num_partitions: config.kafka.numPartitions,
        replication_factor: 1
      });
      logger.debug(`Ensure Kafka topic '${topic}' response`, await utils.ensureTopic({
        topic, 
        num_partitions: config.kafka.numPartitions,
        replication_factor: config.kafka.replication_factor
      }, this.connectOpts));
    }

    logger.info('Subscribing to Kafka topics', listenTopics);
    await this.consumer.subscribe(listenTopics);
    this.consumer.consume(this.messageHandler);
  }

}

export default Listen;