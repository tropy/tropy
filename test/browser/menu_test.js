'use strict'

describe('AppMenu', () => {
  const { Menu } = require('electron')
  const { AppMenu } = __require('browser/menu')

  let menu

  before(() => {
    menu = new AppMenu({
      state: { recent: [] },
      history: {},
      updater: {}
    })
  })

  describe('#load', () => {
    it('loads and translates menu template', () => (
      expect(menu.load())
        .eventually
        .to.have.property('menu')
        .and.be.instanceof(Menu)
    ))
  })

})
