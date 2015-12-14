'use strict';

describe('Tropy', function () {
  const Tropy = __require('browser/tropy');

  it('is a singleton class', function () {
    expect(new Tropy()).to.equal(new Tropy());
  });
});
