const { createNewNote } = require('../schedulers/newsletterScheduler');

describe('Newsletter', () => {
  describe('cronjob', () => {
    it('should create new note', async () => {
      const res = await createNewNote();
      console.log(res);
    });
  });
});
