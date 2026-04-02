import { memo, useMemo, useRef } from 'react'
import { DND } from '../dnd.js'
import { useEvent } from '../../hooks/use-event.js'
import { useDropOutside } from '../../hooks/use-drop-outside.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { useNavKeys } from '../../hooks/use-nav-keys.js'
import { SelectionTile } from './tile.js'
import { adjacent, move } from '../../common/util.js'
import { TABS } from '../../constants/index.js'
import cx from 'classnames'

export const SelectionGrid = memo(({
  active,
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
    adjacent(selections, selection).map(s => s.id))

  let { current, next, prev } = useNavKeys(selections, active)

  let handleKeyDown = useKeyMap('SelectionGrid', {
    left () {
      select(prev())
    },
    right () {
      select(next())
    },
    up () {
      select(prev(cols))
    },
    down () {
      select(next(cols))
    },
    first () {
      select(selections[0])
    },
    last () {
      select(selections.at(-1))
    },
    open () {
      open(current())
    },
    delete () {
      let c = current()
      if (c != null) {
        onDelete({ id: photo.id, selection: c.id })
        select(next() || prev())
      }
    },
    rotateLeft () {
      onRotate(-90)
    },
    rotateRight () {
      onRotate(90)
    }
  })

  let canDrop = useEvent((item) =>
    photo.id === item.photo)

  let [{ isOver }, drop] = useDropOutside({
    type: DND.SELECTION,
    canDrop,
    items: photo.selections,
    onDrop: handleDropSelection
  })

  return (
    <ul
      ref={isSortable ? drop(container) : container}
      className={cx('selection-grid', { over: isOver })}
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
