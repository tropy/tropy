import { mock } from 'node:test'
import { Menu } from 'electron'
import { AppMenu } from '#tropy/main/menu.js'

describe('AppMenu', () => {
  let menu

  before(() => {
    menu = new AppMenu({
      defaults: { locale: 'en' },
      state: { locale: 'en' },
      getHistory: () => ({}),
      projects: { recent: [], get: () => null },
      plugins: { available: mock.fn(() => []) },
      wm: { windows: {} },
      updater: {}
    })
  })

  describe('load', () => {
    let setApplicationMenu

    beforeEach(() => {
      setApplicationMenu = mock.method(Menu, 'setApplicationMenu')
    })

    afterEach(() => {
      setApplicationMenu.mock.restore()
      Menu.setApplicationMenu(null)
    })

    it('loads, compiles and sets the app menu', async () => {
      await menu.load()

      expect(menu).to.have.property('template')
      expect(setApplicationMenu.mock.callCount()).to.be.greaterThan(0)
    })
  })
})
