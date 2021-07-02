import {Listen, Response, messageUtils} from '@ucd-lib/a6t-commons';

const listener = new Listen(messageHandler, {listenTopics: ['test-step1']});
const responder = new Response();

async function messageHandler(msg) {
  console.log('worker received message', msg);
  responder.send(messageUtils.createResponse(msg));
}

(async function() {
  await responder.connect();
  await listener.connect();

  responder.send(messageUtils.createRootMessage(
    'test-input',
    {test: true}
  ))
})();
