import { render, inWindowContext } from '../../support/react.js'
import { SearchField } from '#tropy/components/search/field.js'

describe('SearchField', () => {
  it('marks an invalid query', () => {
    let { $, element } = render(
      <SearchField
        query="tag:"
        error="toolbar.search.error.empty-scope"
        onSearch={() => {}}/>,
      inWindowContext)

    expect(element()).to.have.class('invalid')
    expect(element().title).to.match(/search term after "tag:"/)
    expect($('input').getAttribute('aria-invalid')).to.equal('true')
  })

  it('is valid without an error', () => {
    let { $, element } = render(
      <SearchField query="box" onSearch={() => {}}/>,
      inWindowContext)

    expect(element()).not.to.have.class('invalid')
    expect($('input').hasAttribute('aria-invalid')).to.be.false
  })
})
