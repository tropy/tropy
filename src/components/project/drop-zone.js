'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-electron-backend')
const { extname } = require('path')
const cn = require('classnames')

class ProjectDropZone extends Component {

  get classes() {
    return {
      'project-drop-zone': true,
      'drop-zone': true,
      'over': this.props.isOver
    }
  }

  render() {
    const { children, connectDropTarget } = this.props

    return connectDropTarget(
      <div className={cn(this.classes)}>
        {children}
      </div>
    )
  }

  static propTypes = {
    children: PropTypes.node,
    isOver: PropTypes.bool,
    connectDropTarget: PropTypes.func,
    onDrop: PropTypes.func
  }
}

module.exports = {
  ProjectDropZone: DropTarget(
    NativeTypes.FILE, {

      drop(props, monitor) {
        if (monitor.didDrop()) return

        const accepted = { images: [] }

        for (let file of monitor.getItem().files) {
          if (extname(file.path) === '.tpy') {
            accepted.project = file.path
            break
          }

          if (file.type === 'image/jpeg') {
            accepted.images.push(file.path)
          }
        }

        if (accepted.project || accepted.images.length) {
          return props.onDrop(accepted), accepted
        }
      }

    },


    (connect, monitor) => ({
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver()
    })
  )(ProjectDropZone)
}
