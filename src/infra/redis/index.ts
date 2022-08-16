export * from './redisPublish'
export * from './redisSubscribe'

export const RedisSmqConfig  = {
    namespace: 'espace-membre',
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        connect_timeout: 3600000,
    },
    log: {
        enabled: 0,
        options: {
            level: 'trace',
        },
    },
    monitor: {
        enabled: false,
        host: '127.0.0.1',
        port: 3000,
    },
};