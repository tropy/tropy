'use strict'

const React = require('react')
const { Component, PropTypes } = React
const cn = require('classnames')
const { IconTrash } = require('../icons')
const { FormattedMessage } = require('react-intl')


class TrashListItem extends Component {

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, 'trash', {})
  }

  handleClick = () => {
    if (!this.props.isSelected) {
      this.props.onSelect({ trash: true })
    }
  }

  render() {
    const { isSelected } = this.props

    return (
      <li
        className={cn({ active: isSelected })}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <IconTrash/>
        <div className="title">
          <FormattedMessage id="sidebar.trash"/>
        </div>
      </li>
    )
  }

  static propTypes = {
    isSelected: PropTypes.bool,
    onContextMenu: PropTypes.func,
    onSelect: PropTypes.func,
    onDropItem: PropTypes.func
  }
}

module.exports = {
  TrashListItem
}
