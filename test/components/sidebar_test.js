'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Sidebar', () => {
  const { Sidebar } = __require('components/sidebar')

  it('has id sidebar', () => {
    expect(shallow(<Sidebar/>)).to.have.id('sidebar')
  })

})
