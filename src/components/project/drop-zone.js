'use strict'

const React = require('react')
const { Component, PropTypes } = React
const { DropTarget } = require('react-dnd')
const { NativeTypes } = require('react-dnd-html5-backend')
const { extname } = require('path')
const cn = require('classnames')

class ProjectDropZone extends Component {

  get classes() {
    return {
      'project-drop-zone': true,
      'is-over': this.props.isOver
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
        if (!monitor.didDrop()) {
          const file = monitor
            .getItem()
            .files
            .find(({ path }) => extname(path) === '.tpy')

          if (file) {
            props.onDrop(file.path)
            return { open: file.path }
          }
        }
      }

    },

    (connect, monitor) => ({
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver()
    })
  )(ProjectDropZone)
}
