'use strict'

const React = require('react')
const { PropTypes, Component } = React
const { Editable } = require('../editable')
const { IconTag } = require('../icons')
const { meta } = require('../../common/os')
const cn = require('classnames')


class Tag extends Component {

  get name() {
    return this.props.tag.name
  }

  get id() {
    return this.props.tag.id
  }

  get isSelected() {
    return this.props.selection.includes(this.props.tag.id)
  }

  get classes() {
    return {
      tag: true,
      active: this.isSelected
    }
  }


  handleChange = (name) => {
    this.props.onChange(this.props.tag.id, { name })
  }

  // DRY (see ItemTableRow)
  handleClick = (event) => {
    return this.props.onSelect(
      this.id,
      {
        mod: this.isSelected ?
          (meta(event) ? 'remove' : 'clear') :
          (meta(event) ? 'merge' : 'replace')
      }
    )
  }

  // DRY (see ItemTableRow)
  handleContextMenu = (event) => {
    const { selection, onSelect, onContextMenu } = this.props

    if (!this.isSelected || selection.length > 1) {
      onSelect(this.id, 'replace')
    }

    onContextMenu(event, 'tag', this.id)
  }


  render() {
    const { isEditing, onCancel } = this.props

    return (
      <li
        className={cn(this.classes)}
        onContextMenu={this.handleContextMenu}
        onClick={this.handleClick}>
        <IconTag/>
        <div className="name">
          <Editable
            value={this.name}
            isRequired
            isEditing={isEditing}
            onCancel={onCancel}
            onChange={this.handleChange}/>
        </div>
      </li>
    )
  }


  static propTypes = {
    tag: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string.isRequired
    }).isRequired,

    selection: PropTypes.arrayOf(PropTypes.number).isRequired,

    isEditing: PropTypes.bool,

    onSelect: PropTypes.func,
    onContextMenu: PropTypes.func,
    onCancel: PropTypes.func,
    onChange: PropTypes.func
  }
}

module.exports = {
  Tag
}
