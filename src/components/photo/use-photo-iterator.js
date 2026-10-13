import { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DND } from '../dnd.js'
import { useDropPhotoFiles } from '../../hooks/use-drop-photo-files.js'
import { useEvent } from '../../hooks/use-event.js'
import { useGlobalEvent } from '../../hooks/use-global-event.js'
import { useSortableSequence } from '../../hooks/use-sortable-sequence.js'
import { pick } from '../../common/util.js'
import { getExpandedPhotos, getVisiblePhotos } from '../../selectors/index.js'
import * as act from '../../actions/index.js'

// The photo list container logic shared by list and grid:
// selects the photos, the current photo and selection,
// and the expansions; dispatches the photo actions;
// hands the leaves (tiles, list items) stable handlers.
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

  let onSelect = (payload, meta) => {
    dispatch(act.photo.select(payload, meta))
  }

  let isSelected = (photo) =>
    current === photo.id

  let isExpandable = (photo) =>
    photo?.selections?.length > 0

  let isExpanded = (photo) =>
    photo != null && !!expandedPhotos[photo.id]

  let select = useEvent((photo, event) => {
    if (photo == null || (
      isSelected(photo) && selection === photo.selection
    )) {
      return
    }

    onSelect({
      photo: photo.id,
      item: photo.item,
      selection: photo.selection
    }, { throttle: event?.repeat })
  })

  let contract = (photo) => {
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

  let expand = (photo) => {
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

  let open = useEvent((photo) => {
    if (isItemOpen)
      expand(photo)
    else
      dispatch(act.item.open({
        id: photo.item,
        photos: [photo.id],
        selection: photo.selection
      }))
  })

  let remove = useEvent(({ id, item, selection }) => {
    if (isDisabled)
      return

    if (selection != null)
      dispatch(act.selection.delete({ photo: id, selections: [selection] }))
    else
      dispatch(act.photo.delete({ item, photos: [id] }))
  })

  let rotate = useEvent((by) => {
    if (isDisabled)
      return

    if (selection != null)
      dispatch(act.photo.rotate({ id: selection, by, type: 'selection' }))
    else if (current != null)
      dispatch(act.photo.rotate({ id: current, by, type: 'photo' }))
  })

  let extract = ({ id, selection }, meta = {}) => {
    dispatch(act.photo.extract({ id, selection }, meta))
  }

  let preview = ({ id, item }) => {
    dispatch(act.item.preview({ id: item, photos: [id] }))
  }

  let consolidate = useEvent((photo) => {
    dispatch(act.photo.consolidate([photo.id], { force: true, prompt: true }))
  })

  let contextMenu = useEvent((event, photo, selection) => {
    let scope = (selection == null) ? 'photo' : 'selection'

    onContextMenu(
      event,
      isDisabled ? `${scope}-read-only` : scope,
      pick(photo, ['id', 'item', 'path', 'protocol'],
        (selection == null) ? {} : { selection }))
  })

  useGlobalEvent('nextPhoto', (event) => {
    select(scroll.current?.next(), event)
  })

  useGlobalEvent('prevPhoto', (event) => {
    select(scroll.current?.prev(), event)
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
    selection,
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

  // Sorting the selections of a photo (nested selection list/grid).
  let sortSelections = useEvent((payload) => {
    dispatch(act.selection.order(payload))
  })

  return {
    classes,
    connect,
    contextMenu,
    contract,
    current: () => scroll.current?.current,
    cursor: current,
    expandedPhotos,
    photos,
    selection,
    sortSelections,
    expand,
    extract,
    getIterableProps,
    open,
    preview,
    remove,
    rotate,
    scroll,
    select
  }
}
