'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('ListHead', () => {
  const { ListHead } = __require('components/items/list-head')

  it('has class list-head', () => {
    expect(shallow(<ListHead columns={[]}/>))
      .to.have.className('list-head')
  })

  it('renders head columns', () => {
    const columns = [
      { width: '40%', property: { name: 'x', type: 'string' } },
      { width: '60%', property: { name: 'y', type: 'number' } },
    ]

    expect(shallow(<ListHead columns={columns}/>))
      .to.have.exactly(2).descendants('.metadata-head')
  })
})
