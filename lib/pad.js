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

class PAD {
  constructor() {
    this.details = {
      email: process.env.SECRETARIAT_PAD_USERNAME,
      password: process.env.SECRETARIAT_PAD_PASSWORD,
    };
    this.cookiePromise = this.getCookie();
  }

  async getCookie() {
    if (this.cookie) {
      return this.cookie;
    }
    const formBody = objectToFormBody(this.details);

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
    this.cookie = cookie;
    return this.cookie;
  }

  async getNoteWithId(newsletterTemplateId) {
    const cookie = await this.getCookie();
    const result = await fetch(`https://pad.incubateur.net/${newsletterTemplateId}/download`, {
      headers: {
        cookie,
      },
      method: 'GET',
    }).then((res) => res.text());
    return result;
  }

  async createNewNoteWithContent(newsletterTemplateContent) {
    const cookie = await this.getCookie();
    const result = await fetch('https://pad.incubateur.net/new', {
      headers: {
        'Content-Type': 'text/markdown',
        cookie,
      },
      body: newsletterTemplateContent,
      method: 'POST',
    });
    return result;
  }
}

module.exports = PAD;
