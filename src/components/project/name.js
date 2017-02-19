'use strict'

const React = require('react')
const { PureComponent, PropTypes } = React
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { IconMaze } = require('../icons')
const { Editable } = require('../editable')
const { isValidImage } = require('../../image')
const cx = require('classnames')
const { bool, string, func } = PropTypes


class ProjectName extends PureComponent {
  get classes() {
    return {
      'project-name': true,
      'active': this.props.isSelected,
      'context': this.props.isContext,
      'over': this.props.isOver && this.props.canDrop
    }
  }

  handleClick = () => {
    if (this.props.isSelected) {
      this.props.onEdit()
    } else {
      this.props.onSelect()
    }
  }

  render() {
    const { name, dt, isEditing, onChange, onEditCancel } = this.props

    return dt(
      <li className={cx(this.classes)} onClick={this.handleClick}>
        <IconMaze/>
        <div className="name">
          <Editable
            value={name}
            isRequired
            isEditing={isEditing}
            onCancel={onEditCancel}
            onChange={onChange}/>
        </div>
      </li>
    )
  }


  static propTypes = {
    name: string.isRequired,
    isContext: bool,
    isEditing: bool,
    isSelected: bool,
    isOver: bool,
    canDrop: bool,
    dt: func.isRequired,
    onEdit: func.isRequired,
    onEditCancel: func.isRequired,
    onChange: func.isRequired,
    onDrop: func.isRequired,
    onSelect: func.isRequired
  }
}

const spec = {
  drop({ onDrop }, monitor) {
    const { files } = monitor.getItem()

    const images = files
      .filter(isValidImage)
      .map(file => file.path)

    return onDrop({ files: images }), { images }
  },

  canDrop(_, monitor) {
    return !!monitor.getItem().files.find(isValidImage)
  }
}

const collect = (connect, monitor) => ({
  dt: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
})


module.exports = {
  ProjectName: DropTarget(
    NativeTypes.FILE, spec, collect
  )(ProjectName)
}
