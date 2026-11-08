import { render, createStore, withStore } from '../support/react.js'
import { Highlight, useSearchRanges } from '#tropy/components/highlight.js'
import { nav } from '#tropy/reducers/nav.js'

describe('Highlight', () => {
  const marks = (text, ranges) => {
    let { container } = render(<Highlight text={text} ranges={ranges}/>)
    return [...container.querySelectorAll('mark')].map(m => m.textContent)
  }

  it('marks the given ranges', () => {
    expect(marks('Box 3: Folder 12', [[0, 3], [7, 11]]))
      .to.eql(['Box', 'Fold'])
    expect(marks('Box 3', null)).to.eql([])
  })

  describe('useSearchRanges', () => {
    const SearchHighlight = ({ text }) =>
      <Highlight text={text} ranges={useSearchRanges(text)}/>

    const { settings } = createStore().getState()

    const search = (text, { query, mode = 'project', highlight = true }) => {
      let store = createStore({
        nav: { ...nav(undefined, {}), query, mode },
        settings: { ...settings, search: { highlight } }
      })
      let { container } = render(
        <SearchHighlight text={text}/>, withStore(store))
      return [...container.querySelectorAll('mark')].map(m => m.textContent)
    }

    it('marks the matches of the search query', () => {
      expect(search('Box 3', { query: 'box' })).to.eql(['Box'])
      expect(search('Box 3', { query: 'note:box' })).to.eql([])
      expect(search('Box 3', { query: 'box tag:' })).to.eql(['Box'])

      // Invalid queries (too many terms) mark nothing.
      let many = Array.from({ length: 33 }, (_, i) => `w${i}`).join(' ')
      expect(search('Box 3', { query: `box ${many}` })).to.eql([])
    })

    it('marks nothing in item mode or when switched off', () => {
      expect(search('Box 3', { query: 'box', mode: 'item' })).to.eql([])
      expect(search('Box 3', { query: 'box', highlight: false })).to.eql([])
    })
  })
})
