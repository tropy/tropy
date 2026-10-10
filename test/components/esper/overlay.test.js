import { act, getByTitle } from '@testing-library/react'
import { render, inWindowContext, messages } from '../../support/react.js'
import { EsperOverlay } from '#tropy/components/esper/overlay.js'

const renderOverlay = () =>
  render(<EsperOverlay mode="split"/>, inWindowContext).$('.esper-overlay')

const click = (node, id) =>
  act(() => { getByTitle(node, messages[id]).click() })

const fontSize = (node) =>
  parseFloat(node.style.getPropertyValue('--font-size'))

describe('EsperOverlay', () => {
  it('changes the font size', () => {
    let overlay = renderOverlay()
    let size = fontSize(overlay)

    click(overlay, 'esper.overlay.fontSize.increase')
    expect(fontSize(overlay)).to.be.above(size)

    click(overlay, 'esper.overlay.fontSize.decrease')
    expect(fontSize(overlay)).to.equal(size)
  })

  it('toggles the transcription panel', () => {
    let overlay = renderOverlay()

    click(overlay, 'esper.overlay.panel')
    expect(overlay).to.have.class('transcription-panel-visible')

    click(overlay, 'esper.overlay.panel')
    expect(overlay).not.to.have.class('transcription-panel-visible')
  })
})
