'use strict'

describe('Resource', () => {
  const { Resource } = __require('common/res')

  it('is a constructor', () => expect(Resource).to.be.a('function'))

  describe('.expand', () => {
    it('adds file extension and base directory', () => {
      expect(Resource.expand('main')).to.end(Resource.ext)
    })

    it('adds base directory', () => {
      expect(Resource.expand('main')).to.start(Resource.base)
    })
  })
})
