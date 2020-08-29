import React from 'react'
import cx from 'classnames'
import { IconClock } from '../icons'
import { FormattedMessage } from 'react-intl'
import { bool, func } from 'prop-types'


export const LastImportListNode = ({ isSelected, onClick }) => (
  <li
    className={cx({ active: isSelected })}
    onClick={isSelected ? null : onClick}>
    <div className="list-node-container">
      <IconClock/>
      <div className="name">
        <div className="truncate">
          <FormattedMessage id="sidebar.imports"/>
        </div>
      </div>
    </div>
  </li>
)

LastImportListNode.propTypes = {
  isSelected: bool,
  onClick: func.isRequired
}
