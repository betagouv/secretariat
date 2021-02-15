const nock = require('nock');

const { createNewsletter } = require('../schedulers/newsletterScheduler');

describe('Newsletter', () => {
  describe('cronjob', () => {
    it('should create new note', async () => {
      const incubateurHead = nock('https://pad.incubateur.net').persist()
      .head(/.*/)
      .reply(200, {
        status: 'OK',
      }, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const incubateurPost1 = nock('https://pad.incubateur.net').persist()
      .post(/^.*login.*/)
      .reply(200, {}, {
        'set-cookie': '73dajkhs8934892jdshakldsja',
      });

      const incubateurGet = nock('https://pad.incubateur.net')
      .get(/^.*\/download/)
      .reply(200, '# TITLE ### TEXT CONTENT');

      const incubateurPost2 = nock('https://pad.incubateur.net')
      .post(/^.*new/)
      .reply(200, '# TITLE ### TEXT CONTENT');

      const res = await createNewsletter();
      incubateurHead.isDone().should.be.true;
      incubateurGet.isDone().should.be.true;
      incubateurPost1.isDone().should.be.true;
      incubateurPost2.isDone().should.be.true;

      console.log(res);
    });
  });
});
