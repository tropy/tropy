import cx from 'classnames'
import { SelectionListItem } from './list-item.js'
import { useDropSelection } from '../../hooks/use-drop-selection.js'
import { useEvent } from '../../hooks/use-event.js'
import { adjacent, move } from '../../common/util.js'
import { dc } from '../../ontology/ns.js'


export function SelectionList({
  active,
  data,
  edit,
  isDisabled,
  isItemOpen,
  photo,
  selections,
  onChange,
  onContextMenu,
  onEdit,
  onEditCancel,
  onItemOpen,
  onSelect,
  onSort
}) {
  let isSortable = !isDisabled && selections.length > 1

  let [{ isOver }, drop] = useDropSelection({ photo, isSortable })

  let handleDropSelection = useEvent(({ id, to, offset }) => {
    let order = move(photo.selections, id, to, offset)
    onSort({ photo: photo.id, selections: order })
  })

  let select = useEvent((selection) => {
    if (selection != null && active !== selection.id) {
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

  let getAdjacent = useEvent((selection) => {
    return adjacent(selections, selection).map(s => s.id)
  })

  return (
    <ul
      ref={isSortable ? drop : null}
      className={cx('selection-list', { over: isOver })}>
      {selections.map((selection, index) => (
        <SelectionListItem
          key={selection.id}
          data={data}
          getAdjacent={getAdjacent}
          isActive={active === selection.id}
          isDisabled={isDisabled}
          isEditing={edit === selection.id}
          isItemOpen={isItemOpen}
          isLast={index === selections.length - 1}
          isSortable={isSortable}
          photo={photo}
          selection={selection}
          title={dc.title}
          onChange={onChange}
          onContextMenu={onContextMenu}
          onDropSelection={handleDropSelection}
          onEdit={onEdit}
          onEditCancel={onEditCancel}
          onItemOpen={open}
          onSelect={select}/>
      ))}
    </ul>
  )
}
