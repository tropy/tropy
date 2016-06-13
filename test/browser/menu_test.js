'use strict'

describe('AppMenu', () => {
  const { Menu } = require('electron')
  const AppMenu = __require('browser/menu')

  let appmenu

  before(() => {
    appmenu = new AppMenu(sinon.stub())
  })

  describe('#load', () => {
    it('loads and translates menu template', () => (
      expect(appmenu.load())
        .eventually
        .to.have.property('menu')
        .and.be.instanceof(Menu)
    ))
  })

})
