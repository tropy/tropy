import { mock } from 'node:test'
import { act, render } from '@testing-library/react'
import { ipcRenderer as ipc } from 'electron'
import { DialogService } from '#tropy/dialog.js'
import { ModalLayer } from '#tropy/components/modal-layer.js'
import { WindowContext } from '#tropy/components/window.js'

describe('ModalLayer', () => {
  let service
  let send

  let Modal = ({ n, onClose }) => (
    <button className="modal" onClick={() => onClose(n)}>{n}</button>
  )

  const MODALS = { test: Modal }

  beforeEach(() => {
    send = mock.method(ipc, 'send', () => {})
    service = new DialogService({ getState: () => ({}) })
  })

  afterEach(() => {
    service.stop()
    send.mock.restore()
  })

  let sent = () => send.mock.calls
    .filter(({ arguments: [, type] }) => type === 'dialog')

  let renderLayer = () => render(
    <WindowContext.Provider value={{ dialog: service }}>
      <ModalLayer modals={MODALS}/>
    </WindowContext.Provider>
  )

  it('shows one queued dialog at a time', async () => {
    let { container, unmount } = renderLayer()
    let a, b

    act(() => {
      a = service.show('test', { n: 1 })
      b = service.show('test', { n: 2 })
    })

    expect(container.querySelectorAll('.modal')).to.have.length(1)
    expect(container.querySelector('.modal')).to.have.text('1')

    act(() => { container.querySelector('.modal').click() })
    expect(await a).to.equal(1)
    expect(container.querySelector('.modal')).to.have.text('2')

    act(() => { unmount() })
    expect(await b).to.eql({ cancel: true })
    expect(sent()).to.have.length(0)
    expect(service.canShowAsModal('test')).to.be.false
  })
})
