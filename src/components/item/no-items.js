import React from 'react'
import cx from 'classnames'
import { FormattedMessage } from 'react-intl'
import { bool, func } from 'prop-types'

export const NoItems = ({ connectDropTarget, isOver, isReadOnly }) => {
  if (isReadOnly || !connectDropTarget)
    return (
      <div className="no-items">
        <figure className="no-items-illustration"/>
      </div>
    )
  else
    return connectDropTarget(
      <div className={cx('no-items', { over: isOver })}>
        <figure className="no-items-illustration"/>
        <h1><FormattedMessage id="project.empty"/></h1>
      </div>
    )
}

NoItems.propTypes = {
  connectDropTarget: func,
  isOver: bool,
  isReadOnly: bool
}
