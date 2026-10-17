import { useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DND } from '../dnd.js'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useEvent } from '../../hooks/use-event.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useCursor } from '../../hooks/use-cursor.js'
import { useSortableSequence } from '../../hooks/use-sortable-sequence.js'
import { move as reorder, pick, pluck } from '../../common/util.js'
import { adjacent, indexOf } from '../../common/sequence.js'
import { getExpandedPhotos, getVisiblePhotos } from '../../selectors/index.js'
import * as act from '../../actions/index.js'

// The photo list container logic shared by list and grid:
// selects the photos, the current photo and selection,
// and the expansions; dispatches the photo actions;
// hands the leaves (tiles, list items) stable handlers.
// Commands take sequence elements: photos or selections
// (a selection has a photo field).
export function usePhotoIterator ({
  canCreate,
  isDisabled,
  isItemOpen,
  onContextMenu,
  onCreate
}, { isGrid = false } = {}) {
  let dispatch = useDispatch()
  let scroll = useRef()

  let photos = useSelector(getVisiblePhotos)
  let current = useSelector(state => state.nav.photo)
  let selection = useSelector(state => state.nav.selection)
  let expandedPhotos = useSelector(getExpandedPhotos)
  let selections = useSelector(state => state.selections)

  // Navigation: a Cursor with Scroll's layout.
  // The grid navigates the photos (the expansion row has its own
  // keys, in SelectionGrid); the list also steps into the expanded
  // selections, one row each, as Scroll renders them.
  // Photo and selection ids are unique (subjects), so both mix.
  let sequence = useMemo(() => isGrid ? photos : photos.flatMap(photo => [
    photo,
    ...pluck(selections, expandedPhotos[photo.id] ?? [])
  ]), [isGrid, photos, expandedPhotos, selections])

  // The active selection's row, or the photo's if not expanded.
  let at = (selection != null && indexOf(sequence, selection) >= 0) ?
    selection :
    current

  let [cursor, onLayoutChange] = useCursor(sequence, at)

  // The photo of an element, and the selection id for selections.
  let resolve = (el) => (el?.photo != null) ?
    { photo: photos[indexOf(photos, el.photo)], selection: el.id } :
    { photo: el, selection: undefined }

  let onSelect = (payload, meta) => {
    dispatch(act.photo.select(payload, meta))
  }

  let isSelected = (photo) =>
    current === photo.id

  let isExpandable = (photo) =>
    photo?.selections?.length > 0

  let isExpanded = (photo) =>
    photo != null && !!expandedPhotos[photo.id]

  let select = useEvent((el, keyState) => {
    let { photo, selection: target } = resolve(el)

    if (photo == null || (isSelected(photo) && selection === target))
      return

    onSelect({
      photo: photo.id,
      item: photo.item,
      selection: target
    }, { throttle: keyState?.repeat })
  })

  // Expansion works on the element's photo
  // (contracting a selection row contracts its photo).
  let contract = (el) => {
    let { photo } = resolve(el)

    if (!(isExpandable(photo) && isExpanded(photo)))
      return false

    dispatch(act.photo.contract(isGrid ? photos.map(p => p.id) : [photo.id]))

    if (isSelected(photo)) {
      onSelect({
        photo: photo.id,
        item: photo.item,
        ...(isGrid && { note: photo.notes[0] })
      })
    }

    return true
  }

  let expand = (el) => {
    let { photo } = resolve(el)

    if (!isExpandable(photo) || isExpanded(photo))
      return false

    dispatch(act.photo.expand(photo.id))
    return true
  }

  let toggle = useEvent((photo) => {
    if (isExpanded(photo))
      contract(photo)
    else
      expand(photo)
  })

  let open = useEvent((el) => {
    let { photo, selection } = resolve(el)

    if (photo == null)
      return

    if (isItemOpen)
      expand(photo)
    else
      dispatch(act.item.open({
        id: photo.item,
        photos: [photo.id],
        selection
      }))
  })

  let remove = useEvent((el) => {
    let { photo, selection } = resolve(el)

    if (isDisabled || photo == null)
      return

    if (selection != null)
      dispatch(act.selection.delete({ photo: photo.id, selections: [selection] }))
    else
      dispatch(act.photo.delete({ item: photo.item, photos: [photo.id] }))
  })

  let rotate = useEvent((by) => {
    if (isDisabled)
      return

    if (selection != null)
      dispatch(act.photo.rotate({ id: selection, by, type: 'selection' }))
    else if (current != null)
      dispatch(act.photo.rotate({ id: current, by, type: 'photo' }))
  })

  let extract = (el, meta = {}) => {
    let { photo, selection } = resolve(el)

    if (photo != null)
      dispatch(act.photo.extract({ id: photo.id, selection }, meta))
  }

  let preview = (el) => {
    let { photo } = resolve(el)

    if (photo != null)
      dispatch(act.item.preview({ id: photo.item, photos: [photo.id] }))
  }

  let consolidate = useEvent((photo) => {
    dispatch(act.photo.consolidate([photo.id], { force: true, prompt: true }))
  })

  let contextMenu = useEvent((event, el) => {
    let { photo, selection } = resolve(el)
    let scope = (selection == null) ? 'photo' : 'selection'

    onContextMenu(
      event,
      isDisabled ? `${scope}-read-only` : scope,
      pick(photo, ['id', 'item', 'path', 'protocol'],
        (selection == null) ? {} : { selection }))
  })

  // Cursor keys; Ctrl/Cmd+arrow keys are left alone (they bubble).
  let move = (el, keyState) => {
    if (keyState.ctrlKey || keyState.metaKey)
      return false

    select(el, keyState)
  }

  useGlobalEvent('nextPhoto', (event) => {
    select(cursor.next(), event)
  })

  useGlobalEvent('prevPhoto', (event) => {
    select(cursor.prev(), event)
  })

  let sortable = useSortableSequence({
    type: DND.PHOTO,
    isDisabled,
    items: photos.map(photo => photo.id),
    onSort: (order) =>
      dispatch(act.photo.order({ item: photos[0].item, photos: order }))
  })

  let [file, dropFile] = useDropPhotoFiles({
    isDisabled: !canCreate,
    onDrop: onCreate
  })

  let connect = (element) =>
    isDisabled ? element : sortable.drop(dropFile(element))

  let classes = {
    over: sortable.isOver && sortable.canDrop,
    'over-file': file.isOver && file.canDrop
  }

  let getIterableProps = (photo) => ({
    photo,
    isActive: isSelected(photo) && selection == null,
    isDisabled,
    isExpandable: isExpandable(photo),
    isItemOpen,
    isSelected: isSelected(photo),
    isVertical: !isGrid,
    getAdjacent: sortable.getAdjacent,
    onConsolidate: consolidate,
    onContextMenu: contextMenu,
    onDropPhoto: sortable.onDrop,
    onItemOpen: open,
    onSelect: select,
    onToggle: toggle
  })

  // Sorting the selections of a photo (selection grid and list rows).
  let sortSelections = useEvent((payload) => {
    dispatch(act.selection.order(payload))
  })

  // The list's selection rows sort within their photo.
  let getSelectionAdjacent = useEvent((value) =>
    adjacent(resolve(value).photo.selections, value.id))

  let dropSelection = useEvent(({ id, to, offset }) => {
    let { photo } = resolve(selections[id])

    sortSelections({
      photo: photo.id,
      selections: reorder(photo.selections, id, to, offset)
    })
  })

  let getSelectionProps = (value) => {
    let { photo } = resolve(value)

    return {
      photo,
      selection: value,
      getAdjacent: getSelectionAdjacent,
      isActive: selection === value.id,
      isDisabled,
      isItemOpen,
      isLast: photo.selections.at(-1) === value.id,
      isSortable: !isDisabled && photo.selections.length > 1,
      onContextMenu: contextMenu,
      onDrop: dropSelection,
      onItemOpen: open,
      onSelect: select
    }
  }

  return {
    classes,
    connect,
    contextMenu,
    contract,
    current: () => cursor.current(),
    cursor,
    expand,
    expandedPhotos,
    extract,
    getIterableProps,
    getSelectionProps,
    move,
    onLayoutChange,
    open,
    photos,
    preview,
    remove,
    rotate,
    scroll,
    select,
    sortSelections
  }
}
