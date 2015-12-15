'use strict'

describe('dom', () => {
  const dom = __require('dom')

  describe('.css', () => {
    it('creates a style node', function () {
      expect(dom.css()).to.be.instanceof(HTMLStyleElement)
    })
  })
})
