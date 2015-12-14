'use strict';

describe('Tropy', function () {
  const Tropy = require(__src('browser/tropy'));

  it('is a singleton class', function () {
    expect(new Tropy()).to.equal(new Tropy());
  });
});
