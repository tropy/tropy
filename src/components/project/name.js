'use strict'

const React = require('react')
const { DropTarget, DND } = require('../dnd')
const { IconMaze, IconWarningSm } = require('../icons')
const { Editable } = require('../editable')
const { isImageSupported } = require('../../constants/image')
const { blank } = require('../../common/util')
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
          {this.props.isCorrupted &&
            <IconWarningSm title="project.corrupted"/>}
        </div>
      </li>
    )
  }


  static propTypes = {
    name: string.isRequired,
    isCorrupted: bool,
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
  ProjectName: DropTarget([DND.FILE, DND.URL], {
    drop({ onDrop }, monitor) {
      let item = monitor.getItem()
      let type = monitor.getItemType()
      let files

      switch (type) {
        case DND.FILE:
          files = item.files.filter(isImageSupported).map(f => f.path)
          break
        case DND.URL:
          files = item.urls
          break
      }

      if (!blank(files)) {
        return onDrop({ files }), { files }
      }
    },

    canDrop(_, monitor) {
      switch (monitor.getItemType()) {
        case DND.FILE:
          return !!monitor.getItem().types.find(isImageSupported)
        case DND.URL:
          return true
      }
    }
  }, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })
  )(ProjectName)
}
