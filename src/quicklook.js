import { isInput, off, on } from './dom.js'

export class QuickLook {
  isVisible = false
  port = null
  html = ''

  // Used in QuickLook window only
  ports = new Map()
  attached = null

  constructor (win) {
    this.win = win
  }

  get isQuickLookWindow () {
    return this.win.type === 'quicklook'
  }

  connect (port) {
    this.port?.close()
    this.port = port
    this.port.postMessage(this.html)
  }

  update (html) {
    if (html !== this.html) {
      this.html = html
      this.port?.postMessage(html)
    }
  }

  resize (size) {
    this.win.send('quicklook', 'resize', size)
  }

  show () {
    this.win.send('quicklook', 'show')
  }

  hide () {
    this.win.send('quicklook', 'hide')
  }

  render () {
    document.getElementById('main').innerHTML =
      this.ports.get(this.attached)?.html ?? ''
  }

  handleMessage ({ type, id, isVisible }, [port] = []) {
    switch (type) {
      case 'port':
        if (this.isQuickLookWindow)
          this.listen(port, id)
        else
          this.connect(port)
        break
      case 'attach':
        this.attached = id
        this.render()
        break
      case 'state':
        this.setVisible(isVisible)
        break
    }
  }

  listen (port, id) {
    let entry = { port, html: '' }
    this.ports.set(id, entry)

    port.onmessage = ({ data }) => {
      entry.html = data
      if (id === this.attached) this.render()
    }

    port.addEventListener('close', () => {
      this.ports.delete(id)
    })
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
