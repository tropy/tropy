import React, { useCallback, useRef } from 'react'
import cx from 'classnames'
import { shape, number, string, bool, func } from 'prop-types'
import { Editable } from '../editable.js'
import { IconPlusCircles } from '../icons.js'
import { TagColor } from '../colors.js'
import { isMeta } from '../../keymap.js'
import { noop, toId } from '../../common/util.js'
import { hasFocus } from '../../dom.js'
import { DND, useDrop } from '../dnd.js'


export const NewTag = ({ color, name, onCreate, onCancel }) => (
  <li className="tag" tabIndex={-1}>
    <TagColor color={color}/>
    <div className="name">
      <Editable
        value={name}
        isRequired
        resize
        isActive
        onCancel={onCancel}
        onChange={(value) => onCreate({ name: value, color })}/>
    </div>
  </li>
)

NewTag.propTypes = {
  color: string,
  name: string.isRequired,
  onCreate: func.isRequired,
  onCancel: func.isRequired
}

NewTag.defaultProps = {
  name: ''
}


export const Tag = React.memo(({
  hasFocusIcon,
  isEditing,
  isSelected,
  isReadOnly,
  tag,
  onChange,
  onContextMenu,
  onDropItems,
  onEditCancel,
  onFocusClick,
  onKeyDown,
  onSelect
}) => {

  let container = useRef()

  let [{ isOver }, drop] = useDrop({
    accept: [DND.ITEMS],
    drop: (item) => {
      onDropItems({
        id: item.items.map(toId),
        tags: [tag.id]
      })
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  if (!isReadOnly && !isSelected && onDropItems != null)
    drop(container)

  let handleChange = useCallback((name) => {
    onChange({ name }, tag.id)
  }, [tag, onChange])

  let handleClick = (event) => {
    if (event.button > 0) return

    let mod = isSelected ?
      (isMeta(event) ? 'remove' : 'clear') :
      (isMeta(event) ? 'merge' : 'replace')

    onSelect(tag.id, { mod })

    if (hasFocus(container.current)) {
      onFocusClick?.(tag)
    }
  }

  let handleContextMenu = (event) => {
    onContextMenu(event, tag)
  }

  let handleKeyDown = (event) => {
    onKeyDown(event, tag)
  }

  return (
    <li
      ref={container}
      className={cx('tag', {
        active: isSelected,
        mixed: !!tag.mixed,
        over: isOver
      })}
      tabIndex={-1}
      onContextMenu={isEditing ? null : handleContextMenu}
      onMouseDown={isEditing ? null : handleClick}
      onKeyDown={isEditing ? null : handleKeyDown}>
      <TagColor color={tag.color}/>
      <div className="name">
        <Editable
          isActive={isEditing}
          isDisabled={isReadOnly}
          isRequired
          resize
          value={tag.name}
          onCancel={onEditCancel}
          onChange={handleChange}/>
      </div>
      {hasFocusIcon && !isEditing && tag.mixed &&
        <IconPlusCircles/>}
    </li>
  )
})

Tag.propTypes = {
  hasFocusIcon: bool,
  isEditing: bool,
  isReadOnly: bool,
  isSelected: bool,
  tag: shape({
    id: number,
    name: string.isRequired,
    color: string
  }).isRequired,

  onChange: func.isRequired,
  onContextMenu: func,
  onDropItems: func,
  onEditCancel: func,
  onFocusClick: func,
  onKeyDown: func,
  onSelect: func
}

Tag.defaultProps = {
  onChange: noop
}
