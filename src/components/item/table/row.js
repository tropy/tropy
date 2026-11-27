import { memo } from 'react'
import cx from 'classnames'
import { TableCell } from './cell.js'
import { useEvent } from '../../../hooks/use-event.js'
import * as datatype from '../../../common/datatype.js'
import * as COLUMN from '../../../slices/columns/builtin.js'

const isItemColumn = (id) => {
  let idx = id.search(/^item\./)
  return -1 === idx ? false : id.slice(5)
}

export const TableRow = memo(({
  columns,
  data = {},
  drag,
  drop,
  editing,
  hasPositionColumn,
  index,
  isDisabled,
  isDragging,
  isOver,
  isReadOnly,
  isSelected,
  item,
  onCancel,
  onChange,
  onEdit,
  position,
  size,
  template
}) => {
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
      value.type = field?.datatype || datatype.text
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
      isEditing: editing === column.id,
      // Only metadata columns are searched.
      isHighlighted: !itemColumn,
      isMainColumn,
      isMoving: (idx >= drop && idx < drag) || (idx <= drop && idx > drag),
      isReadOnly: isReadOnly || !!column.protected,
      position: idx,
      type,
      value
    }

    if (isMainColumn) {
      Object.assign(props, { size, title: value })
    }

    if (column.id === 'item.template') {
      props.title = value
      props.display = template?.name
    }

    return props
  }

  let cellProps = {
    isDisabled,
    item,
    onCancel,
    onEdit
  }

  return (
    <div
      data-index={index}
      draggable={!isReadOnly}
      className={cx('tr', 'item', {
        active: isSelected,
        dragging: isDragging,
        over: isOver
      })}>
      {hasPositionColumn && (
        <TableCell
          {...cellProps}
          onChange={onChange}
          isReadOnly
          id={COLUMN.POSITION.id}
          type={COLUMN.POSITION.type}
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
