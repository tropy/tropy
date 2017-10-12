'use strict'

const React = require('react')
const cx = require('classnames')
const { IconList } = require('../icons')
const { FormattedMessage } = require('react-intl')
const { bool, func } = require('prop-types')


const LastImportListNode = ({ isSelected, onClick }) => (
  <li
    className={cx({ active: isSelected })}
    onClick={isSelected ? null : onClick}>
    <IconList/>
    <div className="name">
      <FormattedMessage id="sidebar.imports"/>
    </div>
  </li>
)

LastImportListNode.propTypes = {
  isSelected: bool,
  onClick: func.isRequired
}

module.exports = {
  LastImportListNode
}
