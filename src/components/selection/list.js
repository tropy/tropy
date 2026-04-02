import { memo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { DND } from '../dnd.js'
import { useEvent } from '../../hooks/use-event.js'
import { useDropOutside } from '../../hooks/use-drop-outside.js'
import { SelectionListItem } from './list-item.js'
import { adjacent, move } from '../../common/util.js'
import { dc } from '../../ontology/ns.js'
import cx from 'classnames'

export const SelectionList = memo(({
  isDisabled,
  isItemOpen,
  onChange,
  onContextMenu,
  onEdit,
  onEditCancel,
  onItemOpen,
  onSelect,
  onSort,
  photo,
  selections
}) => {
  let active = useSelector(state => state.nav.selection)
  let edit = useSelector(state => state.edit.selection)

  let container = useRef()
  let isSortable = !isDisabled && selections.length > 1

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
      className={cx('selection-list', { over: isOver })}>
      {selections.map((selection, index) => (
        <SelectionListItem
          key={selection.id}
          getAdjacent={getAdjacent}
          isActive={active === selection.id}
          isDisabled={isDisabled}
          isEditing={edit === selection.id}
          isItemOpen={isItemOpen}
          isLast={index === selections.length - 1}
          isSortable={isSortable}
          onChange={onChange}
          onContextMenu={onContextMenu}
          onDrop={handleDropSelection}
          onEdit={onEdit}
          onEditCancel={onEditCancel}
          onItemOpen={open}
          onSelect={select}
          photo={photo}
          selection={selection}
          title={dc.title}/>
      ))}
    </ul>
  )
})
