import { isRightToLeft } from '#internal/main/locale.js'

describe('locale', () => {
  describe('isRightToLeft', () => {
    it('is true for rtl languages', () => {
      expect(isRightToLeft('he')).to.be.true
      expect(isRightToLeft('ar')).to.be.true
    })

    it('is false for ltr languages', () => {
      expect(isRightToLeft('en')).to.be.false
      expect(isRightToLeft('it')).to.be.false
    })
  })
})
