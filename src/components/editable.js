import { memo, useRef } from 'react'
import cx from 'classnames'
import { useEvent } from '../hooks/use-event.js'
import { Input } from './input.js'

// Remembers where the focus came from, to return it there.
const useFocusRestore = () => {
  let origin = useRef(null)

  return {
    onFocus (event) {
      origin.current = event.relatedTarget
    },

    restore () {
      origin.current?.focus()
      origin.current = null
    }
  }
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
  let focus = useFocusRestore()

  let handleBlur = useEvent((event) => {
    let result = onBlur?.(event)
    focus.restore()
    return result
  })

  let handleFocus = useEvent((event) => {
    focus.onFocus(event)
    return onFocus?.(event)
  })

  let handleCancel = useEvent((...args) => {
    let result = onCancel?.(...args)
    focus.restore()
    return result
  })

  let handleCommit = useEvent((next, { hasChanged, hasBeenForced }) => {
    if (hasChanged || hasBeenForced) {
      onChange?.(next, hasChanged, hasBeenForced)
    } else {
      onCancel?.(false, hasChanged)
    }

    focus.restore()
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
