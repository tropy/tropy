'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('PanelGroup', () => {
  const { PanelGroup } = __require('components/panel')

  it('has id panel-group', () => {
    expect(shallow(<PanelGroup slots={[]}/>)).to.have.id('panel-group')
  })
})
