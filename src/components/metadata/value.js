import { forwardRef } from 'react'
import { bool, func, number, oneOfType, string } from 'prop-types'
import cx from 'classnames'
import { Editable } from '../editable.js'
import { useDropText } from '../../hooks/use-drop-text.js'
import { useEvent } from '../../hooks/use-event.js'
import { IconLock, IconWarningSm } from '../icons.js'
import { auto } from '../../format.js'
import { blank } from '../../common/util.js'


export const MetadataValue = forwardRef(({
  isEditing,
  isReadOnly,
  isRequired,
  onChange,
  onClick,
  text,
  type,
  ...props
}, drag) => {

  // TODO move drop text handling to Editable
  let onDropText = useEvent(value =>
    onChange?.(value, value !== text, true))

  let [{ isOver }, drop] = useDropText(({ onDrop: onDropText }))

  let isInvalid = isRequired && blank(text)

  return (
    <div
      ref={node => {
        drag ? drag(drop(node)) : drop(node)
      }}
      className={cx('value', { over: isOver })}
      onClick={onClick}>
      <Editable
        value={text}
        display={auto(text, type)}
        isReadOnly={isReadOnly}
        isRequired={isRequired}
        isActive={isEditing}
        onChange={onChange}
        {...props}/>
      {isInvalid && <IconWarningSm/>}
      {isReadOnly && <IconLock/>}
    </div>
  )
})

MetadataValue.propTypes = {
  ...Editable.propTypes,
  isEditing: bool,
  isReadOnly: bool,
  isRequired: bool,
  onChange: func,
  onClick: func,
  text: oneOfType([string, number]),
  type: string
}
