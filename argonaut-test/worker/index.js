import {Listen, Response, messageUtils} from '@ucd-lib/a6t-commons';

const listener = new Listen(messageHandler);
const responder = new Response();

async function messageHandler(msg) {
  console.log('worker received message', msg);
  responder.send(messageUtils.createResponse(msg));
}

(async function() {
  responder.connect();
  listener.connect();
});
