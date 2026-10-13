import { render } from '@testing-library/react'
import { Popover } from '#tropy/components/popover.js'
import { Modal } from '#tropy/components/modal.js'

describe('Popover', () => {
  let container = () =>
    document.querySelector('.popover-container')

  // Mirrors the selector the styles use while a popover is open.
  let contextmenu = (node) =>
    node.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true
    }))

  let isPopoverOpen = () =>
    document.documentElement.matches(':root:has(.popover-container:popover-open)')

  it('is rendered in place and shown in the top layer', () => {
    let { container: dom, unmount } = render(<Popover>popover</Popover>)

    expect(container().parentElement).to.equal(dom)
    expect(container().matches(':popover-open')).to.be.true
    expect(isPopoverOpen()).to.be.true

    unmount()
    expect(container()).to.be.null
    expect(isPopoverOpen()).to.be.false
  })

  it('is open while any popover is open', () => {
    let a = render(<Popover>a</Popover>)
    let b = render(<Popover>b</Popover>)

    a.unmount()
    expect(isPopoverOpen()).to.be.true

    b.unmount()
    expect(isPopoverOpen()).to.be.false
  })

  it('is not inert in a modal', () => {
    let { container: dom, unmount } = render(
      <Modal onClose={() => {}}>
        <Popover>popover</Popover>
      </Modal>
    )

    expect(dom.querySelector('dialog').contains(container())).to.be.true
    expect(container().matches(':popover-open')).to.be.true

    unmount()
    expect(container()).to.be.null
  })

  it('supports autofocus of its contents', () => {
    let { unmount } = render(
      <Popover><input className="focus" autoFocus/></Popover>
    )

    expect(document.activeElement).to.have.class('focus')
    unmount()
  })

  describe('with anchor', () => {
    let source

    beforeEach(() => {
      source = document.createElement('input')
      document.body.append(source)
    })

    afterEach(() => {
      source.remove()
    })

    it('is anchored to the anchor element', () => {
      let { unmount } = render(<Popover anchor={{ current: source }}>popover</Popover>)

      expect(container()).to.have.class('anchored')
      expect(source.style.anchorName).to.match(/^--popover-/)
      expect(container().style.positionAnchor)
        .to.equal(source.style.anchorName)

      unmount()
      expect(source.style.anchorName).to.equal('')
    })

    it('lets context menus outside go through', () => {
      let { unmount } = render(<Popover anchor={{ current: source }}>popover</Popover>)

      expect(contextmenu(document.body)).to.be.true
      expect(contextmenu(source)).to.be.true

      unmount()
    })
  })

  it('suppresses context menus inside', () => {
    let { unmount } = render(<Popover><span className="inside">x</span></Popover>)

    expect(contextmenu(document.querySelector('.popover .inside'))).to.be.false

    unmount()
  })

  it('is not anchored without anchor', () => {
    let { unmount } = render(<Popover>popover</Popover>)
    expect(container()).not.to.have.class('anchored')
    unmount()
  })
})
