require('dotenv').config();
const fetch = require('node-fetch');

const objectToFormBody = (obj) => {
  const formBody = [];
  Object.keys(obj).forEach((property) => {
    const encodedKey = encodeURIComponent(property);
    const encodedValue = encodeURIComponent(obj[property]);
    formBody.push(`${encodedKey}=${encodedValue}`);
  });
  return formBody.join('&');
};

const createNewNote = async () => {
  const details = {
    email: process.env.SECRETARIAT_PAD_USERNAME,
    password: process.env.SECRETARIAT_PAD_PASSWORD,
  };

  const formBody = objectToFormBody(details);

  let resp = await fetch('https://pad.incubateur.net');

  resp = await fetch('https://pad.incubateur.net/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      cookie: resp.headers.get('set-cookie'),
    },
    body: formBody,
  });

  const cookie = resp.headers.get('set-cookie');

  const NEWSLETTER_TEMPLATE_ID = 'K9_mewG9SmSvAFjSqHUdHw';
  const newsletterTemplateContent = await fetch(`https://pad.incubateur.net/${NEWSLETTER_TEMPLATE_ID}/download`, {
    headers: {
      cookie,
    },
    method: 'GET',
  }).then((res) => res.text());
  const result = await fetch('https://pad.incubateur.net/new', {
    headers: {
      'Content-Type': 'text/markdown',
      cookie,
    },
    body: newsletterTemplateContent,
    method: 'POST',
  });
  return result;
};

module.exports.createNewNote = createNewNote;
