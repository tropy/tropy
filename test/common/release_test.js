'use strict'

const { resolve } = require('path')

describe('release', () => {
  const release = __require('common/release')

  describe('paths', () => {
    it('resolves to the src/lib folder', () => {
      expect(resolve(release.paths.lib, '..'))
        .to.equal(resolve(__dirname, '..', '..'))
    })
  })
})
