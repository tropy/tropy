'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('List', () => {
  const { List } = __require('components/items/list')

  it('has class item-list', () => {
    expect(shallow(<List/>)).to.have.className('item-list')
  })
})
