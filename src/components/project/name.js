'use strict'

const React = require('react')
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { IconMaze } = require('../icons')
const { Editable } = require('../editable')
const { isImageSupported } = require('../../constants/mime')
const cx = require('classnames')
const { bool, func, string } = require('prop-types')

class ProjectName extends React.PureComponent {
  get classes() {
    return {
      active: this.props.isSelected,
      over: this.props.isOver && this.props.canDrop
    }
  }

  render() {
    return this.props.connectDropTarget(
      <li
        className={cx('project-name', this.classes)}
        onClick={this.props.onClick}>
        <div className="list-node-container">
          <IconMaze/>
          <div className="name">
            <Editable
              value={this.props.name}
              isRequired
              resize
              isActive={this.props.isEditing}
              onCancel={this.props.onEditCancel}
              onChange={this.props.onChange}/>
          </div>
        </div>
      </li>
    )
  }


  static propTypes = {
    name: string.isRequired,
    isEditing: bool,
    isSelected: bool,
    isOver: bool,
    canDrop: bool,
    connectDropTarget: func.isRequired,
    onClick: func.isRequired,
    onEditCancel: func.isRequired,
    onChange: func.isRequired,
    onDrop: func.isRequired
  }
}

module.exports = {
  ProjectName: DropTarget(NativeTypes.FILE, {
    drop({ onDrop }, monitor) {
      let images = monitor.getItem()
        .files
        .filter(isImageSupported)
        .map(f => f.path)

      return onDrop({ files: images }), { images }
    },

    canDrop(_, monitor) {
      return !!monitor.getItem().types.find(type => isImageSupported({ type }))
    }
  }, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })
  )(ProjectName)
}
