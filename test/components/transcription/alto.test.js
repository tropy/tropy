import { mock } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { render } from '../../support/react.js'
import { Alto } from '#tropy/components/transcription/alto.js'

const setup = () => {
  let alto = F.alto('plain')
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

  // Subtle: native selection changes are dispatched asynchronously!
  await setImmediate()
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

    await setImmediate()

    expect(content(onSelect.mock.calls[0].arguments[0]))
      .to.eql(['two', 'three'])
  })

  it('clears the selection when it is collapsed', async () => {
    let { onSelect, strings } = setup()

    await selectRange(strings[1], strings[1])
    expect(content(onSelect.mock.calls[0].arguments[0]))
      .to.eql(['two'])

    document.getSelection().collapseToStart()
    await setImmediate()

    expect(onSelect.mock.calls[1].arguments[0]).to.be.empty
  })

  it('selects the whole word when clicking into a string', async () => {
    let { onSelect, strings } = setup()

    // Clicking places a collapsed caret inside the string.
    let range = document.createRange()
    range.setStart(strings[1].firstChild, 1)
    range.collapse(true)

    let selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    await setImmediate()
    expect(onSelect.mock.calls[0].arguments[0]).to.be.empty

    strings[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    await setImmediate()
    expect(content(onSelect.mock.calls[1].arguments[0]))
      .to.eql(['two'])
  })

  it('keeps the selection when clicking after a drag', async () => {
    let { onSelect, strings } = setup()

    await selectRange(strings[0], strings[1])
    strings[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))

    await setImmediate()

    expect(onSelect.mock.calls).to.have.length(1)
    expect(content(onSelect.mock.calls[0].arguments[0]))
      .to.eql(['one', 'two'])
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

      await setImmediate()

      expect(onSelect.mock.calls[0].arguments[0]).to.be.empty

    } finally {
      outside.remove()
    }
  })
})
