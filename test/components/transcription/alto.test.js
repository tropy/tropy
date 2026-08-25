import { mock } from 'node:test'
import { Document } from 'alto-xml'
import { render } from '../../support/react.js'
import { Alto } from '#tropy/components/transcription/alto.js'

const ALTO = `<?xml version="1.0" encoding="UTF-8"?>
<alto>
  <Layout>
    <Page>
      <PrintSpace>
        <TextBlock>
          <TextLine>
            <String CONTENT="one"/>
            <String CONTENT="two"/>
          </TextLine>
          <TextLine>
            <String CONTENT="three"/>
            <String CONTENT="four"/>
          </TextLine>
        </TextBlock>
      </PrintSpace>
    </Page>
  </Layout>
</alto>`

// Native selection changes are dispatched asynchronously!
const nextTick = () => new Promise(resolve => { setTimeout(resolve, 0) })

const setup = () => {
  let alto = Document.parse(ALTO)
  let onSelect = mock.fn()

  let { $$ } = render(
    <Alto
      document={alto}
      onSelect={onSelect}
      selection={new Map}/>
  )

  return { alto, onSelect, strings: [...$$('.string')] }
}

const selectRange = async (head, tail) => {
  let range = document.createRange()
  range.setStart(head.firstChild, 0)
  range.setEnd(tail.firstChild, tail.firstChild.length)

  let selection = document.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)

  await nextTick()
}

const content = (selection) =>
  [...selection.keys()].map(string => string.CONTENT)

describe('Alto', () => {
  afterEach(() => {
    document.getSelection().removeAllRanges()
  })

  it('renders strings in document order', () => {
    let { strings } = setup()

    expect(strings.map(node => node.textContent))
      .to.eql(['one', 'two', 'three', 'four'])
    expect(strings.map(node => node.dataset.idx))
      .to.eql(['0', '1', '2', '3'])
  })

  it('maps the native selection to strings', async () => {
    let { onSelect, strings } = setup()

    await selectRange(strings[0], strings[2])

    expect(onSelect.mock.calls).to.have.length(1)
    expect(content(onSelect.mock.calls[0].arguments[0]))
      .to.eql(['one', 'two', 'three'])
  })

  it('selects whole strings only', async () => {
    let { onSelect, strings } = setup()

    let range = document.createRange()
    range.setStart(strings[1].firstChild, 1)
    range.setEnd(strings[2].firstChild, 2)

    let selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    await nextTick()

    expect(content(onSelect.mock.calls[0].arguments[0]))
      .to.eql(['two', 'three'])
  })

  it('clears the selection when it is collapsed', async () => {
    let { onSelect, strings } = setup()

    await selectRange(strings[1], strings[1])
    expect(content(onSelect.mock.calls[0].arguments[0]))
      .to.eql(['two'])

    document.getSelection().collapseToStart()
    await nextTick()

    expect(onSelect.mock.calls[1].arguments[0]).to.be.empty
  })

  it('ignores selections outside of the document', async () => {
    let { onSelect } = setup()

    let outside = document.createElement('p')
    outside.textContent = 'outside'
    document.body.appendChild(outside)

    try {
      let range = document.createRange()
      range.selectNodeContents(outside)

      let selection = document.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)

      await nextTick()

      expect(onSelect.mock.calls[0].arguments[0]).to.be.empty

    } finally {
      outside.remove()
    }
  })
})
