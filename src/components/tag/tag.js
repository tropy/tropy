'use strict'

const React = require('react')
const { PureComponent } = React
const PropTypes = require('prop-types')
const { shape, number, string, bool, func } = PropTypes
const { Editable } = require('../editable')
const { IconTag, IconPlusCircles } = require('../icons')
const { isMeta } = require('../../keymap')
const { toId } = require('../../common/util')
const { hasFocus } = require('../../dom')
const cx = require('classnames')
const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { pure } = require('../util')


class Tag extends PureComponent {
  get classes() {
    return {
      tag: true,
      active: this.props.isSelected,
      mixed: !!this.props.tag.mixed,
      over: this.props.isOver,
    }
  }

  get color() {
    const { tag } = this.props
    return (tag.color) ? `color-${tag.color}` : null
  }

  get isDropTarget() {
    return !this.props.isSelected && this.props.onDropItems != null
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
      (isMeta(event) ? 'remove' : 'clear') :
      (isMeta(event) ? 'merge' : 'replace')

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

  connect(element) {
    return (this.isDropTarget) ? this.props.dt(element) : element
  }

  render() {
    const { tag, isEditing, hasFocusIcon, onEditCancel } = this.props

    return this.connect(
      <li
        className={cx(this.classes)}
        tabIndex={-1}
        ref={this.setContainer}
        onContextMenu={isEditing ? null : this.handleContextMenu}
        onMouseDown={isEditing ? null : this.handleClick}
        onKeyDown={isEditing ? null : this.handleKeyDown}>
        <IconTag className={this.color}/>
        <div className="name">
          <Editable
            value={tag.name}
            isRequired
            resize
            isActive={isEditing}
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
    dt: func.isRequired,
    hasFocusIcon: bool,
    isEditing: bool,
    isOver: bool,
    isSelected: bool,
    tag: shape({
      id: number,
      name: string.isRequired,
      color: string
    }).isRequired,

    onChange: func.isRequired,
    onContextMenu: func,
    onDropItems: func,
    onEditCancel: func.isRequired,
    onFocusClick: func,
    onKeyDown: func,
    onSelect: func
  }
}

const DropTargetSpec = {
  drop({ tag, onDropItems }, monitor) {
    const it = monitor.getItem()
    onDropItems({ id: it.items.map(toId), tags: [tag.id] })
  }
}

const DropTargetCollect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver()
})


module.exports = {
  Tag: pure(
    DropTarget(DND.ITEMS, DropTargetSpec, DropTargetCollect)(Tag)
  )
}
