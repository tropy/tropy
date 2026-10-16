import { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import cx from 'classnames'
import { TextSelection } from 'prosemirror-state'
import { IconXSmall, IconChevron9 } from '../icons.js'
import { Button } from '../button.js'
import { useEvent } from '../../hooks/use-event.js'
import { findMatches, decorateMatches } from '../../editor/search.js'

const EMPTY = { matches: [], active: -1 }

// Overlay find-bar rendered above the ProseMirror <iframe>, in the
// *outer* document.
//
// Note on architecture: this deliberately does NOT use a ProseMirror
// Plugin to hold matches/active/query, and does NOT rely on
// view.dispatch() to apply the highlight decorations. Tropy's
// EditorView (components/editor/view.js) supplies a custom
// dispatchTransaction that, outside of IME composition, never calls
// view.updateState() itself -- it hands the new state to onChange(),
// which round-trips through Redux and only reaches the view again on
// a later render via the view's own `state` prop effect. Reading
// view.state right after view.dispatch() (as a Plugin-based
// implementation would need to, to know the fresh match count) would
// therefore see stale data, and decorations coming from a Plugin's
// `props.decorations` would only repaint on that later, async pass.
//
// So instead: matches/active/query live here as plain component
// state, computed directly from view.state.doc, and the highlight
// decorations are pushed straight onto the view via view.setProps()
// followed by a direct view.updateState(view.state) call -- which
// forces an immediate, synchronous repaint without going through
// dispatch()/onChange() at all. Only actually moving the cursor to a
// match (jumpTo) goes through the normal view.dispatch() path, since
// that's real selection state the rest of the app should know about
// (exactly like a manual click in the note).
export const EditorSearch = ({ isOpen, view, onClose }) => {
  let intl = useIntl()
  let input = useRef()
  let bag = useRef(EMPTY)

  let [query, setQuery] = useState('')
  let [{ matches, active }, setResult] = useState(EMPTY)

  let paint = useEvent((nextMatches, nextActive) => {
    bag.current = { matches: nextMatches, active: nextActive }
    setResult(bag.current)

    if (view) {
      view.setProps({
        decorations: (state) =>
          decorateMatches(state.doc, bag.current.matches, bag.current.active)
      })

      // Force an immediate repaint, bypassing the app's controlled
      // dispatchTransaction (see note above).
      view.updateState(view.state)
    }
  })

  let jumpTo = useEvent((match) => {
    if (!view || !match)
      return

    let { from, to } = match

    view.dispatch(
      view.state.tr
        .setSelection(TextSelection.create(view.state.doc, from, to))
        .scrollIntoView()
    )
  })

  useEffect(() => {
    if (isOpen) {
      input.current?.focus()
      input.current?.select()
    } else {
      setQuery('')
      paint([], -1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  let handleChange = useEvent((event) => {
    let value = event.target.value
    setQuery(value)

    if (!view)
      return

    let found = findMatches(view.state.doc, value)
    let idx = found.length ? 0 : -1

    paint(found, idx)

    if (found.length)
      jumpTo(found[0])
  })

  let handleNext = useEvent(() => {
    if (!matches.length)
      return

    let next = (active + 1) % matches.length
    paint(matches, next)
    jumpTo(matches[next])
  })

  let handlePrevious = useEvent(() => {
    if (!matches.length)
      return

    let prev = (active - 1 + matches.length) % matches.length
    paint(matches, prev)
    jumpTo(matches[prev])
  })

  let handleClose = useEvent(() => {
    paint([], -1)
    onClose()
  })

  let handleKeyDown = useEvent((event) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        if (event.shiftKey) handlePrevious()
        else handleNext()
        break
      case 'Escape':
        event.preventDefault()
        handleClose()
        break
      default:
        return
    }

    event.stopPropagation()
  })

  if (!isOpen)
    return null

  return (
    <div className="editor-search" onKeyDown={handleKeyDown}>
      <input
        ref={input}
        type="text"
        className="editor-search-input"
        value={query}
        placeholder={intl.formatMessage({ id: 'editor.search.placeholder' })}
        onChange={handleChange}/>
      <span className={cx('editor-search-count', { blank: !query })}>
        {matches.length > 0 ?
          `${active + 1}/${matches.length}` :
          (query ? '0/0' : '')}
      </span>
      <Button
        icon={<IconChevron9/>}
        isDisabled={matches.length === 0}
        title="editor.search.previous"
        onClick={handlePrevious}/>
      <Button
        icon={<IconChevron9 className="rotate-180"/>}
        isDisabled={matches.length === 0}
        title="editor.search.next"
        onClick={handleNext}/>
      <Button
        icon={<IconXSmall/>}
        title="editor.search.close"
        onClick={handleClose}/>
    </div>
  )
}
