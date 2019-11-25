'use strict'

const React = require('react')
const { render } = require('../support/react')

describe('PanelGroup', () => {
  const { PanelGroup } = __require('components/panel')

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
