import { memo, useMemo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { DND } from '../dnd.js'
import { useEvent } from '../../hooks/use-event.js'
import { useDropOutside } from '../../hooks/use-drop-outside.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { SelectionTile } from './tile.js'
import { adjacent, move } from '../../common/util.js'
import { Cursor } from '../../common/sequence.js'
import { TABS } from '../../constants/index.js'
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
  selections,
  size
}) => {
  let active = useSelector(state => state.nav.selection)

  let container = useRef()
  let isSortable = !isDisabled && selections.length > 1

  let style = useMemo(() => ({
    gridTemplateColumns: `repeat(${cols}, ${cols}fr)`
  }), [cols])

  let handleDropSelection = useEvent(({ id, to, offset }) => {
    onSort({ photo: photo.id, selections: move(photo.selections, id, to, offset) })
  })

  let select = useEvent((selection) => {
    if (selection != null) {
      onSelect({
        id: photo.id,
        item: photo.item,
        selection: selection.id
      })
    }
  })

  let open = useEvent((selection) => {
    if (selection != null) {
      onItemOpen({
        id: photo.id,
        item: photo.item,
        selection: selection.id
      })
    }
  })

  let getAdjacent = useEvent((selection) =>
    adjacent(selections, selection).map(s => s?.id))

  let cursor = new Cursor(selections, active, { columns: cols })

  let handleKeyDown = useKeyMap('SelectionGrid', {
    left () {
      select(cursor.prev())
    },
    right () {
      select(cursor.next())
    },
    up () {
      select(cursor.up())
    },
    down () {
      select(cursor.down())
    },
    first () {
      select(cursor.first())
    },
    last () {
      select(cursor.last())
    },
    open () {
      open(cursor.current())
    },
    delete () {
      if (cursor.current()) {
        onDelete({ id: photo.id, selection: active })
        let [prev, next] = cursor.adjacent()
        select(next ?? prev)
      }
    },
    rotateLeft () {
      onRotate(-90)
    },
    rotateRight () {
      onRotate(90)
    }
  })

  let canDropSelection = useEvent((item) =>
    isSortable &&
    photo.id === item.photo &&
    item.id !== photo.selections.at(-1))

  let [{ canDrop, isOver }, drop] = useDropOutside({
    type: DND.SELECTION,
    canDrop: canDropSelection,
    items: photo.selections,
    onDrop: handleDropSelection
  })

  return (
    <ul
      ref={isSortable ? drop(container) : container}
      className={cx('selection-grid', { over: isOver && canDrop })}
      style={style}
      tabIndex={TABS.SelectionGrid}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}>
      {selections.map((selection, index) => (
        <SelectionTile
          key={selection.id}
          getAdjacent={getAdjacent}
          isActive={active === selection.id}
          isDisabled={isDisabled}
          isLast={index === selections.length - 1}
          isSortable={isSortable}
          isVertical={!(cols > 1)}
          onContextMenu={onContextMenu}
          onDrop={handleDropSelection}
          onItemOpen={open}
          onSelect={select}
          photo={photo}
          selection={selection}
          size={size}/>
      ))}
    </ul>
  )
})
