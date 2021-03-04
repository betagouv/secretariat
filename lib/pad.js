const axios = require('axios').default;
const config = require('../config');

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
      email: config.padEmail,
      password: config.padPassword,
    };
    this.cookiePromise = this.getCookie();
  }

  async getCookie() {
    const formBody = objectToFormBody(this.details);

    let resp = await axios(config.padURL, {
      method: 'head',
    });

    resp = await axios(`${config.padURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        cookie: resp.headers['set-cookie'][0],
      },
      data: formBody,
    });

    const cookie = resp.headers['set-cookie'][0];
    return cookie;
  }

  async getNoteWithId(newsletterTemplateId) {
    const cookie = await this.cookiePromise;
    const result = await axios(`${config.padURL}/${newsletterTemplateId}/download`, {
      headers: {
        cookie,
      },
      method: 'GET',
    }).then((res) => res.data);
    return result;
  }

  async createNewNoteWithContent(newsletterTemplateContent) {
    const cookie = await this.cookiePromise;
    const result = await axios(`${config.padURL}/new`, {
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
