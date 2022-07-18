import EventEmitter from 'events';
import {Kafka} from 'kafkajs';
import {logger, config, waitUntil, waitForTopics} from '../../utils/index.js';

const kafka = new Kafka({
  brokers: [config.kafka.host + ':' + config.kafka.port]
});

/**
 * @class A6tConsumer
 * @description
 */
class A6tConsumer extends EventEmitter {

  constructor(graph, messageCallback) {
    super();
    this.graph = graph;

    this.kafkaConsumer = kafka.consumer({
      groupId : config.kafka.groups.composer
    });

    this.messageCallback = messageCallback;
  }

  /**
   * @method connect
   * @description connect to redis, kafka and elastic search. Ensure kafka topic.  Query 
   * for kafka watermarks and last commited offset.  Register consumer to last committed 
   * offset and start reading kafka stream.  After a small delay, check to see if any messages 
   * are stashed in redis that were never executed
   */
  async connect() {
    logger.info(`waiting for kafka ${config.kafka.host}:${config.kafka.port}`);
    await waitUntil(config.kafka.host, config.kafka.port);

    await this.kafkaConsumer.connect();

    let topics = this.graph.getTopics();

    logger.info('waiting for topics: ', topics);
    await waitForTopics(topics);
    
    logger.info('topics ready, subscribing: ', topics);
    await this.kafkaConsumer.subscribe({topics});

    this._listen();
  }

  /**
   * @method listen
   * @description Start consuming messages from kafka, register onMessage as the handler.
   */
  async _listen() {
    try {
      await this.kafkaConsumer.run({
        eachMessage: async ({topic, partition, message, heartbeat, pause}) => {
          try {
            await this._onMessage(message, topic, partition, message)
          } catch(e) {
            logger.error('kafka message error', e);
          }
        }
      });
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
  async _onMessage(msg, topic, partition) {
    let id = topic+':'+partition+':'+msg.offset;
    logger.debug(`handling kafka message: ${id}`);

    try {
      let task = this.graph.getTaskFromTopic(topic);

      // handle custom decoder
      if( task && task.decoder ) {

        let payloads = await task.decoder(msg.value);
        if( !Array.isArray(payloads) ) payloads = [payloads];
        for( let payload of payloads ) {
          await this.messageCallback({
            msdId: id, 
            taskId: task.id, 
            payload
          });
        }

      } else {
        let payload = JSON.parse(msg.value);
        await this.messageCallback({
          msdId: id, 
          taskId: task ? task.id : topic, 
          payload
        });
      }

    } catch(e) {
      logger.error(
        `failed to parse index payload. message: ${id}`, 
        e.message, 
        e.stack,
        msg.value.toString('utf-8').substring(0, 500)
      );
      return;
    }

  }

}

export default A6tConsumer;