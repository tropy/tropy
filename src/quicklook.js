import { ipcRenderer as ipc } from 'electron'
import { existsSync as exists } from 'node:fs'
import { join } from 'node:path'
import { isInput, nextFrame, off, on, stylesheet } from './dom.js'
import { StyleSheet } from './res.js'

export class QuickLook {
  isVisible = false
  size = null
  popup = null

  constructor (win) {
    this.win = win
    win.on('settings.update', () => this.sync())
  }

  open () {
    if (this.popup == null || this.popup.closed) {
      this.popup = window.open('', 'quicklook')

      if (this.popup != null)
        this.setup(this.popup.document)
    }

    return this.popup?.document.body ?? null
  }

  setup (doc) {
    let user = join(this.win.args.data, 'style.css')

    doc.documentElement.className = process.platform
    doc.head.replaceChildren(
      stylesheet(StyleSheet.expand('quicklook')),
      ...(exists(user) ? [stylesheet(user)] : []))

    doc.body.id = 'quicklook'
    doc.body.replaceChildren()

    this.sync()
  }

  // Applies the window's zoom and font size.
  // The popup does not share the parent's zoom factor.
  sync () {
    let style = this.popup?.document.documentElement.style
    if (style == null) return

    let { fontSize, zoom } = this.win.args

    style.fontSize = fontSize
    style.zoom = zoom
    style.setProperty('--zoom', zoom)
  }

  // Fits the window to the content size, or hides it without content.
  // Resolves in the window's next frame after main applied the bounds,
  // so that content can be swapped in sync with the new size.
  async fit (size) {
    if (size?.width === this.size?.width && size?.height === this.size?.height)
      return

    this.size = size

    if (size == null) {
      await this.hide()
    } else {
      await this.invoke('fit')

      // Hidden windows may not get animation frames.
      if (this.isVisible) await nextFrame(this.popup)
    }
  }

  async show () {
    if (this.size != null)
      await this.invoke('show')
  }

  // Hidden right away: a pending fit must not wait for
  // a frame of the window being hidden.
  hide () {
    this.setVisible(false)
    return this.invoke('hide')
  }

  invoke (action) {
    return ipc.invoke('quicklook', action, this.size)
  }

  setVisible (isVisible) {
    if (isVisible !== this.isVisible) {
      this.isVisible = isVisible

      if (isVisible)
        on(document, 'keydown', this.handleKeyDown, { capture: true })
      else
        off(document, 'keydown', this.handleKeyDown, { capture: true })
    }
  }

  handleKeyDown = (event) => {
    if (event.key !== 'Escape' || isInput(event.target))
      return

    event.preventDefault()
    event.stopPropagation()
    this.hide()
  }
}
