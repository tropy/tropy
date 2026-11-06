import { redactHome } from '#tropy/common/log.js'

describe('log', () => {
  describe('redactHome', () => {
    it('replaces the home folder in serialized paths', () => {
      let line = (path) => JSON.stringify({ path, msg: `open ${path}` })

      expect(redactHome('/Users/x')(line('/Users/x/A.tropy')))
        .to.equal(line('~/A.tropy'))
      expect(redactHome('C:\\Users\\x')(line('C:\\Users\\x\\A.tropy')))
        .to.equal(line('~\\A.tropy'))
    })

    it('keeps folders that only start like the home folder', () => {
      let line = JSON.stringify({ path: '/Users/xy/A.tropy' })
      expect(redactHome('/Users/x')(line)).to.equal(line)
    })
  })
})
