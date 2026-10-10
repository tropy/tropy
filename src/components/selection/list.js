import { memo, useRef } from 'react'
import { useSelector } from 'react-redux'
import { DND } from '../dnd.js'
import { useEvent } from '../../hooks/use-event.js'
import { useSortableSequence } from '../../hooks/use-sortable-sequence.js'
import { SelectionListItem } from './list-item.js'
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

  let sortable = useSortableSequence({
    type: DND.SELECTION,
    canDrop: (item) => item.photo === photo.id,
    isDisabled,
    items: photo.selections,
    onSort: (selections) => onSort({ photo: photo.id, selections })
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

  let handleEdit = useEvent((selection) => {
    onEdit({ selection: selection.id })
  })

  let handleContextMenu = useEvent((event, selection) => {
    onContextMenu(event, photo, selection.id)
  })

  return (
    <ul
      ref={sortable.isSortable ? sortable.drop(container) : container}
      className={cx('selection-list', {
        over: sortable.isOver && sortable.canDrop
      })}>
      {selections.map((selection, index) => (
        <SelectionListItem
          key={selection.id}
          getAdjacent={sortable.getAdjacent}
          isActive={active === selection.id}
          isDisabled={isDisabled}
          isEditing={edit === selection.id}
          isItemOpen={isItemOpen}
          isLast={index === selections.length - 1}
          isSortable={sortable.isSortable}
          onChange={onChange}
          onContextMenu={handleContextMenu}
          onDrop={sortable.onDrop}
          onEdit={handleEdit}
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
