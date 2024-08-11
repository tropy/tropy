import React, { useRef } from 'react'
import cx from 'classnames'
import { TABS } from '../../constants/index.js'

export const EsperContainer = React.forwardRef(({
  children,
  className,
  isDisabled,
  onSlideIn,
  onSlideOut,
  tabIndex = TABS.Esper,
  ...props
}, container) => {

  return (
    <section
      {...props}
      className={cx('esper', className)}
      ref={container}
      tabIndex={isDisabled ? -1 : tabIndex}>
      {children}
    </section>
  )
})
