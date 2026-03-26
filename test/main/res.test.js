import assert from 'node:assert/strict'
import { Resource, Menu, Strings } from '#tropy/main/res.js'

describe('res', () => {
  describe('Resource', () => {
    it('is a constructor', () => expect(Resource).to.be.a('function'))

    describe('expand', () => {
      it('adds file extension', () => {
        expect(Resource.expand('main')).to.match(new RegExp(`\\${Resource.ext}$`))
      })

      it('adds base directory', () => {
        expect(Resource.expand('main')).to.include(Resource.base)
      })
    })
  })

  describe('Menu', () => {
    it('is a Resource', () => {
      expect(new Menu()).to.be.instanceof(Resource)
    })

    describe('expand', () => {
      it('adds menu directory', () => {
        expect(Menu.expand('main')).to.match(/menu.main.en.yml/)
      })
    })

    describe('open', () => {
      it('loads and parses the given menu', async () => {
        let menu = await Menu.open('en', 'app')
        expect(menu).to.have.property('template').and.not.be.empty
      })
    })
  })

  describe('Strings', () => {
    it('is a Resource', () => {
      expect(new Strings()).to.be.instanceof(Resource)
    })

    describe('expand', () => {
      it('adds string directory', () => {
        expect(Strings.expand('en')).to.match(/en\.yml$/)
      })
    })

    describe('open', () => {
      it('loads and parses the strings in the given locale', async () => {
        expect(await Strings.open('en'))
          .to.have.property('locale', 'en')
      })

      it('fails if locale does not exist', async () => {
        await assert.rejects(() => Strings.open('yz'))
      })
    })

    describe('openWithFallback', () => {
      it('falls back to the default locale', async () => {
        expect(await Strings.openWithFallback('en', 'yz'))
          .to.have.property('locale', 'en')
      })
    })
  })
})
