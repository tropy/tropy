import { useImperativeHandle, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { seq, compose, map, cat, keep } from 'transducers.js'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useEvent } from '../../hooks/use-event.js'
import { useEventHandler } from '../../hooks/use-event-handler.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useSequence } from '../../hooks/use-sequence.js'
import { indexOf } from '../../common/sequence.js'
import { blank, get } from '../../common/util.js'
import { getItemSelection, getVisibleItems } from '../../selectors/index.js'
import * as act from '../../actions/index.js'
import { usePhotoPreview } from '../photo/use-photo-preview.js'

// The item list container logic shared by grid and table:
// selects the items and the selection, navigates them
// (a Cursor with Scroll's layout), dispatches the item actions,
// handles the clicks on the leaves (tiles, rows) by delegation,
// and hands the leaves stable handlers for drag and drop.
export function useItemIterator ({
  isDisabled,
  isReadOnly,
  list,
  ref,
  onContextMenu,
  onItemImport
}, { edit, onSelectedClick, tabIndex }) {
  let dispatch = useDispatch()
  let preview = usePhotoPreview()
  let scroll = useRef()

  let items = useSelector(getVisibleItems)
  let selection = useSelector(getItemSelection)
  let isTrashSelected = useSelector(state => state.nav.trash)

  useImperativeHandle(ref, () => ({
    focus () {
      scroll.current?.focus()
    }
  }), [])

  let select = (item, { mode, throttle } = {}) => {
    if (item == null) return

    let next = selection.select(item.id, { mode })

    if (next !== selection.state)
      dispatch(act.item.select({ item: next }, { throttle }))
  }

  let getSelection = useEvent(() => selection.ids())

  let getSelectedPhotos = () =>
    seq(selection.ids(), compose(
      map(id => get(items, [indexOf(items, id), 'photos'])),
      keep(),
      cat))

  // The first unselected item after or before the cursor.
  // Only these are checked: the worst case for sparse selections
  // is not worth the price.
  let adjacent = (cursor) => {
    let [prev, next] = cursor.adjacent()

    for (let it of [next, prev])
      if (it != null && !selection.has(it.id)) return it
  }

  let clearSelection = () => {
    dispatch(act.item.select({ items: [] }))
  }

  let open = (item) => {
    dispatch(act.item.open(item))
  }

  // Handlers for the leaves (memoized tiles and rows).
  let merge = useEvent((ids) => {
    dispatch(act.item.merge(ids))
  })

  let movePhotos = useEvent((payload) => {
    dispatch(act.photo.move(payload))
  })

  let contextMenu = (event, item) => {
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
  }

  let rotate = (by) => {
    if (!isReadOnly && selection.size > 0)
      dispatch(act.photo.rotate({ id: getSelectedPhotos(), by }))
  }

  let [scrollProps, handlers] = useSequence(items, {
    selection,
    isDisabled,
    keymap: 'ItemIterator',
    commands: {
      open ({ cursor }) {
        open(cursor.current())
      },
      preview (_, event) {
        preview(event.shiftKey ? -1 : 1)
      },
      clear: clearSelection,
      delete ({ cursor }) {
        let ids = selection.ids()

        if (!(isReadOnly || blank(ids))) {
          select(adjacent(cursor))
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
      edit ({ cursor }) {
        edit?.(cursor.current())
      }
    },
    onContextMenu: contextMenu,
    onOpen: open,
    // Ctrl/Cmd+arrow keys are left alone (they bubble).
    onSelect: (next, { ctrlKey, metaKey, move, throttle }) => {
      if (move != null && (ctrlKey || metaKey))
        return false

      dispatch(act.item.select({ item: next }, { throttle }))
    },
    onSelectedClick
  })

  let { cursor } = scrollProps

  let openCurrent = () => {
    open(cursor.current())
  }

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
    onDropItems: merge,
    onDropPhotos: movePhotos
  })

  return {
    connect,
    getIterableProps,
    handlers,
    isOver: file.canDrop,
    items,
    scrollProps,
    scroll,
    selection,
    tabIndex: (isDisabled || !items.length) ? null : tabIndex
  }
}
