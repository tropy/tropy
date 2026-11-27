import { memo, useMemo } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { useSequenceDragDrop } from '../../hooks/use-sequence-drag-drop.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { SelectionTile } from './tile.js'
import { PhotoDragPreview } from '../photo/drag-preview.js'
import { Thumbnail } from '../photo/thumbnail.js'
import { Cursor } from '../../common/sequence.js'
import { TABS } from '../../constants/index.js'
import { pick, pluck } from '../../common/util.js'
import { selectCursorSelection } from '../../slices/nav/selectors.js'

export const SelectionGrid = memo(({
  cols,
  isDisabled,
  onBlur,
  onContextMenu,
  onDelete,
  onItemOpen,
  onRotate,
  onSelect,
  onSort,
  photo,
  size
}) => {
  let active = useSelector(state => selectCursorSelection(state)?.id)
  let selections = useSelector(state =>
    pluck(state.selections, photo.selections), shallowEqual)


  let style = useMemo(() => ({
    gridTemplateColumns: `repeat(${cols}, ${cols}fr)`
  }), [cols])

  let { getLeafProps, onPointerDown, setContainer } =
    useSequenceDragDrop(photo.selections, {
      isDisabled: isDisabled || photo.selections.length < 2,
      isGrid: true,

      getData: (id) => ({
        ...pick(selections.find(s => s.id === id), Thumbnail.keys),
        type: 'selection',
        id,
        photo: photo.id,
        color: photo.color,
        mimetype: photo.mimetype,
        orientation: photo.orientation
      }),

      preview: (data) => <PhotoDragPreview item={data} size={size}/>,

      sort: {
        accept: 'selection',
        canSort: (data) => data.photo === photo.id,
        onSort: (order) => onSort({ photo: photo.id, selections: order })
      }
    })

  let cursor = new Cursor(selections, active, {
    layout: 'grid',
    columns: cols
  })

  let onKeyDown = useCursorKeys(cursor, {
    onMove: onSelect,
    onKeyDown: useKeyMap('SelectionGrid', {
      open () {
        onItemOpen(cursor.current())
      },
      delete () {
        // Subtle: always handled, so that the key does not bubble
        // up to the photo grid and delete the photo instead.
        if (cursor.current() != null)
          onDelete(cursor.current())
      },
      rotateLeft () {
        onRotate(-90)
      },
      rotateRight () {
        onRotate(90)
      }
    })
  })

  return (
    <ul
      ref={setContainer}
      className="selection-grid"
      style={style}
      tabIndex={TABS.SelectionGrid}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}>
      {selections.map((selection, index) => (
        <SelectionTile
          {...getLeafProps(selection.id)}
          key={selection.id}
          index={index}
          isActive={active === selection.id}
          isLast={index === selections.length - 1}
          onContextMenu={onContextMenu}
          onItemOpen={onItemOpen}
          onSelect={onSelect}
          photo={photo}
          selection={selection}
          size={size}/>
      ))}
    </ul>
  )
})
