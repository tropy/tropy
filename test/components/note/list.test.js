import { mock } from 'node:test'
import { fireEvent, waitFor } from '@testing-library/react'
import { render, inWindowContext } from '../../support/react.js'
import { NoteList } from '#tropy/components/note/list.js'

describe('NoteList', () => {
  let notes = [
    { id: 1, photo: 1, text: 'one' },
    { id: 2, photo: 1, text: 'two' }
  ]

  it('selects and opens notes with the mouse', () => {
    let onSelect = mock.fn()
    let onOpen = mock.fn()

    let { $ } = render(
      <NoteList
        notes={notes}
        selection={notes[0]}
        onOpen={onOpen}
        onSelect={onSelect}/>,
      inWindowContext)

    let note = $('.note:last-child')
    fireEvent.mouseDown(note, { detail: 1 })
    fireEvent.doubleClick(note, { detail: 2 })

    expect(onSelect.mock.calls[0].arguments[0]).to.include({ note: 2 })
    expect(onOpen.mock.calls[0].arguments[0]).to.equal(notes[1])
  })

  it('selects notes with cursor keys', () => {
    let onSelect = mock.fn()

    let { $ } = render(
      <NoteList notes={notes} selection={notes[0]} onSelect={onSelect}/>,
      inWindowContext)

    fireEvent.keyDown($('.scroll-container'), { key: 'ArrowDown', repeat: true })

    expect(onSelect.mock.calls[0].arguments).to.eql([
      { note: 2, photo: 1, selection: undefined },
      { throttle: true }
    ])
  })

  it('selects a page of notes with page keys', async () => {
    let style = document.createElement('style')
    style.textContent = '.note-list .scroll-container { height: 50px }'
    document.head.appendChild(style)

    let many = Array.from({ length: 20 }, (_, i) =>
      ({ id: i + 1, photo: 1, text: `${i + 1}` }))
    let onSelect = mock.fn()

    let { $ } = render(
      <NoteList
        notes={many}
        rowHeight={10}
        selection={many[0]}
        onSelect={onSelect}/>,
      inWindowContext)

    // The page size is known once the container size is observed.
    await waitFor(() => {
      fireEvent.keyDown($('.scroll-container'), { key: 'PageDown' })
      expect(onSelect.mock.calls.at(-1).arguments[0]).to.include({ note: 6 })
    })

    style.remove()
  })
})
