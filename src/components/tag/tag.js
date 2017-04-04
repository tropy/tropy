'use strict'

const React = require('react')
const { PropTypes, PureComponent } = React
const { shape, number, string, bool, func } = PropTypes
const { Editable } = require('../editable')
const { IconTag, IconPlusCircles } = require('../icons')
const { meta } = require('../../common/os')
const { hasFocus } = require('../../dom')
const cx = require('classnames')


class Tag extends PureComponent {
  get classes() {
    return {
      tag: true,
      active: this.props.isSelected,
      mixed: !!this.props.tag.mixed
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  handleChange = (name) => {
    this.props.onChange({ name }, this.props.tag.id)
  }

  handleClick = (event) => {
    const { tag, isSelected, onSelect, onFocusClick } = this.props

    const mod = isSelected ?
      (meta(event) ? 'remove' : 'clear') :
      (meta(event) ? 'merge' : 'replace')

    onSelect(tag.id, { mod })

    if (hasFocus(this.container) && onFocusClick) {
      onFocusClick(tag)
    }
  }

  handleContextMenu = (event) => {
    this.props.onContextMenu(event, this.props.tag)
  }

  handleKeyDown = (event) => {
    this.props.onKeyDown(event, this.props.tag)
  }

  render() {
    const { tag, isEditing, hasFocusIcon, onEditCancel } = this.props

    return (
      <li
        className={cx(this.classes)}
        tabIndex={-1}
        ref={this.setContainer}
        onContextMenu={isEditing ? null : this.handleContextMenu}
        onMouseDown={isEditing ? null : this.handleClick}
        onKeyDown={isEditing ? null : this.handleKeyDown}>
        <IconTag/>
        <div className="name">
          <Editable
            value={tag.name}
            isRequired
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={this.handleChange}/>
        </div>
        {hasFocusIcon && !isEditing &&
          <span className="btn btn-icon">
            <IconPlusCircles/>
          </span>}
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
    hasFocusIcon: bool,

    onChange: func.isRequired,
    onContextMenu: func,
    onEditCancel: func.isRequired,
    onFocusClick: func,
    onKeyDown: func,
    onSelect: func
  }
}

module.exports = {
  Tag
}
