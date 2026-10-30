import { mock } from 'node:test'
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

  let sent = () => ql.win.send.mock.calls.map(c => c.arguments)

  beforeEach(() => {
    ql = new QuickLook({
      args: { data: '/data', fontSize: '13px', zoom: 1.5 },
      on () {},
      send: mock.fn()
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
      expect(html.classList.contains('vibrancy')).to.be.false
      expect(html.style.zoom).to.equal('1.5')
      expect(popup.document.head.querySelector('link').href)
        .to.match(/quicklook\.css$/)
    })

    it('marks the window for vibrancy', () => {
      ql.win.args.quicklook = { vibrancy: true }
      ql.open()
      expect(popup.document.documentElement.classList.contains('vibrancy'))
        .to.be.true
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

  it('shows only with content', () => {
    ql.show()
    expect(sent()).to.eql([])

    ql.resize({ width: 4, height: 3 })
    ql.show()
    expect(sent()).to.eql([
      ['quicklook', 'show', { width: 4, height: 3, header: 0 }]
    ])
  })

  it('refits while visible and hides without content', () => {
    ql.setVisible(true)
    ql.resize({ width: 4, height: 3 })
    ql.resize(null)

    expect(sent()).to.eql([
      ['quicklook', 'show', { width: 4, height: 3, header: 0 }],
      ['quicklook', 'hide']
    ])
  })

  it('hides on Escape before other key handlers', () => {
    let onKeyDown = mock.fn()

    ql.setVisible(true)
    document.addEventListener('keydown', onKeyDown)

    let event = escape()
    document.removeEventListener('keydown', onKeyDown)

    expect(event.defaultPrevented).to.be.true
    expect(onKeyDown.mock.callCount()).to.equal(0)
    expect(sent()).to.eql([['quicklook', 'hide']])
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
