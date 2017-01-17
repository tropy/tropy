'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Project', () => {
  const { Project } = __require('components/project')

  it('has id project', () => {
    expect(shallow(<Project.WrappedComponent/>)).to.have.id('project')
  })

})
