import {Kafka} from 'kafkajs';
import config from './config.js';
let admin;

const kafka = new Kafka({
  brokers: [config.kafka.host + ':' + config.kafka.port]
});


async function waitForTopics(topics) {
  while( !(await _waitForTopics(topics)) ) {
    await sleep();
  }
}

async function _waitForTopics(topics) {
  if( !admin ) {
    admin = kafka.admin();
    await admin.connect();
  }

  let existingTopics = (await admin.fetchTopicMetadata()).topics.map(item => item.name);

  for( let topic of topics ) {
    if( !existingTopics.includes(topic) ) {
      return false;
    }
  }

  return true;
}

async function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), time || 500);
  });
}

export default waitForTopics;