'use strict'

const React = require('react')
const { PureComponent } = React
const { node, bool, func } = React.PropTypes
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
        className={cx({ toolbar: true,  draggable: this.props.isDraggable })}
        ref={this.props.onDoubleClick ? this.setContainer : null}
        onDoubleClick={this.handleDoubleClick}>
        {this.props.children}
      </div>
    )
  }

  static propTypes = {
    children: node,
    isDraggable: bool,
    onDoubleClick: func
  }

  static defaultProps = {
    isDraggable: ARGS.frameless
  }
}


module.exports = {
  Toolbar,
  ToolbarContext,
  ToolGroup
}
