'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('PanelGroup', () => {
  const { PanelGroup } = __require('components/panel')

  it('has class panel-group', () => {
    expect(shallow(<PanelGroup slots={[]}/>)).to.have.className('panel-group')
  })
})
