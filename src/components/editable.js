import { memo, useRef } from 'react'
import cx from 'classnames'
import { useEvent } from '../hooks/use-event.js'
import { Input } from './input.js'

function restore(focus) {
  focus.current?.focus()
  focus.current = null
}

export const Editable = memo(({
  autofocus = true,
  autoselect = true,
  display,
  isActive,
  isDisabled,
  onBlur,
  onCancel,
  onChange,
  onFocus,
  title,
  value,
  ...props
}) => {
  let input = useRef(null)
  let focus = useRef(null)

  let handleBlur = useEvent((event) => {
    try {
      return onBlur?.(event)
    } finally {
      restore(focus)
    }
  })

  let handleFocus = useEvent((event) => {
    focus.current = event.relatedTarget
    return onFocus?.(event)
  })

  let handleCancel = useEvent((...args) => {
    try {
      return onCancel?.(...args)
    } finally {
      restore(focus)
    }
  })

  let handleCommit = useEvent((next, { hasChanged, hasBeenForced }) => {
    try {
      if (hasChanged || hasBeenForced) {
        onChange?.(next, hasChanged, hasBeenForced)
      } else {
        onCancel?.(false, hasChanged)
      }
    } finally {
      restore(focus)
    }
  })

  isActive = isActive && !isDisabled && onChange != null

  return (
    <div className={cx('editable', {
      active: isActive,
      disabled: isDisabled
    })}>
      {isActive ? (
        <Input
          {...props}
          ref={input}
          autofocus={autofocus}
          autoselect={autoselect}
          className="editable-control"
          onBlur={handleBlur}
          onCancel={handleCancel}
          onCommit={handleCommit}
          onFocus={handleFocus}
          value={value || ''}/>
      ) : (
        <div className="truncate" title={title} dir="auto">
          {display || value}
        </div>
      )}
    </div>
  )
})
