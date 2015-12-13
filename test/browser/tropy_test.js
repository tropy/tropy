'use strict';

describe('Tropy', function () {
  const Tropy = load('browser/tropy');

  it('is a singleton class', function () {
    expect(new Tropy()).to.equal(new Tropy());
  });
});
