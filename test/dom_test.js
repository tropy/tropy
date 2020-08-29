import * as dom from '../src/dom'

describe('dom', () => {
  describe('.css', () => {
    it('creates a style node', () => {
      expect(dom.css()).to.be.instanceof(HTMLStyleElement)
    })
  })

  describe('.stylesheet', () => {
    it('creates a link node', () => {
      let link = dom.stylesheet('theme.css')
      expect(link).to.be.instanceof(HTMLLinkElement)
      expect(link.getAttribute('href')).to.eql('theme.css')
    })
  })

  describe('ready', () => {
    it('resolves eventually', () =>
      expect(dom.ready).eventually.to.be.fulfilled)

    it('resolves to nothing', () =>
      expect(dom.ready).eventually.to.be.undefined)
  })

  describe('.attr()', () => {
    const attr = dom.attr
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

  describe('.create()', () => {
    it('creates element with attributes', () => {
      let n = dom.create('div', { tabindex: -1 })

      expect(n.tagName).to.eql('DIV')
      expect(n.getAttribute('tabindex')).to.eql('-1')
    })
  })

  describe('.append()', () => {
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
    let noop = () => {}

    beforeEach(() => {
      node = dom.element('div')
      sinon.stub(node, 'addEventListener')
      sinon.spy(node, 'removeEventListener')
    })

    describe('.on', () => {
      it('adds an event listener', () => {
        dom.on(node, 'click', noop)
        expect(node.addEventListener)
          .to.have.been.calledWith('click', noop)
      })

      it('can be called', () => {
        const listener = sinon.spy()
        node.addEventListener.restore()

        dom.on(node, 'custom', listener)

        dom.emit(node, 'custom')
        dom.emit(node, 'custom')

        expect(listener).to.have.been.calledTwice
      })
    })

    describe('.off', () => {
      it('removes an event listener', () => {
        dom.off(node, 'click', noop)
        expect(node.removeEventListener)
          .to.have.been.calledWith('click', noop)
      })
    })

    describe('.once', () => {
      it('adds an event listener', () => {
        dom.once(node, 'click', noop)

        expect(node.addEventListener)
          .to.have.been.called
      })

      it('is removed after the first call', () => {
        const listener = sinon.spy()
        node.addEventListener.restore()

        dom.once(node, 'custom', listener)

        dom.emit(node, 'custom')
        dom.emit(node, 'custom')

        expect(listener).to.have.been.calledOnce
      })
    })
  })

  describe('.loadImage()', () => {
    it('resolves when the image has loaded', () =>
      expect(dom.loadImage(F.images('PA140105.JPG').path))
        .to.eventually.be.fulfilled)

    it('rejects when the image fails to load', () =>
      expect(dom.loadImage(F.images('404.png').path))
        .to.eventually.be.rejected)
  })
})
