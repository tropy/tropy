import { render } from '../support/react'
import { PanelGroup } from '../../src/components/panel'

describe('PanelGroup', () => {
  it('renders panel-group structure', () => {
    expect(render(
      <PanelGroup
        slots={[]}
        onResize={sinon.spy()}/>
    ).element())
      .to.have.class('panel-group')
      .and.have.descendants('.panel-group-header, .panel-group-body')
      .and.have.length(2)
  })
})
