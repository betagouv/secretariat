import { isValidGithubUserName } from "@/lib/github";

describe('Github lib', () => {
  describe('isValidGithubUserName', () => {
    describe('github validation functions', () => {
      it('should return false if github input is a URL', () => {
        isValidGithubUserName('https://github.com/username').should.be.false;
      });

      it('should return false if github input contains a @', () => {
        isValidGithubUserName('@username').should.be.false;
      });

      it('should return false if github input starts or ends with a hyphen ', () => {
        isValidGithubUserName('-username').should.be.false;
        isValidGithubUserName('username-').should.be.false;
        isValidGithubUserName('user-name').should.be.true;
      });

      it('should return true if username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen', () => {
        isValidGithubUserName('username').should.be.true;
      });
    });
  });
});
