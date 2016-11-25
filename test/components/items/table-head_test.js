'use strict'

const React = require('react')
const { shallow } = require('enzyme')

describe('TableHead', () => {
  const { TableHead } = __require('components/items/table-head')

  it('has class list-head', () => {
    expect(shallow(<TableHead columns={[]}/>))
      .to.have.className('list-head')
  })

  it('renders head columns', () => {
    const columns = [
      { width: '40%', property: { uri: 'x', type: 'string' } },
      { width: '60%', property: { uri: 'y', type: 'number' } },
    ]

    expect(shallow(<TableHead columns={columns}/>))
      .to.have.exactly(2).descendants('.metadata-head')
  })
})
