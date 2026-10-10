import { render } from '@testing-library/react'
import { MessageBox } from '#tropy/components/message-box.js'

describe('MessageBox', () => {
  let show = (props) => {
    let { promise, resolve } = Promise.withResolvers()
    let { container, unmount } = render(
      <MessageBox
        message="Delete items?"
        buttons={['Cancel', 'Delete']}
        onClose={resolve}
        {...props}/>
    )
    return { container, unmount, result: promise }
  }

  let unmount

  afterEach(() => {
    unmount?.()
    unmount = null
  })

  it('resolves with the clicked button', async () => {
    let dom = show({ checkboxLabel: 'Remember' })
    unmount = dom.unmount

    dom.container.querySelector('input[name="checked"]').click()
    dom.container.querySelectorAll('button')[1].click()

    expect(await dom.result)
      .to.eql({ cancel: false, value: 1, data: { checked: true } })
  })

  it('cancels when the cancel button is clicked', async () => {
    let dom = show({ cancelId: 0 })
    unmount = dom.unmount

    dom.container.querySelectorAll('button')[0].click()

    expect(await dom.result)
      .to.eql({ cancel: true, value: 0, data: { checked: false } })
  })

  it('cancels on close request and keeps the checkbox state', async () => {
    let dom = show({ cancelId: 1, checkboxLabel: 'Remember' })
    unmount = dom.unmount

    dom.container.querySelector('input[name="checked"]').click()
    dom.container.querySelector('dialog').requestClose()

    expect(await dom.result)
      .to.eql({ cancel: true, value: 1, data: { checked: true } })
  })

  it('focuses the default button', () => {
    let dom = show({ defaultId: 1 })
    unmount = dom.unmount

    expect(document.activeElement)
      .to.equal(dom.container.querySelectorAll('button')[1])
  })
})
