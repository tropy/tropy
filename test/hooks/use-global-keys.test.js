import { mock } from 'node:test'
import { render } from '@testing-library/react'
import { useGlobalKeys } from '#tropy/hooks/use-global-keys.js'
import { KeyMap } from '#tropy/keymap.js'

describe('useGlobalKeys', () => {
  let keymap = new KeyMap({ back: 'Escape' })
  let handleBack = mock.fn()

  let Keys = () => {
    useGlobalKeys(keymap)
    return null
  }

  let press = (target) => {
    let event = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    })
    target.dispatchEvent(event)
    return event
  }

  beforeEach(() => {
    handleBack.mock.resetCalls()
    document.addEventListener('global:back', handleBack)
  })

  afterEach(() => {
    document.removeEventListener('global:back', handleBack)
  })

  it('handles matching keys', () => {
    let { unmount } = render(<Keys/>)

    expect(press(document.body).defaultPrevented).to.be.true
    expect(handleBack.mock.callCount()).to.equal(1)

    unmount()
  })

  it('ignores keys while a modal is open', () => {
    let { unmount } = render(<Keys/>)
    let dialog = document.createElement('dialog')
    let button = document.createElement('button')

    dialog.append(button)
    document.body.append(dialog)
    dialog.showModal()

    try {
      expect(press(button).defaultPrevented).to.be.false
      expect(handleBack.mock.callCount()).to.equal(0)
    } finally {
      dialog.remove()
      unmount()
    }
  })
})
