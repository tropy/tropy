import { mock } from 'node:test'
import { Menu } from 'electron'
import { AppMenu, Menu as TropyMenu } from '#tropy/main/menu.js'

describe('AppMenu', () => {
  let menu

  before(() => {
    menu = new AppMenu({
      defaults: { locale: 'en' },
      state: { locale: 'en' },
      getHistory: () => ({}),
      pm: { recent: [], get: () => null },
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

    it('rebuilds the menu once for bursts of reloads', async () => {
      await menu.load()
      setApplicationMenu.mock.resetCalls()

      menu.reload()
      menu.reload()
      menu.reload.flush()

      expect(setApplicationMenu.mock.callCount()).to.equal(1)
    })
  })
})

describe('Menu conditions', () => {
  let win = {}
  let other = {}

  let app = {
    pm: {
      get: (w) => (w === win) ? { isReadOnly: false } : null,
      has: (w) => w === win,
      window: (path) => (path === '/open.tpy') ? other : null
    }
  }

  let enabled = (condition, event) => {
    let item = { condition }
    TropyMenu.ItemCompiler.condition(item, app, win, event)
    return item.enabled
  }

  it('resolves project conditions for the menu\'s window', () => {
    expect(enabled('isProjectOpen')).to.be.true
    expect(enabled('!isProjectReadOnly')).to.be.true
  })

  it('checks whether a target project is open', () => {
    expect(enabled('!isTargetProjectOpen', { target: { path: '/open.tpy' } })).to.be.false
    expect(enabled('!isTargetProjectOpen', { target: { path: '/closed.tpy' } })).to.be.true
  })
})
