import { mock } from 'node:test'
import { render, inWindowContext } from '../../support/react.js'
import { PopupSelect } from '#tropy/components/resource/popup.js'

describe('PopupSelect', () => {
  let options = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' }
  ]

  let show = (props) => render(
    <PopupSelect options={options} value={[]} {...props}/>,
    inWindowContext)

  let popup = () =>
    document.querySelector('.popup-select')

  it('opens at the given position', () => {
    let { unmount } = show({ left: 10, top: 20, width: 100 })

    expect(popup().style.left).to.equal('10px')
    expect(popup().style.top).to.equal('20px')
    expect(popup().style.width).to.equal('100px')

    unmount()
  })

  it('opens to the left and above if there is no space', () => {
    let { unmount } = show({
      left: innerWidth - 10,
      top: innerHeight - 10,
      width: 100
    })

    let { left, top, height } = popup().style
    expect(left).to.equal(`${innerWidth - 110}px`)
    expect(top).to.equal(`${innerHeight - 10 - parseFloat(height)}px`)

    unmount()
  })

  it('closes when the window is resized', () => {
    let onClose = mock.fn()
    let { unmount } = show({ left: 10, top: 20, onClose })

    window.dispatchEvent(new Event('resize'))
    expect(onClose.mock.callCount()).to.equal(1)

    unmount()
    window.dispatchEvent(new Event('resize'))
    expect(onClose.mock.callCount()).to.equal(1)
  })
})
