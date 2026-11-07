import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { SearchSettings } from '#tropy/components/settings/search.js'

describe('SearchSettings', () => {
  it('switches highlights off', () => {
    let onChange = mock.fn()
    let { container } = render(
      <SearchSettings config={{ highlight: true }} onChange={onChange}/>,
      inWindowContext)

    fireEvent.click(container.querySelector('input[name="highlight"]'))
    expect(onChange.mock.calls[0].arguments[0])
      .to.eql({ search: { highlight: false } })
  })
})
