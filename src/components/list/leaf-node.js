import React from 'react'
import cx from 'classnames'
import { NodeContainer } from '../tree/node-container.js'
import { FormattedMessage } from 'react-intl'

export const ListLeafNode = ({
  icon = 'Folder',
  name,
  isSelected,
  onClick
}) => (
  <li
    className={cx({ active: isSelected })}
    onClick={isSelected ? null : onClick}>
    <NodeContainer icon={icon}>
      <div className="name">
        <div className="truncate">
          <FormattedMessage id={name}/>
        </div>
      </div>
    </NodeContainer>
  </li>
)
