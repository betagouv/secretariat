import crypto from "crypto";
import getRawBody from "raw-body";

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
    const headerComps = req.headers['x-hub-signature'].split('=');
    if (headerComps[0] !== 'sha1') {
      return false;
    }
    const signatureReceived = Buffer.from(headerComps[1], 'hex');

    req.body = await getRawBody(req, { encoding: 'utf-8' });
    const signatureComputed = compute(req.signatureSecret, req.body);
    return crypto.timingSafeEqual(signatureReceived, signatureComputed);
  } catch (e) {
    console.error(e);
    return false;
  }
}

export {
  compute,
  checkSignaturePresence,
  checkSignatureValidity,
};
