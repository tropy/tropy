'use strict'

const React = require('react')
const { Editable } = require('../editable')
const { IconTag, IconPlusCircles } = require('../icons')
const { isMeta } = require('../../keymap')
const { toId } = require('../../common/util')
const { hasFocus } = require('../../dom')
const cx = require('classnames')
const { DropTarget } = require('react-dnd')
const { DND } = require('../../constants')
const { pure } = require('../util')
const { shape, number, string, bool, func } = require('prop-types')


const NewTag = (props) => (
  <li className="tag" tabIndex={-1}>
    <IconTag/>
    <div className="name">
      <Editable
        value={props.name}
        isRequired
        resize
        isActive
        onCancel={props.onCancel}
        onChange={(name) => props.onCreate({ name })}/>
    </div>
  </li>
)

NewTag.propTypes = {
  name: string.isRequired,
  onCreate: func.isRequired,
  onCancel: func.isRequired
}

NewTag.defaultProps = {
  name: ''
}


class Tag extends React.PureComponent {
  get classes() {
    return ['tag', {
      active: this.props.isSelected,
      mixed: !!this.props.tag.mixed,
      over: this.props.isOver
    }]
  }

  get color() {
    return (this.props.tag.color) ?
      `color-${this.props.tag.color}` :
      null
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
    let { tag, isSelected, onSelect, onFocusClick } = this.props

    let mod = isSelected ?
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
    let { tag, isEditing, hasFocusIcon, onEditCancel } = this.props

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
  NewTag,
  Tag: pure(
    DropTarget(DND.ITEMS, DropTargetSpec, DropTargetCollect)(Tag)
  )
}
