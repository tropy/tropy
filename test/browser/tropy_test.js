'use strict';

describe('Tropy', function () {
  var Tropy = require('../../src/browser/tropy');

  it('is a singleton class', function () {
    expect(new Tropy()).to.equal(new Tropy());
  });
});
