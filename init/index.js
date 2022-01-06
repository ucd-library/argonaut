import {logger, config, waitUntil} from '../utils/index.js';
import Graph from './lib/graph.js';
import {exec} from 'child_process';

class KafkaInit {

  constructor() {
    this.graph = new Graph();
    this.graph.load(config.graph.file);
    this.shell = '/bin/bash';
  }

  async run() {
    logger.info('waiting for zookeeper and kafka');

    await waitUntil(config.zookeeper.host, config.zookeeper.port);
    await waitUntil(config.kafka.host, config.kafka.port);

    logger.info('initializing kafka topics');
    let topics = graph.getTopics();

    for( let topic of topics ) {
      await this.ensureTopic(topic);
      await this.ensureRetention(topic);
    }

    logger.info('Kafka initialization complete');
  }

  ensureTopic(topic) {
    let cmd = `kafka-topics.sh --create \
    --zookeeper ${config.zookeeper.host}:${config.zookeeper.port} \
    --replication-factor ${topic.replicationFactor} \
    --partitions ${topic.partitions} \
    --topic ${topic.name} || true`;

    return this._exec(cmd);
  }

  ensureRetention(topic) {
    let cmd = `kafka-configs.sh --alter \
      --bootstrap-server ${config.kafka.host}:${config.kafka.port} \
      --entity-type topics \
      --entity-name ${topic.name} \
      --add-config retention.ms=${topic.retention}`;

    return this._exec(cmd);
  }

  _exec(cmd) {
    return new Promise((resolve, reject) => {
      exec(cmd, {shell: this.shell}, (error, stdout, stderr) => {
        if( error ) reject(error);
        else resolve({stdout, stderr});
      });
    });
  }

}

(async function() {
  const init = new KafkaInit();

  try {
    await init.run();
    logger.info('Graceful exit.  This is supposed to happen');
  } catch(e) {
    logger.error('KafkaInit Failed', e);
  }
})();