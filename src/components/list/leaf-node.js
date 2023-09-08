import React from 'react'
import cx from 'classnames'
import * as icons from '../icons.js'
import { FormattedMessage } from 'react-intl'
import { bool, func, string } from 'prop-types'

export const ListLeafNode = ({ icon, name, isSelected, onClick }) => (
  <li
    className={cx({ active: isSelected })}
    onClick={isSelected ? null : onClick}>
    <div className="list-node-container">
      {React.createElement(icons[`Icon${icon}`])}
      <div className="name">
        <div className="truncate">
          <FormattedMessage id={name}/>
        </div>
      </div>
    </div>
  </li>
)

ListLeafNode.propTypes = {
  icon: string.isRequired,
  isSelected: bool,
  name: string.isRequired,
  onClick: func.isRequired
}

ListLeafNode.defaultProps = {
  icon: 'Folder'
}
