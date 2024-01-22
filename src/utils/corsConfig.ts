import config from '@/config';

var whitelist = config.CORS_ORIGIN;

const corsOptions = {
  origin: function (origin, callback) {
    const isAllowed = whitelist.some((allowedOrigin) => {
      // Check if the whitelist entry is a string representation of a regex
      if (allowedOrigin.startsWith('/') && allowedOrigin.endsWith('/')) {
        const pattern = allowedOrigin.slice(1, -1); // Remove the slashes
        const regex = new RegExp(pattern);
        return regex.test(origin);
      }
      // Handle normal string comparison
      return origin === allowedOrigin;
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
