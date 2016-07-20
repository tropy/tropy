'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Project', () => {
  const { Project } = __require('containers/project')

  it('can be rendered', () => {
    expect(shallow(<Project/>)).to.be.ok
  })
})
