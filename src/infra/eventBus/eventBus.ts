import InMemoryEventBus from '../inMemoryEventBus';
import RedisEventBus from '../redis';

export interface IEventBus {
    init: any,
    consume: any,
    produce: any
}

const EventBus : IEventBus = process.env.NODE_ENV === 'test' ? new InMemoryEventBus() : RedisEventBus

export default EventBus