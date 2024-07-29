import React from 'react'
import cx from 'classnames'
import { Icon } from '../icons.js'
import { FormattedMessage } from 'react-intl'

export const ListLeafNode = ({ icon, name, isSelected, onClick }) => (
  <li
    className={cx({ active: isSelected })}
    onClick={isSelected ? null : onClick}>
    <div className="list-node-container">
      <Icon name={icon}/>
      <div className="name">
        <div className="truncate">
          <FormattedMessage id={name}/>
        </div>
      </div>
    </div>
  </li>
)

ListLeafNode.defaultProps = {
  icon: 'Folder'
}
