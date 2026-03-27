import { mock } from 'node:test'
import { join } from 'node:path'
import * as dom from '#tropy/dom.js'

const images = join(import.meta.dirname, 'fixtures/images')

describe('dom', () => {
  describe('css', () => {
    it('creates a style node', () => {
      expect(dom.css()).to.be.instanceof(HTMLStyleElement)
    })
  })

  describe('stylesheet', () => {
    it('creates a link node', () => {
      let link = dom.stylesheet('theme.css')
      expect(link).to.be.instanceof(HTMLLinkElement)
      expect(link.getAttribute('href')).to.equal('theme.css')
    })
  })

  describe('ready', () => {
    it('resolves eventually', async () => {
      await dom.ready
    })

    it('resolves to nothing', async () => {
      expect(await dom.ready).to.be.undefined
    })
  })

  describe('attr', () => {
    const { attr } = dom
    let node

    beforeEach(() => node = dom.element('div'))

    it('returns the attribute value', () => {
      node.setAttribute('tabindex', -1)
      expect(attr(node, 'tabindex')).to.equal('-1')
    })

    describe('called with a value', () => {
      it('sets the value by default', () => {
        attr(node, 'tabindex', 0)
        expect(node.getAttribute('tabindex')).to.equal('0')
      })

      it('removes the value when null/undefined', () => {
        node.setAttribute('tabindex', -1)
        attr(node, 'tabindex', null)
        expect(node.hasAttribute('tabindex')).to.be.false
      })
    })
  })

  describe('create', () => {
    it('creates element with attributes', () => {
      let n = dom.create('div', { tabindex: -1 })

      expect(n.tagName).to.equal('DIV')
      expect(n.getAttribute('tabindex')).to.equal('-1')
    })
  })

  describe('append', () => {
    it('adds a node to another', () => {
      let n1 = dom.element('div')
      let n2 = dom.element('div')

      dom.append(n1, n2)

      expect(n1.children).to.be.empty
      expect(n2.children).to.have.length(1)
      expect(n2.children.item(0)).to.equal(n1)
    })
  })

  describe('event handling', () => {
    let node

    beforeEach(() => {
      node = dom.element('div')
    })

    describe('on', () => {
      it('adds an event listener', () => {
        let add = mock.method(node, 'addEventListener')
        let noop = () => {}

        dom.on(node, 'click', noop)
        expect(add.mock.calls[0].arguments[0]).to.equal('click')
        expect(add.mock.calls[0].arguments[1]).to.equal(noop)

        add.mock.restore()
      })

      it('can be called', () => {
        let listener = mock.fn()

        dom.on(node, 'custom', listener)
        dom.emit(node, 'custom')
        dom.emit(node, 'custom')

        expect(listener.mock.callCount()).to.equal(2)
      })
    })

    describe('off', () => {
      it('removes an event listener', () => {
        let remove = mock.method(node, 'removeEventListener')
        let noop = () => {}

        dom.off(node, 'click', noop)
        expect(remove.mock.calls[0].arguments[0]).to.equal('click')
        expect(remove.mock.calls[0].arguments[1]).to.equal(noop)

        remove.mock.restore()
      })
    })

    describe('once', () => {
      it('adds an event listener', () => {
        let add = mock.method(node, 'addEventListener')

        dom.once(node, 'click', () => {})
        expect(add.mock.callCount()).to.be.greaterThan(0)

        add.mock.restore()
      })

      it('is removed after the first call', () => {
        let listener = mock.fn()

        dom.once(node, 'custom', listener)
        dom.emit(node, 'custom')
        dom.emit(node, 'custom')

        expect(listener.mock.callCount()).to.equal(1)
      })
    })
  })

  // skip: spark:// protocol cannot load file:// images
  describe.skip('loadImage', () => {
    it('resolves when the image has loaded', async () => {
      await dom.loadImage(join(images, 'PA140105.JPG'))
    })

    it('rejects when the image fails to load', async () => {
      try {
        await dom.loadImage(join(images, '404.png'))
        expect.fail('should have rejected')
      } catch { /* expected */ }
    })
  })
})
