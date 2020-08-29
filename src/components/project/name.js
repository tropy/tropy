import React from 'react'
import { DND, DropTarget, hasPhotoFiles } from '../dnd'
import { IconMaze, IconWarningSm, IconLock } from '../icons'
import { Editable } from '../editable'
import { blank } from '../../common/util'
import cx from 'classnames'
import { bool, func, string } from 'prop-types'


class ProjectName extends React.PureComponent {
  get classes() {
    return {
      'active': this.props.isSelected,
      'read-only': this.props.isReadOnly,
      'over': this.props.isOver && this.props.canDrop
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
              isDisabled={this.props.isReadOnly}
              isRequired
              resize
              isActive={this.props.isEditing}
              onCancel={this.props.onEditCancel}
              onChange={this.props.onChange}/>
          </div>
          {this.props.isCorrupted &&
            <IconWarningSm title="project.corrupted"/>}
          {this.props.isReadOnly &&
            <IconLock title="project.readOnly"/>}
        </div>
      </li>
    )
  }


  static propTypes = {
    name: string.isRequired,
    isCorrupted: bool,
    isEditing: bool,
    isReadOnly: bool,
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

const ProjectNameContainer =
  DropTarget([DND.FILE, DND.URL], {
    drop({ onDrop }, monitor) {
      let item = monitor.getItem()
      let files

      switch (monitor.getItemType()) {
        case DND.FILE:
          files = item.files.map(f => f.path)
          break
        case DND.URL:
          files = item.urls
          break
      }

      if (!blank(files)) {
        onDrop({ files })
        return { files }
      }
    },

    canDrop({ isReadOnly }, monitor) {
      if (isReadOnly)
        return false

      switch (monitor.getItemType()) {
        case DND.FILE:
          return hasPhotoFiles(monitor)
        case DND.URL:
          return true
      }
    }
  }, (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  }))(ProjectName)

export {
  ProjectNameContainer as ProjectName
}
