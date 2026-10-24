import { MessageChannelMain, nativeTheme, screen } from 'electron'
import { getTitleBarOverlay, sanitizeWindowBounds } from './wm.js'
import { warn } from '../common/log.js'
import { darwin, linux } from '../common/os.js'
import { pick } from '../common/util.js'

export class QuickLook {
  window = null
  parent = null
  sizes = new WeakMap()

  constructor (wm) {
    this.wm = wm

    wm
      .on('create', (type, win, args) => {
        if (type === 'project') {
          this.window ??= this.open(args)

          // Subtle: on reload, the window's quicklook state is gone.
          win.on('ready', () => {
            this.sizes.delete(win)
            this.hide(win)
            this.connect(win)
          })
        }
      })
      .on('focus-change', (type, win) => {
        if (type === 'project') this.follow(win)
      })
      .on('close', (type, win) => {
        if (type === 'project') this.hide(win)
      })
      .on('closed', (type) => {
        if (type === 'quicklook') {
          this.window = null
          this.parent = null
          this.wm.send('project', 'quicklook', {
            type: 'state',
            isVisible: false
          })
        }

        if (type === 'project' && !this.wm.has('project'))
          this.wm.close('quicklook')
      })
  }

  async open (args) {
    try {
      let win = await this.wm.open('quicklook', {
        ...pick(args, [
          'data',
          'debug',
          'fontSize',
          'level',
          'locale',
          'log',
          'theme',
          'zoom'
        ]),
        frameless: !darwin,
        vibrancy: !nativeTheme.prefersReducedTransparency
      })

      await win.ready
      return win

    } catch (err) {
      warn({ err }, 'failed to open quicklook window')
      this.window = null
    }
  }

  handleClose (event, win) {
    if (!this.wm.has('project'))
      return false

    event.preventDefault()
    this.hide(win)
    return true
  }

  handleMessage (win, type, ...args) {
    switch (type) {
      case 'show':
        return this.show(win)
      case 'hide':
        return this.hide(win)
      case 'resize':
        return this.resize(win, ...args)
    }
  }

  async connect (win) {
    let quicklook = await this.window
    if (quicklook == null || quicklook.isDestroyed() || win.isDestroyed())
      return

    let { port1, port2 } = new MessageChannelMain()

    quicklook.webContents.postMessage('quicklook', {
      type: 'port',
      id: win.id
    }, [port1])

    win.webContents.postMessage('quicklook', { type: 'port' }, [port2])
  }

  async show (parent) {
    this.present(await this.window, parent)
  }

  async hide (sender) {
    let win = await this.window

    if (this.parent != null && (sender === this.parent || sender === win))
      this.dismiss(win)
  }

  async resize (sender, size) {
    this.sizes.set(sender, size)

    let win = await this.window

    if (this.parent === sender) {
      if (size)
        this.setBounds(win, sender)
      else
        this.dismiss(win)
    }
  }

  async follow (parent) {
    let win = await this.window

    if (this.parent == null || this.parent === parent)
      return

    if (!this.present(win, parent))
      this.dismiss(win)
  }

  present (win, parent) {
    if (win == null || !this.sizes.get(parent))
      return false
    if (win.isDestroyed() || parent.isDestroyed())
      return false

    if (this.parent !== parent) {
      if (this.parent != null)
        sendState(this.parent, false)

      attach(win, parent)
    }

    this.setBounds(win, parent)
    this.parent = parent

    win.showInactive()
    sendState(parent, true)

    return true
  }

  dismiss (win) {
    let parent = this.parent
    this.parent = null

    if (!win.isDestroyed()) {
      win.hide()
      attach(win, null)
    }

    sendState(parent, false)
  }

  // Fits quicklook to the parent's content size.
  // Centered on the parent's screen when shown or moved there;
  // otherwise, while visible, resized in place.
  setBounds (win, parent) {
    let { width, height } = this.sizes.get(parent)
    if (!(width > 0 && height > 0)) return

    // The title bar and padding around the content, see quicklook.scss.
    let frame = darwin ?
      { width: 12, height: 50 } :
      { width: 0, height: linux ? 46 : getTitleBarOverlay().height }

    let display = screen.getDisplayMatching(parent.getBounds())
    let { workArea } = display

    let anchor = (this.parent != null &&
      screen.getDisplayMatching(win.getContentBounds()).id === display.id) ?
      win.getContentBounds() :
      workArea

    // Fill most of the screen, like macOS Quick Look.
    let scale = Math.min(1,
      (0.9 * workArea.width - frame.width) / width,
      (0.95 * workArea.height - frame.height) / height)

    win.setAspectRatio(width / height, frame)

    width = Math.round(width * scale) + frame.width
    height = Math.round(height * scale) + frame.height

    win.setContentBounds(sanitizeWindowBounds({
      x: Math.round(anchor.x + (anchor.width - width) / 2),
      y: Math.round(anchor.y + (anchor.height - height) / 2),
      width,
      height
    }))
  }
}

function attach (win, parent) {
  win.setParentWindow(parent)
  win.webContents.send('quicklook', { type: 'attach', id: parent?.id ?? null })
}

function sendState (win, isVisible) {
  if (!win.isDestroyed())
    win.webContents.send('quicklook', { type: 'state', isVisible })
}
