import { useRef } from 'react'
import { DND } from '../components/dnd.js'
import { useDropPhotoFiles } from './use-drop-photo-files.js'
import { useEvent } from './use-event.js'
import { useGlobalEvent } from './use-global-event.js'
import { useSortableSequence } from './use-sortable-sequence.js'
import { pick } from '../common/util.js'

export function usePhotoIterator ({
  canCreate,
  current,
  expandedPhotos,
  isDisabled,
  isItemOpen,
  photos,
  selection,
  onConsolidate,
  onContextMenu,
  onContract,
  onCreate,
  onDelete,
  onExpand,
  onExtract,
  onItemOpen,
  onItemPreview,
  onRotate,
  onSelect,
  onSort
}, { isGrid = false } = {}) {
  let scroll = useRef()

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

    onContract(isGrid ? photos.map(p => p.id) : [photo.id])

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

    onExpand(photo.id)
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
      onItemOpen({
        id: photo.item,
        photos: [photo.id],
        selection: photo.selection
      })
  })

  let remove = useEvent(({ id, item, selection }) => {
    if (!isDisabled) {
      onDelete(selection != null ?
          { photo: id, selections: [selection] } :
          { item, photos: [id] })
    }
  })

  let rotate = useEvent((by) => {
    if (isDisabled)
      return

    if (selection != null)
      onRotate({ id: selection, by, type: 'selection' })
    else if (current != null)
      onRotate({ id: current, by, type: 'photo' })
  })

  let extract = ({ id, selection }, meta = {}) => {
    onExtract({ id, selection }, meta)
  }

  let preview = ({ id, item }) => {
    onItemPreview({ id: item, photos: [id] })
  }

  let consolidate = useEvent((photo) => {
    onConsolidate([photo.id], { force: true, prompt: true })
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
    onSort: (order) => onSort({ item: photos[0].item, photos: order })
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

  return {
    classes,
    connect,
    contextMenu,
    contract,
    current: () => scroll.current?.current,
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
