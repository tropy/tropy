'use strict'

const React = require('react')
const { PureComponent } = React
const { node, bool, func } = React.PropTypes
const cn = require('classnames')

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
        className={cn({ toolbar: true,  draggable: this.props.isDraggable })}
        ref={this.setContainer}
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
  ToolGroup
}
