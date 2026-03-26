import { mock } from 'node:test'
import { render } from '../support/react.cjs'
import { PanelGroup } from '#tropy/components/panel.js'

describe('PanelGroup', () => {
  it('renders panel-group structure', () => {
    expect(render(
      <PanelGroup
        slots={[]}
        onResize={mock.fn()}/>
    ).element())
      .to.have.class('panel-group')
      .and.have.descendants('.panel-group-header, .panel-group-body')
      .and.have.length(2)
  })
})
