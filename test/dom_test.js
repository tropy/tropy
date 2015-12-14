'use strict';

describe('dom', function () {
  let dom = __require('dom');

  describe('.css', function () {
    it('creates a style node', function () {
      expect(dom.css()).to.be.instanceof(HTMLStyleElement);
    });
  });
});
