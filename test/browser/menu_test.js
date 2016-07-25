'use strict'

describe('AppMenu', () => {
  const { Menu } = require('electron')
  const AppMenu = __require('browser/menu')

  let appmenu

  before(() => {
    const app = sinon.stub()
    app.state = { recent: [] }

    appmenu = new AppMenu(app)
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
