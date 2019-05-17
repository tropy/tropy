'use strict'

describe('css', () => {
  const { cursor } = __require('css')

  describe('cursor', () => {
    it('returns a css url() for a single path', () => {
      expect(cursor('x.png'))
        .to.match(/url\(.+cursors.x\.png\) 1 1, default/)

      expect(cursor('y.png', { x: 1, y: -1, fallback: 'move' }))
        .to.match(/url\(.+cursors.y\.png\) 1 -1, move/)
    })

    it('returns an image-set for multiple paths', () => {
      expect(cursor(['x.png', 'y.png']))
        .to.match(/url\(.+cursors.x\.png\) 1x/)
        .and.to.match(/url\(.+cursors.y\.png\) 2x/)
    })
  })
})
