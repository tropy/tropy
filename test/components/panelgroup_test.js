'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('PanelGroup', () => {
  const { PanelGroup } = __require('components/panelgroup')

  it('has id items', () => {
    expect(shallow(<PanelGroup/>)).to.have.id('panel-group')
  })

})
