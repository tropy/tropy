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
})
