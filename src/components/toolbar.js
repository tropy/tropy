'use strict'

const React = require('react')
const { PureComponent } = React
const { bool, func, node, string } = require('prop-types')
const cx = require('classnames')


const ToolbarContext = ({ children, className, dom, isActive }) => (
  <div
    ref={dom}
    className={cx('toolbar-context', { active: isActive }, className)}>
    {children}
  </div>
)

ToolbarContext.propTypes = {
  children: node,
  className: string,
  isActive: bool,
  dom: func
}


const ToolGroup = ({ children }) => (
  <div className="tool-group">{children}</div>
)

ToolGroup.propTypes = {
  children: node
}

const ToolbarLeft = ({ children, className }) => (
  <div className={cx('toolbar-left', className)}>{children}</div>
)

ToolbarLeft.propTypes = {
  children: node,
  className: string
}

const ToolbarRight = ({ children, className }) => (
  <div className={cx('toolbar-right', className)}>{children}</div>
)

ToolbarRight.propTypes = {
  children: node,
  className: string
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
