'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Editable } = require('../editable')
const { IconFolder } = require('../icons')
const { noop } = require('../../common/util')
const cn = require('classnames')


class ListNode extends Component {

  handleChange = (name) => {
    this.props.onUpdate(this.props.list.id, { name })
  }

  handleClick = () => {
    if (this.props.isSelected) {
      this.props.onRename(this.props.list.id)
    } else {
      this.props.onSelect({ list: this.props.list.id })
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, 'list', this.props.list.id)
  }

  render() {
    const {
      list, isSelected, isContext, isEditing, onEditCancel
    } = this.props

    return (
      <li
        className={cn({ list: true, active: isSelected, context: isContext })}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <IconFolder/>
        <div className="name">
          <Editable
            value={list.name}
            isRequired
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    list: PropTypes.object,

    isContext: PropTypes.bool,
    isSelected: PropTypes.bool,
    isEditing: PropTypes.bool,

    onEditCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onRename: PropTypes.func,
    onSelect: PropTypes.func,
    onUpdate: PropTypes.func
  }

  static defaultProps = {
    onContextMenu: noop,
    onSelect: noop
  }
}

module.exports = {
  ListNode
}
