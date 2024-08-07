import React from 'react'
import cx from 'classnames'
import { FormattedMessage } from 'react-intl'

export const NoItems = React.forwardRef(
  ({ isOver, isReadOnly }, ref) => (
    <div ref={ref} className={cx('no-items', { over: isOver })}>
      <figure className="no-items-illustration"/>
      {!isReadOnly &&
        <h1><FormattedMessage id="project.empty"/></h1>}
    </div>
  ))
