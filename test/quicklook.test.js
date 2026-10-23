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

  beforeEach(() => {
    ql = new QuickLook({ send: mock.fn() })
  })

  afterEach(() => {
    ql.setVisible(false)
  })

  it('hides on Escape before other key handlers', () => {
    let onKeyDown = mock.fn()

    ql.setVisible(true)
    document.addEventListener('keydown', onKeyDown)

    let event = escape()
    document.removeEventListener('keydown', onKeyDown)

    expect(event.defaultPrevented).to.be.true
    expect(onKeyDown.mock.callCount()).to.equal(0)
    expect(ql.win.send.mock.calls[0].arguments).to.eql(['quicklook', 'hide'])
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
    expect(ql.win.send.mock.callCount()).to.equal(0)
  })
})
