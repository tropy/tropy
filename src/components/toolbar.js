'use strict'

const React = require('react')
const { WindowContext } = require('./main')
const { bool, func, node, string } = require('prop-types')
const cx = require('classnames')

const Toolbar = React.forwardRef((props, ref) =>
  <div
    ref={ref}
    className={cx('toolbar', props.className)}
    onDoubleClick={props.onDoubleClick}>
    {props.children}
  </div>
)

Toolbar.propTypes = {
  children: node,
  className: string,
  onDoubleClick: func
}

Toolbar.Context = React.forwardRef((props, ref) => (
  <div
    ref={ref}
    className={cx('toolbar-context', props.className, {
      active: props.isActive
    })}>
    {props.children}
  </div>
))

Toolbar.Context.propTypes = {
  children: node,
  className: string,
  isActive: bool
}


Toolbar.Left = ({ children, className }) =>
  <div className={cx('toolbar-left', className)}>{children}</div>

Toolbar.Left.propTypes = {
  children: node,
  className: string
}

Toolbar.Center = ({ children, className }) =>
  <div className={cx('toolbar-center', className)}>{children}</div>

Toolbar.Center.propTypes = {
  children: node,
  className: string
}

Toolbar.Right = ({ children, className }) =>
  <div className={cx('toolbar-right', className)}>{children}</div>

Toolbar.Right.propTypes = {
  children: node,
  className: string
}


const ToolGroup = ({ children }) =>
  <div className="tool-group">{children}</div>

ToolGroup.propTypes = {
  children: node
}


class Titlebar extends React.PureComponent {
  container = React.createRef()

  handleDoubleClick = (event) => {
    if (this.context.state.frameless &&
      event.target === this.container.current) {
      this.context.maximize()
    }
  }

  render() {
    return (!this.props.isOptional || this.context.state.frameless) && (
      <Toolbar
        className={cx(
          'titlebar',
          this.context.state.frameless ? 'window-draggable' : null
        )}
        onDoubleClick={this.handleDoubleClick}
        ref={this.container}>
        {this.props.children}
      </Toolbar>
    )
  }

  static contextType = WindowContext

  static propTypes = {
    children: node,
    isOptional: bool
  }
}

module.exports = {
  Toolbar,
  ToolGroup,
  Titlebar
}
