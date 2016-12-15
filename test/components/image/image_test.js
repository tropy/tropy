'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('Image', () => {
  const { Image } = __require('components/image/image')

  it('has id image', () => {
    expect(shallow(<Image/>)).to.have.id('image')
  })

})
