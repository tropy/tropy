import { darwin, linux } from './common/os.js'
import { append, create, on, toggle } from './dom.js'
import ARGS from './args.js'

export class WindowControls {
  constructor() {
    this.layout = new ButtonLayout()

    if (linux && ARGS.controls)
      this.layout.parse(ARGS.controls)
  }

  mount(win) {
    this.root = create('div', { class: 'window-controls' })

    append(Button('close', () => { win.close() }), this.root)

    if (this.layout.maximize) {
      append(Button('maximize', () => { win.maximize() }), this.root)
      toggle(win.html, 'window-controls-maximize', true)
    }

    if (this.layout.minimize) {
      append(Button('minimize', () => { win.minimize() }), this.root)
      toggle(win.html, 'window-controls-minimize', true)
    }

    if (!darwin) {
      append(
        Button('menu', (event) => { win.menu(event) }, { tabindex: '0' }),
        this.root)

      toggle(win.html, 'window-controls-menu', true)
    }

    toggle(win.html, `window-controls-${this.layout.placement}`, true)

    append(this.root, win.body)
  }
}

function Button(type, action, attrs = {}) {
  let button = create('button', {
    tabindex: '-1',
    class: type,
    ...attrs
  })

  on(button, 'click', action)

  return button
}

class ButtonLayout {
  placement = darwin ? 'left' : 'right'
  maximize = true
  minimize = true

  // Parses org.gnome.desktop.wm.preferences.button-layout
  parse(string = ':close') {
    let [left, right] = string.split(':').map(b => b.split(','))
    let buttons = left.includes('close') ? left : right

    this.placement = buttons === left ? 'left' : 'right'
    this.maximize = buttons.includes('maximize')
    this.minimize = buttons.includes('minimize')
  }
}
