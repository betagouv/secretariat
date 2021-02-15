const { createNewNote, getNote } = require('../schedulers/newsletterScheduler');

describe('Newsletter', () => {
  describe('cronjob', () => {
    it('should create new note', async () => {
      await createNewNote();
    });
    it('should get content of note by id', async () => {
      await getNote();
    });
  });
});
