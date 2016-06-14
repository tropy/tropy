'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Project', () => {
  const { Project } = __require('components/project')

  it('has id project', () => {
    expect(shallow(<Project/>)).to.have.id('project')
  })

})
