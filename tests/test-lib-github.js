const chai = require('chai');

const { isValidGithubUserName } = require('../lib/github');

describe('Github lib', () => {
  describe('isValidGithubUserName', () => {
    describe('github validation functions', () => {
      it('should return false if github input contains http', () => {
        isValidGithubUserName('https://github.com/username').should.be.false;
      });

      it('should return false if github input contains a @', () => {
        isValidGithubUserName('@username').should.be.false;
      });

      it('should return false if github input contains a @', () => {
        isValidGithubUserName('username').should.be.true;
      });
    });
  });
});
