import { cloneElement, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useEvent } from '../../hooks/use-event.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useCursor } from '../../hooks/use-cursor.js'
import { useSequenceDragDrop } from '../../hooks/use-sequence-drag-drop.js'
import { PhotoDragPreview } from './drag-preview.js'
import { Thumbnail } from './thumbnail.js'
import { pick } from '../../common/util.js'
import { SASS } from '../../constants/index.js'
import { indexOf, toId } from '../../common/sequence.js'
import { selectPhotoExpansion } from '../../selectors/index.js'
import {
  selectActivePhotoIds,
  selectCursorPhoto,
  selectCursorSelection,
  selectIsPhotoGrid,
  selectPhotoSequence
} from '../../slices/nav/selectors.js'
import * as act from '../../actions/index.js'

// The photo list container logic shared by list and grid:
// selects the photos, the current photo and selection,
// and the expansions; dispatches the photo actions;
// hands the leaves (tiles, list items) stable handlers.
// The sequence holds photo and (in the list) expanded selection ids;
// handlers take ids (from the cursor) or records (from the leaves).
export function usePhotoIterator ({
  canCreate,
  isDisabled,
  isItemOpen,
  onContextMenu,
  onCreate,
  size
}) {
  let dispatch = useDispatch()
  let scroll = useRef()

  // Navigation: a Cursor with Scroll's layout over the ids.
  // The grid navigates the photos (the expansion row has its own
  // keys, in SelectionGrid); the list also steps into the expanded
  // selections, one row each, as Scroll renders them.
  // Photo and selection ids are unique (subjects), so both mix.
  let isGrid = useSelector(selectIsPhotoGrid)
  let sequence = useSelector(selectPhotoSequence)
  let photoIds = useSelector(selectActivePhotoIds)

  // Records by id: the leaves get them (memoized per record).
  let photos = useSelector(state => state.photos)
  let selections = useSelector(state => state.selections)

  let current = useSelector(state => selectCursorPhoto(state)?.id)
  let selection = useSelector(state => selectCursorSelection(state)?.id)
  // Photo id => when it was expanded (list), and the grid's expansion.
  let expandedPhotos = useSelector(state => state.panel.expand)
  let expansion = useSelector(selectPhotoExpansion)
  let contributors = useSelector(state => state.qr.contributors)

  // With several items, the photos of different items mix.
  let first = photos[photoIds[0]]
  let isUnsortable = photoIds.some(id => photos[id]?.item !== first?.item)

  // The active selection's row, or the photo's if not expanded.
  let at = (selection != null && indexOf(sequence, selection) >= 0) ?
    selection :
    current

  let [cursor, onLayoutChange] = useCursor(sequence, at)

  // The photo of an element (an id or a record),
  // and the selection id for selections.
  let resolve = (el) => {
    let id = toId(el)
    let sel = selections[id]

    return (sel != null) ?
      { photo: photos[sel.photo], selection: id } :
      { photo: photos[id], selection: undefined }
  }

  let onSelect = (payload, meta) => {
    dispatch(act.nav.select.photo(payload, meta))
  }

  let isSelected = (photo) =>
    current === photo.id

  let isExpandable = (photo) =>
    photo?.selections?.length > 0

  // An element (id or record) is expanded: in the grid only the
  // photo expanded last, in the list every expanded photo.
  let isExpanded = (el) => {
    let photo = photos[toId(el)]

    return isExpandable(photo) && (isGrid
      ? photo.id === expansion?.id
      : expandedPhotos[photo.id] > 0)
  }

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

    dispatch(act.photo.contract(isGrid ? photoIds : [photo.id]))

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
      dispatch(act.nav.open.item({
        id: photo.item,
        photo: photo.id,
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

  // Sorting the selections of a photo (selection grid and list rows).
  let sortSelections = useEvent((payload) => {
    dispatch(act.selection.order(payload))
  })

  // Photos drag (onto items, or to sort them); the list's
  // selection rows drag to sort within their photo.
  let dnd = useSequenceDragDrop(sequence, {
    isDisabled,
    isGrid,

    getData: (id) => {
      let { photo, selection: sel } = resolve(id)

      if (photo == null)
        return null

      if (sel == null)
        return {
          ...pick(photo, Thumbnail.keys),
          type: 'photo',
          id: photo.id,
          item: photo.item
        }

      return (photo.selections.length > 1)
        ? {
          ...pick(selections[sel], Thumbnail.keys),
          type: 'selection',
          id: sel,
          photo: photo.id,
          color: photo.color,
          mimetype: photo.mimetype,
          orientation: photo.orientation
        }
        : null
    },

    // The thumbnail variant the leaves show (the list's rows: 48),
    // already loaded: the browser snapshots the image at once.
    preview: (data) =>
      <PhotoDragPreview item={data} size={isGrid ? size : SASS.ICON.SIZE}/>,

    sort: {
      accept: isGrid ? 'photo' : ['photo', 'selection'],

      canSort: (data, id) =>
        (data.type === 'photo')
          ? !isUnsortable && photos[id] != null
          : selections[id]?.photo === data.photo,

      getOrder: (data) =>
        (data.type === 'photo')
          ? photoIds
          : photos[data.photo].selections,

      onSort: (order, data) => {
        if (data.type === 'photo')
          dispatch(act.photo.order({ item: first.item, photos: order }))
        else
          sortSelections({ photo: data.photo, selections: order })
      }
    }
  })

  let [file, dropFile] = useDropPhotoFiles({
    isDisabled: isDisabled || !canCreate,
    onDrop: onCreate
  })

  let connect = (element) =>
    cloneElement(element, {
      onPointerDown: dnd.onPointerDown,
      ref: (node) => {
        dnd.setContainer(node)
        dropFile(node)
      }
    })

  let classes = {
    'over-file': file.isOver
  }

  // Null for ids without a record (briefly possible after a delete).
  let getIterableProps = (id, index) => {
    let photo = photos[id]

    if (photo == null)
      return null

    return {
      ...dnd.getLeafProps(id),
      index,
      photo,
      isActive: isSelected(photo) && selection == null,
      isDisabled,
      isExpandable: isExpandable(photo),
      isItemOpen,
      isMatch: !!contributors?.photos[photo.id],
      isSelected: isSelected(photo),
      onConsolidate: consolidate,
      onContextMenu: contextMenu,
      onItemOpen: open,
      onSelect: select,
      onToggle: toggle
    }
  }

  // Null for ids without a record (as getIterableProps).
  let getSelectionProps = (id, index) => {
    let value = selections[id]
    let { photo } = resolve(id)

    if (value == null || photo == null)
      return null

    return {
      ...dnd.getLeafProps(id),
      index,
      photo,
      selection: value,
      isActive: selection === value.id,
      isDisabled,
      isItemOpen,
      isLast: photo.selections.at(-1) === value.id,
      onContextMenu: contextMenu,
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
    expansion,
    extract,
    getIterableProps,
    getSelectionProps,
    isExpanded,
    move,
    onLayoutChange,
    open,
    preview,
    remove,
    resolve,
    rotate,
    scroll,
    select,
    sequence,
    sortSelections
  }
}
