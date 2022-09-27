import InMemoryEventBus from '../inMemoryEventBus';
import makeRedisEventBus from '../redis';

export interface IEventBus {
    init: any,
    consume: any,
    produce: any
}

const EventBus : IEventBus = process.env.NODE_ENV === 'test' || process.env.CI ? new InMemoryEventBus() : makeRedisEventBus({ REDIS_URL: process.env.REDIS_URL })

export default EventBus
