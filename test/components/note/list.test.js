import { mock } from 'node:test'
import { fireEvent } from '@testing-library/react'
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
})
