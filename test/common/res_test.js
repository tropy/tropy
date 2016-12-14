'use strict'

const { Resource, Menu, Strings } = __require('common/res')

describe('Resource', () => {
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

describe('Menu', () => {
  it('is a Resource', () => {
    expect(new Menu()).to.be.instanceof(Resource)
  })

  describe('.expand', () => {
    it('adds menu directory', () => {
      expect(Menu.expand('main')).to.match(/menu.main\.yml/)
    })
  })

  describe('.open', () => {
    it('loads and parses the given menu', () => (
      expect(Menu.open('app'))
        .eventually.to.have.property('template')
        .and.not.be.empty
    ))
  })
})

describe('Strings', () => {
  it('is a Resource', () => {
    expect(new Strings()).to.be.instanceof(Resource)
  })

  describe('.expand', () => {
    it('adds string directory', () => {
      expect(Strings.expand('en')).to.match(/en\.yml/)
    })
  })

  describe('.open', () => {
    it('loads and parses the strings in the given locale', () =>
      expect(Strings.open('en')).eventually.to.have.property('locale', 'en'))

    it('fails if locale does not exist', () =>
      expect(Strings.open('yz')).eventually.to.be.rejected)
  })

  describe('.openWithFallback', () => {
    it('fallsback to the default locale', () =>
      expect(Strings.openWithFallback('yz'))
        .eventually.to.have.property('locale', 'en'))
  })
})
