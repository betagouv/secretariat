import jwt from 'jsonwebtoken';
import config from '@/config';

export const getToken = (req) => {
  return (req.session && req.session.token) || null;
};

export const getJwtTokenForUser = (id) => {
  return jwt.sign({ id }, config.secret, { expiresIn: '7 days' });
};
