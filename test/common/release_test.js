'use strict'

const { resolve } = require('path')

describe('release', () => {
  const release = __require('common/release')

  describe('lib', () => {
    it('resolves to the src/lib folder', () => {
      expect(resolve(release.lib, '..'))
        .to.equal(resolve(__dirname, '..', '..'))
    })
  })
})
