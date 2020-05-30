'use strict'

describe('AppMenu', () => {
  const { Menu } = require('electron')
  const { AppMenu } = __require('browser/menu')

  let menu

  before(() => {
    menu = new AppMenu({
      defaults: { locale: 'en' },
      state: { recent: [], locale: 'en' },
      getHistory: () => ({}),
      plugins: { available: sinon.stub().returns([]) },
      wm: { windows: {} },
      updater: {}
    })
  })

  describe('#load', () => {
    beforeEach(() => {
      sinon.spy(Menu, 'setApplicationMenu')
    })

    afterEach(() => {
      Menu.setApplicationMenu.restore()
      Menu.setApplicationMenu(null)
    })

    it('loads, compiles and sets the app menu', async () => {
      await menu.load()

      expect(menu).to.have.property('template')
      expect(Menu.setApplicationMenu).to.have.been.called
    })
  })
})
