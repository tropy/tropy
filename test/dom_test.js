'use strict'

describe('dom', () => {
  const dom = __require('dom')

  describe('.css', () => {
    it('creates a style node', function () {
      expect(dom.css()).to.be.instanceof(HTMLStyleElement)
    })
  })

  describe('.stylesheet', () => {
    it('creates a link node', function () {
      let link = dom.stylesheet('theme.css')

      expect(link).to.be.instanceof(HTMLLinkElement)
      expect(link.getAttribute('href')).to.eql('theme.css')
    })
  })

  describe('.append', () => {
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

      it('removes listener after first callback', (done) => {
        node.addEventListener.restore()

        dom.once(node, 'click', () => {
          expect(node.removeEventListener)
            .to.have.been.called

          done()
        })

        expect(node.removeEventListener)
          .not.to.have.been.called

        dom.emit(node, 'click')
      })
    })
  })
})
