import { memo } from 'react'
import cx from 'classnames'
import { CoverImage } from '../cover-image.js'
import { Editable } from '../../editable.js'
import { TagColors } from '../../tag/colors.js'
import { auto } from '../../../format.js'
import { noop } from '../../../common/util.js'

export const TableCell = memo(({
  display,
  getNextColumn = noop,
  getPrevColumn = noop,
  id,
  isDisabled,
  isDragging,
  isEditing,
  isMainColumn,
  isMoving,
  isReadOnly,
  item,
  onCancel,
  onChange,
  onEdit,
  position = 0,
  size = 48,
  title,
  type,
  value
}) => {
  let edit = (property) => {
    onEdit({ column: { [item.id]: property } })
  }

  let handleChange = (text) => {
    onChange(id, { text, type })
    onCancel()
  }

  let handleKeyDown = (event, input) => {
    if (event.key === 'Tab') {
      event.preventDefault()
      event.stopPropagation()
      event.nativeEvent.stopImmediatePropagation()

      if (input.hasChanged) input.commit(true)

      let next = event.shiftKey ?
        getPrevColumn(position) :
        getNextColumn(position)

      if (next != null) edit(next)
    }
  }

  return (
    <div
      className={cx('td', 'metadata', type, {
        dragging: isDragging,
        'main-column': isMainColumn,
        moving: isMoving,
        'read-only': isReadOnly
      })}
      data-column={id}>
      <div className="flex-row center td-container">
        {isMainColumn && (
          <div className="cover-image-container">
            <CoverImage
              cover={item.cover}
              photos={item.photos}
              size={size}/>
          </div>
        )}
        <Editable
          display={display || auto(value, type)}
          isActive={isEditing}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          resize
          title={title}
          value={value}
          onCancel={onCancel}
          onChange={handleChange}
          onKeyDown={handleKeyDown}/>
        {isMainColumn && <TagColors tags={item.tags}/>}
      </div>
    </div>
  )
})
