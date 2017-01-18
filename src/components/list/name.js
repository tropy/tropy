'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Editable } = require('../editable')
const { IconFolder } = require('../icons')
const cn = require('classnames')


class ListName extends Component {

  handleChange = (name) => {
    this.props.onUpdate(this.props.list.id, { name })
  }

  handleClick = () => {
    if (this.props.isSelected) {
      this.props.onRename(this.props.list.id)
    } else {
      this.props.onSelect(this.props.list.id)
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, this.props.list.id)
  }

  render() {
    const {
      list, isSelected, context, isEditing, onCancel
    } = this.props

    return (
      <li
        className={cn({ list: true, active: isSelected, context })}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <IconFolder/>
        <div className="name">
          <Editable
            value={list.name}
            isRequired
            isEditing={isEditing}
            onCancel={onCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }

  static propTypes = {
    list: PropTypes.object,
    context: PropTypes.bool,

    isSelected: PropTypes.bool,
    isEditing: PropTypes.bool,

    onCancel: PropTypes.func,
    onContextMenu: PropTypes.func,
    onRename: PropTypes.func,
    onSelect: PropTypes.func,
    onUpdate: PropTypes.func
  }
}

module.exports = {
  ListName
}
