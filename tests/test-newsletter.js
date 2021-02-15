const { createNewsletter } = require('../schedulers/newsletterScheduler');

describe('Newsletter', () => {
  describe('cronjob', () => {
    it('should create new note', async () => {
      const res = await createNewsletter();
      console.log(res);
    });
  });
});
