'use strict'

const React = require('react')
const { PropTypes, PureComponent } = React
const { Editable } = require('../editable')
const { IconTag } = require('../icons')
const { meta } = require('../../common/os')
const cn = require('classnames')
const { shape, number, string, bool, func } = PropTypes


class Tag extends PureComponent {

  get classes() {
    return {
      tag: true,
      active: this.props.isSelected
    }
  }

  handleChange = (name) => {
    this.props.onChange({ name }, this.props.tag.id)
  }

  handleClick = (event) => {
    const { tag, isSelected, onSelect } = this.props

    const mod = isSelected ?
      (meta(event) ? 'remove' : 'clear') :
      (meta(event) ? 'merge' : 'replace')

    onSelect(tag.id, { mod })
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, this.props.tag)
  }

  render() {
    const { tag, isEditing, onCancel } = this.props

    return (
      <li
        className={cn(this.classes)}
        onContextMenu={isEditing ? null : this.handleContextMenu}
        onClick={isEditing ? null : this.handleClick}>
        <IconTag/>
        <div className="name">
          <Editable
            value={tag.name}
            isRequired
            isEditing={isEditing}
            onCancel={onCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }


  static propTypes = {
    tag: shape({
      id: number,
      name: string.isRequired
    }).isRequired,

    isEditing: bool,
    isSelected: bool,

    onSelect: func,
    onContextMenu: func,
    onCancel: func.isRequired,
    onChange: func.isRequired
  }
}

module.exports = {
  Tag
}
