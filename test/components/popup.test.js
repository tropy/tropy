import { render } from '@testing-library/react'
import { Popup } from '#tropy/components/popup.js'
import { Modal } from '#tropy/components/modal.js'

describe('Popup', () => {
  let container = () =>
    document.querySelector('.popup-container')

  // Mirrors the selector the styles use while a popup is open.
  let contextmenu = (node) =>
    node.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true
    }))

  let isPopupOpen = () =>
    document.documentElement.matches(':root:has(.popup-container:popover-open)')

  it('is rendered in place and shown in the top layer', () => {
    let { container: dom, unmount } = render(<Popup>popup</Popup>)

    expect(container().parentElement).to.equal(dom)
    expect(container().matches(':popover-open')).to.be.true
    expect(isPopupOpen()).to.be.true

    unmount()
    expect(container()).to.be.null
    expect(isPopupOpen()).to.be.false
  })

  it('is open while any popup is open', () => {
    let a = render(<Popup>a</Popup>)
    let b = render(<Popup>b</Popup>)

    a.unmount()
    expect(isPopupOpen()).to.be.true

    b.unmount()
    expect(isPopupOpen()).to.be.false
  })

  it('is not inert in a modal', () => {
    let { container: dom, unmount } = render(
      <Modal onClose={() => {}}>
        <Popup>popup</Popup>
      </Modal>
    )

    expect(dom.querySelector('dialog').contains(container())).to.be.true
    expect(container().matches(':popover-open')).to.be.true

    unmount()
    expect(container()).to.be.null
  })

  it('supports autofocus of its contents', () => {
    let { unmount } = render(
      <Popup><input className="focus" autoFocus/></Popup>
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
      let { unmount } = render(<Popup anchor={{ current: source }}>popup</Popup>)

      expect(container()).to.have.class('anchored')
      expect(source.style.anchorName).to.match(/^--popover-/)
      expect(container().style.positionAnchor)
        .to.equal(source.style.anchorName)

      unmount()
      expect(source.style.anchorName).to.equal('')
    })

    it('lets context menus outside go through', () => {
      let { unmount } = render(<Popup anchor={{ current: source }}>popup</Popup>)

      expect(contextmenu(document.body)).to.be.true
      expect(contextmenu(source)).to.be.true

      unmount()
    })
  })

  it('suppresses context menus inside', () => {
    let { unmount } = render(<Popup><span className="inside">x</span></Popup>)

    expect(contextmenu(document.querySelector('.popup .inside'))).to.be.false

    unmount()
  })

  it('is not anchored without anchor', () => {
    let { unmount } = render(<Popup>popup</Popup>)
    expect(container()).not.to.have.class('anchored')
    unmount()
  })
})
