const crypto = require('crypto');
const getRawBody = require('raw-body');

function compute(secret, data) {
  const hmac = crypto.createHmac('sha1', secret);
  hmac.update(data);
  return hmac.digest();
}

async function checkSignaturePresence(req) {
  return Boolean(req.headers['x-hub-signature']);
}

async function checkSignatureValidity(req) {
  try {
    const header_comps = req.headers['x-hub-signature'].split('=');
    if (header_comps[0] !== 'sha1') {
      return false;
    }
    const signature_received = Buffer.from(header_comps[1], 'hex');

    req.body = await getRawBody(req, { encoding: 'utf-8' });
    const signature_computed = compute(req.signatureSecret, req.body);
    return crypto.timingSafeEqual(signature_received, signature_computed);
  } catch (e) {
    console.error(e);
    return false;
  }
}

module.exports = {
  compute,
  checkSignaturePresence,
  checkSignatureValidity,
};
