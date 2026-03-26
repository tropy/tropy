import process from 'node:process'
import * as release from '#tropy/common/release.js'

describe('release', () => {
  describe('channel', () => {
    it('is valid name', () => {
      expect(release.channel).to.be.oneOf(['latest', 'beta', 'alpha'])
    })
  })

  describe('feed', () => {
    it('includes platform name', () => {
      expect(release.feed).to.include(process.platform)
    })

    it('includes arch name', () => {
      expect(release.feed).to.include(process.arch)
    })
  })
})
