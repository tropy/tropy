import { getLocale, isRightToLeft, defaultLocale } from '#tropy/main/locale.js'

describe('locale', () => {
  describe('getLocale', () => {
    it('returns supported locales as-is', () => {
      expect(getLocale('en')).to.equal('en')
      expect(getLocale('de')).to.equal('de')
      expect(getLocale('ja')).to.equal('ja')
      expect(getLocale('fr')).to.equal('fr')
    })

    it('maps aliases', () => {
      expect(getLocale('zh')).to.equal('cn')
    })

    it('falls back to default for unsupported locales', () => {
      expect(getLocale('xx')).to.equal(defaultLocale)
      expect(getLocale('zz')).to.equal(defaultLocale)
    })

    it('falls back to default for empty/null input', () => {
      expect(getLocale('')).to.equal(defaultLocale)
      expect(getLocale(null)).to.equal(defaultLocale)
    })
  })

  describe('isRightToLeft', () => {
    it('is true for rtl languages', () => {
      expect(isRightToLeft('he')).to.be.true
      expect(isRightToLeft('ar')).to.be.true
    })

    it('is false for ltr languages', () => {
      expect(isRightToLeft('en')).to.be.false
      expect(isRightToLeft('it')).to.be.false
    })

    it('is false for invalid locales', () => {
      expect(isRightToLeft('not-a-locale')).to.be.false
      expect(isRightToLeft('')).to.be.false
      expect(isRightToLeft(null)).to.be.false
    })
  })

  describe('defaultLocale', () => {
    it('is English', () => {
      expect(defaultLocale).to.equal('en')
    })
  })
})
