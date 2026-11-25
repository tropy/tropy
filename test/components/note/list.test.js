import { mock } from 'node:test'
import { act, fireEvent, waitFor } from '@testing-library/react'
import { render, withStore } from '../../support/react.js'
import { KeyMap } from '#tropy/keymap.js'
import { NOTE } from '#tropy/constants/index.js'
import { NoteList } from '#tropy/components/note/list.js'
import { createNoteStore } from './store.js'

describe('NoteList', () => {
  let setup = (options, props) => {
    let store = createNoteStore(options)
    let dispatch = mock.method(store, 'dispatch')
    let dom = render(<NoteList {...props}/>, withStore(store))

    // The project commands dispatched (delete).
    let commands = () => dispatch.mock.calls
      .map(call => call.arguments[0])
      .filter(action => action?.meta?.cmd === 'project')

    return { ...dom, commands, store }
  }

  it('selects and opens notes with the mouse', () => {
    let { $, store } = setup()

    let note = $('.note-list li:last-child')
    fireEvent.mouseDown(note, { detail: 1 })
    fireEvent.doubleClick(note, { detail: 2 })

    expect(store.getState().nav).to.nested.include({
      'select.note.cursor': 2, mode: 'item'
    })
  })

  it('updates the row of an edited note', () => {
    let { $, store } = setup()

    act(() => {
      store.dispatch({
        type: NOTE.UPDATE,
        payload: { id: 2, text: 'edited' },
        meta: { done: true }
      })
    })

    expect($('.note-list li:last-child').textContent).to.equal('edited')
  })

  it('previews the matches of the search query', () => {
    let text = `${'Lorem ipsum. '.repeat(30)}A letter from Paris.`
    let { $ } = setup({ count: 1, query: 'paris', text })
    let preview = $('.note-list li .css-multiline-truncate')

    expect(preview.textContent).to.match(/^….* letter from Paris\.$/)
    expect(preview.querySelector('mark').textContent).to.equal('Paris')
  })

  it('does not open notes in item mode', () => {
    let { $, store } = setup({}, { isItemOpen: true })

    fireEvent.doubleClick($('.note-list li'), { detail: 2 })
    expect(store.getState().nav.mode).to.equal('project')
  })

  it('opens and removes the note at the cursor with keys', () => {
    let { $, commands, store } = setup({
      note: 2,
      keymap: {
        NoteList: new KeyMap({ open: 'Enter', remove: 'Backspace' })
      }
    })

    fireEvent.keyDown($('.scroll-container'), { key: 'Enter' })
    fireEvent.keyDown($('.scroll-container'), { key: 'Backspace' })

    expect(store.getState().nav.mode).to.equal('item')
    expect(commands()[0].payload).to.eql([2])
  })

  it('leaves remove keys alone when read-only', () => {
    let { $, commands } = setup({
      keymap: { NoteList: new KeyMap({ remove: 'Backspace' }) }
    }, { isReadOnly: true })

    let isHandled = !fireEvent.keyDown($('.scroll-container'), {
      key: 'Backspace'
    })

    expect(isHandled).to.be.false
    expect(commands()).to.be.empty
  })

  it('selects notes with cursor keys', () => {
    let { $, store } = setup()

    fireEvent.keyDown($('.scroll-container'), { key: 'ArrowDown' })
    expect(store.getState().nav.select.note.cursor).to.equal(2)
  })

  it('selects a page of notes with page keys', async () => {
    let style = document.createElement('style')
    style.textContent = '.note-list .scroll-container { height: 50px }'
    document.head.appendChild(style)

    let { $, $$, store } = setup({ count: 20 }, { rowHeight: 10 })

    // The page size is known once the container size is observed
    // (and more rows than without a size are rendered).
    await waitFor(() => {
      expect($$('.note-list li')).to.have.length.above(2)
    })

    fireEvent.keyDown($('.scroll-container'), { key: 'PageDown' })
    expect(store.getState().nav.select.note.cursor).to.equal(6)

    style.remove()
  })
})
