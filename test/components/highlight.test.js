import { render, createStore, withStore } from '../support/react.js'
import { Highlight } from '#tropy/components/highlight.js'
import { nav } from '#tropy/reducers/nav.js'

describe('Highlight', () => {
  const marks = (query, text, scope = 'metadata') => {
    let store = createStore({ nav: { ...nav(undefined, {}), query } })
    let { container } = render(
      <Highlight scope={scope} text={text}/>, withStore(store))

    return [...container.querySelectorAll('mark')].map(m => m.textContent)
  }

  it('marks the matches of the search query', () => {
    expect(marks('box fold', 'Box 3: Folder 12')).to.eql(['Box', 'Fold'])
  })

  it('applies the terms of its scope', () => {
    expect(marks('note:box', 'Box 3')).to.eql([])
    expect(marks('note:box', 'Box 3', 'note')).to.eql(['Box'])
  })

  it('marks nothing for an invalid query', () => {
    expect(marks('box tag:', 'Box 3')).to.eql([])
  })
})
