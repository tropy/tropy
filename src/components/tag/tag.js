import React from 'react'
import { Editable } from '../editable'
import { IconTag, IconPlusCircles } from '../icons'
import { isMeta } from '../../keymap'
import { noop, toId } from '../../common/util'
import { hasFocus } from '../../dom'
import cx from 'classnames'
import { DND, DropTarget } from '../dnd'
import { pure } from '../util'
import { shape, number, string, bool, func } from 'prop-types'

const ccx = (color) => color && `color-${color}`

const NewTag = (props) => (
  <li className="tag" tabIndex={-1}>
    <IconTag className={ccx(props.color)}/>
    <div className="name">
      <Editable
        value={props.name}
        isRequired
        resize
        isActive
        onCancel={props.onCancel}
        onChange={(name) => props.onCreate({ name, color: props.color })}/>
    </div>
  </li>
)

NewTag.propTypes = {
  color: string,
  name: string.isRequired,
  onCreate: func.isRequired,
  onCancel: func.isRequired
}

NewTag.defaultProps = {
  name: ''
}


class Tag extends React.PureComponent {
  container = React.createRef()

  get classes() {
    return ['tag', {
      active: this.props.isSelected,
      mixed: !!this.props.tag.mixed,
      over: this.props.isOver
    }]
  }

  get isDropTarget() {
    return !this.props.isReadOnly &&
      !this.props.isSelected &&
      this.props.onDropItems != null
  }

  handleChange = (name) => {
    this.props.onChange({ name }, this.props.tag.id)
  }

  handleClick = (event) => {
    if (event.button > 0) return

    let { tag, isSelected, onSelect, onFocusClick } = this.props

    let mod = isSelected ?
      (isMeta(event) ? 'remove' : 'clear') :
      (isMeta(event) ? 'merge' : 'replace')

    onSelect(tag.id, { mod })

    if (hasFocus(this.container.current) && onFocusClick) {
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
    let { tag, isEditing, hasFocusIcon } = this.props

    return this.connect(
      <li
        className={cx(this.classes)}
        tabIndex={-1}
        ref={this.container}
        onContextMenu={isEditing ? null : this.handleContextMenu}
        onMouseDown={isEditing ? null : this.handleClick}
        onKeyDown={isEditing ? null : this.handleKeyDown}>
        <IconTag className={ccx(tag.color)}/>
        <div className="name">
          <Editable
            isActive={isEditing}
            isDisabled={this.props.isReadOnly}
            isRequired
            resize
            value={tag.name}
            onCancel={this.props.onEditCancel}
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
    isReadOnly: bool,
    isSelected: bool,
    tag: shape({
      id: number,
      name: string.isRequired,
      color: string
    }).isRequired,

    onChange: func.isRequired,
    onContextMenu: func,
    onDropItems: func,
    onEditCancel: func,
    onFocusClick: func,
    onKeyDown: func,
    onSelect: func
  }

  static defaultProps = {
    onChange: noop
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


const TagContainer = pure(
  DropTarget(DND.ITEMS, DropTargetSpec, DropTargetCollect)(Tag)
)

export {
  NewTag,
  TagContainer as Tag
}
