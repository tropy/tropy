'use strict'

describe('css', () => {
  const { cursor } = __require('css')

  describe('cursor', () => {
    it('returns a css url() for a single path', () => {
      expect(cursor('x.png'))
        .to.equal('url(./images/x.png) 1 1, default')

      expect(cursor('y.png', { x: 1, y: -1, fallback: 'move' }))
        .to.equal('url(./images/y.png) 1 -1, move')
    })

    it('returns an image-set for multiple paths', () => {
      expect(cursor(['x.png', 'y.png'])).to.equal(
        '-webkit-image-set(url(./images/x.png) 1x, url(./images/y.png) 2x) 1 1, default'
      )
    })
  })
})
