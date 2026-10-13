import { setTimeout as sleep } from 'node:timers/promises'
import { render, inWindowContext } from '../../support/react.js'
import { TranscriptionConfig } from '#tropy/components/transcription/config.js'
import ARGS, { update } from '#tropy/args.js'

describe('TranscriptionConfig', () => {
  let config = {
    grayscale: false,
    resize: true,
    quality: 0.8,
    model: 356425
  }

  let account = ARGS.account

  before(() => {
    update({ account: { linked: true } })
  })

  after(() => {
    update({ account })
  })

  let show = () => {
    let { promise, resolve } = Promise.withResolvers()
    let dom = render(
      <TranscriptionConfig config={config} onClose={resolve}/>,
      inWindowContext)
    return { ...dom, result: promise }
  }

  let unmount

  afterEach(() => {
    unmount?.()
    unmount = null
  })

  it('resolves with the adjusted config', async () => {
    let dom = show()
    unmount = dom.unmount

    document.querySelector('dialog input[name="grayscale"]').click()
    document.querySelector('dialog button[value="transcribe"]').click()

    expect(await dom.result).to.eql({
      cancel: false,
      value: 'transcribe',
      data: { ...config, grayscale: true }
    })
  })

  it('cancels without data', async () => {
    let dom = show()
    unmount = dom.unmount

    document.querySelector('dialog input[name="grayscale"]').click()
    document.querySelector('dialog button[type="button"]').click()

    expect(await dom.result).to.eql({ cancel: true })
  })

  it('opens the model select popup inside the modal', async () => {
    let dom = show()
    unmount = dom.unmount

    document.querySelector('dialog .model-select')
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))

    await sleep(10)

    let popup = document.querySelector('.popup-container')
    expect(popup.closest('dialog')).to.equal(document.querySelector('dialog'))

    // Elements outside the modal would be inert.
    let option = popup.querySelector('.option')
    let { left, top, width, height } = option.getBoundingClientRect()
    expect(popup.contains(
      document.elementFromPoint(left + width / 2, top + height / 2)
    )).to.be.true
  })
})
