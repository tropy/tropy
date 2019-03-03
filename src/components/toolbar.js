'use strict'

const React = require('react')
const { bool, func, node, string } = require('prop-types')
const cx = require('classnames')


class Toolbar extends React.PureComponent {
  container = React.createRef()

  handleDoubleClick = (event) => {
    if (this.props.onDoubleClick &&
      event.target === this.container.current) {
      this.props.onDoubleClick()
    }
  }

  render() {
    return (
      <div
        className={cx('toolbar', {
          'window-draggable': this.props.isDraggable
        })}
        ref={this.container}
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
  isActive: bool,
  dom: func
}


Toolbar.Left = ({ children, className }) =>
  <div className={cx('toolbar-left', className)}>{children}</div>

Toolbar.Left.propTypes = {
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


module.exports = {
  Toolbar,
  ToolGroup
}
