import { MARRAINAGE_EVENT } from '../../models/marrainage';
import { IEventBus } from '../../infra/eventBus';

export async function sendEmailOnMarrainageCreated(EventBus: IEventBus) {
  const messageHandler = (msg, cb) => {
    const payload = JSON.parse(msg)
    console.log('Message payload', payload);
    cb(); // acknowledging the message
  };
  EventBus.consume(MARRAINAGE_EVENT.MARRAINAGE_IS_DOING_EVENT, messageHandler)
}
