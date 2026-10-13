import { mock } from 'node:test'
import { render } from '@testing-library/react'
import { Modal } from '#tropy/components/modal.js'

describe('Modal', () => {
  it('closes on close requests only by default', () => {
    let { container, unmount } = render(<Modal onClose={() => {}}/>)
    expect(container.querySelector('dialog').closedBy).to.equal('closerequest')
    unmount()
  })

  it('supports closedBy', () => {
    let { container, unmount } = render(
      <Modal closedBy="any" onClose={() => {}}/>)
    expect(container.querySelector('dialog').closedBy).to.equal('any')
    unmount()
  })

  it('keeps context menus from going through', () => {
    let handleContextMenu = mock.fn()
    let { container, unmount } = render(
      <div onContextMenu={handleContextMenu}>
        <Modal onClose={() => {}}>
          <span className="inside">x</span>
        </Modal>
      </div>)

    container.querySelector('dialog .inside').dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))

    expect(handleContextMenu.mock.callCount()).to.equal(0)
    unmount()
  })
})
