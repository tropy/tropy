'use strict'

const React = require('react')
const { PureComponent } = React
const { node, bool, func } = require('prop-types')
const cx = require('classnames')


const ToolbarContext = ({ children, isActive: active }) => (
  <div className={cx({ 'toolbar-context': true, active })}>{children}</div>
)

ToolbarContext.propTypes = {
  children: node,
  isActive: bool
}


const ToolGroup = ({ children }) => (
  <div className="tool-group">{children}</div>
)

ToolGroup.propTypes = {
  children: node
}

const ToolbarLeft = ({ children }) => (
  <div className="toolbar-left">{children}</div>
)

ToolbarLeft.propTypes = {
  children: node
}

const ToolbarRight = ({ children }) => (
  <div className="toolbar-right">{children}</div>
)

ToolbarRight.propTypes = {
  children: node
}



class Toolbar extends PureComponent {
  handleDoubleClick = (event) => {
    if (this.props.onDoubleClick && event.target === this.container) {
      this.props.onDoubleClick()
    }
  }

  setContainer = (container) => {
    this.container = container
  }

  render() {
    return (
      <div
        className={
          cx({ 'toolbar': true, 'window-draggable': this.props.isDraggable })
        }
        ref={this.props.onDoubleClick ? this.setContainer : null}
        onDoubleClick={this.handleDoubleClick}>
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: node,
    isDraggable: bool.isRequired,
    onDoubleClick: func
  }

  static defaultProps = {
    isDraggable: ARGS.frameless
  }
}


module.exports = {
  Toolbar,
  ToolbarContext,
  ToolbarLeft,
  ToolbarRight,
  ToolGroup
}
