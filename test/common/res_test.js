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

  describe('.all', () => {
    it('opens all dictionaries', () =>
      expect(Strings.all())
        .eventually.to.be.instanceof(Strings)
        .and.have.deep.property('data.list.name', 'List'))
  })

  describe('.expand', () => {
    it('adds string directory', () => {
      expect(Strings.expand('mod')).to.match(/strings.mod\.yml/)
    })
  })

  describe('.open', () => {
    it('loads and parses the strings in the given locale', () =>
      expect(Strings.open('mod', 'en'))
        .eventually.to.have.property('data')
        .and.not.be.empty)
  })
})
