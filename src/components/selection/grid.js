import { memo, useMemo } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { DND } from '../dnd.js'
import { useSortableSequence } from '../../hooks/use-sortable-sequence.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { useCursorKeys } from '../../hooks/use-cursor-keys.js'
import { SelectionTile } from './tile.js'
import { Cursor } from '../../common/sequence.js'
import { TABS } from '../../constants/index.js'
import { pluck } from '../../common/util.js'
import cx from 'classnames'

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
  let active = useSelector(state => state.nav.selection)
  let selections = useSelector(state =>
    pluck(state.selections, photo.selections), shallowEqual)


  let style = useMemo(() => ({
    gridTemplateColumns: `repeat(${cols}, ${cols}fr)`
  }), [cols])

  let sortable = useSortableSequence({
    type: DND.SELECTION,
    canDrop: (item) => item.photo === photo.id,
    isDisabled,
    items: photo.selections,
    onSort: (selections) => onSort({ photo: photo.id, selections })
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
      ref={sortable.isSortable ? sortable.drop : null}
      className={cx('selection-grid', {
        over: sortable.isOver && sortable.canDrop
      })}
      style={style}
      tabIndex={TABS.SelectionGrid}
      onBlur={onBlur}
      onKeyDown={onKeyDown}>
      {selections.map((selection, index) => (
        <SelectionTile
          key={selection.id}
          getAdjacent={sortable.getAdjacent}
          isActive={active === selection.id}
          isDisabled={isDisabled}
          isLast={index === selections.length - 1}
          isSortable={sortable.isSortable}
          isVertical={!(cols > 1)}
          onContextMenu={onContextMenu}
          onDrop={sortable.onDrop}
          onItemOpen={onItemOpen}
          onSelect={onSelect}
          photo={photo}
          selection={selection}
          size={size}/>
      ))}
    </ul>
  )
})
