import { memo, useMemo, useRef } from 'react'
import { DND } from '../dnd.js'
import { useEvent } from '../../hooks/use-event.js'
import { useDropOutside } from '../../hooks/use-drop-outside.js'
import { SelectionTile } from './tile.js'
import { adjacent, move } from '../../common/util.js'
import { match } from '../../keymap.js'
import { indexOf, sanitize } from '../../common/collection.js'
import { TABS } from '../../constants/index.js'
import cx from 'classnames'

export const SelectionGrid = memo(({
  active,
  cols,
  isDisabled,
  keymap,
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

  let next = (offset = 1) => {
    if (active != null)
      return selections[sanitize(
        selections.length,
        indexOf(selections, active) + offset,
        'bounds')]
    else
      return selections[0]
  }

  let prev = (offset = 1) => {
    if (active != null)
      return next(-offset)
    else
      return selections[selections.length - 1]
  }

  let handleKeyDown = useEvent((event) => {
    switch (match(keymap, event)) {
      case 'left':
        select(prev())
        break
      case 'right':
        select(next())
        break
      case 'up':
        select(prev(cols))
        break
      case 'down':
        select(next(cols))
        break
      case 'first':
        select(selections[0])
        break
      case 'last':
        select(selections[selections.length - 1])
        break
      case 'open':
        open(next(0))
        break
      case 'delete': {
        let current = next(0)
        if (current != null) {
          onDelete({
            id: photo.id,
            selection: current.id
          })
          select(next() || prev())
        }
        break
      }
      case 'rotateLeft':
        onRotate(-90)
        break
      case 'rotateRight':
        onRotate(90)
        break
      default:
        return
    }

    event.preventDefault()
    event.stopPropagation()
    event.nativeEvent.stopImmediatePropagation()
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
