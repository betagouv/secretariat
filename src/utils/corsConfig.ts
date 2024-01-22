import config from '@/config';

var whitelist = config.CORS_ORIGIN;

const corsOptions = {
  origin: function (origin, callback) {
    const isAllowed = whitelist.some((allowedOrigin: RegExp | string) => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed || process.env.NODE_ENV === 'test' || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: 'POST, PUT, OPTIONS, DELETE, GET',
  allowedHeaders:
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-HTTP-Method-Override, Set-Cookie, Cookie',
};

export { corsOptions };
