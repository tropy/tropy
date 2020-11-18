import { Icon, Menu as MR } from '../common/res'
import { basename } from 'path'
import { error, warn } from '../common/log'
import { blank } from '../common/util'
import { BrowserWindow, Menu as M } from 'electron'

const SEPARATOR = { type: 'separator' }

export class Menu {
  static eachItem(menu, fn) {
    if (menu != null) {
      for (let item of menu.items) {
        fn(item)
        Menu.eachItem(item.submenu, fn)
      }
    }
  }

  constructor(app) {
    this.app = app
  }

  async loadTemplate(name) {
    let { template } = await MR.openWithFallback(
      this.app.defaultLocale,
      this.app.state.locale,
      name)

    return template
  }

  build(template, ...args) {
    return M.buildFromTemplate(
      template
        .map(item => this.compile(item, ...args))
        // Hiding of root items does not work at the moment.
        // See Electron #2895
        .filter(item => item.visible !== false)
    )
  }

  compile(item, win = BrowserWindow.getFocusedWindow(), event = {}) {
    item = { ...item }
    let { app } = this

    if (item.command)
      item.click = createResponder(item.command, app, event)

    if (item.label)
      Menu.ItemCompiler.label(item, app)

    if (item.color)
      Menu.ItemCompiler.color(item, app, win, event)

    if (item.window) {
      Menu.ItemCompiler.window(item, app, win, event)

      if (item.enabled && item.condition)
        Menu.ItemCompiler.condition(item, app, win, event)

    } else {
      if (item.condition)
        Menu.ItemCompiler.condition(item, app, win, event)
    }

    Menu.ItemCompiler[item.id]?.(item, app, win, event)

    if (item.submenu) {
      item.submenu = item.submenu.map(submenuItem =>
        this.compile(submenuItem, win, event)
      )
    }

    return item
  }
}

export class AppMenu extends Menu {
  static get instance() {
    return M.getApplicationMenu()
  }

  static getItems(...args) {
    let { instance } = AppMenu
    return args.map(id => instance?.getMenuItemById(id))
  }

  async load(name = 'app') {
    this.template = await this.loadTemplate(name)
    this.update()
  }

  reload() {
    this.update()
  }

  update() {
    M.setApplicationMenu(this.build(this.template))
  }

  handleHistoryChange(history = this.app.getHistory()) {
    let [undo, redo] = AppMenu.getItems('undo', 'redo')

    if (undo)
      undo.enabled = history?.past > 0
    if (redo)
      redo.enabled = history?.future > 0
  }

  handleThemeChange(theme = this.app.state.theme) {
    let [themes] = AppMenu.getItems('theme')

    Menu.eachItem(themes?.submenu, (item) => {
      item.checked = item.id === theme
      item.enabled = !item.checked
    })
  }

  handleUpdaterChange = () => {
    AppMenu
      .getItems('updater-check', 'updater-is-checking', 'updater-install')
      .forEach(item => {
        Menu.ItemCompiler[item?.id]?.(item, this.app)
      })
  }

  handleWindowChange = () => {
    Menu.eachItem(AppMenu.instance, (item) => {
      if (item.window) {
        Menu.ItemCompiler.window(item, this.app)

        if (item.enabled && item.condition) {
          Menu.ItemCompiler.condition(item, this.app)
        }
      }
    })

    this.handleHistoryChange()
  }
}


export class ContextMenu extends Menu {
  static scopes = {}

  async load(name = 'context') {
    this.templates = await this.loadTemplate(name)
  }

  show({ scope, event }, win) {
    return new Promise((resolve, reject) =>  {
      try {
        let settings = [
          ...ContextMenu.scopes[scope]
        ]

        if (scope !== 'default')
          settings = ContextMenu.scopes.default.concat(settings)

        if (this.app.dev || this.app.debug)
          settings.push('dev')

        let template = settings.flatMap(id => ([
          SEPARATOR,
          ...this.templates[id]
        ])).slice(1)

        this.menu = this.build(template, win, event)

        this.menu.popup({
          win,
          positioningItem: settings.position,
          callback: () => {
            this.menu = null
            resolve()
          }
        })
      } catch (e) {
        error({
          stack: e.stack,
          scope
        }, `failed to show context-menu: ${e.message}`)
        reject(e)
      }
    })
  }
}

{
  const { scopes } = ContextMenu

  scopes.default = ['history']

  scopes.sidebar = ['project', 'lists', 'tags']
  scopes.sidebar.position = 2

  scopes.lists = [...scopes.sidebar]
  scopes.lists.position = 5

  scopes.list = ['project', 'lists', 'list', 'tags']
  scopes.list.position = 5

  scopes.tags = [...scopes.sidebar]
  scopes.tags.position = 7

  scopes.tag = [...scopes.sidebar, 'tag']
  scopes.tag.position = 7

  scopes.items = ['items']
  scopes.items.position = 2

  scopes.item = [
    ...scopes.items,
    'item',
    'item-read-only',
    'item-rotate']
  scopes.item.position = 2

  scopes['item-read-only'] = [
    'item-read-only']
  scopes['item-read-only'].position = 2

  scopes.trash = [
    ...scopes.sidebar,
    'trash']
  scopes.trash.position = 10

  scopes.photo = [
    'photo',
    'photo-read-only',
    'photo-rotate']
  scopes.photo.position = 2

  scopes['photo-read-only'] = [
    'photo-read-only']
  scopes['photo-read-only'].position = 2

  scopes.selection = [
    'photo-read-only',
    'selection-read-only',
    'selection',
    'selection-rotate']
  scopes.selection.position = 9

  scopes['selection-read-only'] = [
    'photo-read-only',
    'selection-read-only']
  scopes['selection-read-only'].position = 5

  scopes.note = ['note']
  scopes.note.position = 2

  scopes['metadata-list'] = [
    'metadata-list']
  scopes['metadata-list'].position = 2

  scopes['metadata-field'] = [
    ...scopes['metadata-list'],
    'metadata-field']
  scopes['metadata-field'].position = 2

  scopes['item-bulk'] = [
    ...scopes.items,
    'item-bulk-read-only',
    'item-bulk',
    'item-rotate']
  scopes['item-bulk'].position = 2

  scopes['item-bulk-read-only'] = [
    'item-bulk-read-only']
  scopes['item-bulk-read-only'].position = 2

  scopes['item-list'] = [
    ...scopes.items,
    'item-list',
    'item',
    'item-read-only',
    'item-rotate']
  scopes['item-list'].position = 2

  scopes['item-bulk-list'] = [
    ...scopes.items,
    'item-bulk-list',
    'item-bulk-read-only',
    'item-bulk',
    'item-rotate']
  scopes['item-bulk-list'].position = 2

  scopes['item-deleted'] = [
    'item-read-only',
    'item-deleted']
  scopes['item-deleted'].position = 2

  scopes['item-bulk-deleted'] = [
    'item-bulk-read-only',
    'item-bulk-deleted']
  scopes['item-bulk-deleted'].position = 2

  scopes['item-read-only'] = ['item-read-only']
  scopes['item-read-only'].position = 2

  scopes['item-bulk-read-only'] = ['item-bulk-read-only']
  scopes['item-bulk-read-only'].position = 2

  scopes['item-tag'] = ['item-tag']
  scopes['item-tag'].position = 2

  scopes['item-view'] = ['item-view']
  scopes['item-view'].position = 2

  scopes.notepad = [
    ...scopes['item-view'],
    'notepad']
  scopes.notepad.position = 2

  scopes.esper = [...scopes['item-view']]
  scopes.esper.position = 2
}


Menu.ItemCompiler = {
  'window': (item, app) => {
    switch (item.window) {
      case null:
      case undefined:
        break
      case '*':
        item.enabled = !app.wm.empty
        break
      default:
        if (item.window.startsWith('!'))
          item.enabled = blank(app.wm.windows[item.window.slice(1)])
        else
          item.enabled = !blank(app.wm.windows[item.window])
    }
  },

  'color': (item, app, win, event) => {
    let [col, ctx, cmd] = item.color

    item.type = 'checkbox'
    item.checked = event.target?.[ctx] === col

    if (col != null && col !== 'random')
      item.icon = Icon.color(col)
    if (cmd)
      item.click = createResponder(cmd, app, event, col)
  },

  'label': (item, app) => {
    item.label = item.label.replace(/%(\w+)/g, (_, prop) =>
      app[prop] || prop)
  },

  // Electron does not support removing menu items
  // dynamically (#527), therefore we currently populate
  // recent projects only in the translation loop.
  'recent': (item, app) => {
    if (app.state.recent.length) {
      item.enabled = true

      item.submenu = [
        ...app.state.recent.map((file, idx) => ({
          label: `${idx + 1}. ${basename(file)}`,
          click: () => app.open(file)
        })),
        ...item.submenu
      ]
    }
  },

  'updater-check': (item, app) => {
    item.enabled = app.updater.isSupported
    item.visible = app.updater.canCheck
  },

  'updater-is-checking': (item, app) => {
    item.visible = app.updater.isChecking
  },

  'updater-install': (item, app) => {
    item.enabled = app.updater.isSupported
    item.visible = app.updater.isUpdateReady
  },

  'dev': (item, app) => {
    item.visible = (app.dev || app.debug)
  },

  'theme': (item, app) => {
    item.submenu = item.submenu.map(theme => ({
      ...theme,
      checked: (theme.id === app.state.theme),
      enabled: (theme.id !== app.state.theme),
      click: createResponder('app:switch-theme', app, theme.id)
    }))
  },

  'undo': (item, app, win) => {
    if (app.getHistory(win)?.past > 0) {
      item.enabled = true
      // item.label = `${item.label} ${this.app.getHistory(win).undo}`
    } else {
      item.enabled = false
    }
  },

  'redo': (item, app, win) => {
    if (app.getHistory(win)?.future > 0) {
      item.enabled = true
      // item.label = `${item.label} ${this.app.getHistory(win).redo}`
    } else {
      item.enabled = false
    }
  },

  'export': (item, app, win, event) => {
    let plugins = app.plugins.available('export')

    if (plugins.length > 0) {
      item.submenu = [
        ...item.submenu,
        { type: 'separator' },
        ...plugins.map(({ id, name }) => ({
          label: name,
          click: createResponder('app:export-item', app, {
            target: event?.target,
            plugin: id
          })
        }))
      ]
    }
  },

  'tag': (item, app, win, event) => {
    let { target } = event
    let tags = app.getTags(win)

    if (!tags.length) {
      item.enabled = false

    } else {
      item.submenu = [
        ...item.submenu,
        ...tags.map(tag => ({
          type: 'checkbox',
          label: tag.name,
          checked: target.tags.includes(tag.id),
          click: createResponder('app:toggle-item-tag', app, {
            id: target.id,
            tag: tag.id
          })
        }))
      ]

      if (target.tags.length) {
        item.submenu[0] = {
          ...item.submenu[0],
          checked: false,
          enabled: true,
          click: createResponder('app:clear-item-tags', app, {
            id: target.id
          })
        }
      }
    }
  },

  'line-wrap': (item, app, win, event) => {
    item.checked = !!event.target.wrap
  },

  'line-numbers': (item, app, win, event) => {
    item.checked = !!event.target.numbers
  },

  'writing-mode': (item, app, win, event) => {
    item.submenu = item.submenu.map(li => ({
      ...li,
      checked: li.mode === event.target.mode,
      click: createResponder('app:writing-mode', app, {
        id: event.target.id,
        mode: li.mode
      })
    }))
  },

  'item-view-layout': (item, app, win, event) => {
    item.submenu = item.submenu.map(li => ({
      ...li,
      checked: li.id === event.target.layout,
      click: createResponder('app:settings-persist', app, {
        layout: li.id
      })
    }))
  },

  'condition': (item, app, win, event) => {
    let { condition } = item
    let negate = false

    if (condition.startsWith('!')) {
      negate = true
      condition = condition.slice(1)
    }

    if (condition in Menu.ItemConditions)
      item.enabled = Menu.ItemConditions[condition]({ app, event })
    else
      item.enabled = !!event?.target?.[condition]

    if (negate)
      item.enabled = !item.enabled

    item.visible = item.enabled
  }
}

Menu.ItemConditions = {
  isMultiplePhotos({ event }) {
    return event?.target?.photos?.length > 1
  },

  isMultipleItems({ event }) {
    return event?.target?.items?.length > 1
  },

  isSingleItem(...args) {
    return !Menu.ItemConditions.isMultipleItems(...args)
  },

  isProjectReadOnly({ app, win }) {
    return app.getProject(win)?.isReadOnly
  }
}

function createResponder(cmd, app, ...params) {
  let [prefix, action] = cmd.split(':', 2)

  switch (prefix) {
    case 'app':
      return (_, win) =>
        app.emit(cmd, win, ...params)
    case 'win':
      return (_, win) =>
        win?.webContents.send(action, params)
    default:
      warn(`no responder for menu command ${cmd}`)
  }
}
