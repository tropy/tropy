import cx from 'classnames'
import { SelectionTile } from './tile.js'
import { useDropSelection } from '../../hooks/use-drop-selection.js'
import { useEvent } from '../../hooks/use-event.js'
import { useKeyMap } from '../../hooks/use-keymap.js'
import { useNavControls } from '../../hooks/use-nav-controls.js'
import { adjacent, move } from '../../common/util.js'
import { TABS } from '../../constants/index.js'


export function SelectionGrid({
  active,
  cols,
  isDisabled,
  isItemOpen,
  photo,
  selections,
  onBlur,
  onContextMenu,
  onDelete,
  onItemOpen,
  onRotate,
  onSelect,
  onSort
}) {
  let isSortable = !isDisabled && selections.length > 1

  let [{ isOver }, drop] = useDropSelection({ photo, isSortable })

  let handleDropSelection = useEvent(({ id, to, offset }) => {
    let order = move(photo.selections, id, to, offset)
    onSort({ photo: photo.id, selections: order })
  })

  let handleSelect = useEvent((selection) => {
    onSelect({
      id: photo.id,
      item: photo.item,
      selection: selection.id
    })
  })

  let { first, last, next, prev, current, isActive, select } =
    useNavControls(selections, {
      active,
      onSelect: handleSelect
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

  let getAdjacent = useEvent((selection) => {
    return adjacent(selections, selection).map(s => s.id)
  })

  let remove = useEvent((selection) => {
    if (selection != null) {
      onDelete({
        id: photo.id,
        selection: selection.id
      })
    }
  })

  let handleKeyDown = useKeyMap('SelectionGrid', {
    left() {
      select(prev())
    },
    right() {
      select(next())
    },
    up() {
      select(prev(cols))
    },
    down() {
      select(next(cols))
    },
    first() {
      select(first())
    },
    last() {
      select(last())
    },
    open() {
      open(current())
    },
    delete() {
      remove(current())
      select(next() || prev())
    },
    rotateLeft() {
      onRotate(-90)
    },
    rotateRight() {
      onRotate(90)
    }
  })

  let style = {
    gridTemplateColumns: `repeat(${cols}, ${cols}fr)`
  }

  return (
    <ul
      ref={isSortable ? drop : null}
      className={cx('selection-grid', { over: isOver })}
      style={style}
      tabIndex={TABS.SelectionGrid}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}>
      {selections.map((selection, index) => (
        <SelectionTile
          key={selection.id}
          getAdjacent={getAdjacent}
          isActive={isActive(selection.id)}
          isDisabled={isDisabled}
          isItemOpen={isItemOpen}
          isLast={index === selections.length - 1}
          isSortable={isSortable}
          photo={photo}
          selection={selection}
          onContextMenu={onContextMenu}
          onDropSelection={handleDropSelection}
          onItemOpen={open}
          onSelect={select}/>
      ))}
    </ul>
  )
}
