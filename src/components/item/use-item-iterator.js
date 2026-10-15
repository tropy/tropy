import { useImperativeHandle, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { seq, compose, map, cat, keep } from 'transducers.js'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { useEvent } from '../../hooks/use-event.js'
import { useEventHandler } from '../../hooks/use-event-handler.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { getSelectionMode } from '../../keymap.js'
import { Cursor, indexOf } from '../../common/sequence.js'
import { blank, get } from '../../common/util.js'
import { getItemSelection, getVisibleItems } from '../../selectors/index.js'
import * as act from '../../actions/index.js'

// The item list container logic shared by grid and table:
// selects the items and the selection, navigates them
// (a Cursor with Scroll's layout), dispatches the item actions,
// and hands the leaves (tiles, rows) stable handlers.
export function useItemIterator ({
  isDisabled,
  isReadOnly,
  list,
  ref,
  onContextMenu,
  onItemImport
}, { edit, isGrid = false, tabIndex }) {
  let dispatch = useDispatch()
  let scroll = useRef()

  let items = useSelector(getVisibleItems)
  let selection = useSelector(getItemSelection)
  let isTrashSelected = useSelector(state => state.nav.trash)

  let [layout, setLayout] = useState()
  let cursor = new Cursor(items, selection.cursor, layout)

  useImperativeHandle(ref, () => ({
    focus () {
      scroll.current?.focus()
    }
  }), [])

  let current = () => cursor.current()

  let select = useEvent((item, { mode, throttle } = {}) => {
    if (item == null) return

    let next = selection.select(item.id, { mode })

    if (next !== selection.state)
      dispatch(act.item.select({ item: next }, { throttle }))
  })

  // Cursor keys: Shift extends, in grids it steps.
  // Ctrl/Cmd+arrow keys are left alone (they bubble).
  let move = (item, keyState) => {
    if (keyState.ctrlKey || keyState.metaKey)
      return false

    let mode = getSelectionMode(keyState)

    if (isGrid && mode === 'extend')
      mode = 'step'

    select(item, { mode, throttle: keyState.repeat })
  }

  // Tab focus selects the current (or first) item,
  // unless something is selected already.
  let handleTabFocus = () => {
    if (selection.size === 0)
      select(current() ?? items[0])
  }

  let getSelection = useEvent(() => selection.ids())

  let getSelectedPhotos = () =>
    seq(selection.ids(), compose(
      map(id => get(items, [indexOf(items, id), 'photos'])),
      keep(),
      cat))

  // The first unselected item after or before the current one.
  // Only these are checked: the worst case for sparse selections
  // is not worth the price.
  let adjacent = () => {
    let [prev, next] = cursor.adjacent()

    for (let it of [next, prev])
      if (it != null && !selection.has(it.id)) return it
  }

  let clearSelection = () => {
    dispatch(act.item.select({ items: [] }))
  }

  // Handlers for the leaves (memoized tiles and rows).
  let open = useEvent((item) => {
    dispatch(act.item.open(item))
  })

  let merge = useEvent((ids) => {
    dispatch(act.item.merge(ids))
  })

  let movePhotos = useEvent((payload) => {
    dispatch(act.photo.move(payload))
  })

  let contextMenu = useEvent((event, item) => {
    let context = ['item']
    let target = {
      id: item.id,
      photos: item.photos,
      tags: item.tags,
      list
    }

    // Items select on mouse-down (useSequenceClicks),
    // so the right-clicked item is already selected.
    if (selection.size > 1) {
      context.push('bulk')
      target.id = selection.ids()
      target.photos = getSelectedPhotos()
    }

    if (isTrashSelected)
      context.push('deleted')
    else if (isReadOnly)
      context.push('read-only')
    else if (list)
      context.push('list')

    onContextMenu(event, context.join('-'), target)
  })

  let openCurrent = () => {
    open(current())
  }

  let commands = useKeyMap('ItemIterator', {
    open: openCurrent,
    preview () {
      let item = current()
      if (item != null)
        dispatch(act.item.preview({ id: item.id, photos: item.photos }))
    },
    clear: clearSelection,
    delete () {
      let ids = selection.ids()

      if (!(isReadOnly || blank(ids))) {
        select(adjacent())
        dispatch(act.item.delete(ids))
      }
    },
    all () {
      dispatch(act.item.select({ all: true }))
    },
    merge () {
      let ids = selection.ids()

      if (!(isReadOnly || blank(ids)))
        merge(ids)
    },
    rotateLeft () {
      rotate(-90)
    },
    rotateRight () {
      rotate(90)
    },
    edit () {
      edit?.(current())
    }
  })

  let rotate = (by) => {
    if (!isReadOnly && selection.size > 0)
      dispatch(act.photo.rotate({ id: getSelectedPhotos(), by }))
  }

  let onKeyDown = useCursorKeys(cursor, {
    onMove: move,
    onKeyDown: commands
  })

  useGlobalEvent('nextItem', (event) => {
    select(cursor.next(), { throttle: event?.repeat })
  })

  useGlobalEvent('prevItem', (event) => {
    select(cursor.prev(), { throttle: event?.repeat })
  })

  // The mouse forward button.
  useGlobalEvent('forward', openCurrent)

  useEventHandler(window, 'copy', () => {
    let sel = document.getSelection()
    let ids = selection.elements()

    if ((sel == null || !sel.toString()) && !blank(ids))
      dispatch(act.item.export(ids, { target: ':clipboard:' }))
  })

  let [file, dropFile] = useDropPhotoFiles({
    isDisabled: isReadOnly,
    onDrop: onItemImport
  })

  let connect = (element) =>
    isReadOnly ? element : dropFile(element)

  let getIterableProps = (item, index) => ({
    item,
    index,
    isSelected: selection.has(item.id),
    isReadOnly,
    getSelection,
    onContextMenu: contextMenu,
    onDropItems: merge,
    onDropPhotos: movePhotos,
    onItemOpen: open,
    onSelect: select
  })

  return {
    clearSelection,
    connect,
    cursor,
    getIterableProps,
    handleTabFocus,
    isOver: file.canDrop,
    items,
    onKeyDown,
    onLayoutChange: setLayout,
    scroll,
    selection,
    tabIndex: (isDisabled || !items.length) ? null : tabIndex
  }
}
