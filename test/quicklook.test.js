import { mock } from 'node:test'
import { ipcRenderer } from 'electron'
import { QuickLook } from '#tropy/quicklook.js'

describe('QuickLook', () => {
  let ql

  let escape = (target = document.body) => {
    let event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    })
    target.dispatchEvent(event)
    return event
  }

  let sent = () => ipcRenderer.invoke.mock.calls.map(c => c.arguments)

  beforeEach(() => {
    mock.method(ipcRenderer, 'invoke', async () => {})

    ql = new QuickLook({
      args: { data: '/data', fontSize: '13px', zoom: 1.5 },
      on () {}
    })
  })

  afterEach(() => {
    ql.setVisible(false)
    mock.restoreAll()
  })

  describe('open', () => {
    let popup

    beforeEach(() => {
      popup = {
        closed: false,
        document: document.implementation.createHTMLDocument()
      }
      popup.document.body.innerHTML = '<p>stale</p>'
      mock.method(window, 'open', () => popup)
    })

    it('opens or reattaches to the window and clears it', () => {
      let root = ql.open()

      expect(window.open.mock.calls[0].arguments).to.eql(['', 'quicklook'])
      expect(root).to.equal(popup.document.body)
      expect(root.innerHTML).to.equal('')
    })

    it('sets up the window like the parent', () => {
      let root = ql.open()
      let html = popup.document.documentElement

      expect(root.id).to.equal('quicklook')
      expect(html.classList.contains(process.platform)).to.be.true
      expect(html.style.zoom).to.equal('1.5')
      expect(popup.document.head.querySelector('link').href)
        .to.match(/quicklook\.css$/)
    })

    it('reopens the window once closed', () => {
      ql.open()
      ql.open()
      expect(window.open.mock.callCount()).to.equal(1)

      popup.closed = true
      ql.open()
      expect(window.open.mock.callCount()).to.equal(2)
    })

    it('returns null without a quicklook window', () => {
      window.open.mock.mockImplementation(() => null)
      expect(ql.open()).to.be.null
    })
  })

  it('shows only with content', async () => {
    await ql.show()
    expect(sent()).to.eql([])

    await ql.fit({ width: 4, height: 3 })
    await ql.show()
    expect(sent()).to.eql([
      ['quicklook', 'fit', { width: 4, height: 3 }],
      ['quicklook', 'show', { width: 4, height: 3 }]
    ])
  })

  it('fits only changed sizes and hides without content', async () => {
    await ql.fit({ width: 4, height: 3 })
    await ql.fit({ width: 4, height: 3 })
    await ql.fit(null)

    expect(sent()).to.eql([
      ['quicklook', 'fit', { width: 4, height: 3 }],
      ['quicklook', 'hide', null]
    ])
  })

  it('resolves fit after the reply, and the next frame while visible', async () => {
    let steps = []

    ipcRenderer.invoke.mock.mockImplementation(async () => {
      steps.push('reply')
    })
    ql.popup = {
      requestAnimationFrame (fn) {
        steps.push('frame')
        fn()
      }
    }

    await ql.fit({ width: 4, height: 3 })
    expect(steps).to.eql(['reply'])

    ql.setVisible(true)
    await ql.fit({ width: 3, height: 4 })
    expect(steps).to.eql(['reply', 'reply', 'frame'])
  })

  it('hides on Escape before other key handlers', () => {
    let onKeyDown = mock.fn()

    ql.setVisible(true)
    document.addEventListener('keydown', onKeyDown)

    let event = escape()
    document.removeEventListener('keydown', onKeyDown)

    expect(event.defaultPrevented).to.be.true
    expect(onKeyDown.mock.callCount()).to.equal(0)
    expect(ql.isVisible).to.be.false
    expect(sent()).to.eql([['quicklook', 'hide', null]])
  })

  it('leaves Escape to inputs and when not visible', () => {
    let input = document.createElement('input')
    document.body.appendChild(input)

    ql.setVisible(true)
    let event = escape(input)
    input.remove()
    expect(event.defaultPrevented).to.be.false

    ql.setVisible(false)
    expect(escape().defaultPrevented).to.be.false
    expect(sent()).to.eql([])
  })
})
