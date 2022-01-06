import EventEmitter from 'events';
import {Consumer, utils} from '@ucd-lib/node-kafka';
import {logger, config, waitUntil} from '../../utils/index.js';
import graph from './graph.js';

const GROUP_KAFKA_CONFIG = config.kafka.groups.composer;

/**
 * @class Consumer
 * @description
 */
class Consumer extends EventEmitter {

  constructor(graph) {
    this.graph = graph;

    this.kafkaConsumer = new kafka.Consumer({
      'group.id': GROUP_KAFKA_CONFIG.id,
      'metadata.broker.list': config.kafka.host+':'+config.kafka.port,
    },{
      // subscribe to front of committed offset
      'auto.offset.reset' : 'earliest'
    });
  }

  /**
   * @method connect
   * @description connect to redis, kafka and elastic search. Ensure kafka topic.  Query 
   * for kafka watermarks and last commited offset.  Register consumer to last committed 
   * offset and start reading kafka stream.  After a small delay, check to see if any messages 
   * are stashed in redis that were never executed
   */
  async connect() {
    await waitUntil(config.kafka.host, config.kafka.port);

    await this.kafkaConsumer.connect();

    let topics = graph.getTopics().map(topic => topic.name);

    logger.info('waiting for topics: ', topics);
    await this.kafkaConsumer.waitForTopics(topics);
    
    logger.info('topics ready, subscribing: ', topics);
    await this.kafkaConsumer.subscribe(topics);

    this._listen();
  }

  /**
   * @method listen
   * @description Start consuming messages from kafka, register onMessage as the handler.
   */
  async _listen() {
    try {
      await this.kafkaConsumer.consume(msg => this._onMessage(msg));
    } catch(e) {
      logger.error('kafka consume error', e);
    }
  }

  /**
   * @method onMessage
   * @description handle a kafka message.  
   * 
   * @param {Object} msg kafka message
   */
  async _onMessage(msg) {
    let id = kafka.utils.getMsgId(msg);
    let topic = msg.topic;
    logger.debug(`handling kafka message: ${id}`);

    try {
      let task = graph.getTaskFromTopic(topic);

      // handle custom decoder
      if( task && task.decoder ) {

        let payloads = await task.decoder(msg.value);
        if( !Array.isArray(payloads) ) payloads = [payloads];
        payloads.forEach(payload => {
          this.emit('message', {
            msdId: id, 
            taskId: task.id, 
            payload
          });
        });

      } else {
        let payload = JSON.parse(msg.value);
        this.emit('message', {
          msdId: id, 
          taskId: task.id, 
          payload
        });
      }

    } catch(e) {
      logger.error(
        `failed to parse index payload. message: ${id}`, 
        e.message, 
        msg.value.toString('utf-8').substring(0, 1000)
      );
      return;
    }

  }

}

export default Consumer;