require('dotenv').config();
const axios = require('axios').default;

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

    let resp = await axios('https://pad.incubateur.net');

    resp = await axios('https://pad.incubateur.net/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        cookie: resp.headers['set-cookie'][0],
      },
      data: formBody,
    });

    const cookie = resp.headers['set-cookie'][0];
    this.cookie = cookie;
    return this.cookie;
  }

  async getNoteWithId(newsletterTemplateId) {
    const cookie = await this.getCookie();
    const result = await axios(`https://pad.incubateur.net/${newsletterTemplateId}/download`, {
      headers: {
        cookie,
      },
      method: 'GET',
    }).then((res) => res.data);
    return result;
  }

  async createNewNoteWithContent(newsletterTemplateContent) {
    const cookie = await this.getCookie();
    const result = await axios('https://pad.incubateur.net/new', {
      headers: {
        'Content-Type': 'text/markdown',
        cookie,
      },
      data: newsletterTemplateContent,
      method: 'POST',
    });
    return result;
  }
}

module.exports = PAD;
