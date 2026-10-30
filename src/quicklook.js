import { existsSync as exists } from 'node:fs'
import { join } from 'node:path'
import { isInput, off, on, stylesheet, toggle } from './dom.js'
import { StyleSheet } from './res.js'

export class QuickLook {
  isVisible = false
  size = null
  popup = null

  constructor (win) {
    this.win = win
    win.on('settings.update', () => this.sync())
  }

  // Opens the quicklook companion window, or reattaches to it
  // after a reload, and returns its (cleared) body to render into.
  // Returns null if this window has no quicklook.
  open () {
    if (this.popup == null || this.popup.closed) {
      this.popup = window.open('', 'quicklook')

      if (this.popup != null)
        this.setup(this.popup.document)
    }

    return this.popup?.document.body ?? null
  }

  // Sets up the blank (or stale) document like a window of its own.
  setup (doc) {
    let user = join(this.win.args.data, 'style.css')

    doc.documentElement.className = process.platform
    toggle(doc.documentElement, 'vibrancy', this.win.args.quicklook?.vibrancy === true)
    doc.head.replaceChildren(
      stylesheet(StyleSheet.expand('quicklook')),
      ...[user].filter(exists).map(stylesheet))

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

  // The title's height, to keep when fitting the window to the content.
  get header () {
    return this.popup?.document
      .querySelector('.quicklook-title')
      ?.getBoundingClientRect().height ?? 0
  }

  resize (size) {
    this.size = size

    if (size == null)
      this.hide()
    else if (this.isVisible)
      this.show()
  }

  show () {
    if (this.size != null)
      this.win.send('quicklook', 'show', { ...this.size, header: this.header })
  }

  hide () {
    this.win.send('quicklook', 'hide')
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
