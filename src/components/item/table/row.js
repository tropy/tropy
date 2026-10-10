import { memo, useRef } from 'react'
import cx from 'classnames'
import { TableCell } from './cell.js'
import { useDragDropItem } from '../../../hooks/use-drag-drop-items.js'
import { useItemClickHandler } from '../../../hooks/use-item-click-handler.js'
import { useEvent } from '../../../hooks/use-event.js'
import { get } from '../../../common/util.js'
import { NAV, TYPE } from '../../../constants/index.js'

const isItemColumn = (id) => {
  let idx = id.search(/^item\./)
  return -1 === idx ? false : id.slice(5)
}

export const TableRow = memo(({
  columns,
  data = {},
  drag,
  drop,
  edit,
  getSelection,
  hasPositionColumn,
  isDisabled,
  isReadOnly,
  isSelected,
  item,
  onCancel,
  onChange,
  onContextMenu,
  onDropItems,
  onDropPhotos,
  onEdit,
  onItemOpen,
  onSelect,
  photos,
  position,
  size,
  tags,
  template
}) => {
  let container = useRef()

  let [{ canDrop, isDragging, isOver }, dnd] =
    useDragDropItem(container, {
      item,
      getSelection,
      isDisabled: isReadOnly,
      onDropItems,
      onDropPhotos
    })

  let handlers = useItemClickHandler(item, {
    isSelected,
    onContextMenu,
    onOpen: onItemOpen,
    onSelect
  })

  let getNextColumn = useEvent((at = 0, dir = 1) => {
    for (let k = 1, N = columns.length; k < N; ++k) {
      let column = columns[(N + at + k * dir) % N]
      if (column.protected) continue
      return column.id
    }
  })

  let getPrevColumn = useEvent((at = 0) => (
    getNextColumn(at, -1)
  ))

  let handleChange = useEvent((id, value) => {
    if (value.type == null) {
      let field = template?.fields?.find(f => f.property === id)
      value.type = field?.datatype || TYPE.TEXT
    }

    onChange({
      id: item.id,
      data: { [id]: value }
    })
  })

  let getColumnProps = (column, idx) => {
    let isMainColumn = (idx === 0)
    let itemColumn = isItemColumn(column.id)
    let type, value

    if (itemColumn) {
      type = column.type
      value = item[itemColumn]

    } else {
      let cell = data[column.id]

      if (cell != null) {
        type = cell.type
        value = cell.text
      }
    }

    let props = {
      id: column.id,
      isDragging: idx === drag,
      isEditing: get(edit, [item.id]) === column.id,
      isMainColumn,
      isMoving: (idx >= drop && idx < drag) || (idx <= drop && idx > drag),
      isReadOnly: isReadOnly || !!column.protected,
      position: idx,
      type,
      value
    }

    if (isMainColumn) {
      Object.assign(props, { photos, tags, size, title: value })
    }

    if (column.id === 'item.template') {
      props.title = value
      props.display = template?.name
    }

    return props
  }

  let cellProps = {
    getSelection,
    isDisabled,
    isSelected,
    item,
    onCancel,
    onEdit
  }

  return (
    <div
      {...handlers}
      ref={dnd}
      className={cx('tr', 'item', {
        active: isSelected,
        dragging: isDragging,
        over: isOver && canDrop
      })}>
      {hasPositionColumn && (
        <TableCell
          {...cellProps}
          onChange={onChange}
          isReadOnly
          id={NAV.COLUMN.POSITION.id}
          type={NAV.COLUMN.POSITION.type}
          value={position}/>
      )}
      {columns.map((column, idx) => (
        <TableCell
          key={column.id}
          {...cellProps}
          {...getColumnProps(column, idx)}
          getNextColumn={getNextColumn}
          getPrevColumn={getPrevColumn}
          onChange={handleChange}/>
      ))}
    </div>
  )
})
