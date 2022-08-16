export const RedisSmqConfig  = {
    namespace: 'espace-membre',
    redis: {
        host: undefined,
        port: undefined,
        url: process.env.REDIS_URL,
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