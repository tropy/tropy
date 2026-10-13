import { useImperativeHandle, useRef } from 'react'
import { seq, compose, map, cat, keep } from 'transducers.js'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useEvent } from '../../hooks/use-event.js'
import { useEventHandler } from '../../hooks/use-event-handler.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { getKeyState, getSelectionMode } from '../../keymap.js'
import { indexOf } from '../../common/sequence.js'
import { blank, get } from '../../common/util.js'

export function useItemIterator ({
  isDisabled,
  isReadOnly,
  isTrashSelected,
  items,
  list,
  photos,
  ref,
  selection,
  tags,
  onContextMenu,
  onItemDelete,
  onItemExport,
  onItemImport,
  onItemMerge,
  onItemOpen,
  onItemPreview,
  onPhotoMove,
  onPhotoRotate,
  onSelect
}, { edit, isGrid = false, tabIndex }) {
  let scroll = useRef()

  useImperativeHandle(ref, () => ({
    focus () {
      scroll.current?.focus()
    }
  }), [])

  let current = () => scroll.current?.current

  let select = useEvent((item, { mode, throttle } = {}) => {
    if (item == null) return

    let next = selection.select(item.id, { mode })

    if (next !== selection.state)
      onSelect({ item: next }, { throttle })
  })

  // Arrow keys (via Scroll), the global next/prev events,
  // and Scroll's autoselect on focus (without an event):
  // it only selects when nothing is selected yet.
  let handleSelectItem = useEvent((item, event) => {
    if (event == null && selection.size > 0)
      return

    let mode = event && getSelectionMode(getKeyState(event))

    if (isGrid && mode === 'extend')
      mode = 'step'

    select(item, { mode, throttle: event?.repeat })
  })

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
    for (let it of [scroll.current?.next(), scroll.current?.prev()])
      if (it != null && !selection.has(it.id)) return it
  }

  let clearSelection = () => {
    onSelect({ items: [] })
  }

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

  let open = () => {
    onItemOpen(current())
  }

  let onKeyDown = useKeyMap('ItemIterator', {
    open,
    preview () {
      let item = current()
      if (item != null)
        onItemPreview({ id: item.id, photos: item.photos })
    },
    clear: clearSelection,
    delete () {
      let ids = selection.ids()

      if (!(isReadOnly || blank(ids))) {
        select(adjacent())
        onItemDelete(ids)
      }
    },
    all () {
      onSelect({ all: true })
    },
    merge () {
      let ids = selection.ids()

      if (!(isReadOnly || blank(ids)))
        onItemMerge(ids)
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
      onPhotoRotate({ id: getSelectedPhotos(), by })
  }

  useGlobalEvent('nextItem', (event) => {
    handleSelectItem(scroll.current?.next(), event)
  })

  useGlobalEvent('prevItem', (event) => {
    handleSelectItem(scroll.current?.prev(), event)
  })

  // The mouse forward button.
  useGlobalEvent('forward', open)

  useEventHandler(window, 'copy', () => {
    let sel = document.getSelection()
    let ids = selection.elements()

    if ((sel == null || !sel.toString()) && !blank(ids))
      onItemExport(ids, { target: ':clipboard:' })
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
    photos,
    tags,
    isSelected: selection.has(item.id),
    isReadOnly,
    getSelection,
    onContextMenu: contextMenu,
    onDropItems: onItemMerge,
    onDropPhotos: onPhotoMove,
    onItemOpen,
    onSelect: select
  })

  return {
    clearSelection,
    connect,
    getIterableProps,
    handleSelectItem,
    isOver: file.canDrop,
    onKeyDown,
    scroll,
    tabIndex: (isDisabled || !items.length) ? null : tabIndex
  }
}
