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
      let n1 = document.createElement('div')
      let n2 = document.createElement('div')

      dom.append(n1, n2)

      expect(n1.children).to.be.empty

      expect(n2.children).to.have.length(1)
      expect(n2.children.item(0)).to.equal(n1)
    })
  })
})
