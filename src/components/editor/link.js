import { useEffect, useRef } from 'react'
import { useIntl } from 'react-intl'
import { useEvent } from '../../hooks/use-event.js'
import { Toolbar } from '../toolbar.js'
import { Input } from '../input.js'
import { ensure } from '../../dom.js'

export const LinkContext = ({
  href = '',
  isActive = false,
  isReadOnly,
  onBlur = () => (true), // cancel on blur!
  onCancel,
  onCommit
}) => {
  let input = useRef()
  let container = useRef()
  let intl = useIntl()

  let placeholder = intl.formatMessage({
    id: 'editor.commands.link.target'
  })

  useEffect(() => {
    if (isActive) {
      ensure(
        container.current,
        'transitionend',
        input.current.focus,
        650)
    }
  }, [isActive])


  let handleTargetChange = useEvent((value) => {
    onCommit({ href: value })
  })

  return (
    <Toolbar.Context
      className="link"
      ref={container}
      isActive={isActive}>
      <Toolbar.Left className="form-inline">
        {isActive && (
          <Input
            ref={input}
            className="form-control link-target"
            isReadOnly={isReadOnly}
            isRequired
            placeholder={placeholder}
            value={href}
            onBlur={onBlur}
            onCancel={onCancel}
            onCommit={handleTargetChange}/>
        )}
      </Toolbar.Left>
    </Toolbar.Context>
  )
}
