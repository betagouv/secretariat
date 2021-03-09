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
  constructor(email, password, url) {
    this.url = url;
    this.details = {
      email,
      password,
    };
    this.cookiePromise = this.getCookie();
  }

  async getCookie() {
    const formBody = objectToFormBody(this.details);

    let resp = await axios(this.url, {
      method: 'head',
    });

    resp = await axios(`${this.url}/login`, {
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
    const result = await axios(`${this.url}/${newsletterTemplateId}/download`, {
      headers: {
        cookie,
      },
      method: 'GET',
    }).then((res) => res.data);
    return result;
  }

  async createNewNoteWithContent(newsletterTemplateContent) {
    const cookie = await this.cookiePromise;
    const result = await axios(`${this.url}/new`, {
      headers: {
        'Content-Type': 'text/markdown',
        cookie,
      },
      data: newsletterTemplateContent,
      method: 'POST',
    });
    return result;
  }

  async createNewNoteWithContentAndAlias(newsletterTemplateContent, alias) {
    const cookie = await this.cookiePromise;
    const result = await axios(`${config.padURL}/new/${alias}`, {
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
